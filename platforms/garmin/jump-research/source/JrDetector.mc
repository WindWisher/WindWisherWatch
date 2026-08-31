import Toybox.Math;

class JrDetector {
    private const STATE_GROUND = 0;
    private const STATE_TAKEOFF = 1;
    private const STATE_FLIGHT = 2;
    private const STATE_LANDING = 3;
    private const TAKEOFF_IMPULSE_MILLIG = 1428;
    private const LOW_G_MILLIG = 663;
    private const GROUNDED_MINIMUM_MILLIG = 714;
    private const GROUNDED_MAXIMUM_MILLIG = 1325;
    private const LANDING_IMPULSE_MILLIG = 1529;
    private const MIN_FLIGHT_MILLISECONDS = 240;
    private const MIN_SUSTAINED_LOW_G_MILLISECONDS = 120;
    private const MAX_FLIGHT_MILLISECONDS = 3000;
    private const TAKEOFF_WINDOW_MILLISECONDS = 360;
    private const MAX_TAKEOFF_CANDIDATE_MILLISECONDS = 1000;
    private const LANDING_STABILIZATION_MILLISECONDS = 160;
    private const POST_EVENT_MILLISECONDS = 1000;
    private const MIN_TAKEOFF_LANDING_DIRECTION_COSINE = 0.9;

    private var _state = STATE_GROUND;
    private var _impulse = null;
    private var _candidateStarted = null;
    private var _takeoff = null;
    private var _landing = null;
    private var _landingStable = false;
    private var _stateStarted = 0;
    private var _confirmed = 0;
    private var _rejected = 0;
    private var _candidateCount = 0;
    private var _activeCandidateId = null;
    private var _smoothingValues = [0, 0, 0, 0, 0];
    private var _smoothingSize = 3;
    private var _smoothingCount = 0;
    private var _smoothingIndex = 0;
    private var _smoothingSum = 0.0;
    private var _lastAirtime = null;
    private var _peakAccel = 0.0;
    private var _minimumFlightAccel = null;
    private var _maximumSustainedLowG = 0;
    private var _lowGStreakStarted = null;
    private var _qualityMask = 0;
    private var _reasonMask = 0;
    private var _gyroValidSamples = 0;
    private var _gyroOutlierSamples = 0;
    private var _maximumValidGyro = 0.0;
    private var _takeoffX = 0.0;
    private var _takeoffY = 0.0;
    private var _takeoffZ = 0.0;
    private var _landingDirectionCosine = null;
    private var _traces = [];
    private var _traceStatuses = [];
    private var _traceWriteIndex = 0;

    function initialize(profile) { _smoothingSize = profile.equals("HIGH") ? 5 : 3; }
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

