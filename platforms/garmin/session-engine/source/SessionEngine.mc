import Toybox.System;

class SessionEngine {
    private var _store;
    private var _clock;
    private var _frame;
    private var _state = SeConstants.STATE_IDLE;
    private var _sessionId = null;
    private var _sequence = 0;
    private var _startedAt = 0;
    private var _wallAnchor = 0;
    private var _elapsedBeforeRecovery = 0;
    private var _lastCheckpointElapsed = 0;
    private var _currentSpeed = null;
    private var _heartRate = null;
    private var _gpsQuality = null;
    private var _positionCount = 0;
    private var _heartRateCount = 0;
    private var _pressureCount = 0;
    private var _motionCount = 0;
    private var _runtimeCount = 0;
    private var _qualityCount = 0;
    private var _lastQuality = null;
    private var _lastPersistedSequence = -1;

    function initialize(store, clock) {
        _store = store;
        _clock = clock;
        _frame = new SeFrame();
    }

    function state() { return _state; }
    function sessionId() { return _sessionId; }
    function elapsedMilliseconds() {
        if (_state.equals(SeConstants.STATE_IDLE)) { return 0; }
        if (_state.equals(SeConstants.STATE_RECOVERED)) { return _elapsedBeforeRecovery; }
        return _elapsedBeforeRecovery + _clock.elapsed(_startedAt, _clock.monotonicMilliseconds());
    }

    function prepare() {
        if (!_state.equals(SeConstants.STATE_IDLE)) { return false; }
        _state = SeConstants.STATE_PREPARING;
        _startedAt = _clock.monotonicMilliseconds();
        _wallAnchor = _clock.epochSeconds();
        _sessionId = "ww-" + _wallAnchor + "-" + _startedAt;
        if (!_store.create(_sessionId, _wallAnchor)) { return fail("STORAGE_WRITE_FAILED"); }
        return true;
    }

    function start() {
        if (!_state.equals(SeConstants.STATE_PREPARING)) { return false; }
        if (!append(SeConstants.FRAME_SESSION_START, "schema=" + SeConstants.SESSION_SCHEMA_VERSION + ";wall=" + _wallAnchor + ";mono=" + _startedAt)) { return false; }
        _state = SeConstants.STATE_RECORDING;
        if (!_store.updateState(_sessionId, _state)) { return fail("STORAGE_WRITE_FAILED"); }
        return true;
    }

    function ingestPosition(relativeMilliseconds, latitude, longitude, groundSpeed, quality) {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _positionCount += 1;
        _currentSpeed = groundSpeed;
        _gpsQuality = quality;
        // Canonical location is durable but never emitted to developer logs.
        return append(SeConstants.FRAME_POSITION, "t=" + relativeMilliseconds + ";lat=" + latitude + ";lon=" + longitude + ";speed=" + groundSpeed + ";quality=" + quality);
    }

    function ingestHeartRate(relativeMilliseconds, bpm) {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _heartRateCount += 1;
        _heartRate = bpm;
        return append(SeConstants.FRAME_HEART_RATE, "t=" + relativeMilliseconds + ";bpm=" + bpm + ";source=platform");
    }

    function ingestPressure(relativeMilliseconds, pressure) {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _pressureCount += 1;
        return append(SeConstants.FRAME_PRESSURE, "t=" + relativeMilliseconds + ";pascals=" + pressure);
    }

    function ingestMotionQuality(qualityCode) {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _motionCount += 1;
        if (qualityCode != null) { return quality(qualityCode); }
        return true;
    }

    function ingestRuntime(freeMemory, usedMemory) {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _runtimeCount += 1;
        if (freeMemory < SeConstants.LOW_MEMORY_BYTES) {
            quality("LOW_MEMORY");
            return fail("LOW_MEMORY");
        }
        return append(SeConstants.FRAME_RUNTIME, "t=" + elapsedMilliseconds() + ";free=" + freeMemory + ";used=" + usedMemory);
    }

    function quality(code) {
        _qualityCount += 1;
        _lastQuality = code;
        return append(SeConstants.FRAME_QUALITY, "t=" + elapsedMilliseconds() + ";code=" + code);
    }

    function tick() {
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        var elapsed = elapsedMilliseconds();
        if (elapsed - _lastCheckpointElapsed >= SeConstants.CHECKPOINT_INTERVAL_MILLISECONDS) { return checkpoint(); }
        return true;
    }

    function checkpoint() {
        if (!_state.equals(SeConstants.STATE_RECORDING) && !_state.equals(SeConstants.STATE_STOPPING)) { return false; }
        var elapsed = elapsedMilliseconds();
        var result = append(SeConstants.FRAME_CHECKPOINT, checkpointPayload(elapsed));
        if (result) { _lastCheckpointElapsed = elapsed; }
        return result;
    }

