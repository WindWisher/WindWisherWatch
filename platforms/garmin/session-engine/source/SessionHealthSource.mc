import Toybox.Sensor;

class SessionHealthSource {
    private var _controller;
    private var _running = false;

    function initialize(controller) { _controller = controller; }

    function start() {
        if (_running) { return true; }
        try {
            Sensor.setEnabledSensors([Sensor.SENSOR_HEARTRATE]);
            Sensor.enableSensorEvents(method(:onSensor));
            _running = true;
            return true;
        } catch (ex) { return false; }
    }

    function stop() {
        if (!_running) { return; }
        try {
            Sensor.enableSensorEvents(null);
            Sensor.setEnabledSensors([]);
        } catch (ex) { }
        _running = false;
    }

    function onSensor(info as Sensor.Info) as Void {
        if (info.heartRate != null) { _controller.heartRate(info.heartRate); }
        if (info.pressure != null) { _controller.pressure(info.pressure); }
    }
}
