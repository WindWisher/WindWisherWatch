import Toybox.Timer;
import Toybox.Time;
import Toybox.WatchUi;

class LabController {
    private const EXPERIMENTS = ["BASELINE", "GPS", "IMU", "HEALTH", "COMBINED", "STORAGE", "RECOVERY"];
    private var _view;
    private var _writer;
    private var _motion;
    private var _position;
    private var _health;
    private var _runtime;
    private var _storage;
    private var _profiles;
    private var _timer;
    private var _state = LabConstants.STATE_IDLE;
    private var _experimentIndex = 0;
    private var _profileIndex = 0;
    private var _startedAt = 0;
    private var _lastRuntimeAt = 0;
    private var _counts;
    private var _capabilities;

    function initialize(view) {
        _view = view;
        _writer = new LabRecordWriter();
        _profiles = new LabProfiles();
        resetCounts();
        _motion = new MotionProbe(_writer, _counts);
        _position = new PositionProbe(_writer, _counts);
        _health = new HealthProbe(_writer, _counts);
        _runtime = new RuntimeProbe(_writer);
        _storage = new StorageProbe(_writer);
        _timer = new Timer.Timer();
    }

    function resetCounts() {
        _counts = {
            :accelerometer => 0, :gyroscope => 0, :position => 0, :heartRate => 0, :pressure => 0,
            :accelerometerMaxAbsX => 0, :accelerometerMaxAbsY => 0, :accelerometerMaxAbsZ => 0,
            :gyroscopeMaxAbsX => 0, :gyroscopeMaxAbsY => 0, :gyroscopeMaxAbsZ => 0
        };
    }

    function state() { return _state; }
    function profile() { return _profiles.name(_profileIndex); }
    function experiment() { return EXPERIMENTS[_experimentIndex]; }
    function counts() { return _counts; }
    function elapsedMilliseconds() { return _state.equals(LabConstants.STATE_RUNNING) ? LabClock.elapsed(_startedAt, LabClock.now()) : 0; }

    function nextProfile(delta) {
        if (!_state.equals(LabConstants.STATE_IDLE)) { return; }
        _profileIndex = (_profileIndex + delta + _profiles.count()) % _profiles.count();
        WatchUi.requestUpdate();
    }

    function nextExperiment() {
        if (!_state.equals(LabConstants.STATE_IDLE)) { return; }
        _experimentIndex = (_experimentIndex + 1) % EXPERIMENTS.size();
        WatchUi.requestUpdate();
    }

    function start() {
        if (!_state.equals(LabConstants.STATE_IDLE)) { return false; }
        resetCounts();
        _motion = new MotionProbe(_writer, _counts);
        _position = new PositionProbe(_writer, _counts);
        _health = new HealthProbe(_writer, _counts);
        _runtime.reset();
        _capabilities = new DeviceProbe().inspect(profile());
        _startedAt = LabClock.now();
        _lastRuntimeAt = _startedAt;
        var experimentId = "garmin-" + Time.now().value() + "-" + _startedAt;
        _writer.manifest(experimentId, experiment(), profile(), _capabilities);
        _storage.runSafeProbe();
        _state = LabConstants.STATE_RUNNING;
        var active = experiment();
        if (active.equals("GPS") || active.equals("COMBINED")) { _position.start(); }
        if (active.equals("IMU") || active.equals("COMBINED")) { _motion.start(_capabilities[:requestedAccelerometerRate], _capabilities[:requestedGyroscopeRate]); }
        if (active.equals("HEALTH") || active.equals("COMBINED")) { _health.start(); }
        if (active.equals("STORAGE")) { _storage.runRepeatedProbe(10); }
        if (active.equals("RECOVERY")) { _storage.runRecoveryProbe(); }
        _runtime.capture();
        _timer.start(method(:onTick), 1000, true);
        WatchUi.requestUpdate();
        return true;
    }

    function onTick() {
        var elapsed = LabClock.elapsed(_startedAt, LabClock.now());
        if (LabClock.elapsed(_lastRuntimeAt, LabClock.now()) >= LabConstants.RUNTIME_INTERVAL_MILLISECONDS) {
            _lastRuntimeAt = LabClock.now();
            if (!_runtime.capture()) { finish(LabConstants.STATE_FAILED); return; }
        }
        if (elapsed >= LabConstants.MAX_DURATION_MILLISECONDS) { finish(LabConstants.STATE_COMPLETED); return; }
        WatchUi.requestUpdate();
    }

    function stop() { return finish(LabConstants.STATE_COMPLETED); }

    function cancel() {
        _writer.warning(LabConstants.ERROR_EXPERIMENT_CANCELLED, "user_cancelled");
        return finish(LabConstants.STATE_CANCELLED);
    }

    function finish(result) {
        if (!_state.equals(LabConstants.STATE_RUNNING)) { return false; }
        _state = LabConstants.STATE_STOPPING;
        _timer.stop();
        _motion.stop();
        _position.stop();
        _health.stop();
        _runtime.capture();
        _writer.completion(result, _startedAt, _counts, _capabilities, _runtime.summaryJson(), _motion.timingJson(), _position.timingJson(), _health.timingJson(), _position.ttffJson(), _motion.diagnosticsJson());
        _state = result;
        _timer.start(method(:resetToIdle), LabConstants.COMPLETION_FEEDBACK_MILLISECONDS, false);
        WatchUi.requestUpdate();
        return true;
    }

    function resetToIdle() {
        _timer.stop();
        _state = LabConstants.STATE_IDLE;
        WatchUi.requestUpdate();
    }

    function shutdown() {
        if (_state.equals(LabConstants.STATE_RUNNING)) { cancel(); }
    }
}
