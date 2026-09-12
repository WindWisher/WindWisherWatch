import Toybox.Sensor;
import Toybox.System;
import Toybox.Time;
import Toybox.Timer;
import Toybox.WatchUi;

class JrController {
    private const PROFILES = ["MEDIUM", "HIGH"];
    private const MODES = [JrConstants.MODE_CONTROLLED_FULL_WINDOW, JrConstants.MODE_CANDIDATE_WINDOWS, JrConstants.MODE_SUMMARY_ONLY];
    private const PROTOCOLS = ["BT1", "BT2", "BT3", "BT4", "BN1", "BN2", "BN3", "BN4", "BN5", "BP1", "BP2", "BP3", "BP4", "AT1", "AT2", "AT3", "AT4", "AT5", "AT6", "HN1", "HN2", "HN3", "HN4", "HN5", "HP1", "HP2", "HP3", "HP4"];
    private var _view;
    private var _writer;
    private var _timer;
    private var _source = null;
    private var _packed = null;
    private var _state = JrConstants.STATE_IDLE;
    private var _profileIndex = 0;
    private var _modeIndex = 0;
    private var _protocolIndex = 0;
    private var _startedAt = 0;
    private var _trialStartedAt = 0;
    private var _countdownEndsAt = 0;
    private var _stopAfter = null;
    private var _operatorReference = null;
    private var _postEventMarked = false;
    private var _experimentId = null;
    private var _rate = 0;
    private var _maximumRate = 0;
    private var _exportIndex = 0;
    private var _result = JrConstants.STATE_COMPLETED;
    private var _captureDuration = 0;
    private var _startMemory = null;
    private var _endMemory = null;

    function initialize(view) {
        _view = view;
        _writer = new JrWriter();
        _timer = new Timer.Timer();
    }

    function state() { return _state; }
    function profile() { return PROFILES[_profileIndex]; }
    function mode() { return MODES[_modeIndex]; }
    function protocol() { return _protocolIndex == 0 ? JrConstants.DIAGNOSTIC_PROTOCOL : PROTOCOLS[_protocolIndex - 1]; }
    function sampleCount() { return _source == null ? 0 : _source.sequence(); }
    function confirmedCount() { return _source == null ? 0 : _source.detector().confirmed(); }
    function elapsedMilliseconds() {
        if (_state.equals(JrConstants.STATE_COUNTDOWN)) { return JrClock.elapsed(_trialStartedAt, JrClock.now()); }
        return _state.equals(JrConstants.STATE_RUNNING) ? JrClock.elapsed(_startedAt, JrClock.now()) : 0;
    }
    function countdownSeconds() {
        if (!_state.equals(JrConstants.STATE_COUNTDOWN)) { return 0; }
        var remaining = JrConstants.COUNTDOWN_MILLISECONDS - JrClock.elapsed(_trialStartedAt, JrClock.now());
        return remaining <= 0 ? 0 : ((remaining + 999) / 1000);
    }
    function markerStatus() { return _state.equals(JrConstants.STATE_RUNNING) && _postEventMarked ? "MARKED" : ""; }
    function expectsHop() {
        var value = protocol();
        if (value.equals(JrConstants.DIAGNOSTIC_PROTOCOL)) { return true; }
        return value.equals("AT3") || value.equals("AT4") || value.equals("AT5") || value.equals("HP1") || value.equals("HP2") || value.equals("HP3") || value.equals("HP4") || value.equals("BT1") || value.equals("BT3") || value.equals("BT4") || value.equals("BP1") || value.equals("BP2") || value.equals("BP3") || value.equals("BP4");
    }
    function datasetSplit() {
        var value = protocol();
        return value.substring(0, 1).equals("H") || value.substring(0, 2).equals("BN") || value.substring(0, 2).equals("BP") ? "HOLDOUT" : "TUNING";
    }

    function nextProfile() {
        if (!_state.equals(JrConstants.STATE_IDLE)) { return; }
        _profileIndex = (_profileIndex + 1) % PROFILES.size();
        WatchUi.requestUpdate();
    }

    function nextMode() {
        if (!_state.equals(JrConstants.STATE_IDLE)) { return; }
        _modeIndex = (_modeIndex + 1) % MODES.size();
        WatchUi.requestUpdate();
    }

    function nextProtocol() {
        if (!_state.equals(JrConstants.STATE_IDLE)) { return; }
        _protocolIndex = (_protocolIndex + 1) % (PROTOCOLS.size() + 1);
        WatchUi.requestUpdate();
    }

