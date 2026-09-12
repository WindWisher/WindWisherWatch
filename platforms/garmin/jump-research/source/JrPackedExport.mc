import Toybox.Lang;
import Toybox.StringUtil;
import Toybox.System;

// Post-capture lossless Float32 acceleration, UInt32 times and state flags.
class JrPackedExport {
    private var _lines = [];
    private var _bytes = 0;
    private var _invalid = false;
    private var _source;
    private var _reference;
    private var _duration;
    private var _result;
    private var _nextSample = 0;
    private var _phase = 0;
    private var _statsJson;
    private var _referenceJson;
    private var _tracesJson;
    function ready() { return _phase == 5 && valid(); }
    function initialize() {}
    function add(line) {
        if (_invalid) { return; }
        if (_lines.size() >= 18 || _bytes + JrConstants.LOG_PREFIX.length() + line.length() + 1 > JrConstants.DIAGNOSTIC_EXPORT_BUDGET) { _invalid = true; return; }
        _bytes += JrConstants.LOG_PREFIX.length() + line.length() + 1;
        _lines.add(line);
    }
    function size() { return _lines.size(); }
    function line(index) { return _lines[index]; }
    function bytes() { return _bytes; }
    function valid() { return !_invalid && _bytes <= JrConstants.DIAGNOSTIC_EXPORT_BUDGET; }
    function motion(buffer, start, count) {
        var bytes = new [12 + count * 19]b;
        var first = buffer.record(start);
        var bases = [first[1] == null ? 0 : first[1], first[4], first[3]];
        for (var baseIndex = 0; baseIndex < 3; baseIndex += 1) {
            if (bases[baseIndex] < 0 || bases[baseIndex] >= 4294967295l) { throw new Lang.InvalidValueException("Invalid clock base"); }
            bytes.encodeNumber(bases[baseIndex], Lang.NUMBER_FORMAT_UINT32, {:offset => baseIndex * 4, :endianness => Lang.ENDIAN_LITTLE});
        }
        for (var i = 0; i < count; i += 1) {
            var row = buffer.record(start + i);
            var offset = 12 + i * 19;
            var times = [row[1], row[4], row[3]];
            for (var j = 0; j < 3; j += 1) {
                var time = times[j] == null ? 4294967295l : times[j];
                if (time < 0 || time > 4294967295l || (time == 4294967295l && times[j] != null)) { throw new Lang.InvalidValueException("Timestamp cannot be encoded losslessly"); }
                var delta = times[j] == null ? 65535 : (time - bases[j] + 4294967296l) % 4294967296l;
                if ((times[j] == null && j != 0) || delta > 65535 || (delta == 65535 && times[j] != null)) { throw new Lang.InvalidValueException("Clock delta cannot be encoded losslessly"); }
                bytes.encodeNumber(delta, Lang.NUMBER_FORMAT_UINT16, {:offset => offset + j * 2, :endianness => Lang.ENDIAN_LITTLE});
            }
            for (var axis = 0; axis < 3; axis += 1) {
                var at = offset + 6 + axis * 4;
                bytes.encodeNumber(row[5 + axis], Lang.NUMBER_FORMAT_FLOAT, {:offset => at, :endianness => Lang.ENDIAN_LITTLE});
                if (bytes.decodeNumber(Lang.NUMBER_FORMAT_FLOAT, {:offset => at, :endianness => Lang.ENDIAN_LITTLE}) != row[5 + axis]) { throw new Lang.InvalidValueException("Acceleration cannot be encoded losslessly"); }
            }
            var state = buffer.stateAt(start + i);
            if (row[11] < 0 || row[11] > 15 || state < 0 || state > 7) { throw new Lang.InvalidValueException("Invalid diagnostic flags"); }
            bytes[offset + 18] = row[11] | (state << 4);
        }
        var a = 1l; var b = 0l;
        for (var k = 0; k < bytes.size(); k += 1) { a = (a + bytes[k]) % 65521; b = (b + a) % 65521; }
        return "E|" + start + "|" + StringUtil.convertEncodedString(bytes, {:fromRepresentation => StringUtil.REPRESENTATION_BYTE_ARRAY, :toRepresentation => StringUtil.REPRESENTATION_STRING_BASE64}) + "|" + (b * 65536 + a);
    }
    function prepare(id, source, reference, duration, result) {
        _source = source; _reference = reference; _duration = duration; _result = result;
        add("{\"recordType\":\"manifest\",\"researchSchemaVersion\":\"1.3.0\",\"appVersion\":\"" + JrConstants.APP_VERSION + "\",\"experimentId\":\"" + id + "\",\"protocolId\":\"" + JrConstants.DIAGNOSTIC_PROTOCOL + "\",\"sensorProfile\":\"MEDIUM\",\"captureMode\":\"CONTROLLED_FULL_WINDOW\",\"jumpAlgorithmVersion\":\"" + JrConstants.ALGORITHM_VERSION + "\",\"requestedRateHz\":25,\"encoding\":\"LE19_DELTA_ACCEL_STATE_V1\",\"gyroExport\":\"QUALITY_ONLY\",\"limits\":{\"maxSamples\":225,\"maxDurationMilliseconds\":12000}}");
        return valid();
    }
    // Exactly one bounded block or summary component per timer turn.
    // No lines are emitted until every stage has passed the export budget.
    function step() {
        if (!valid() || _phase == 5) { return valid(); }
        var source = _source;
        var buffer = source.buffer();
        var result = _result;
        var duration = _duration;
        if (_nextSample < buffer.size()) {
            var count = buffer.size() - _nextSample;
            if (count > 25) { count = 25; }
            add(motion(buffer, _nextSample, count));
            _nextSample += count;
            return valid();
        }
        if (_phase == 0) { _statsJson = source.stats().toJson(); _phase = 1; return valid(); }
        if (_phase == 1) { _referenceJson = _reference.toJson(); _phase = 2; return valid(); }
        if (_phase == 2) { _tracesJson = source.detector().compactTracesJson(); _phase = 3; return valid(); }
        if (_phase == 4) {
            add("{\"recordType\":\"completion\",\"result\":\"" + result + "\",\"records\":" + buffer.size() + "}");
            _source = null; _reference = null;
            _phase = 5; return valid();
        }
        var d = source.detector();
        add("{\"recordType\":\"summary\",\"result\":\"" + result + "\",\"durationMilliseconds\":" + duration
            + ",\"observedSamples\":" + source.sequence() + ",\"exportedSamples\":" + buffer.size()
            + ",\"overwrittenOrDroppedSamples\":" + buffer.dropped()
            + ",\"unprocessedDeliveredSamples\":" + source.diagnosticDiscarded()
            + ",\"exportFreeBytes\":" + System.getSystemStats().freeMemory
            + ",\"callbackStatistics\":" + _statsJson
            + ",\"operatorReference\":" + _referenceJson
            + ",\"detector\":{\"candidateCount\":" + d.candidateCount() + ",\"confirmedCandidates\":" + d.confirmed()
            + ",\"rejectedCandidates\":" + d.rejected() + ",\"compactCandidateTraces\":" + _tracesJson + "}}");
        _statsJson = null; _referenceJson = null; _tracesJson = null;
        _phase = 4;
        return valid();
    }
}
