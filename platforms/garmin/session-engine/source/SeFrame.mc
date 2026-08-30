class SeFrame {
    private var _checksum;

    function initialize() { _checksum = new SeChecksum(); }

    function create(sequence, frameType, payload) {
        if (payload.length() > SeConstants.MAX_PAYLOAD_CHARACTERS) { return null; }
        var canonical = canonical(sequence, frameType, payload);
        return {
            "magic" => SeConstants.FRAME_MAGIC,
            "formatVersion" => SeConstants.JOURNAL_FORMAT_VERSION,
            "sequence" => sequence,
            "frameType" => frameType,
            "payloadLength" => payload.length(),
            "payload" => payload,
            "checksum" => _checksum.calculate(canonical)
        };
    }

    function validate(frame) {
        if (frame == null || frame["magic"] == null || !frame["magic"].equals(SeConstants.FRAME_MAGIC)) { return false; }
        if (frame["formatVersion"] != SeConstants.JOURNAL_FORMAT_VERSION) { return false; }
        if (frame["payload"] == null || frame["payload"].length() > SeConstants.MAX_PAYLOAD_CHARACTERS) { return false; }
        if (frame["payloadLength"] != frame["payload"].length()) { return false; }
        return frame["checksum"] == _checksum.calculate(canonical(frame["sequence"], frame["frameType"], frame["payload"]));
    }

    function canonical(sequence, frameType, payload) {
        return SeConstants.FRAME_MAGIC + "|" + SeConstants.JOURNAL_FORMAT_VERSION + "|" + sequence + "|" + frameType + "|" + payload;
    }
}
