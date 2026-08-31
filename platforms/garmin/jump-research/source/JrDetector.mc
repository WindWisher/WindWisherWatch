import Toybox.Math;

class JrDetector {
    private const STATE_GROUND = 0;
    private const STATE_TAKEOFF = 1;
    private const STATE_FLIGHT = 2;
    private const STATE_LANDING = 3;
    private const TAKEOFF_IMPULSE_MILLIG = 1428;
    private const LOW_G_MILLIG = 663;
    private const LANDING_IMPULSE_MILLIG = 1529;
    private const MIN_FLIGHT_MILLISECONDS = 240;
    private const MAX_FLIGHT_MILLISECONDS = 3000;
    private const TAKEOFF_WINDOW_MILLISECONDS = 360;
    private const POST_EVENT_MILLISECONDS = 1000;

    private var _state = STATE_GROUND;
    private var _takeoff = null;
    private var _landing = null;
    private var _stateStarted = 0;
    private var _confirmed = 0;
    private var _rejected = 0;
    private var _candidateCount = 0;
    private var _smoothingValues = [0, 0, 0, 0, 0];
    private var _smoothingSize = 3;
    private var _smoothingCount = 0;
    private var _smoothingIndex = 0;
    private var _smoothingSum = 0.0;
    private var _lastAirtime = null;

    function initialize(profile) {
        _smoothingSize = profile.equals("HIGH") ? 5 : 3;
    }

    function magnitude(x, y, z) { return Math.sqrt((x * x) + (y * y) + (z * z)); }

    function smooth(value) {
        if (_smoothingCount < _smoothingSize) {
            _smoothingValues[_smoothingIndex] = value;
            _smoothingSum += value;
            _smoothingCount += 1;
        } else {
            _smoothingSum -= _smoothingValues[_smoothingIndex];
            _smoothingValues[_smoothingIndex] = value;
            _smoothingSum += value;
        }
        _smoothingIndex = (_smoothingIndex + 1) % _smoothingSize;
        return _smoothingSum / _smoothingCount;
    }

    function observe(normalizedTimestamp, ax, ay, az) {
        var raw = magnitude(ax, ay, az);
        var filtered = smooth(raw);
        if (_state == STATE_GROUND) {
            if (raw >= TAKEOFF_IMPULSE_MILLIG) {
                _state = STATE_TAKEOFF;
                _stateStarted = normalizedTimestamp;
                _candidateCount += 1;
            }
            return 0;
        }
        if (_state == STATE_TAKEOFF) {
            if (filtered <= LOW_G_MILLIG) {
                _takeoff = _stateStarted;
                _state = STATE_FLIGHT;
            } else if (normalizedTimestamp - _stateStarted > TAKEOFF_WINDOW_MILLISECONDS) {
                _rejected += 1;
                resetState();
                return -1;
            }
            return 0;
        }
        if (_state == STATE_FLIGHT) {
            var duration = normalizedTimestamp - _takeoff;
            if (duration > MAX_FLIGHT_MILLISECONDS) {
                _rejected += 1;
                resetState();
                return -1;
            }
            if (raw >= LANDING_IMPULSE_MILLIG) {
                _landing = normalizedTimestamp;
                _state = STATE_LANDING;
                if (duration < MIN_FLIGHT_MILLISECONDS) {
                    _rejected += 1;
                    resetState();
                    return -1;
                }
            }
            return 0;
        }
        if (normalizedTimestamp - _landing >= POST_EVENT_MILLISECONDS) {
            _lastAirtime = _landing - _takeoff;
            _confirmed += 1;
            resetState();
            return 1;
        }
        return 0;
    }

    function resetState() {
        _state = STATE_GROUND;
        _takeoff = null;
        _landing = null;
    }

    function finish() {
        if (_state != STATE_GROUND) { _rejected += 1; resetState(); }
    }

    function confirmed() { return _confirmed; }
    function rejected() { return _rejected; }
    function candidateCount() { return _candidateCount; }
    function lastAirtime() { return _lastAirtime; }
    function stateName() {
        if (_state == STATE_TAKEOFF) { return "POSSIBLE_TAKEOFF"; }
        if (_state == STATE_FLIGHT) { return "FLIGHT"; }
        if (_state == STATE_LANDING) { return "POSSIBLE_LANDING"; }
        return "GROUND";
    }
}
