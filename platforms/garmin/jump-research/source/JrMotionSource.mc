import Toybox.Sensor;

class JrMotionSource {
    private var _profile;
    private var _mode;
    private var _rate;
    private var _buffer;
    private var _stats;
    private var _detector;
    private var _running = false;
    private var _sequence = 0;
    private var _lastRawTimestamp = null;
    private var _lastNormalizedTimestamp = null;
    private var _expectedInterval = 40;
    private var _captureFrozen = false;
    private var _postCandidateRemaining = 0;
    private var _limitReached = false;

    function initialize(profile, mode, rate) {
        _profile = profile;
        _mode = mode;
        _rate = rate;
        _expectedInterval = 1000 / rate;
        _buffer = new JrCaptureBuffer(JrConstants.MAX_CAPTURE_SAMPLES);
        _buffer.reset(mode.equals(JrConstants.MODE_CANDIDATE_WINDOWS));
        _stats = new JrStats();
        _detector = new JrDetector(profile);
    }

    function start() {
        var options = {
            :period => 1,
            :synchronous => true,
            :accelerometer => { :enabled => true, :sampleRate => _rate, :includePower => false, :includePitch => false, :includeRoll => false, :includeTimestamps => true },
            :gyroscope => { :enabled => true, :sampleRate => _rate, :includeTimestamps => true }
        };
        Sensor.registerSensorDataListener(method(:onSensorData), options);
        _running = true;
    }

    function stop() {
        if (!_running) { return; }
        Sensor.unregisterSensorDataListener();
        _running = false;
        _detector.finish();
    }

    function onSensorData(data as Sensor.SensorData) as Void {
        var callbackStart = JrClock.now();
        var accel = data.accelerometerData;
        var gyro = data.gyroscopeData;
        var batchSize = accel == null ? 0 : accel.x.size();
        var accelTimes = (accel != null && accel has :timestamp) ? accel.timestamp : null;
        var gyroTimes = (gyro != null && gyro has :timestamp) ? gyro.timestamp : null;
        for (var index = 0; index < batchSize; index += 1) {
            var rawTimestamp = accelTimes == null ? null : accelTimes[index];
            var gyroTimestamp = (gyroTimes == null || index >= gyroTimes.size()) ? null : gyroTimes[index];
            var quality = 0;
            var normalized = rawTimestamp;
            if (rawTimestamp == null) {
                normalized = callbackStart;
                quality |= JrConstants.FLAG_TIMESTAMP_DEGRADED;
                _stats.fallback();
            } else if (_lastRawTimestamp != null && rawTimestamp <= _lastRawTimestamp) {
                if (rawTimestamp == _lastRawTimestamp) { _stats.duplicate(); }
                else { _stats.outOfOrder(); }
                normalized = callbackStart;
                quality |= JrConstants.FLAG_TIMESTAMP_DEGRADED;
                _stats.fallback();
            }
            if (_lastNormalizedTimestamp != null && normalized <= _lastNormalizedTimestamp) {
                normalized = _lastNormalizedTimestamp + _expectedInterval;
                quality |= JrConstants.FLAG_TIMESTAMP_DEGRADED;
                _stats.fallback();
            }
            if (_lastNormalizedTimestamp != null && normalized - _lastNormalizedTimestamp > (_expectedInterval * 3)) {
                quality |= JrConstants.FLAG_SAMPLE_GAP;
                _stats.gap();
            }
            if (rawTimestamp != null && (_lastRawTimestamp == null || rawTimestamp > _lastRawTimestamp)) { _lastRawTimestamp = rawTimestamp; }
            _lastNormalizedTimestamp = normalized;

            var gx = (gyro == null || index >= gyro.x.size()) ? null : gyro.x[index];
            var gy = (gyro == null || index >= gyro.y.size()) ? null : gyro.y[index];
            var gz = (gyro == null || index >= gyro.z.size()) ? null : gyro.z[index];
            if (isGyroOutlier(gx, gy, gz)) {
                quality |= JrConstants.FLAG_GYRO_OUTLIER;
                _stats.gyroOutlier();
            }
            var detectorResult = _detector.observe(normalized, accel.x[index], accel.y[index], accel.z[index]);
            if (detectorResult == 1 && _mode.equals(JrConstants.MODE_CANDIDATE_WINDOWS)) { _postCandidateRemaining = _rate; }
            if (_postCandidateRemaining > 0) {
                _postCandidateRemaining -= 1;
                if (_postCandidateRemaining == 0) { _captureFrozen = true; _limitReached = true; }
            }
            if (!_captureFrozen && !_mode.equals(JrConstants.MODE_SUMMARY_ONLY)) {
                // A full raw transport buffer is not a sensor-runtime limit.
                // Continue detector/statistics processing until the explicit
                // duration bound and expose every rejected raw sample via the
                // buffer's deterministic dropped counter.
                _buffer.append(_sequence, rawTimestamp, gyroTimestamp, callbackStart, normalized, accel.x[index], accel.y[index], accel.z[index], gx, gy, gz, quality);
            }
            _sequence += 1;
        }
        var callbackEnd = JrClock.now();
        _stats.observeCallback(callbackStart, callbackEnd, batchSize);
    }

    function isGyroOutlier(x, y, z) {
        if (x == null || y == null || z == null) { return false; }
        return absolute(x) >= 3000 || absolute(y) >= 3000 || absolute(z) >= 3000;
    }

    function absolute(value) { return value < 0 ? -value : value; }
    function buffer() { return _buffer; }
    function stats() { return _stats; }
    function detector() { return _detector; }
    function limitReached() { return _limitReached; }
    function sequence() { return _sequence; }
}
