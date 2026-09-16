import Toybox.Lang;

// Transport state machine only. It never mutates or deletes journal storage.
class SePhoneTransferProtocol {
    private const PROTOCOL = "windwisher.session.transfer";
    private const VERSION = 1;
    private const MAX_SESSIONS = 32;

    private var _port;
    private var _producer = null;
    private var _sessionId = null;
    private var _requestId = null;
    private var _lineIndex = 0;
    private var _completed = false;

    function initialize(port) { _port = port; }

    function handle(data) {
        if (!(data instanceof Lang.Dictionary)) { return error(null, "INVALID_REQUEST"); }
        var requestId = data["requestId"];
        if (!validToken(requestId, 64) || !PROTOCOL.equals(data["protocol"]) || data["version"] != VERSION) {
            return error(validToken(requestId, 64) ? requestId : null, "INVALID_REQUEST");
        }
        var type = data["type"];
        if (!(type instanceof Lang.String)) { return error(requestId, "INVALID_REQUEST"); }
        if (type.equals("inventory_request")) { return inventory(requestId); }
        if (type.equals("download_start")) { return startDownload(requestId, data["sessionId"]); }
        if (type.equals("download_ack")) { return acknowledge(requestId, data["sessionId"], data["lineIndex"]); }
        if (type.equals("download_abort")) { return abort(requestId, data["sessionId"]); }
        return error(requestId, "UNKNOWN_REQUEST");
    }

    function inventory(requestId) {
        var index = _port.readIndex();
        if (!(index instanceof Lang.Dictionary)) { return error(requestId, "STORAGE_UNAVAILABLE"); }
        var keys = index.keys();
        var sessions = [];
        for (var i = 0; i < keys.size(); i += 1) {
            var id = keys[i];
            var metadata = index[id];
            if (!(metadata instanceof Lang.Dictionary) || !"COMPLETED".equals(metadata["state"])) { continue; }
            var integrity = _port.validate(id);
            if (!(integrity instanceof Lang.Dictionary) || !"VALID".equals(integrity["integrity"])) { continue; }
            var reference = referenceFor(id, metadata);
            if (reference == null) { return error(requestId, "INVALID_COMPLETED_SESSION"); }
            if (sessions.size() >= MAX_SESSIONS) { return error(requestId, "SESSION_LIMIT_EXCEEDED"); }
            sessions.add(reference);
        }
        return base("inventory", requestId, { "format" => "garmin-frame-envelope-v1", "sessions" => sessions });
    }

    function referenceFor(id, metadata) {
        try {
            var lastSequence = metadata["lastSequence"];
            var lastChunk = metadata["lastChunk"];
            var startedAt = metadata["startedAt"];
            if (!(lastSequence instanceof Lang.Number) || !(lastChunk instanceof Lang.Number) || !(startedAt instanceof Lang.Number)) { return null; }
            var chunk = _port.readChunk(id, lastChunk);
            if (!(chunk instanceof Lang.Array) || chunk.size() == 0) { return null; }
            var frame = chunk[lastSequence % SeConstants.MAX_FRAMES_PER_CHUNK];
            if (!(frame instanceof Lang.Dictionary) || !SeConstants.FRAME_SESSION_FINAL.equals(frame["frameType"])) { return null; }
            var elapsed = fieldNumber(frame["payload"], "elapsed");
            var completed = fieldNumber(frame["payload"], "completed");
            if (elapsed == null || completed == null || elapsed < 0 || completed < startedAt) { return null; }
            return {
                "sessionId" => id,
                "startedAtEpochSeconds" => startedAt,
                "endedAtEpochSeconds" => completed,
                "durationMilliseconds" => elapsed,
                "frameCount" => lastSequence + 1
            };
        } catch (ex) { return null; }
    }

    function startDownload(requestId, id) {
        if (!validToken(id, 96)) { return error(requestId, "INVALID_SESSION_ID"); }
        if (_producer != null) {
            if (_requestId.equals(requestId) && _sessionId.equals(id)) { return currentLineOrCompletion(); }
            return error(requestId, "TRANSFER_BUSY");
        }
        _producer = new SeTransferProducer(_port, id);
        if (!_producer.status().equals("READY")) { clearTransfer(); return error(requestId, "SESSION_UNAVAILABLE"); }
        _sessionId = id;
        _requestId = requestId;
        _lineIndex = 0;
        _completed = false;
        return currentLineOrCompletion();
    }

    function acknowledge(requestId, id, lineIndex) {
        if (_producer == null || !_requestId.equals(requestId) || !_sessionId.equals(id) || !(lineIndex instanceof Lang.Number)) {
            return error(requestId, "TRANSFER_NOT_FOUND");
        }
        if (_completed) {
            return lineIndex == _lineIndex - 1 ? completion() : error(requestId, "ACK_OUT_OF_ORDER");
        }
        if (lineIndex == _lineIndex - 1) { return currentLineOrCompletion(); }
        if (lineIndex != _lineIndex || !_producer.acknowledge()) { return error(requestId, "ACK_OUT_OF_ORDER"); }
        _lineIndex += 1;
        return currentLineOrCompletion();
    }

    function abort(requestId, id) {
        if (_producer != null && _requestId.equals(requestId) && _sessionId.equals(id)) { clearTransfer(); }
        return base("download_aborted", requestId, {});
    }

    function currentLineOrCompletion() {
        var line = _producer.nextLine();
        if (line != null) {
            return base("download_line", _requestId, {
                "sessionId" => _sessionId,
                "lineIndex" => _lineIndex,
                "line" => line
            });
        }
        if (_producer.status().equals("EXHAUSTED")) { _completed = true; return completion(); }
        var requestId = _requestId;
        clearTransfer();
        return error(requestId, "TRANSFER_FAILED");
    }

    function completion() {
        return base("download_complete", _requestId, {
            "sessionId" => _sessionId,
            "lineCount" => _lineIndex
        });
    }

    function clearTransfer() {
        _producer = null; _sessionId = null; _requestId = null; _lineIndex = 0; _completed = false;
    }

    function base(type, requestId, content) {
        var response = { "protocol" => PROTOCOL, "version" => VERSION, "type" => type, "requestId" => requestId };
        var keys = content.keys();
        for (var i = 0; i < keys.size(); i += 1) { response[keys[i]] = content[keys[i]]; }
        return response;
    }

    function error(requestId, code) { return base("error", requestId, { "code" => code }); }

    function validToken(value, maximumLength) {
        if (!(value instanceof Lang.String) || value.length() < 1 || value.length() > maximumLength) { return false; }
        var chars = value.toCharArray();
        for (var i = 0; i < chars.size(); i += 1) {
            var c = chars[i].toNumber();
            if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 45 || c == 95)) { return false; }
        }
        return true;
    }

    function fieldNumber(payload, name) {
        if (!(payload instanceof Lang.String)) { return null; }
        var marker = name + "=";
        var start = payload.find(marker);
        if (start == null) { return null; }
        var tail = payload.substring(start + marker.length(), payload.length());
        var delimiter = tail.find(";");
        var text = delimiter == null ? tail : tail.substring(0, delimiter);
        return text.toNumber();
    }
}