    function requestedRate(maximumRate) {
        var requested = profile().equals("HIGH") ? 50 : 25;
        return requested < maximumRate ? requested : maximumRate;
    }

    function start() {
        if (!_state.equals(JrConstants.STATE_IDLE)) { return false; }
        if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL) && (!profile().equals("MEDIUM") || !mode().equals(JrConstants.MODE_CONTROLLED_FULL_WINDOW))) { return false; }
        var maximumRate = 0;
        try {
            if (Sensor has :getMaxSampleRateForSensorType) {
                var accelerometerMaximum = Sensor.getMaxSampleRateForSensorType(:accelerometer);
                var gyroscopeMaximum = Sensor.getMaxSampleRateForSensorType(:gyroscope);
                maximumRate = accelerometerMaximum < gyroscopeMaximum ? accelerometerMaximum : gyroscopeMaximum;
            }
            else if (Sensor has :getMaxSampleRate) { maximumRate = Sensor.getMaxSampleRate(); }
        } catch (ex) { maximumRate = 0; }
        _rate = requestedRate(maximumRate);
        _maximumRate = maximumRate;
        if (_rate <= 0) { _state = JrConstants.STATE_FAILED; WatchUi.requestUpdate(); return false; }
        // TP3 diagnostic windows retain the second confirmation so a
        // transition-related false positive can be inspected after the real
        // operator-observed hop. Other protocols still freeze on the first.
        _source = new JrMotionSource(profile(), mode(), _rate, 1);
        if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) {
            if (_rate != 25) { _state = JrConstants.STATE_FAILED; return false; }
            _source.enableDiagnostic();
        }
        _packed = null;
        _trialStartedAt = JrClock.now();
        _countdownEndsAt = _trialStartedAt + JrConstants.COUNTDOWN_MILLISECONDS;
        _experimentId = "jr-" + Time.now().value() + "-" + _trialStartedAt;
        var expectedEvent = protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL) ? "OPERATOR_COUNT_ONLY" : (expectsHop() ? "CONTROLLED_HOP" : "NONE");
        _operatorReference = new JrOperatorReference(_experimentId, datasetSplit(), expectedEvent);
        _operatorReference.add("TRIAL_START", 0, null, null, 0, 0, "OPERATOR_START_BUTTON");
        if (!expectsHop()) { _operatorReference.add("NEGATIVE_TRIAL", 0, null, null, 0, 0, "PREDECLARED_PROTOCOL"); }
        _postEventMarked = false;
        _stopAfter = null;
        // Fixed observation; actual operator hop count is reported offline.
        if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) { _stopAfter = JrConstants.DIAGNOSTIC_OBSERVATION_MILLISECONDS; }
        _state = JrConstants.STATE_COUNTDOWN;
        _timer.start(method(:onTick), JrConstants.TIMER_INTERVAL_MILLISECONDS, true);
        WatchUi.requestUpdate();
        return true;
    }

    function onTick() {
        if (_state.equals(JrConstants.STATE_COUNTDOWN)) {
            if (JrClock.elapsed(_trialStartedAt, JrClock.now()) >= JrConstants.COUNTDOWN_MILLISECONDS) { beginCapture(); }
        } else if (_state.equals(JrConstants.STATE_RUNNING)) {
            var limit = mode().equals(JrConstants.MODE_CONTROLLED_FULL_WINDOW) ? JrConstants.MAX_CONTROLLED_DURATION_MILLISECONDS : JrConstants.MAX_RESEARCH_DURATION_MILLISECONDS;
            var elapsed = JrClock.elapsed(_startedAt, JrClock.now());
            var tailReady = _stopAfter != null && elapsed >= _stopAfter;
            if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) {
                limit = JrConstants.DIAGNOSTIC_DURATION;
                tailReady = JrDiagnosticTail.complete(_stopAfter, elapsed, _source.lastNormalizedTimestamp());
            }
            if (_source.limitReached() || elapsed >= limit || tailReady) { beginExport(JrConstants.STATE_COMPLETED); }
        } else if (_state.equals(JrConstants.STATE_EXPORTING)) { drainExport(); }
        WatchUi.requestUpdate();
    }

    function beginCapture() {
        _startedAt = JrClock.now();
        _startMemory = System.getSystemStats();
        if (!protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) { _writer.manifest(_experimentId, protocol(), profile(), mode(), _rate, _maximumRate, System.getDeviceSettings()); }
        try { _source.start(); }
        catch (ex) { _state = JrConstants.STATE_FAILED; _timer.stop(); WatchUi.requestUpdate(); return; }
        _operatorReference.add("GO_SIGNAL", 0, 0, 0, 0, 500, "COUNTDOWN_GO_SENSOR_REGISTRATION");
        _state = JrConstants.STATE_RUNNING;
    }

    function stop() {
        if (_state.equals(JrConstants.STATE_RUNNING)) {
            if (expectsHop() && !protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL) && !_postEventMarked) {
                var timestamp = JrClock.elapsed(_startedAt, JrClock.now());
                _operatorReference.add("POST_EVENT_MARK", timestamp, _source.lastNormalizedTimestamp(), _source.sequence(), JrConstants.POST_MARK_UNCERTAINTY_BEFORE_MILLISECONDS, JrConstants.POST_MARK_UNCERTAINTY_AFTER_MILLISECONDS, "OPERATOR_POST_EVENT_BUTTON");
                _postEventMarked = true;
                _stopAfter = timestamp + JrConstants.POST_MARK_CAPTURE_TAIL_MILLISECONDS;
                WatchUi.requestUpdate();
                return true;
            }
            // A second SELECT must not truncate the diagnostic post-marker tail.
            if (!protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) { beginExport(JrConstants.STATE_COMPLETED); }
            return true;
        }
        return false;
    }

    function cancel() {
        if (_state.equals(JrConstants.STATE_COUNTDOWN)) { _timer.stop(); _state = JrConstants.STATE_CANCELLED; _timer.start(method(:reset), 1000, false); WatchUi.requestUpdate(); return true; }
        if (_state.equals(JrConstants.STATE_RUNNING)) { beginExport(JrConstants.STATE_CANCELLED); return true; }
        return false;
    }

    function beginExport(result) {
        _captureDuration = JrClock.elapsed(_startedAt, JrClock.now());
        _source.stop();
        _endMemory = System.getSystemStats();
        _result = result;
        if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) {
            _result = JrDiagnosticTail.result(result, _stopAfter, _captureDuration, _source.lastNormalizedTimestamp());
            if (_result.equals(JrConstants.STATE_COMPLETED)
                && (!JrDiagnosticTail.samplesValid(_source.buffer()) || _source.diagnosticDiscarded() != 0)) {
                _result = JrConstants.STATE_INCOMPLETE;
            }
        }
        _exportIndex = 0;
        _state = JrConstants.STATE_EXPORTING;
        if (protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) {
            try {
                _packed = new JrPackedExport();
                if (!_packed.prepare(_experimentId, _source, _operatorReference, _captureDuration, _result)) { _state = JrConstants.STATE_FAILED; _timer.stop(); }
            } catch (ex) { _state = JrConstants.STATE_FAILED; _timer.stop(); }
        }
    }

    function drainExport() {
        if (_packed != null) {
            if (!_packed.ready()) {
                try {
                    if (!_packed.step()) { _state = JrConstants.STATE_FAILED; _timer.stop(); }
                } catch (ex) { _state = JrConstants.STATE_FAILED; _timer.stop(); }
                return;
            }
            _writer.emit(_packed.line(_exportIndex));
            _exportIndex += 1;
            if (_exportIndex >= _packed.size()) { _timer.stop(); _state = _result; _timer.start(method(:reset), 8000, false); }
            return;
        }
        var buffer = _source.buffer();
        var emitted = 0;
        while (_exportIndex < buffer.size() && emitted < JrConstants.EXPORT_RECORDS_PER_TICK && _exportIndex < JrConstants.MAX_EXPORT_RECORDS) {
            _writer.sample(buffer.record(_exportIndex));
            _exportIndex += 1;
            emitted += 1;
        }
        if (_exportIndex >= buffer.size() || _exportIndex >= JrConstants.MAX_EXPORT_RECORDS) {
            _writer.summary(_result, _captureDuration, _source, _startMemory, _endMemory, _operatorReference);
            _timer.stop();
            _state = _result;
            _timer.start(method(:reset), 8000, false);
        }
    }

    function reset() {
        _timer.stop();
        _postEventMarked = false;
        _stopAfter = null;
        _state = JrConstants.STATE_IDLE;
        WatchUi.requestUpdate();
    }
    function shutdown() { if (_state.equals(JrConstants.STATE_RUNNING)) { _source.stop(); } _timer.stop(); }
}
