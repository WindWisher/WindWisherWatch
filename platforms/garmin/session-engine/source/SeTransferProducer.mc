import Toybox.Lang;

// Private transport-neutral producer. Caller owns delivery, never log the lines.
// nextLine is retry-stable until acknowledge; source Object Store is read-only.
class SeTransferProducer {
    private var _port;
    private var _id;
    private var _meta;
    private var _codec;
    private var _stage = 0;
    private var _sequence = 0;
    private var _pending = null;
    private var _chunk = null;
    private var _chunkNumber = -1;
    private var _a = 1;
    private var _b = 0;
    function initialize(port, id) {
        _port = port; _id = id; _codec = new SeFrame();
        try {
            if (!(id instanceof Lang.String) || id.length() < 1 || id.length() > 96) { _stage = -1; return; }
            var chars = id.toCharArray();
            for (var i = 0; i < chars.size(); i += 1) {
                var c = chars[i].toNumber();
                if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c == 45 || c == 95)) { _stage = -1; return; }
            }
            var index = _port.readIndex();
            if (!(index instanceof Lang.Dictionary)) { _stage = -1; return; }
            _meta = index[id];
            if (!(_meta instanceof Lang.Dictionary) || !_meta["state"].equals("COMPLETED") || !(_meta["lastSequence"] instanceof Lang.Number) || !(_meta["lastChunk"] instanceof Lang.Number)) { _stage = -1; return; }
            if (_meta["lastSequence"] < 1 || _meta["lastSequence"] >= 1024 || _meta["lastChunk"] != _meta["lastSequence"] / 16) { _stage = -1; }
        } catch (ex) { _stage = -1; }
    }
    function status() { return _stage == -1 ? "FAILED" : (_stage == 3 ? "EXHAUSTED" : "READY"); }
    function updateChecksum(text) {
        var chars = text.toCharArray();
        for (var i = 0; i < chars.size(); i += 1) { _a = (_a + chars[i].toNumber()) % 65521; _b = (_b + _a) % 65521; }
    }
    function quote(text) {
        var result = "\""; var chars = text.toCharArray();
        for (var i = 0; i < chars.size(); i += 1) {
            var c = chars[i].toNumber();
            if (c < 32 || c > 126) { _stage = -1; return null; }
            if (c == 34 || c == 92) { result += "\\"; }
            result += chars[i].toString();
        }
        return result + "\"";
    }
    function nextLine() {
        if (_stage < 0 || _stage == 3) { return null; }
        if (_pending != null) { return _pending; }
        try {
            if (_stage == 0) {
                updateChecksum("WWSE_TRANSFER|1|" + _id + "\n");
                _pending = "{\"recordType\":\"manifest\",\"transferVersion\":1,\"sessionId\":" + quote(_id) + "}\n";
            } else if (_stage == 2) {
                _pending = "{\"recordType\":\"completion\",\"frameCount\":" + _sequence + ",\"streamAdler32\":" + ((_b * 65536l) + _a) + "}\n";
            } else {
                var number = _sequence / 16;
                if (number != _chunkNumber) {
                    _chunk = _port.readChunk(_id, number); _chunkNumber = number;
                    var expected = number == _meta["lastChunk"] ? (_meta["lastSequence"] % 16) + 1 : 16;
                    if (!(_chunk instanceof Lang.Array) || _chunk.size() != expected) { _stage = -1; return null; }
                }
                var frame = _chunk[_sequence % 16];
                if (!_codec.validate(frame) || frame["sequence"] != _sequence) { _stage = -1; return null; }
                var kind = frame["frameType"];
                if (!(kind.equals("SESSION_START") || kind.equals("POSITION") || kind.equals("HEART_RATE") || kind.equals("PRESSURE") || kind.equals("RUNTIME") || kind.equals("QUALITY") || kind.equals("CHECKPOINT") || kind.equals("SESSION_STOP") || kind.equals("SESSION_FINAL")) || frame["payload"].length() > 512) { _stage = -1; return null; }
                if ((_sequence == 0) != kind.equals("SESSION_START") || (_sequence == _meta["lastSequence"]) != kind.equals("SESSION_FINAL")) { _stage = -1; return null; }
                var payload = quote(frame["payload"]);
                if (_stage == -1) { return null; }
                var typeText = quote(kind);
                if (_stage == -1) { return null; }
                updateChecksum(_codec.canonical(_sequence, kind, frame["payload"]) + "\n");
                _pending = "{\"recordType\":\"frame\",\"frame\":{\"magic\":\"WWJF\",\"formatVersion\":1,\"sequence\":" + _sequence + ",\"frameType\":" + typeText + ",\"payloadLength\":" + frame["payloadLength"] + ",\"payload\":" + payload + ",\"checksum\":" + frame["checksum"] + "}}\n";
            }
        } catch (ex) { _stage = -1; _pending = null; }
        return _pending;
    }
    function acknowledge() {
        if (_pending == null || _stage < 0 || _stage == 3) { return false; }
        _pending = null;
        if (_stage == 0) { _stage = 1; }
        else if (_stage == 1) { _sequence += 1; if (_sequence > _meta["lastSequence"]) { _stage = 2; _chunk = null; } }
        else { _stage = 3; }
        return true;
    }
}
