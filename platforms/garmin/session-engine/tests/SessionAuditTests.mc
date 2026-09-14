class SeAuditTestPort {
    var index = {};
    var chunks = {};
    var reads = 0;
    function initialize() {
        var codec = new SeFrame();
        for (var s = 0; s < 2; s += 1) {
            var id = "synthetic-" + s;
            index[id] = { "state" => "COMPLETED", "lastChunk" => 1, "lastSequence" => 17 };
            var first = [];
            for (var i = 0; i < 16; i += 1) { first.add(codec.create(i, i == 0 ? "SESSION_START" : "CHECKPOINT", "synthetic")); }
            chunks[id + ".0"] = first;
            chunks[id + ".1"] = [codec.create(16, "CHECKPOINT", "synthetic"), codec.create(17, "SESSION_FINAL", "synthetic")];
        }
    }
    function readIndex() { return index; }
    function readChunk(id, number) { reads += 1; return chunks[id + "." + number]; }
}

function finishSeAudit(audit) {
    for (var i = 0; i < 100 && audit.status().equals("SCANNING"); i += 1) { audit.step(); }
    return audit.status();
}

(:test)
function seAuditChecksTwoJournalsWithoutWrites(logger) {
    var port = new SeAuditTestPort();
    var audit = new SeReadOnlyAudit(port);
    if (!finishSeAudit(audit).equals("VALID")) { return false; }
    audit.step();
    return audit.verifiedSessions() == 2 && audit.scannedFrames() == 36 && port.reads == 4 && port.index.size() == 2 && port.chunks["synthetic-0.0"].size() == 16;
}

(:test)
function seAuditDetectsCorruptionBeforeFinalChunk(logger) {
    var port = new SeAuditTestPort();
    port.chunks["synthetic-0.0"][3]["payload"] = "changed";
    return finishSeAudit(new SeReadOnlyAudit(port)).equals("CHECKSUM_OR_SEQUENCE_FAILED");
}

(:test)
function seAuditRejectsSequenceAndPrematureFinal(logger) {
    var port = new SeAuditTestPort();
    port.chunks["synthetic-0.0"][3] = new SeFrame().create(4, "CHECKPOINT", "synthetic");
    if (!finishSeAudit(new SeReadOnlyAudit(port)).equals("CHECKSUM_OR_SEQUENCE_FAILED")) { return false; }
    port = new SeAuditTestPort();
    port.chunks["synthetic-0.0"][3] = new SeFrame().create(3, "SESSION_FINAL", "synthetic");
    return finishSeAudit(new SeReadOnlyAudit(port)).equals("INVALID_FINAL");
}

(:test)
function seAuditRejectsMissingChunkAndOversizeIndex(logger) {
    var port = new SeAuditTestPort();
    port.chunks["synthetic-0.1"] = null;
    if (!finishSeAudit(new SeReadOnlyAudit(port)).equals("INVALID_CHUNK")) { return false; }
    port = new SeAuditTestPort();
    for (var i = 0; i < 9; i += 1) { port.index["extra-" + i] = {}; }
    var audit = new SeReadOnlyAudit(port);
    return audit.status().equals("LIMIT_EXCEEDED") && port.reads == 0;
}

(:test)
function seAuditNeverTreatsEmptyOrRecoverableAsValid(logger) {
    var port = new SeAuditTestPort();
    port.index = {};
    if (!new SeReadOnlyAudit(port).status().equals("EMPTY")) { return false; }
    port = new SeAuditTestPort();
    port.index["synthetic-0"]["state"] = "RECORDING";
    return finishSeAudit(new SeReadOnlyAudit(port)).equals("NOT_COMPLETED");
}

(:test)
function seTransferRetryAndBounds(logger) {
    var port = new SeAuditTestPort();
    var producer = new SeTransferProducer(port, "synthetic-0");
    var count = 0;
    while (count < 21) {
        var line = producer.nextLine();
        if (line == null) { break; }
        var reads = port.reads;
        if (count == 19 && !line.equals("{\"recordType\":\"completion\",\"frameCount\":18,\"streamAdler32\":4267821037}\n")) { return false; }
        if (!line.equals(producer.nextLine()) || port.reads != reads) { return false; }
        if (!producer.acknowledge()) { return false; }
        count += 1;
    }
    return count == 20 && port.reads == 2 && producer.status().equals("EXHAUSTED") && !producer.acknowledge() && port.index.size() == 2;
}

(:test)
function seTransferRejectsCorruptionAndIncomplete(logger) {
    var port = new SeAuditTestPort();
    port.chunks["synthetic-0.0"][3]["payload"] = "changed";
    var producer = new SeTransferProducer(port, "synthetic-0");
    for (var i = 0; i < 20; i += 1) {
        if (producer.nextLine() == null) { break; }
        producer.acknowledge();
    }
    if (!producer.status().equals("FAILED")) { return false; }
    port.index["synthetic-1"]["state"] = "RECORDING";
    return new SeTransferProducer(port, "synthetic-1").status().equals("FAILED");
}

(:test)
function sePrivateExportPagesBoundedAndDeterministic(logger) {
    var port = new SeAuditTestPort();
    var total = 1;
    for (var page = 1; page <= total && page <= 10; page += 1) {
        var scan = new SeExportPages(port, page);
        for (var i = 0; i < 100 && scan.status().equals("SCANNING"); i += 1) { scan.step(); }
        if (!scan.status().equals("READY") || scan.contents().length() == 0 || scan.contents().length() > 4000) { return false; }
        total = scan.pageCount();
        var retry = new SeExportPages(port, page);
        for (var i = 0; i < 100 && retry.status().equals("SCANNING"); i += 1) { retry.step(); }
        if (!scan.contents().equals(retry.contents()) || !scan.header().equals(retry.header())) { return false; }
    }
    return total >= 2 && total <= 10 && port.index.size() == 2;
}