    function observe(normalizedTimestamp, ax, ay, az, quality, gx, gy, gz, gyroOutlier) {
        var raw = magnitude(ax, ay, az);
        var filtered = smooth(raw);
        if (_state == STATE_GROUND) {
            if (raw >= TAKEOFF_IMPULSE_MILLIG) {
                _activeCandidateId = _candidateCount;
                _candidateCount += 1;
                _state = STATE_TAKEOFF;
                _stateStarted = normalizedTimestamp;
                _impulse = normalizedTimestamp;
                _candidateStarted = normalizedTimestamp;
                _peakAccel = raw;
                _qualityMask = quality;
                _reasonMask = JrConstants.REASON_TAKEOFF_IMPULSE_FOUND;
                _gyroValidSamples = 0;
                _gyroOutlierSamples = 0;
                _maximumValidGyro = 0.0;
                _takeoffX = ax;
                _takeoffY = ay;
                _takeoffZ = az;
                _landingDirectionCosine = null;
                _minimumFlightAccel = null;
                _maximumSustainedLowG = 0;
                _lowGStreakStarted = null;
                observeGyro(gx, gy, gz, gyroOutlier);
            }
            return 0;
        }

        _qualityMask |= quality;
        if ((quality & JrConstants.FLAG_TIMESTAMP_DEGRADED) != 0) { _reasonMask |= JrConstants.REASON_TIMESTAMP_DEGRADED; }
        _peakAccel = raw > _peakAccel ? raw : _peakAccel;
        observeGyro(gx, gy, gz, gyroOutlier);

        if (_state == STATE_TAKEOFF) {
            if (normalizedTimestamp - _candidateStarted > MAX_TAKEOFF_CANDIDATE_MILLISECONDS) {
                _reasonMask |= JrConstants.REASON_NO_FLIGHT_PHASE;
                return finishCandidate("REJECTED", normalizedTimestamp);
            } else if (raw >= TAKEOFF_IMPULSE_MILLIG) {
                _impulse = normalizedTimestamp;
                _stateStarted = normalizedTimestamp;
                _takeoffX = ax;
                _takeoffY = ay;
                _takeoffZ = az;
                _reasonMask |= JrConstants.REASON_TAKEOFF_IMPULSE_UPDATED;
            } else if (normalizedTimestamp - _stateStarted > TAKEOFF_WINDOW_MILLISECONDS) {
                _reasonMask |= JrConstants.REASON_NO_FLIGHT_PHASE | JrConstants.REASON_IMPACT_ONLY;
                return finishCandidate("REJECTED", normalizedTimestamp);
            } else if (filtered <= LOW_G_MILLIG) {
                _takeoff = normalizedTimestamp;
                _minimumFlightAccel = filtered;
                _maximumSustainedLowG = 0;
                _lowGStreakStarted = normalizedTimestamp;
                _reasonMask |= JrConstants.REASON_LOW_G_PHASE_FOUND;
                _state = STATE_FLIGHT;
            }
            return 0;
        }

        if (_state == STATE_FLIGHT) {
            var duration = normalizedTimestamp - _takeoff;
            _minimumFlightAccel = filtered < _minimumFlightAccel ? filtered : _minimumFlightAccel;
            if (filtered <= LOW_G_MILLIG) {
                if (_lowGStreakStarted == null) { _lowGStreakStarted = normalizedTimestamp; }
                var lowGDuration = normalizedTimestamp - _lowGStreakStarted;
                if (lowGDuration > _maximumSustainedLowG) { _maximumSustainedLowG = lowGDuration; }
            } else { _lowGStreakStarted = null; }
            if (duration > MAX_FLIGHT_MILLISECONDS) { return finishCandidate("REJECTED", normalizedTimestamp); }
            if (raw >= LANDING_IMPULSE_MILLIG) {
                _landing = normalizedTimestamp;
                var directionDenominator = magnitude(_takeoffX, _takeoffY, _takeoffZ) * raw;
                _landingDirectionCosine = directionDenominator == 0 ? null : ((_takeoffX * ax) + (_takeoffY * ay) + (_takeoffZ * az)) / directionDenominator;
                if (_landingDirectionCosine != null && _landingDirectionCosine < MIN_TAKEOFF_LANDING_DIRECTION_COSINE) {
                    _qualityMask |= JrConstants.FLAG_ARM_MOTION_PATTERN;
                    _reasonMask |= JrConstants.REASON_ARM_MOTION_PATTERN;
                } else if (_landingDirectionCosine != null) { _reasonMask |= JrConstants.REASON_IMPULSE_DIRECTION_CONSISTENT; }
                _reasonMask |= JrConstants.REASON_LANDING_IMPULSE_FOUND;
                if (duration < MIN_FLIGHT_MILLISECONDS || _maximumSustainedLowG < MIN_SUSTAINED_LOW_G_MILLISECONDS) {
                    if (_maximumSustainedLowG < MIN_SUSTAINED_LOW_G_MILLISECONDS) { _reasonMask |= JrConstants.REASON_LOW_G_TOO_BRIEF; }
                    return finishCandidate("REJECTED", normalizedTimestamp);
                }
                _reasonMask |= JrConstants.REASON_FLIGHT_DURATION_PLAUSIBLE | JrConstants.REASON_LOW_G_DURATION_PLAUSIBLE;
                _state = STATE_LANDING;
            }
            return 0;
        }

        if (filtered >= GROUNDED_MINIMUM_MILLIG && filtered <= GROUNDED_MAXIMUM_MILLIG && normalizedTimestamp - _landing >= LANDING_STABILIZATION_MILLISECONDS) {
            _landingStable = true;
            _reasonMask |= JrConstants.REASON_LANDING_STABLE;
        }
        if (normalizedTimestamp - _landing >= POST_EVENT_MILLISECONDS) {
            if (!_landingStable) {
                _reasonMask |= JrConstants.REASON_LANDING_NOT_STABLE;
                return finishCandidate("REJECTED", normalizedTimestamp);
            }
            if ((_reasonMask & JrConstants.REASON_ARM_MOTION_PATTERN) != 0) { return finishCandidate("REJECTED", normalizedTimestamp); }
            _lastAirtime = _landing - _takeoff;
            return finishCandidate("CONFIRMED", normalizedTimestamp);
        }
        return 0;
    }

