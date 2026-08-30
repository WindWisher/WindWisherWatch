import Toybox.Math;

class CoreMetricProjector {
    private var _distance = 0.0;
    private var _maximumSpeed = null;
    private var _latestSpeed = null;
    private var _speedTime = null;
    private var _latitude = null;
    private var _longitude = null;
    private var _positionTime = null;
    private var _heartRate = null;
    private var _heartRateTime = null;
    private var _validGpsCount = 0;
    private var _rejectedSegmentCount = 0;
    private var _invalidGpsCount = 0;
    private var _invalidHeartRateCount = 0;

    function initialize() { }

    function ingestPosition(time, latitude, longitude, speed, usable) {
        if (!usable || latitude == null || longitude == null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            _invalidGpsCount += 1;
            return "GPS_POOR_FIX";
        }
        if (_positionTime != null && time < _positionTime) {
            _invalidGpsCount += 1;
            return "GPS_BACKWARD_TIMESTAMP";
        }
        if (_positionTime != null && time == _positionTime) {
            _invalidGpsCount += 1;
            return "GPS_DUPLICATE";
        }
        var speedIssue = null;
        if (speed != null && (speed < 0 || speed > SeConstants.MAXIMUM_SPEED_MPS)) { speedIssue = "GPS_INVALID_SPEED"; }
        if (_latitude != null) {
            var elapsedSeconds = (time - _positionTime).toFloat() / 1000.0;
            var segment = distanceMeters(_latitude, _longitude, latitude, longitude);
            if (elapsedSeconds <= 0 || segment / elapsedSeconds > SeConstants.MAXIMUM_SPEED_MPS) {
                _rejectedSegmentCount += 1;
                return "GPS_SPIKE";
            }
            _distance += segment;
        }
        _latitude = latitude;
        _longitude = longitude;
        _positionTime = time;
        _validGpsCount += 1;
        if (speed != null && speed >= 0 && speed <= SeConstants.MAXIMUM_SPEED_MPS) {
            _latestSpeed = speed;
            _speedTime = time;
            if (_maximumSpeed == null || speed > _maximumSpeed) { _maximumSpeed = speed; }
        }
        return speedIssue;
    }

    function ingestHeartRate(time, bpm) {
        if (bpm == null) { _invalidHeartRateCount += 1; return "HR_UNAVAILABLE"; }
        if (bpm < 20 || bpm > 250) { _invalidHeartRateCount += 1; return "HR_INVALID"; }
        _heartRate = bpm;
        _heartRateTime = time;
        return null;
    }

    function distanceMeters(lat1, lon1, lat2, lon2) {
        var radians = Math.PI / 180.0;
        var latitudeDelta = (lat2 - lat1) * radians;
        var longitudeDelta = (lon2 - lon1) * radians;
        var firstLatitude = lat1 * radians;
        var secondLatitude = lat2 * radians;
        var sinLatitude = Math.sin(latitudeDelta / 2.0);
        var sinLongitude = Math.sin(longitudeDelta / 2.0);
        var a = sinLatitude * sinLatitude + Math.cos(firstLatitude) * Math.cos(secondLatitude) * sinLongitude * sinLongitude;
        return 2.0 * SeConstants.EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
    }

    function restore(distance, maximumSpeed, latestSpeed, speedTime, latitude, longitude, positionTime, heartRate, heartRateTime, validGpsCount, rejectedSegmentCount, invalidGpsCount, invalidHeartRateCount) {
        _distance = distance;
        _maximumSpeed = maximumSpeed;
        _latestSpeed = latestSpeed;
        _speedTime = speedTime;
        _latitude = latitude;
        _longitude = longitude;
        _positionTime = positionTime;
        _heartRate = heartRate;
        _heartRateTime = heartRateTime;
        _validGpsCount = validGpsCount;
        _rejectedSegmentCount = rejectedSegmentCount;
        _invalidGpsCount = invalidGpsCount;
        _invalidHeartRateCount = invalidHeartRateCount;
    }

    function distance() { return _distance; }
    function maximumSpeed() { return _maximumSpeed; }
    function latestSpeed() { return _latestSpeed; }
    function speedTime() { return _speedTime; }
    function latitude() { return _latitude; }
    function longitude() { return _longitude; }
    function positionTime() { return _positionTime; }
    function heartRate() { return _heartRate; }
    function heartRateTime() { return _heartRateTime; }
    function validGpsCount() { return _validGpsCount; }
    function rejectedSegmentCount() { return _rejectedSegmentCount; }
    function invalidGpsCount() { return _invalidGpsCount; }
    function invalidHeartRateCount() { return _invalidHeartRateCount; }

    function gpsStatus(now) {
        if (_positionTime == null) { return "UNAVAILABLE"; }
        return now - _positionTime > SeConstants.GPS_STALE_MILLISECONDS ? "STALE" : "VALID";
    }

    function heartRateStatus(now) {
        if (_heartRateTime == null) { return "UNAVAILABLE"; }
        return now - _heartRateTime > SeConstants.HR_STALE_MILLISECONDS ? "STALE" : "VALID";
    }

    function currentSpeed(now) { return gpsStatus(now).equals("VALID") && _speedTime != null && now - _speedTime <= SeConstants.GPS_STALE_MILLISECONDS ? _latestSpeed : null; }
    function currentHeartRate(now) { return heartRateStatus(now).equals("VALID") ? _heartRate : null; }
}
