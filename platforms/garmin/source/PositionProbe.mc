import Toybox.Math;
import Toybox.Position;

class PositionProbe {
    private var _writer;
    private var _counts;
    private var _running = false;
    private var _timing;
    private var _requestedAt = null;
    private var _firstUsableAt = null;
    private var _firstUsableQuality = null;

    function initialize(writer, counts) { _writer = writer; _counts = counts; }

    function start() {
        if (_running) { return false; }
        try {
            _timing = new TimingStats(1000);
            _requestedAt = LabClock.now();
            _firstUsableAt = null;
            _firstUsableQuality = null;
            Position.enableLocationEvents(Position.LOCATION_CONTINUOUS, method(:onPosition));
            _running = true;
            return true;
        } catch (ex) {
            _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "position_listener");
            return false;
        }
    }

    function stop() {
        if (!_running) { return; }
        try { Position.enableLocationEvents(Position.LOCATION_DISABLE, null); }
        catch (ex) { _writer.warning(LabConstants.ERROR_REGISTRATION_FAILED, "position_disable"); }
        _running = false;
    }

    function onPosition(info as Position.Info) as Void {
        var callbackTime = LabClock.now();
        _timing.observe(callbackTime);
        var lat = "null";
        var lon = "null";
        if (info.position != null) {
            var degrees = info.position.toDegrees();
            lat = degrees[0].toString();
            lon = degrees[1].toString();
            if (_firstUsableAt == null) {
                _firstUsableAt = callbackTime;
                _firstUsableQuality = info.accuracy;
            }
        }
        var gpsTime = info.when != null ? info.when.value() : "null";
        var altitude = info.altitude != null ? info.altitude : "null";
        var speed = info.speed != null ? info.speed : "null";
        var heading = info.heading != null ? info.heading : "null";
        var sequence = _counts[:position];
        _writer.sample("position", sequence, callbackTime, callbackTime, "{\"latitudeDegrees\":" + lat + ",\"longitudeDegrees\":" + lon + ",\"altitudeMeters\":" + altitude + ",\"groundSpeedMps\":" + speed + ",\"headingRadians\":" + heading + ",\"gpsEpochSeconds\":" + gpsTime + ",\"quality\":" + info.accuracy + "}");
        _counts[:position] = sequence + 1;
    }

    function timingJson() { return _timing == null ? "null" : _timing.toJson(); }

    function ttffJson() {
        var elapsed = (_requestedAt != null && _firstUsableAt != null) ? LabClock.elapsed(_requestedAt, _firstUsableAt) : null;
        return "{\"requestedAtMonotonicMilliseconds\":" + value(_requestedAt) + ",\"firstUsablePositionAtMonotonicMilliseconds\":" + value(_firstUsableAt) + ",\"timeToFirstUsablePositionMilliseconds\":" + value(elapsed) + ",\"firstUsablePositionQuality\":" + value(_firstUsableQuality) + "}";
    }

    function value(item) { return item == null ? "null" : item.toString(); }
}