    function observeGyro(gx, gy, gz, outlier) {
        if (outlier) {
            _gyroOutlierSamples += 1;
            _reasonMask |= JrConstants.REASON_GYRO_CORRUPTED;
            return;
        }
        if (gx == null || gy == null || gz == null) { return; }
        var gyroMagnitude = magnitude(gx, gy, gz);
        _gyroValidSamples += 1;
        if (gyroMagnitude > _maximumValidGyro) { _maximumValidGyro = gyroMagnitude; }
    }

    function finishCandidate(status, endTime) {
        if (status.equals("CONFIRMED")) { _confirmed += 1; } else { _rejected += 1; }
        var trace = "{\"candidateId\":" + _activeCandidateId
            + ",\"status\":\"" + status + "\""
            + ",\"reasonMask\":" + _reasonMask
            + ",\"qualityMask\":" + _qualityMask
            + ",\"impulseToFlightMilliseconds\":" + value(_takeoff == null ? null : _takeoff - _impulse)
            + ",\"candidateToFlightMilliseconds\":" + value(_takeoff == null ? null : _takeoff - _candidateStarted)
            + ",\"sustainedLowGMilliseconds\":" + _maximumSustainedLowG
            + ",\"flightToLandingMilliseconds\":" + value((_takeoff == null || _landing == null) ? null : _landing - _takeoff)
            + ",\"peakAccelMillig\":" + _peakAccel
            + ",\"minimumFlightAccelMillig\":" + value(_minimumFlightAccel)
            + ",\"landingStable\":" + (_landingStable ? "true" : "false")
            + ",\"gyroValidSamples\":" + _gyroValidSamples
            + ",\"gyroOutlierSamples\":" + _gyroOutlierSamples
            + ",\"maximumValidGyro\":" + _maximumValidGyro
            + ",\"takeoffLandingDirectionCosine\":" + value(_landingDirectionCosine)
            + ",\"endMilliseconds\":" + endTime + "}";
        retainTrace(trace, status);
        resetState();
        return status.equals("CONFIRMED") ? 1 : -1;
    }

    function retainTrace(trace, status) {
        if (_traces.size() < JrConstants.MAX_CANDIDATES) {
            _traces.add(trace);
            _traceStatuses.add(status);
            return;
        }
        var replacement = null;
        for (var offset = 0; offset < JrConstants.MAX_CANDIDATES; offset += 1) {
            var index = (_traceWriteIndex + offset) % JrConstants.MAX_CANDIDATES;
            if (_traceStatuses[index].equals("REJECTED")) { replacement = index; break; }
        }
        if (replacement == null) { return; }
        _traces[replacement] = trace;
        _traceStatuses[replacement] = status;
        _traceWriteIndex = (replacement + 1) % JrConstants.MAX_CANDIDATES;
    }

    function resetState() {
        _state = STATE_GROUND;
        _impulse = null;
        _candidateStarted = null;
        _takeoff = null;
        _landing = null;
        _landingStable = false;
        _lowGStreakStarted = null;
        _activeCandidateId = null;
    }

    function finish() {
        if (_state != STATE_GROUND) {
            _reasonMask |= JrConstants.REASON_SESSION_ENDED;
            finishCandidate("REJECTED", _stateStarted);
        }
    }

    function confirmed() { return _confirmed; }
    function rejected() { return _rejected; }
    function candidateCount() { return _candidateCount; }
    function lastAirtime() { return _lastAirtime; }
    function tracesJson() {
        var output = "[";
        for (var index = 0; index < _traces.size(); index += 1) {
            if (index > 0) { output += ","; }
            output += _traces[index];
        }
        return output + "]";
    }
    function retainedTraceCount() { return _traces.size(); }
    function stateName() {
        if (_state == STATE_TAKEOFF) { return "POSSIBLE_TAKEOFF"; }
        if (_state == STATE_FLIGHT) { return "FLIGHT"; }
        if (_state == STATE_LANDING) { return "POSSIBLE_LANDING"; }
        return "GROUND";
    }
    function value(item) { return item == null ? "null" : item.toString(); }
}
