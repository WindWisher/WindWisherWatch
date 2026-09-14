import Toybox.Lang;

// Bounded full-frame integrity inspection, outside recording/recovery/finalization.
// Only readIndex/readChunk are available on the injected port. No payload output.
class SeReadOnlyAudit {
    const MAX_SESSIONS = 8;
    const MAX_CHUNKS = 64;
    private var _store;
    private var _codec;
    private var _index;
    private var _ids = [];
    private var _session = 0;
    private var _chunkNumber = 0;
    private var _frameNumber = 0;
    private var _sequence = 0;
    private var _chunk = null;
    private var _metadata = null;
    private var _status = "SCANNING";
    private var _verified = 0;
    private var _frames = 0;

    function initialize(store) {
        _store = store; _codec = new SeFrame();
        try {
            _index = _store.readIndex();
            if (!(_index instanceof Lang.Dictionary)) { reject("INVALID_INDEX"); return; }
            if (_index.size() > MAX_SESSIONS) { reject("LIMIT_EXCEEDED"); return; }
            _ids = _index.keys();
            if (_ids.size() == 0) { _status = "EMPTY"; }
        } catch (ex) { reject("READ_FAILED"); }
    }

    function status() { return _status; }
    function verifiedSessions() { return _verified; }
    function scannedFrames() { return _frames; }
    function sessionCount() { return _ids.size(); }
    function reject(code) { _status = code; _chunk = null; }
    function numberIn(value, minimum, maximum) {
        return value instanceof Lang.Number && value >= minimum && value <= maximum;
    }

    function step() {
        if (!_status.equals("SCANNING")) { return; }
        try { scanOne(); } catch (ex) { reject("READ_OR_FORMAT_FAILED"); }
    }

    function scanOne() {
        if (_metadata == null) {
            if (!(_ids[_session] instanceof Lang.String)) { reject("INVALID_INDEX"); return; }
            _metadata = _index[_ids[_session]];
            if (!(_metadata instanceof Lang.Dictionary)) { reject("INVALID_INDEX"); return; }
            if (!(_metadata["state"] instanceof Lang.String) || !_metadata["state"].equals(SeConstants.STATE_COMPLETED)) { reject("NOT_COMPLETED"); return; }
            if (!numberIn(_metadata["lastChunk"], 0, MAX_CHUNKS - 1) || !numberIn(_metadata["lastSequence"], 1, MAX_CHUNKS * SeConstants.MAX_FRAMES_PER_CHUNK - 1)) { reject("LIMIT_OR_INDEX_INVALID"); return; }
            if (_metadata["lastSequence"] / SeConstants.MAX_FRAMES_PER_CHUNK != _metadata["lastChunk"]) { reject("INDEX_MISMATCH"); return; }
        }
        if (_chunk == null) {
            _chunk = _store.readChunk(_ids[_session], _chunkNumber);
            if (!(_chunk instanceof Lang.Array) || _chunk.size() == 0 || _chunk.size() > SeConstants.MAX_FRAMES_PER_CHUNK) { reject("INVALID_CHUNK"); return; }
            var expectedSize = _chunkNumber == _metadata["lastChunk"] ? (_metadata["lastSequence"] % SeConstants.MAX_FRAMES_PER_CHUNK) + 1 : SeConstants.MAX_FRAMES_PER_CHUNK;
            if (_chunk.size() != expectedSize) { reject("TRUNCATED_OR_EXTRA_FRAMES"); return; }
        }
        var frame = _chunk[_frameNumber];
        if (!(frame instanceof Lang.Dictionary) || !_codec.validate(frame) || frame["sequence"] != _sequence) { reject("CHECKSUM_OR_SEQUENCE_FAILED"); return; }
        var kind = frame["frameType"];
        if (!(kind instanceof Lang.String)) { reject("INVALID_FRAME_TYPE"); return; }
        if (_sequence == 0 && !kind.equals(SeConstants.FRAME_SESSION_START)) { reject("MISSING_START"); return; }
        if (_sequence > 0 && kind.equals(SeConstants.FRAME_SESSION_START)) { reject("DUPLICATE_START"); return; }
        var isLast = _sequence == _metadata["lastSequence"];
        if (kind.equals(SeConstants.FRAME_SESSION_FINAL) != isLast) { reject("INVALID_FINAL"); return; }
        if (!(kind.equals("SESSION_START") || kind.equals("POSITION") || kind.equals("HEART_RATE") || kind.equals("PRESSURE") || kind.equals("RUNTIME") || kind.equals("QUALITY") || kind.equals("CHECKPOINT") || kind.equals("SESSION_STOP") || kind.equals("SESSION_FINAL"))) { reject("INVALID_FRAME_TYPE"); return; }
        _frames += 1; _sequence += 1; _frameNumber += 1;
        if (isLast) {
            _verified += 1; _session += 1; _metadata = null; _chunk = null;
            _sequence = 0; _chunkNumber = 0; _frameNumber = 0;
            if (_session == _ids.size()) { _status = "VALID"; }
        } else if (_frameNumber == _chunk.size()) {
            _chunkNumber += 1; _frameNumber = 0; _chunk = null;
        }
    }
}
