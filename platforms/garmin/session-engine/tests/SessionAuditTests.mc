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

class SePhoneTestPort {
    var index = {};
    var chunks = {};
    var reads = 0;
    var validations = 0;

    function initialize() {
        var codec = new SeFrame();
        var id = "phone-session-1";
        index[id] = {
            "state" => "COMPLETED",
            "startedAt" => 1700000000,
            "lastChunk" => 0,
            "lastSequence" => 1
        };
        chunks[id + ".0"] = [
            codec.create(0, "SESSION_START", "started=1700000000"),
            codec.create(1, "SESSION_FINAL", "elapsed=60000;completed=1700000060")
        ];
    }

    function readIndex() { return index; }
    function readChunk(id, number) { reads += 1; return chunks[id + "." + number]; }
    function validate(id) {
        validations += 1;
        return index[id] == null ? { "integrity" => "CORRUPT" } : { "integrity" => "VALID" };
    }
}

function sePhoneRequest(type, requestId) {
    return {
        "protocol" => "windwisher.session.transfer",
        "version" => 1,
        "type" => type,
        "requestId" => requestId
    };
}

(:test)
function sePhoneInventoryContainsOnlyVerifiedCompletedMetadata(logger) {
    var port = new SePhoneTestPort();
    port.index["recording"] = { "state" => "RECORDING" };
    var response = new SePhoneTransferProtocol(port).handle(sePhoneRequest("inventory_request", "inventory-1"));
    var sessions = response["sessions"];
    if (!response["type"].equals("inventory") || !response["format"].equals("garmin-frame-envelope-v1") || sessions.size() != 1) { return false; }
    var session = sessions[0];
    return session["sessionId"].equals("phone-session-1") && session["startedAtEpochSeconds"] == 1700000000 && session["endedAtEpochSeconds"] == 1700000060 && session["durationMilliseconds"] == 60000 && session["frameCount"] == 2 && port.validations == 1;
}

(:test)
function sePhoneDownloadIsRetryStableUntilAcknowledged(logger) {
    var port = new SePhoneTestPort();
    var protocol = new SePhoneTransferProtocol(port);
    var request = sePhoneRequest("download_start", "download-1");
    request["sessionId"] = "phone-session-1";
    var first = protocol.handle(request);
    var retry = protocol.handle(request);
    if (!first["type"].equals("download_line") || first["lineIndex"] != 0 || !first["line"].equals(retry["line"])) { return false; }
    var ack = sePhoneRequest("download_ack", "download-1");
    ack["sessionId"] = "phone-session-1";
    ack["lineIndex"] = 0;
    var second = protocol.handle(ack);
    var duplicate = protocol.handle(ack);
    return second["lineIndex"] == 1 && second["line"].equals(duplicate["line"]) && !first["line"].equals(second["line"]);
}

(:test)
function sePhoneDownloadCompletesAndFinalAckCanRetry(logger) {
    var protocol = new SePhoneTransferProtocol(new SePhoneTestPort());
    var start = sePhoneRequest("download_start", "download-2");
    start["sessionId"] = "phone-session-1";
    var response = protocol.handle(start);
    if (!response["type"].equals("download_line")) { return false; }
    for (var line = 0; line < 4; line += 1) {
        var ack = sePhoneRequest("download_ack", "download-2");
        ack["sessionId"] = "phone-session-1";
        ack["lineIndex"] = line;
        response = protocol.handle(ack);
    }
    if (!response["type"].equals("download_complete") || response["lineCount"] != 4) { return false; }
    var finalRetry = sePhoneRequest("download_ack", "download-2");
    finalRetry["sessionId"] = "phone-session-1";
    finalRetry["lineIndex"] = 3;
    response = protocol.handle(finalRetry);
    return response["type"].equals("download_complete") && response["lineCount"] == 4;
}

(:test)
function sePhoneProtocolRejectsInvalidAndOutOfOrderRequests(logger) {
    var protocol = new SePhoneTransferProtocol(new SePhoneTestPort());
    if (!protocol.handle({})["code"].equals("INVALID_REQUEST")) { return false; }
    var start = sePhoneRequest("download_start", "download-3");
    start["sessionId"] = "phone-session-1";
    if (!protocol.handle(start)["type"].equals("download_line")) { return false; }
    var ack = sePhoneRequest("download_ack", "download-3");
    ack["sessionId"] = "phone-session-1";
    ack["lineIndex"] = 2;
    return protocol.handle(ack)["code"].equals("ACK_OUT_OF_ORDER");
}
