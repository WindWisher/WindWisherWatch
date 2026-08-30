import Toybox.Application.Storage;
import Toybox.Lang;

class GarminSessionStore {
    private var _frames;

    function initialize() { _frames = new SeFrame(); }

    function create(sessionId, startedAt) {
        var index = readIndex();
        if (index[sessionId] != null) { return false; }
        index[sessionId] = { "state" => SeConstants.STATE_PREPARING, "startedAt" => startedAt, "lastSequence" => -1, "lastChunk" => 0 };
        Storage.setValue(chunkKey(sessionId, 0), []);
        Storage.setValue(SeConstants.INDEX_KEY, index);
        return true;
    }

    function append(sessionId, frame) {
        var index = readIndex();
        var metadata = index[sessionId];
        if (metadata == null) { return false; }
        var chunkNumber = metadata["lastChunk"];
        var key = chunkKey(sessionId, chunkNumber);
        var chunk = Storage.getValue(key);
        if (chunk == null) { chunk = []; }
        if (chunk.size() >= SeConstants.MAX_FRAMES_PER_CHUNK) {
            chunkNumber += 1;
            key = chunkKey(sessionId, chunkNumber);
            chunk = [];
        }
        chunk.add(frame);
        Storage.setValue(key, chunk);
        var verified = Storage.getValue(key);
        if (verified == null || verified.size() != chunk.size() || !_frames.validate(verified[verified.size() - 1])) { return false; }
        metadata["lastChunk"] = chunkNumber;
        metadata["lastSequence"] = frame["sequence"];
        index[sessionId] = metadata;
        Storage.setValue(SeConstants.INDEX_KEY, index);
        return true;
    }

    function updateState(sessionId, state) {
        var index = readIndex();
        if (index[sessionId] == null) { return false; }
        index[sessionId]["state"] = state;
        Storage.setValue(SeConstants.INDEX_KEY, index);
        return true;
    }

    function validate(sessionId) {
        var index = readIndex();
        var metadata = index[sessionId];
        if (metadata == null) { return { "integrity" => "CORRUPT", "lastSequence" => -1, "hasFinal" => false }; }
        var chunkNumber = metadata["lastChunk"];
        var chunk = Storage.getValue(chunkKey(sessionId, chunkNumber));
        if (chunk == null || chunk.size() == 0) {
            return { "integrity" => "CORRUPT", "lastSequence" => -1, "hasFinal" => false };
        }
        // Every frame is read back and verified before the index advances. Rechecking
        // only the bounded tail avoids a watchdog trip when a physical session ends.
        var expected = chunkNumber * SeConstants.MAX_FRAMES_PER_CHUNK;
        var hasFinal = false;
        for (var frameIndex = 0; frameIndex < chunk.size(); frameIndex += 1) {
            var frame = chunk[frameIndex] as Lang.Dictionary;
            if (!_frames.validate(frame) || frame["sequence"] != expected) {
                return { "integrity" => expected > 0 ? "RECOVERABLE" : "CORRUPT", "lastSequence" => expected - 1, "hasFinal" => false };
            }
            hasFinal = frame["frameType"].equals(SeConstants.FRAME_SESSION_FINAL);
            expected += 1;
        }
        if (metadata["lastSequence"] != expected - 1) { return { "integrity" => "RECOVERABLE", "lastSequence" => expected - 1, "hasFinal" => false }; }
        return { "integrity" => hasFinal ? "VALID" : "RECOVERABLE", "lastSequence" => expected - 1, "hasFinal" => hasFinal };
    }

    function discoverRecoverable() {
        var output = [];
        var index = readIndex();
        var keys = index.keys();
        for (var position = 0; position < keys.size(); position += 1) {
            var sessionId = keys[position];
            if (!validate(sessionId)["integrity"].equals("VALID")) { output.add(sessionId); }
        }
        return output;
    }

    function latestCheckpoint(sessionId) {
        var metadata = readIndex()[sessionId];
        if (metadata == null) { return null; }
        for (var chunkNumber = metadata["lastChunk"]; chunkNumber >= 0; chunkNumber -= 1) {
            var chunk = Storage.getValue(chunkKey(sessionId, chunkNumber));
            if (chunk == null) { return null; }
            for (var frameIndex = chunk.size() - 1; frameIndex >= 0; frameIndex -= 1) {
                var frame = chunk[frameIndex] as Lang.Dictionary;
                if (!_frames.validate(frame)) { return null; }
                if (frame["frameType"].equals(SeConstants.FRAME_CHECKPOINT)) { return frame; }
            }
        }
        return null;
    }

    function readIndex() {
        var index = Storage.getValue(SeConstants.INDEX_KEY);
        return index == null ? {} : index;
    }

    function chunkKey(sessionId, chunkNumber) { return "se." + sessionId + "." + chunkNumber; }
}