    function stop() {
        if (_state.equals(SeConstants.STATE_COMPLETED)) { return true; }
        if (!_state.equals(SeConstants.STATE_RECORDING)) { return false; }
        _state = SeConstants.STATE_STOPPING;
        if (!append(SeConstants.FRAME_SESSION_STOP, "elapsed=" + elapsedMilliseconds())) { return false; }
        if (!checkpoint()) { return false; }
        if (!append(SeConstants.FRAME_SESSION_FINAL, checkpointPayload(elapsedMilliseconds()) + ";completed=" + _clock.epochSeconds())) { return false; }
        if (!_store.validate(_sessionId)["integrity"].equals("VALID")) { return fail("JOURNAL_CORRUPT"); }
        _state = SeConstants.STATE_COMPLETED;
        if (!_store.updateState(_sessionId, _state)) { return fail("STORAGE_WRITE_FAILED"); }
        return true;
    }

    function recoverFirst() {
        if (!_state.equals(SeConstants.STATE_IDLE)) { return false; }
        var sessions = _store.discoverRecoverable();
        if (sessions.size() == 0) { return false; }
        _sessionId = sessions[0];
        var integrity = _store.validate(_sessionId);
        if (integrity["lastSequence"] < 0) { return fail("JOURNAL_CORRUPT"); }
        _sequence = integrity["lastSequence"] + 1;
        _lastPersistedSequence = integrity["lastSequence"];
        var checkpoint = _store.latestCheckpoint(_sessionId);
        if (checkpoint != null) { parseCheckpoint(checkpoint["payload"]); }
        _state = SeConstants.STATE_RECOVERED;
        _lastQuality = "RECOVERY_APPLIED";
        _qualityCount += 1;
        return _store.updateState(_sessionId, _state);
    }

    function finalizeRecovered() {
        if (!_state.equals(SeConstants.STATE_RECOVERED)) { return false; }
        _state = SeConstants.STATE_STOPPING;
        if (!append(SeConstants.FRAME_CHECKPOINT, checkpointPayload(_elapsedBeforeRecovery))) { return false; }
        if (!append(SeConstants.FRAME_SESSION_FINAL, checkpointPayload(_elapsedBeforeRecovery) + ";recovered=true;completed=" + _clock.epochSeconds())) { return false; }
        if (!_store.validate(_sessionId)["integrity"].equals("VALID")) { return fail("JOURNAL_CORRUPT"); }
        _state = SeConstants.STATE_COMPLETED;
        return _store.updateState(_sessionId, _state);
    }

    function append(frameType, payload) {
        var record = _frame.create(_sequence, frameType, payload);
        if (record == null || !_store.append(_sessionId, record)) { return fail("STORAGE_WRITE_FAILED"); }
        _lastPersistedSequence = _sequence;
        _sequence += 1;
        return true;
    }

    function checkpointPayload(elapsed) {
        return "elapsed=" + elapsed + ";pos=" + _positionCount + ";hr=" + _heartRateCount + ";pressure=" + _pressureCount + ";motion=" + _motionCount + ";runtime=" + _runtimeCount + ";quality=" + _qualityCount + ";last=" + _lastPersistedSequence;
    }

    function parseCheckpoint(payload) {
        _elapsedBeforeRecovery = fieldNumber(payload, "elapsed", _elapsedBeforeRecovery);
        _positionCount = fieldNumber(payload, "pos", _positionCount);
        _heartRateCount = fieldNumber(payload, "hr", _heartRateCount);
        _pressureCount = fieldNumber(payload, "pressure", _pressureCount);
        _motionCount = fieldNumber(payload, "motion", _motionCount);
        _runtimeCount = fieldNumber(payload, "runtime", _runtimeCount);
        _qualityCount = fieldNumber(payload, "quality", _qualityCount);
    }

    function fieldNumber(payload, name, fallback) {
        var marker = name + "=";
        var start = payload.find(marker);
        if (start == null) { return fallback; }
        var tail = payload.substring(start + marker.length(), payload.length());
        var delimiter = tail.find(";");
        var text = delimiter == null ? tail : tail.substring(0, delimiter);
        var value = text.toNumber();
        return value == null ? fallback : value;
    }

    function fail(code) {
        _state = SeConstants.STATE_FAILED;
        _lastQuality = code;
        return false;
    }

    function liveState() {
        return {
            "sessionId" => _sessionId,
            "state" => _state,
            "elapsedMilliseconds" => elapsedMilliseconds(),
            "currentSpeedMps" => _currentSpeed,
            "heartRate" => _heartRate,
            "gpsQuality" => _gpsQuality,
            "positionCount" => _positionCount,
            "heartRateCount" => _heartRateCount,
            "pressureCount" => _pressureCount,
            "motionCount" => _motionCount,
            "runtimeCount" => _runtimeCount,
            "qualityCount" => _qualityCount,
            "lastQuality" => _lastQuality,
            "lastPersistedSequence" => _lastPersistedSequence
        };
    }
}
