import Toybox.System;
import Toybox.Timer;
import Toybox.WatchUi;

class SessionDevController {
    private var _engine;
    private var _position;
    private var _health;
    private var _timer;
    private var _clock;
    private var _lastRuntime = 0;

    function initialize() {
        _clock = new SeClock();
        _engine = new SessionEngine(new GarminSessionStore(), _clock);
        _position = new SessionPositionSource(self);
        _health = new SessionHealthSource(self);
        _timer = new Timer.Timer();
        if (!_engine.recoverFirst()) { System.println("WWSE|state=IDLE"); }
        else { System.println("WWSE|state=RECOVERED"); }
    }

    function engine() { return _engine; }

    function onSelect() {
        if (_engine.state().equals(SeConstants.STATE_IDLE)) { return startSession(); }
        if (_engine.state().equals(SeConstants.STATE_RECORDING)) { return stopSession(); }
        if (_engine.state().equals(SeConstants.STATE_RECOVERED)) {
            var result = _engine.finalizeRecovered();
            System.println("WWSE|recoveryFinalized=" + result);
            WatchUi.requestUpdate();
            return result;
        }
        return false;
    }

    function startSession() {
        if (!_engine.prepare() || !_engine.start()) { WatchUi.requestUpdate(); return false; }
        if (!_position.start()) { _engine.quality("GPS_UNAVAILABLE"); }
        if (!_health.start()) { _engine.quality("SENSOR_UNAVAILABLE"); }
        _lastRuntime = _clock.monotonicMilliseconds();
        runtime();
        _timer.start(method(:onTick), 1000, true);
        System.println("WWSE|state=RECORDING");
        WatchUi.requestUpdate();
        return true;
    }

    function stopSession() {
        _timer.stop();
        _position.stop();
        _health.stop();
        runtime();
        var result = _engine.stop();
        System.println("WWSE|state=" + _engine.state() + ";integrity=" + (result ? "VALID" : "FAILED") + ";frames=" + (_engine.liveState()["lastPersistedSequence"] + 1));
        WatchUi.requestUpdate();
        return result;
    }

    function onTick() {
        if (!_engine.state().equals(SeConstants.STATE_RECORDING)) { return; }
        if (_clock.elapsed(_lastRuntime, _clock.monotonicMilliseconds()) >= 10000) {
            _lastRuntime = _clock.monotonicMilliseconds();
            runtime();
        }
        _engine.tick();
        WatchUi.requestUpdate();
    }

    function position(latitude, longitude, speed, qualityValue, usable) {
        _engine.ingestPosition(_engine.elapsedMilliseconds(), latitude, longitude, speed, qualityValue, usable);
    }

    function heartRate(bpm) { _engine.ingestHeartRate(_engine.elapsedMilliseconds(), bpm); }
    function pressure(value) { _engine.ingestPressure(_engine.elapsedMilliseconds(), value); }
    function quality(code) { _engine.quality(code); }

    function runtime() {
        var stats = System.getSystemStats();
        _engine.ingestRuntime(stats.freeMemory, stats.usedMemory);
    }

    function shutdown() {
        // Controlled app exit intentionally leaves RECORDING journal recoverable.
        _timer.stop();
        _position.stop();
        _health.stop();
        if (_engine.state().equals(SeConstants.STATE_RECORDING)) { System.println("WWSE|state=RECOVERABLE_ON_RELAUNCH"); }
    }
}
