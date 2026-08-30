import Toybox.Position;

class SessionPositionSource {
    private var _controller;
    private var _running = false;

    function initialize(controller) { _controller = controller; }

    function start() {
        if (_running) { return true; }
        try {
            Position.enableLocationEvents(Position.LOCATION_CONTINUOUS, method(:onPosition));
            _running = true;
            return true;
        } catch (ex) { return false; }
    }

    function stop() {
        if (!_running) { return; }
        try { Position.enableLocationEvents(Position.LOCATION_DISABLE, null); }
        catch (ex) { }
        _running = false;
    }

    function onPosition(info as Position.Info) as Void {
        if (info.position == null) { _controller.quality("GPS_UNAVAILABLE"); return; }
        var degrees = info.position.toDegrees();
        var speed = info.speed == null ? 0 : info.speed;
        _controller.position(degrees[0], degrees[1], speed, info.accuracy);
    }
}
