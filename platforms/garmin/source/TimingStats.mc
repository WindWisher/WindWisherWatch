class TimingStats {
    private const BUCKET_MULTIPLIERS = [50, 75, 90, 110, 125, 150, 200, 250, 400];
    private const GAP_MULTIPLIER_PERCENT = 250;

    private var _expectedInterval;
    private var _lastTimestamp = null;
    private var _sampleCount = 0;
    private var _intervalCount = 0;
    private var _sumInterval = 0l;
    private var _minimumInterval = null;
    private var _maximumInterval = 0;
    private var _duplicateCount = 0;
    private var _outOfOrderCount = 0;
    private var _gapCount = 0;
    private var _largestGap = 0;
    private var _largestGapPreviousTimestamp = null;
    private var _largestGapCurrentTimestamp = null;
    private var _nonGapIntervalCount = 0;
    private var _nonGapIntervalSum = 0l;
    private var _missingTimestampCount = 0;
    private var _buckets;

    function initialize(expectedIntervalMilliseconds) {
        _expectedInterval = expectedIntervalMilliseconds;
        _buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    function observe(timestamp) {
        _sampleCount += 1;
        if (timestamp == null) {
            _missingTimestampCount += 1;
            return;
        }
        if (_lastTimestamp == null) {
            _lastTimestamp = timestamp;
            return;
        }

        var previousTimestamp = _lastTimestamp;
        var interval = timestamp - previousTimestamp;
        if (interval == 0) {
            _duplicateCount += 1;
            return;
        }
        if (interval < 0) {
            _outOfOrderCount += 1;
            return;
        }
        _lastTimestamp = timestamp;

        _intervalCount += 1;
        _sumInterval += interval;
        if (_minimumInterval == null || interval < _minimumInterval) { _minimumInterval = interval; }
        if (interval > _maximumInterval) { _maximumInterval = interval; }
        if (interval > gapThreshold()) {
            _gapCount += 1;
            if (interval > _largestGap) {
                _largestGap = interval;
                _largestGapPreviousTimestamp = previousTimestamp;
                _largestGapCurrentTimestamp = timestamp;
            }
        } else {
            _nonGapIntervalCount += 1;
            _nonGapIntervalSum += interval;
        }
        _buckets[bucketIndex(interval)] += 1;
    }

    function gapThreshold() {
        return (_expectedInterval * GAP_MULTIPLIER_PERCENT) / 100;
    }

    function bucketIndex(interval) {
        for (var index = 0; index < BUCKET_MULTIPLIERS.size(); index += 1) {
            if ((interval * 100) <= (_expectedInterval * BUCKET_MULTIPLIERS[index])) { return index; }
        }
        return BUCKET_MULTIPLIERS.size();
    }

    function percentileUpperBound(percentile) {
        if (_intervalCount == 0) { return null; }
        var target = ((_intervalCount * percentile) + 99) / 100;
        var cumulative = 0;
        for (var index = 0; index < _buckets.size(); index += 1) {
            cumulative += _buckets[index];
            if (cumulative >= target) {
                if (index >= BUCKET_MULTIPLIERS.size()) { return _maximumInterval; }
                return (_expectedInterval * BUCKET_MULTIPLIERS[index]) / 100;
            }
        }
        return _maximumInterval;
    }

    function toJson() {
        var mean = _intervalCount > 0 ? _sumInterval.toFloat() / _intervalCount : null;
        var nonGapMean = _nonGapIntervalCount > 0 ? _nonGapIntervalSum.toFloat() / _nonGapIntervalCount : null;
        return "{\"sampleCount\":" + _sampleCount
            + ",\"intervalCount\":" + _intervalCount
            + ",\"expectedIntervalMilliseconds\":" + _expectedInterval
            + ",\"gapThresholdMilliseconds\":" + gapThreshold()
            + ",\"meanIntervalMilliseconds\":" + value(mean)
            + ",\"nonGapIntervalCount\":" + _nonGapIntervalCount
            + ",\"nonGapMeanIntervalMilliseconds\":" + value(nonGapMean)
            + ",\"minimumIntervalMilliseconds\":" + value(_minimumInterval)
            + ",\"maximumIntervalMilliseconds\":" + _maximumInterval
            + ",\"medianUpperBoundMilliseconds\":" + value(percentileUpperBound(50))
            + ",\"p95UpperBoundMilliseconds\":" + value(percentileUpperBound(95))
            + ",\"p99UpperBoundMilliseconds\":" + value(percentileUpperBound(99))
            + ",\"duplicateCount\":" + _duplicateCount
            + ",\"outOfOrderCount\":" + _outOfOrderCount
            + ",\"missingTimestampCount\":" + _missingTimestampCount
            + ",\"gapCount\":" + _gapCount
            + ",\"largestGapMilliseconds\":" + _largestGap
            + ",\"largestGapPreviousTimestamp\":" + value(_largestGapPreviousTimestamp)
            + ",\"largestGapCurrentTimestamp\":" + value(_largestGapCurrentTimestamp)
            + ",\"histogramCounts\":[" + joinBuckets() + "]}";
    }

    function joinBuckets() {
        var output = "";
        for (var index = 0; index < _buckets.size(); index += 1) {
            if (index > 0) { output += ","; }
            output += _buckets[index];
        }
        return output;
    }

    function value(item) { return item == null ? "null" : item.toString(); }

    function sampleCount() { return _sampleCount; }
    function intervalCount() { return _intervalCount; }
    function gapCount() { return _gapCount; }
    function largestGap() { return _largestGap; }
}
