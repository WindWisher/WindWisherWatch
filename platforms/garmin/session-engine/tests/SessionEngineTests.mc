class SeTestClock {
    var monotonic = 1000;
    var epoch = 1700000000;
    function monotonicMilliseconds() { return monotonic; }
    function epochSeconds() { return epoch; }
    function elapsed(startValue, endValue) {
        if (endValue >= startValue) { return endValue - startValue; }
        return (4294967296l - startValue) + endValue;
    }
}

class SeTestStore {
    var records = [];
    var sessionId = null;
    var state = null;
    var failAppend = false;

    function create(id, startedAt) { sessionId = id; state = SeConstants.STATE_PREPARING; return true; }
    function append(id, frame) { if (failAppend) { return false; } records.add(frame); return true; }
    function updateState(id, nextState) { state = nextState; return true; }
    function validate(id) {
        var hasFinal = records.size() > 0 && records[records.size() - 1]["frameType"].equals(SeConstants.FRAME_SESSION_FINAL);
        return { "integrity" => hasFinal ? "VALID" : "RECOVERABLE", "lastSequence" => records.size() - 1, "hasFinal" => hasFinal };
    }
    function discoverRecoverable() { return sessionId != null && !validate(sessionId)["hasFinal"] ? [sessionId] : []; }
    function latestCheckpoint(id) {
        for (var index = records.size() - 1; index >= 0; index -= 1) {
            if (records[index]["frameType"].equals(SeConstants.FRAME_CHECKPOINT)) { return records[index]; }
        }
        return null;
    }
}

(:test)
function seChecksumDetectsChangedPayload(logger) {
    var checksum = new SeChecksum();
    return checksum.calculate("stable") != checksum.calculate("stAble");
}

(:test)
function seFrameValidatesLengthAndChecksum(logger) {
    var codec = new SeFrame();
    var frame = codec.create(0, SeConstants.FRAME_SESSION_START, "session=synthetic");
    if (!codec.validate(frame)) { return false; }
    frame["payload"] = "session=changed";
    return !codec.validate(frame);
}

(:test)
function seClockHandlesRollover(logger) {
    return new SeClock().elapsed(4294967290l, 4) == 10;
}

(:test)
function seEngineCompletesOnlyAfterValidFinal(logger) {
    var store = new SeTestStore();
    var clock = new SeTestClock();
    var engine = new SessionEngine(store, clock);
    if (!engine.prepare() || !engine.start()) { return false; }
    clock.monotonic += 2000;
    engine.ingestPosition(2000, 0.001, 0.001, 4, 3, true);
    if (!engine.stop()) { return false; }
    return engine.state().equals(SeConstants.STATE_COMPLETED) && store.validate(engine.sessionId())["integrity"].equals("VALID");
}

(:test)
function seEngineFailsClosedOnAppendFailure(logger) {
    var store = new SeTestStore();
    var engine = new SessionEngine(store, new SeTestClock());
    if (!engine.prepare()) { return false; }
    store.failAppend = true;
    return !engine.start() && engine.state().equals(SeConstants.STATE_FAILED);
}

(:test)
function seRecoveryPreservesSessionIdentity(logger) {
    var store = new SeTestStore();
    var clock = new SeTestClock();
    var first = new SessionEngine(store, clock);
    if (!first.prepare() || !first.start()) { return false; }
    var original = first.sessionId();
    var recovered = new SessionEngine(store, clock);
    if (!recovered.recoverFirst()) { return false; }
    if (!recovered.sessionId().equals(original) || !recovered.state().equals(SeConstants.STATE_RECOVERED)) { return false; }
    return recovered.finalizeRecovered() && recovered.state().equals(SeConstants.STATE_COMPLETED);
}

(:test)
function seCoreMetricsAccumulateDistanceAndMaximumSpeed(logger) {
    var metrics = new CoreMetricProjector();
    if (metrics.ingestPosition(0, 0.0, 0.0, 2.0, true) != null) { return false; }
    if (metrics.ingestPosition(10000, 0.0, 0.0001, 4.0, true) != null) { return false; }
    return metrics.distance() > 11.0 && metrics.distance() < 11.3 && metrics.maximumSpeed() == 4.0 && metrics.validGpsCount() == 2;
}

(:test)
function seCoreMetricsRejectGpsSpike(logger) {
    var metrics = new CoreMetricProjector();
    metrics.ingestPosition(0, 0.0, 0.0, 2.0, true);
    var issue = metrics.ingestPosition(1000, 0.0, 1.0, 2.0, true);
    return issue.equals("GPS_SPIKE") && metrics.distance() == 0.0 && metrics.rejectedSegmentCount() == 1;
}

(:test)
function seCoreMetricsExposeFreshnessWithoutFakeZero(logger) {
    var metrics = new CoreMetricProjector();
    if (!metrics.gpsStatus(0).equals("UNAVAILABLE") || metrics.currentSpeed(0) != null) { return false; }
    metrics.ingestPosition(1000, 0.0, 0.0, 0.0, true);
    if (!metrics.gpsStatus(2000).equals("VALID") || metrics.currentSpeed(2000) != 0.0) { return false; }
    return metrics.gpsStatus(12000).equals("STALE") && metrics.currentSpeed(12000) == null;
}

(:test)
function seRecoveryRestoresCoreMetricsFromCheckpoint(logger) {
    var store = new SeTestStore();
    var clock = new SeTestClock();
    var first = new SessionEngine(store, clock);
    if (!first.prepare() || !first.start()) { return false; }
    first.ingestPosition(0, 0.0, 0.0, 2.0, 3, true);
    first.ingestPosition(10000, 0.0, 0.0001, 4.0, 3, true);
    first.ingestHeartRate(10000, 120);
    clock.monotonic += 60000;
    if (!first.tick()) { return false; }
    var expected = first.liveState();
    var recovered = new SessionEngine(store, clock);
    if (!recovered.recoverFirst()) { return false; }
    var actual = recovered.liveState();
    return actual["distanceMeters"] == expected["distanceMeters"] && actual["maximumSpeedMps"] == expected["maximumSpeedMps"] && actual["validGpsSampleCount"] == expected["validGpsSampleCount"];
}
