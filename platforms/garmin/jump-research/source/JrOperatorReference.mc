class JrOperatorReference {
    private const CAPACITY = 4;
    private var _trialId;
    private var _datasetSplit;
    private var _expectedEventType;
    private var _types = new [CAPACITY];
    private var _timestamps = new [CAPACITY];
    private var _normalizedTimestamps = new [CAPACITY];
    private var _sequences = new [CAPACITY];
    private var _before = new [CAPACITY];
    private var _after = new [CAPACITY];
    private var _provenance = new [CAPACITY];
    private var _size = 0;

    function initialize(trialId, datasetSplit, expectedEventType) {
        _trialId = trialId;
        _datasetSplit = datasetSplit;
        _expectedEventType = expectedEventType;
    }

    function add(type, timestamp, normalizedTimestamp, sequence, uncertaintyBefore, uncertaintyAfter, provenance) {
        if (_size >= CAPACITY) { return false; }
        _types[_size] = type;
        _timestamps[_size] = timestamp;
        _normalizedTimestamps[_size] = normalizedTimestamp;
        _sequences[_size] = sequence;
        _before[_size] = uncertaintyBefore;
        _after[_size] = uncertaintyAfter;
        _provenance[_size] = provenance;
        _size += 1;
        return true;
    }

    function size() { return _size; }
    function capacity() { return CAPACITY; }
    function expectedEventType() { return _expectedEventType; }

    // Called only after sensor unregister, never from the IMU callback.
    function toJson() {
        var output = "{\"referenceSchemaVersion\":\"1.0.0\",\"trialId\":\"" + _trialId + "\",\"datasetSplit\":\"" + _datasetSplit + "\",\"expectedEventType\":\"" + _expectedEventType + "\",\"timestampQuality\":\"VALID\",\"markers\":[";
        for (var index = 0; index < _size; index += 1) {
            if (index > 0) { output += ","; }
            output += "{\"referenceId\":\"" + _trialId + ":m" + index + "\",\"markerType\":\"" + _types[index] + "\",\"timestampMilliseconds\":" + _timestamps[index]
                + ",\"normalizedTimestampMilliseconds\":" + value(_normalizedTimestamps[index]) + ",\"nearestSequence\":" + value(_sequences[index])
                + ",\"uncertaintyBeforeMilliseconds\":" + _before[index] + ",\"uncertaintyAfterMilliseconds\":" + _after[index]
                + ",\"provenance\":\"" + _provenance[index] + "\"}";
        }
        return output + "]}";
    }

    function value(item) { return item == null ? "null" : item.toString(); }
}
