class JrStats {
    private var _callbacks = 0;
    private var _callbackDurationSum = 0l;
    private var _callbackDurationMax = 0;
    private var _callbackBuckets = [0, 0, 0, 0, 0, 0];
    private var _batchMin = null;
    private var _batchMax = 0;
    private var _batchSum = 0l;
    private var _samples = 0;
    private var _duplicates = 0;
    private var _outOfOrder = 0;
    private var _gaps = 0;
    private var _fallback = 0;
    private var _gyroOutliers = 0;
    private var _callbackPrevious = null;
    private var _callbackGapMax = 0;

    function observeCallback(startTime, endTime, batchSize) {
        var duration = JrClock.elapsed(startTime, endTime);
        _callbacks += 1;
        _callbackDurationSum += duration;
        if (duration > _callbackDurationMax) { _callbackDurationMax = duration; }
        var bucket = duration <= 0 ? 0 : (duration <= 1 ? 1 : (duration <= 2 ? 2 : (duration <= 4 ? 3 : (duration <= 8 ? 4 : 5))));
        _callbackBuckets[bucket] += 1;
        if (_batchMin == null || batchSize < _batchMin) { _batchMin = batchSize; }
        if (batchSize > _batchMax) { _batchMax = batchSize; }
        _batchSum += batchSize;
        _samples += batchSize;
        if (_callbackPrevious != null) {
            var gap = JrClock.elapsed(_callbackPrevious, startTime);
            if (gap > _callbackGapMax) { _callbackGapMax = gap; }
        }
        _callbackPrevious = startTime;
    }

    function duplicate() { _duplicates += 1; }
    function outOfOrder() { _outOfOrder += 1; }
    function gap() { _gaps += 1; }
    function fallback() { _fallback += 1; }
    function gyroOutlier() { _gyroOutliers += 1; }
    function callbacks() { return _callbacks; }
    function samples() { return _samples; }
    function gyroOutliers() { return _gyroOutliers; }

    function percentileBucket(percentile) {
        if (_callbacks == 0) { return null; }
        var target = ((_callbacks * percentile) + 99) / 100;
        var total = 0;
        var limits = [0, 1, 2, 4, 8, null];
        for (var index = 0; index < _callbackBuckets.size(); index += 1) {
            total += _callbackBuckets[index];
            if (total >= target) { return limits[index]; }
        }
        return _callbackDurationMax;
    }

    function percentileLowerBound(percentile) {
        if (_callbacks == 0) { return null; }
        var target = ((_callbacks * percentile) + 99) / 100;
        var total = 0;
        for (var index = 0; index < _callbackBuckets.size(); index += 1) {
            total += _callbackBuckets[index];
            if (total >= target) { return index == 5 ? 8 : null; }
        }
        return null;
    }

    function toJson() {
        var meanDuration = _callbacks > 0 ? _callbackDurationSum.toFloat() / _callbacks : null;
        var meanBatch = _callbacks > 0 ? _batchSum.toFloat() / _callbacks : null;
        return "{\"callbacks\":" + _callbacks
            + ",\"samples\":" + _samples
            + ",\"callbackProcessingMilliseconds\":{\"mean\":" + value(meanDuration) + ",\"max\":" + _callbackDurationMax + ",\"p95UpperBound\":" + value(percentileBucket(95)) + ",\"p95LowerBound\":" + value(percentileLowerBound(95)) + ",\"p99UpperBound\":" + value(percentileBucket(99)) + ",\"p99LowerBound\":" + value(percentileLowerBound(99)) + ",\"histogramBounds\":[0,1,2,4,8,\"over8\"],\"histogramCounts\":[" + buckets() + "]}"
            + ",\"batchSize\":{\"min\":" + value(_batchMin) + ",\"mean\":" + value(meanBatch) + ",\"max\":" + _batchMax + "}"
            + ",\"maximumInterCallbackMilliseconds\":" + _callbackGapMax
            + ",\"timestampQuality\":{\"duplicates\":" + _duplicates + ",\"outOfOrder\":" + _outOfOrder + ",\"gaps\":" + _gaps + ",\"fallbackOrInterpolated\":" + _fallback + "}"
            + ",\"gyroOutliers\":" + _gyroOutliers + "}";
    }

    function buckets() {
        var output = "";
        for (var index = 0; index < _callbackBuckets.size(); index += 1) {
            if (index > 0) { output += ","; }
            output += _callbackBuckets[index];
        }
        return output;
    }

    function value(item) { return item == null ? "null" : item.toString(); }
}
