import Toybox.Sensor;

class MotionProbe {
    private var _writer;
    private var _counts;
    private var _running = false;
    private var _timing;
    private var _gyroscopePrevious = null;
    private var _gyroscopeMaximum = null;
    private var _gyroscopeMaximumNext = null;
    private var _awaitingMaximumNext = false;
    private var _callbackTiming;
    private var _callbackCount = 0;
    private var _accelerometerMaximumBatchSize = 0;
    private var _gyroscopeMaximumBatchSize = 0;

    function initialize(writer, counts) {
        _writer = writer;
        _counts = counts;
    }

    function start(accelerometerRate, gyroscopeRate) {
        if (_running) { return false; }
        if (accelerometerRate == null || accelerometerRate <= 0 || gyroscopeRate == null || gyroscopeRate <= 0) {
            _writer.warning(LabConstants.ERROR_SAMPLE_RATE_UNSUPPORTED, "max_rate_unavailable");
            return false;
        }
        var options = {
            :period => 1,
            :synchronous => true,
            :accelerometer => { :enabled => true, :sampleRate => accelerometerRate, :includePower => false, :includePitch => false, :includeRoll => false, :includeTimestamps => true },
            :gyroscope => { :enabled => true, :sampleRate => gyroscopeRate, :includeTimestamps => true }
        };
        _timing = {
            :accelerometer => new TimingStats(1000 / accelerometerRate),
            :gyroscope => new TimingStats(1000 / gyroscopeRate)
        };
        _callbackTiming = new TimingStats(1000);
        _callbackCount = 0;
        try {
            Sensor.registerSensorDataListener(method(:onSensorData), options);
            _running = true;
            return true;
        } catch (ex) {
            _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "high_frequency_listener");
            return false;
        }
    }

    function stop() {
        if (!_running) { return; }
        try { Sensor.unregisterSensorDataListener(); }
        catch (ex) { _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "unregister_listener"); }
        _running = false;
    }

    function onSensorData(data as Sensor.SensorData) as Void {
        var callbackTime = LabClock.now();
        _callbackTiming.observe(callbackTime);
        _callbackCount += 1;
        if (data.accelerometerData != null && data.accelerometerData.x.size() > _accelerometerMaximumBatchSize) { _accelerometerMaximumBatchSize = data.accelerometerData.x.size(); }
        if (data.gyroscopeData != null && data.gyroscopeData.x.size() > _gyroscopeMaximumBatchSize) { _gyroscopeMaximumBatchSize = data.gyroscopeData.x.size(); }
        if (data.accelerometerData != null) { emitBatch("accelerometer", :accelerometer, data.accelerometerData, callbackTime, "millig"); }
        if (data.gyroscopeData != null) { emitBatch("gyroscope", :gyroscope, data.gyroscopeData, callbackTime, "degrees_per_second"); }
    }

    function emitBatch(sensorName, sensorKey, batch, callbackTime, units) {
        var timestamps = null;
        if (batch has :timestamp) { timestamps = batch.timestamp; }
        for (var index = 0; index < batch.x.size(); index += 1) {
            var sampleTime = timestamps != null ? timestamps[index] : callbackTime;
            var sequence = _counts[sensorKey];
            _timing[sensorKey].observe(sampleTime);
            if (sensorKey == :gyroscope) { observeGyroscope(sequence, sampleTime, batch.x[index], batch.y[index], batch.z[index]); }
            updateMaxima(sensorKey, batch.x[index], batch.y[index], batch.z[index]);
            // Keep physical debug logs bounded. Counts include every sample, while
            // raw export preserves an initial timing window plus sparse continuity
            // evidence for longer runs.
            if (sequence < 32 || sequence % 100 == 0) {
                _writer.sample(sensorName, sequence, sampleTime, callbackTime, "{\"x\":" + batch.x[index] + ",\"y\":" + batch.y[index] + ",\"z\":" + batch.z[index] + ",\"units\":\"" + units + "\",\"timestampSource\":\"" + (timestamps != null ? "sensor" : "callback_fallback") + "\"}");
            }
            _counts[sensorKey] = sequence + 1;
        }
    }

    function updateMaxima(sensorKey, x, y, z) {
        if (sensorKey == :accelerometer) {
            updateMaximum(:accelerometerMaxAbsX, absolute(x));
            updateMaximum(:accelerometerMaxAbsY, absolute(y));
            updateMaximum(:accelerometerMaxAbsZ, absolute(z));
        } else {
            updateMaximum(:gyroscopeMaxAbsX, absolute(x));
            updateMaximum(:gyroscopeMaxAbsY, absolute(y));
            updateMaximum(:gyroscopeMaxAbsZ, absolute(z));
        }
    }

    function updateMaximum(key, value) {
        if (value > _counts[key]) { _counts[key] = value; }
    }

    function absolute(value) { return value < 0 ? -value : value; }

    function observeGyroscope(sequence, sampleTime, x, y, z) {
        if (_awaitingMaximumNext) {
            _gyroscopeMaximumNext = [x, y, z];
            _awaitingMaximumNext = false;
        }
        var magnitude = absolute(x);
        if (absolute(y) > magnitude) { magnitude = absolute(y); }
        if (absolute(z) > magnitude) { magnitude = absolute(z); }
        if (_gyroscopeMaximum == null || magnitude > _gyroscopeMaximum[:magnitude]) {
            _gyroscopeMaximum = {
                :magnitude => magnitude,
                :sequence => sequence,
                :timestamp => sampleTime,
                :value => [x, y, z],
                :previous => _gyroscopePrevious
            };
            _gyroscopeMaximumNext = null;
            _awaitingMaximumNext = true;
        }
        _gyroscopePrevious = [x, y, z];
    }

    function timingJson() {
        if (_timing == null) { return "{\"accelerometer\":null,\"gyroscope\":null}"; }
        return "{\"accelerometer\":" + _timing[:accelerometer].toJson() + ",\"gyroscope\":" + _timing[:gyroscope].toJson() + "}";
    }


    function diagnosticsJson() {
        if (_gyroscopeMaximum == null) { return "{\"gyroscopeMaximum\":null,\"callbackTiming\":" + callbackTimingJson() + "}"; }
        return "{\"gyroscopeMaximum\":{\"maximumAbsoluteAxisValue\":" + _gyroscopeMaximum[:magnitude]
            + ",\"sequence\":" + _gyroscopeMaximum[:sequence]
            + ",\"sensorTimestampMilliseconds\":" + _gyroscopeMaximum[:timestamp]
            + ",\"value\":" + vectorJson(_gyroscopeMaximum[:value])
            + ",\"precedingValue\":" + vectorJson(_gyroscopeMaximum[:previous])
            + ",\"followingValue\":" + vectorJson(_gyroscopeMaximumNext)
            + ",\"units\":\"degrees_per_second\"},\"callbackTiming\":" + callbackTimingJson() + "}";
    }

    function callbackTimingJson() {
        return "{\"callbackCount\":" + _callbackCount
            + ",\"accelerometerMaximumBatchSize\":" + _accelerometerMaximumBatchSize
            + ",\"gyroscopeMaximumBatchSize\":" + _gyroscopeMaximumBatchSize
            + ",\"intervals\":" + (_callbackTiming == null ? "null" : _callbackTiming.toJson()) + "}";
    }

    function vectorJson(vector) {
        if (vector == null) { return "null"; }
        return "[" + vector[0] + "," + vector[1] + "," + vector[2] + "]";
    }
}
