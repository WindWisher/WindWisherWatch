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
    private const MAX_JUMP_ENVELOPE_FLIGHT_MINIMUM_MILLIG = 408;
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
    private var _latestObservedTimestamp = null;
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
    private var _takeoffPeakAccel = 0.0;
    private var _flightMinimumAccel = null;
    private var _landingPeakAccel = null;
    private var _postEventPeakAccel = null;
    private var _decisionTakeoffPeakAccel = null;
    private var _decisionFlightMinimumAccel = null;
    private var _decisionLandingPeakAccel = null;
    private var _decisionFlightDuration = null;
    private var _decisionSustainedLowG = null;
    private var _decisionEnvelopeMatched = false;
    private var _shortFlight = false;
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
    private var _locomotion;
    private var _preImpactCount = 0;
    private var _preIntervalMean = null;
    private var _preIntervalCv = null;
    private var _prePreviousImpactDelta = null;
    private var _preLocomotionState = "LOCOMOTION_NONE";

    function initialize(profile) {
        _smoothingSize = profile.equals("HIGH") ? 5 : 3;
        _locomotion = new JrLocomotionContext();
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

    function observe(normalizedTimestamp, ax, ay, az, quality, gx, gy, gz, gyroOutlier) {
        _latestObservedTimestamp = normalizedTimestamp;
        var raw = magnitude(ax, ay, az);
        var filtered = smooth(raw);
        _locomotion.observe(normalizedTimestamp, raw, quality);
        if (_state == STATE_GROUND) {
            if (raw >= TAKEOFF_IMPULSE_MILLIG) {
                _activeCandidateId = _candidateCount;
                _candidateCount += 1;
                _state = STATE_TAKEOFF;
                _stateStarted = normalizedTimestamp;
                _impulse = normalizedTimestamp;
                _candidateStarted = normalizedTimestamp;
                _takeoffPeakAccel = raw;
                _qualityMask = quality;
                _reasonMask = JrConstants.REASON_TAKEOFF_IMPULSE_FOUND;
                _gyroValidSamples = 0;
                _gyroOutlierSamples = 0;
                _maximumValidGyro = 0.0;
                _takeoffX = ax;
                _takeoffY = ay;
                _takeoffZ = az;
                _landingDirectionCosine = null;
                _flightMinimumAccel = null;
                _landingPeakAccel = null;
                _postEventPeakAccel = null;
                _decisionTakeoffPeakAccel = null;
                _decisionFlightMinimumAccel = null;
                _decisionLandingPeakAccel = null;
                _decisionFlightDuration = null;
                _decisionSustainedLowG = null;
                _decisionEnvelopeMatched = false;
                _shortFlight = false;
                _maximumSustainedLowG = 0;
                _lowGStreakStarted = null;
                var preEnd = normalizedTimestamp - 1;
                var preStart = _locomotion.defaultStart(preEnd);
                _preImpactCount = _locomotion.count(preStart, preEnd);
                _preIntervalMean = _locomotion.intervalMean(preStart, preEnd);
                _preIntervalCv = _locomotion.intervalCv(preStart, preEnd);
                _prePreviousImpactDelta = _locomotion.previousDelta(preEnd);
                _preLocomotionState = _locomotion.state(preStart, preEnd);
                observeGyro(gx, gy, gz, gyroOutlier);
            }
            return 0;
        }

        _qualityMask |= quality;
        if ((quality & JrConstants.FLAG_TIMESTAMP_DEGRADED) != 0) { _reasonMask |= JrConstants.REASON_TIMESTAMP_DEGRADED; }
        observeGyro(gx, gy, gz, gyroOutlier);

        if (_state == STATE_TAKEOFF) {
            _takeoffPeakAccel = raw > _takeoffPeakAccel ? raw : _takeoffPeakAccel;
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
                _flightMinimumAccel = filtered;
                _maximumSustainedLowG = 0;
                _lowGStreakStarted = normalizedTimestamp;
                _reasonMask |= JrConstants.REASON_LOW_G_PHASE_FOUND;
                _state = STATE_FLIGHT;
            }
            return 0;
        }

        if (_state == STATE_FLIGHT) {
            var duration = normalizedTimestamp - _takeoff;
            _flightMinimumAccel = filtered < _flightMinimumAccel ? filtered : _flightMinimumAccel;
            if (filtered <= LOW_G_MILLIG) {
                if (_lowGStreakStarted == null) { _lowGStreakStarted = normalizedTimestamp; }
                var lowGDuration = normalizedTimestamp - _lowGStreakStarted;
                if (lowGDuration > _maximumSustainedLowG) { _maximumSustainedLowG = lowGDuration; }
            } else { _lowGStreakStarted = null; }
            if (duration > MAX_FLIGHT_MILLISECONDS) { return finishCandidate("REJECTED", normalizedTimestamp); }
            if (raw >= LANDING_IMPULSE_MILLIG) {
                _landing = normalizedTimestamp;
                _landingPeakAccel = raw;
                var directionDenominator = magnitude(_takeoffX, _takeoffY, _takeoffZ) * raw;
                _landingDirectionCosine = directionDenominator == 0 ? null : ((_takeoffX * ax) + (_takeoffY * ay) + (_takeoffZ * az)) / directionDenominator;
                var hasJumpImpulseLowGEnvelope = _takeoffPeakAccel >= JrConstants.TAKEOFF_PEAK_THRESHOLD_MILLIG
                    && _flightMinimumAccel != null
                    && _flightMinimumAccel <= MAX_JUMP_ENVELOPE_FLIGHT_MINIMUM_MILLIG;
                _decisionTakeoffPeakAccel = _takeoffPeakAccel;
                _decisionFlightMinimumAccel = _flightMinimumAccel;
                _decisionLandingPeakAccel = _landingPeakAccel;
                _decisionFlightDuration = duration;
                _decisionSustainedLowG = _maximumSustainedLowG;
                _decisionEnvelopeMatched = hasJumpImpulseLowGEnvelope;
                if (!hasJumpImpulseLowGEnvelope) {
                    _qualityMask |= JrConstants.FLAG_ARM_MOTION_PATTERN;
                    _reasonMask |= JrConstants.REASON_ARM_MOTION_PATTERN;
                    _reasonMask |= JrConstants.REASON_JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING;
                } else { _reasonMask |= JrConstants.REASON_JUMP_IMPULSE_LOW_G_ENVELOPE_FOUND; }
                if (_landingDirectionCosine != null && _landingDirectionCosine >= MIN_TAKEOFF_LANDING_DIRECTION_COSINE) { _reasonMask |= JrConstants.REASON_IMPULSE_DIRECTION_CONSISTENT; }
                _reasonMask |= JrConstants.REASON_LANDING_IMPULSE_FOUND;
                _shortFlight = duration < MIN_FLIGHT_MILLISECONDS || _maximumSustainedLowG < MIN_SUSTAINED_LOW_G_MILLISECONDS;
                if (_shortFlight) {
                    if (_maximumSustainedLowG < MIN_SUSTAINED_LOW_G_MILLISECONDS) { _reasonMask |= JrConstants.REASON_LOW_G_TOO_BRIEF; }
                } else {
                    _reasonMask |= JrConstants.REASON_FLIGHT_DURATION_PLAUSIBLE | JrConstants.REASON_LOW_G_DURATION_PLAUSIBLE;
                }
                _state = STATE_LANDING;
            }
            return 0;
        }

        _postEventPeakAccel = _postEventPeakAccel == null || raw > _postEventPeakAccel ? raw : _postEventPeakAccel;
        if (filtered >= GROUNDED_MINIMUM_MILLIG && filtered <= GROUNDED_MAXIMUM_MILLIG && normalizedTimestamp - _landing >= LANDING_STABILIZATION_MILLISECONDS) {
            _landingStable = true;
            _reasonMask |= JrConstants.REASON_LANDING_STABLE;
        }
        if (normalizedTimestamp - _landing >= POST_EVENT_MILLISECONDS) {
            if (!_landingStable) {
                _reasonMask |= JrConstants.REASON_LANDING_NOT_STABLE;
                return finishCandidate("REJECTED", normalizedTimestamp);
            }
            if (_shortFlight) { return finishCandidate("REJECTED", normalizedTimestamp); }
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
        var postStart = _landing == null ? endTime : _landing + 100;
        var trace = "{\"candidateId\":" + _activeCandidateId
            + ",\"status\":\"" + status + "\""
            + ",\"candidateStartedMilliseconds\":" + value(_candidateStarted)
            + ",\"takeoffMilliseconds\":" + value(_takeoff)
            + ",\"landingMilliseconds\":" + value(_landing)
            + ",\"reasonMask\":" + _reasonMask
            + ",\"qualityMask\":" + _qualityMask
            + ",\"impulseToFlightMilliseconds\":" + value(_takeoff == null ? null : _takeoff - _impulse)
            + ",\"candidateToFlightMilliseconds\":" + value(_takeoff == null ? null : _takeoff - _candidateStarted)
            + ",\"sustainedLowGMilliseconds\":" + _maximumSustainedLowG
            + ",\"flightToLandingMilliseconds\":" + value((_takeoff == null || _landing == null) ? null : _landing - _takeoff)
            + ",\"takeoffPeakAccelMillig\":" + _takeoffPeakAccel
            + ",\"flightMinimumAccelMillig\":" + value(_flightMinimumAccel)
            + ",\"landingPeakAccelMillig\":" + value(_landingPeakAccel)
            + ",\"featuresAtDecision\":{\"takeoffPeakAccelMillig\":" + value(_decisionTakeoffPeakAccel)
            + ",\"flightMinimumAccelMillig\":" + value(_decisionFlightMinimumAccel)
            + ",\"landingPeakAccelMillig\":" + value(_decisionLandingPeakAccel)
            + ",\"flightDurationMilliseconds\":" + value(_decisionFlightDuration)
            + ",\"sustainedLowGMilliseconds\":" + value(_decisionSustainedLowG)
            + ",\"takeoffPeakThresholdMillig\":" + JrConstants.TAKEOFF_PEAK_THRESHOLD_MILLIG
            + ",\"maximumFlightMinimumMillig\":" + MAX_JUMP_ENVELOPE_FLIGHT_MINIMUM_MILLIG
            + ",\"envelopeMatched\":" + (_decisionEnvelopeMatched ? "true" : "false") + "}"
            + ",\"postEventDiagnostics\":{\"peakAccelMillig\":" + value(_postEventPeakAccel) + "}"
            + ",\"landingStable\":" + (_landingStable ? "true" : "false")
            + ",\"gyroValidSamples\":" + _gyroValidSamples
            + ",\"gyroOutlierSamples\":" + _gyroOutlierSamples
            + ",\"maximumValidGyro\":" + _maximumValidGyro
            + ",\"takeoffLandingDirectionCosine\":" + value(_landingDirectionCosine)
            + ",\"locomotionContext\":{\"observerOnly\":true,\"preState\":\"" + _preLocomotionState + "\",\"preImpactCount\":" + _preImpactCount
            + ",\"preIntervalMeanMilliseconds\":" + value(_preIntervalMean) + ",\"preIntervalCoefficientOfVariation\":" + value(_preIntervalCv)
            + ",\"previousImpactDeltaMilliseconds\":" + value(_prePreviousImpactDelta) + ",\"postImpactCount\":" + _locomotion.count(postStart, endTime)
            + ",\"postIntervalMeanMilliseconds\":" + value(_locomotion.intervalMean(postStart, endTime)) + ",\"postIntervalCoefficientOfVariation\":" + value(_locomotion.intervalCv(postStart, endTime))
            + ",\"postState\":\"" + _locomotion.state(postStart, endTime) + "\"}"
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
            // End in the same normalized sample domain as takeoff/landing.
            // _stateStarted is the last takeoff impulse, not the last sample.
            finishCandidate("REJECTED", _latestObservedTimestamp);
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
    function confirmedTracesJson() {
        var output = "[";
        var emitted = 0;
        for (var index = 0; index < _traces.size(); index += 1) {
            if (!_traceStatuses[index].equals("CONFIRMED")) { continue; }
            if (emitted > 0) { output += ","; }
            output += _traces[index];
            emitted += 1;
        }
        return output + "]";
    }
    function retainedTraceCount() { return _traces.size(); }
    function locomotionContext() { return _locomotion; }
    function stateName() {
        if (_state == STATE_TAKEOFF) { return "POSSIBLE_TAKEOFF"; }
        if (_state == STATE_FLIGHT) { return "FLIGHT"; }
        if (_state == STATE_LANDING) { return "POSSIBLE_LANDING"; }
        return "GROUND";
    }
    function value(item) { return item == null ? "null" : item.toString(); }
}
