import Toybox.Sensor;
import Toybox.System;
import Toybox.Time;
import Toybox.Timer;
import Toybox.WatchUi;

class JrController {
    private const PROFILES = ["MEDIUM", "HIGH"];
    private const MODES = [JrConstants.MODE_CONTROLLED_FULL_WINDOW, JrConstants.MODE_CANDIDATE_WINDOWS, JrConstants.MODE_SUMMARY_ONLY];
    private const PROTOCOLS = ["J0", "J1", "J2", "J3", "J4", "J5", "J6"];
    private var _view;
    private var _writer;
    private var _timer;
    private var _source = null;
    private var _state = JrConstants.STATE_IDLE;
    private var _profileIndex = 0;
    private var _modeIndex = 0;
    private var _protocolIndex = 0;
    private var _startedAt = 0;
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
    function protocol() { return PROTOCOLS[_protocolIndex]; }
    function sampleCount() { return _source == null ? 0 : _source.sequence(); }
    function confirmedCount() { return _source == null ? 0 : _source.detector().confirmed(); }
    function elapsedMilliseconds() { return _state.equals(JrConstants.STATE_RUNNING) ? JrClock.elapsed(_startedAt, JrClock.now()) : 0; }

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
        _protocolIndex = (_protocolIndex + 1) % PROTOCOLS.size();
        WatchUi.requestUpdate();
    }

    function requestedRate(maximumRate) {
        var requested = profile().equals("HIGH") ? 50 : 25;
        return requested < maximumRate ? requested : maximumRate;
    }

    function start() {
        if (!_state.equals(JrConstants.STATE_IDLE)) { return false; }
        var maximumRate = 0;
        try {
            if (Sensor has :getMaxSampleRateForSensorType) {
                var accelerometerMaximum = Sensor.getMaxSampleRateForSensorType(:accelerometer);
                var gyroscopeMaximum = Sensor.getMaxSampleRateForSensorType(:gyroscope);
                maximumRate = accelerometerMaximum < gyroscopeMaximum ? accelerometerMaximum : gyroscopeMaximum;
            }
            else if (Sensor has :getMaxSampleRate) { maximumRate = Sensor.getMaxSampleRate(); }
        } catch (ex) { maximumRate = 0; }
        var rate = requestedRate(maximumRate);
        if (rate <= 0) { _state = JrConstants.STATE_FAILED; WatchUi.requestUpdate(); return false; }
        _source = new JrMotionSource(profile(), mode(), rate);
        _startedAt = JrClock.now();
        _startMemory = System.getSystemStats();
        var experimentId = "jr-" + Time.now().value() + "-" + _startedAt;
        _writer.manifest(experimentId, protocol(), profile(), mode(), rate, maximumRate, System.getDeviceSettings());
        try { _source.start(); }
        catch (ex) { _state = JrConstants.STATE_FAILED; WatchUi.requestUpdate(); return false; }
        _state = JrConstants.STATE_RUNNING;
        _timer.start(method(:onTick), JrConstants.TIMER_INTERVAL_MILLISECONDS, true);
        WatchUi.requestUpdate();
        return true;
    }

    function onTick() {
        if (_state.equals(JrConstants.STATE_RUNNING)) {
            var limit = mode().equals(JrConstants.MODE_CONTROLLED_FULL_WINDOW) ? JrConstants.MAX_CONTROLLED_DURATION_MILLISECONDS : JrConstants.MAX_RESEARCH_DURATION_MILLISECONDS;
            if (_source.limitReached() || JrClock.elapsed(_startedAt, JrClock.now()) >= limit) { beginExport(JrConstants.STATE_COMPLETED); }
        } else if (_state.equals(JrConstants.STATE_EXPORTING)) { drainExport(); }
        WatchUi.requestUpdate();
    }

    function stop() {
        if (_state.equals(JrConstants.STATE_RUNNING)) { beginExport(JrConstants.STATE_COMPLETED); return true; }
        return false;
    }

    function cancel() {
        if (_state.equals(JrConstants.STATE_RUNNING)) { beginExport(JrConstants.STATE_CANCELLED); return true; }
        return false;
    }

    function beginExport(result) {
        _captureDuration = JrClock.elapsed(_startedAt, JrClock.now());
        _source.stop();
        _endMemory = System.getSystemStats();
        _result = result;
        _exportIndex = 0;
        _state = JrConstants.STATE_EXPORTING;
    }

    function drainExport() {
        var buffer = _source.buffer();
        var emitted = 0;
        while (_exportIndex < buffer.size() && emitted < JrConstants.EXPORT_RECORDS_PER_TICK && _exportIndex < JrConstants.MAX_EXPORT_RECORDS) {
            _writer.sample(buffer.record(_exportIndex));
            _exportIndex += 1;
            emitted += 1;
        }
        if (_exportIndex >= buffer.size() || _exportIndex >= JrConstants.MAX_EXPORT_RECORDS) {
            _writer.summary(_result, _captureDuration, _source, _startMemory, _endMemory);
            _timer.stop();
            _state = _result;
            _timer.start(method(:reset), 4000, false);
        }
    }

    function reset() { _timer.stop(); _state = JrConstants.STATE_IDLE; WatchUi.requestUpdate(); }
    function shutdown() { if (_state.equals(JrConstants.STATE_RUNNING)) { _source.stop(); } _timer.stop(); }
}
