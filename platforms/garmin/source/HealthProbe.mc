import Toybox.Sensor;

class HealthProbe {
    private var _writer;
    private var _counts;
    private var _running = false;
    private var _heartRateTiming;
    private var _pressureTiming;

    function initialize(writer, counts) { _writer = writer; _counts = counts; }

    function start() {
        if (_running) { return false; }
        try {
            _heartRateTiming = new TimingStats(1000);
            _pressureTiming = new TimingStats(1000);
            Sensor.setEnabledSensors([Sensor.SENSOR_HEARTRATE]);
            Sensor.enableSensorEvents(method(:onSensor));
            _running = true;
            return true;
        } catch (ex) {
            _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "health_listener");
            return false;
        }
    }

    function stop() {
        if (!_running) { return; }
        try {
            Sensor.enableSensorEvents(null);
            Sensor.setEnabledSensors([]);
        } catch (ex) { _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "health_disable"); }
        _running = false;
    }

    function onSensor(info as Sensor.Info) as Void {
        var now = LabClock.now();
        if (info.heartRate != null) {
            _heartRateTiming.observe(now);
            var hrSequence = _counts[:heartRate];
            _writer.sample("heart_rate", hrSequence, now, now, "{\"bpm\":" + info.heartRate + ",\"units\":\"bpm\"}");
            _counts[:heartRate] = hrSequence + 1;
        }
        if (info.pressure != null || info.altitude != null) {
            _pressureTiming.observe(now);
            var pressureSequence = _counts[:pressure];
            var pressure = info.pressure != null ? info.pressure : "null";
            var altitude = info.altitude != null ? info.altitude : "null";
            _writer.sample("pressure", pressureSequence, now, now, "{\"seaLevelCalibratedPressurePascals\":" + pressure + ",\"altitudeMeters\":" + altitude + "}");
            _counts[:pressure] = pressureSequence + 1;
        }
    }

    function timingJson() {
        return "{\"heartRate\":" + (_heartRateTiming == null ? "null" : _heartRateTiming.toJson()) + ",\"pressure\":" + (_pressureTiming == null ? "null" : _pressureTiming.toJson()) + "}";
    }
}
