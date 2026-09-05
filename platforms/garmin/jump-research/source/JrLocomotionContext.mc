import Toybox.Math;

class JrLocomotionContext {
    private const CAPACITY = 8;
    private const ENTER_MILLIG = 1428;
    private const EXIT_MILLIG = 1122;
    private const DEBOUNCE_MILLISECONDS = 180;
    private const WINDOW_MILLISECONDS = 3000;
    private var _timestamps = [null, null, null, null, null, null, null, null];
    private var _writeIndex = 0;
    private var _length = 0;
    private var _above = false;
    private var _lastImpact = null;
    private var _degraded = false;
    private var _totalImpacts = 0;

    function observe(timestamp, magnitude, quality) {
        if ((quality & (JrConstants.FLAG_TIMESTAMP_DEGRADED | JrConstants.FLAG_SAMPLE_GAP)) != 0) { _degraded = true; }
        if (magnitude <= EXIT_MILLIG) { _above = false; }
        if (magnitude < ENTER_MILLIG || _above) { return; }
        if (_lastImpact != null && timestamp - _lastImpact < DEBOUNCE_MILLISECONDS) { return; }
        _above = true;
        _lastImpact = timestamp;
        _timestamps[_writeIndex] = timestamp;
        _writeIndex = (_writeIndex + 1) % CAPACITY;
        if (_length < CAPACITY) { _length += 1; }
        _totalImpacts += 1;
    }

    function count(startTime, endTime) {
        var result = 0;
        for (var index = 0; index < _length; index += 1) {
            var timestamp = timestampAt(index);
            if (timestamp >= startTime && timestamp <= endTime) { result += 1; }
        }
        return result;
    }

    function intervalMean(startTime, endTime) {
        var previous = null;
        var sum = 0.0;
        var intervals = 0;
        for (var index = 0; index < _length; index += 1) {
            var timestamp = timestampAt(index);
            if (timestamp < startTime || timestamp > endTime) { continue; }
            if (previous != null) { sum += timestamp - previous; intervals += 1; }
            previous = timestamp;
        }
        return intervals == 0 ? null : sum / intervals;
    }

    function intervalCv(startTime, endTime) {
        var mean = intervalMean(startTime, endTime);
        if (mean == null || mean == 0) { return null; }
        var previous = null;
        var sumSquares = 0.0;
        var intervals = 0;
        for (var index = 0; index < _length; index += 1) {
            var timestamp = timestampAt(index);
            if (timestamp < startTime || timestamp > endTime) { continue; }
            if (previous != null) {
                var difference = (timestamp - previous) - mean;
                sumSquares += difference * difference;
                intervals += 1;
            }
            previous = timestamp;
        }
        return intervals == 0 ? null : Math.sqrt(sumSquares / intervals) / mean;
    }

    function state(startTime, endTime) {
        if (_degraded) { return "LOCOMOTION_AMBIGUOUS"; }
        var impactCount = count(startTime, endTime);
        var mean = intervalMean(startTime, endTime);
        var cv = intervalCv(startTime, endTime);
        if (impactCount >= 4 && mean >= 250 && mean <= 1200 && cv != null && cv <= 0.25) { return "LOCOMOTION_PERIODIC"; }
        return impactCount >= 2 ? "LOCOMOTION_POSSIBLE" : "LOCOMOTION_NONE";
    }

    function previousDelta(endTime) {
        var previous = null;
        for (var index = 0; index < _length; index += 1) {
            var timestamp = timestampAt(index);
            if (timestamp <= endTime) { previous = timestamp; }
        }
        return previous == null ? null : endTime - previous;
    }

    function defaultStart(endTime) { return endTime - WINDOW_MILLISECONDS; }
    function used() { return _length; }
    function totalImpacts() { return _totalImpacts; }
    function timestampAt(orderedIndex) {
        var start = (_writeIndex - _length + CAPACITY) % CAPACITY;
        return _timestamps[(start + orderedIndex) % CAPACITY];
    }
}
