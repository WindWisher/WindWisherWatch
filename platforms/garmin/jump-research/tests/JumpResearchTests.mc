(:test)
function noVideoHopHasSeparateIdentityAndBoundedWindow(logger) {
    var controller = new JrController(null);
    return controller.expectsHop()
        && controller.protocol().equals("M54BD_NV_HOP_01")
        && JrConstants.APP_VERSION.equals("0.5.1-m5.4bd-novideo2")
        && JrConstants.DIAGNOSTIC_OBSERVATION_MILLISECONDS == 8000
        && JrConstants.DIAGNOSTIC_SAMPLES == 225
        && JrConstants.DIAGNOSTIC_DURATION == 12000;
}

(:test)
function captureBufferNeverExceedsCapacity(logger) {
    var buffer = new JrCaptureBuffer(3);
    buffer.reset(false);
    buffer.append(0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 0);
    buffer.append(1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 0);
    buffer.append(2, 2, 2, 2, 2, 1, 2, 3, 4, 5, 6, 0);
    var accepted = buffer.append(3, 3, 3, 3, 3, 1, 2, 3, 4, 5, 6, 0);
    return buffer.size() == 3 && buffer.dropped() == 1 && !accepted;
}

(:test)
function circularBufferKeepsNewestSamples(logger) {
    var buffer = new JrCaptureBuffer(2);
    buffer.reset(true);
    buffer.append(0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 0);
    buffer.append(1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 0);
    buffer.append(2, 2, 2, 2, 2, 1, 2, 3, 4, 5, 6, 0);
    return buffer.size() == 2 && buffer.record(0)[0] == 1 && buffer.record(1)[0] == 2;
}

(:test)
function isolatedImpactDoesNotConfirmJump(logger) {
    var detector = new JrDetector("MEDIUM");
    detector.observe(0, 1800, 0, 0, 0, 0, 0, 0, false);
    for (var index = 1; index < 20; index += 1) { detector.observe(index * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.finish();
    return detector.confirmed() == 0 && detector.rejected() >= 1;
}

(:test)
function syntheticPatternConfirmsOneCandidate(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 10; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(400, 3200, 0, 0, 0, 0, 0, 0, false);
    detector.observe(440, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(480, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(520, 300, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 14; flight < 28; flight += 1) { detector.observe(flight * 40, 300, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(1120, 3500, 0, 0, 0, 0, 0, 0, false);
    for (var tail = 29; tail < 60; tail += 1) { detector.observe(tail * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    return detector.confirmed() == 1 && detector.lastAirtime() == 600;
}

(:test)
function transientLowGArmHypothesisIsRejected(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 25; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(1000, 1800, 0, 0, 0, 0, 0, 0, false);
    detector.observe(1040, 1800, 0, 0, 0, 0, 0, 0, false);
    detector.observe(1080, 200, 0, 0, 0, 0, 0, 0, false);
    detector.observe(1120, 200, 0, 0, 0, 0, 0, 0, false);
    detector.observe(1160, 200, 0, 0, 0, 0, 0, 0, false);
    for (var motion = 30; motion < 40; motion += 1) { detector.observe(motion * 40, 1100, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(1600, 2100, 0, 0, 0, 0, 0, 0, false);
    detector.finish();
    return detector.confirmed() == 0 && detector.rejected() >= 1;
}

(:test)
function candidateTraceRetentionIsBounded(logger) {
    var detector = new JrDetector("MEDIUM");
    var timestamp = 0;
    for (var candidate = 0; candidate < 12; candidate += 1) {
        detector.observe(timestamp, 1800, 0, 0, 0, 0, 0, 0, false);
        timestamp += 400;
        detector.observe(timestamp, 1000, 0, 0, 0, 0, 0, 0, false);
        timestamp += 40;
    }
    detector.finish();
    return detector.candidateCount() == 12 && detector.retainedTraceCount() == JrConstants.MAX_CANDIDATES;
}

(:test)
function strongDeepLowGEnvelopeOverridesDirection(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 10; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(400, 3200, 0, 0, 0, 0, 0, 0, false);
    detector.observe(440, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(480, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(520, 300, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 14; flight < 24; flight += 1) { detector.observe(flight * 40, 300, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(960, 0, 3500, 0, 0, 0, 0, 0, false);
    for (var tail = 25; tail < 55; tail += 1) { detector.observe(tail * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    return detector.confirmed() == 1 && detector.rejected() == 0;
}

(:test)
function weakImpulseDeepLowGEnvelopeIsRejected(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 10; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(400, 2400, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 11; flight < 24; flight += 1) { detector.observe(flight * 40, 270, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(960, 2400, 0, 0, 0, 0, 0, 0, false);
    for (var tail = 25; tail < 55; tail += 1) { detector.observe(tail * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    return detector.confirmed() == 0 && detector.rejected() == 1;
}

(:test)
function latePostEventPeakDoesNotChangeDecisionSnapshot(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 10; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(400, 2400, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 11; flight < 21; flight += 1) { detector.observe(flight * 40, 220, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(840, 1800, 0, 0, 0, 0, 0, 0, false);
    detector.observe(880, 4800, 0, 0, 0, 0, 0, 0, false);
    for (var tail = 23; tail < 50; tail += 1) { detector.observe(tail * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    var traces = detector.tracesJson();
    return detector.confirmed() == 0
        && detector.rejected() == 1
        && traces.find("\"takeoffPeakAccelMillig\":2400") != null
        && traces.find("\"postEventDiagnostics\":{\"peakAccelMillig\":4800") != null
        && traces.find("\"envelopeMatched\":false") != null;
}

(:test)
function canonicalTakeoffPeakThresholdIsExactlyThreeG(logger) {
    return JrConstants.TAKEOFF_PEAK_THRESHOLD_MILLIG == 3000;
}

// Same synthetic sample schedule is exercised by the host regression.
(:test)
function finalizationUsesLatestSampleInEveryPhase(logger) {
    var stops = [400, 480, 640, 680, 840, 1680];
    for (var scenario = 0; scenario < stops.size(); scenario += 1) {
        var detector = new JrDetector("MEDIUM");
        var stop = stops[scenario];
        for (var t = 0; t <= stop; t += 40) {
            var a = t == 400 ? 3200 : (t > 400 && t < 680 ? 200 : (t == 680 ? 1800 : 1000));
            detector.observe(t, a, 0, 0, 0, null, null, null, false);
        }
        detector.finish();
        var snapshot = detector.tracesJson();
        if (snapshot.find("\"endMilliseconds\":" + stop + "}") == null) { return false; }
        if (stop >= 680 && snapshot.find("\"landingMilliseconds\":680") == null) { return false; }
        detector.finish();
        if (!snapshot.equals(detector.tracesJson())) { return false; }
        // Reuse must not mutate the retained serialized candidate.
        detector.observe(stop + 40, 3200, 0, 0, 0, null, null, null, false);
        if (!snapshot.equals(detector.tracesJson())) { return false; }
    }
    return true;
}

(:test)
function shortFlightStopKeepsLandingAndEndOrdered(logger) {
    var detector = new JrDetector("MEDIUM");
    detector.observe(0, 3200, 0, 0, 0, null, null, null, false);
    for (var t = 40; t <= 120; t += 40) { detector.observe(t, 200, 0, 0, 0, null, null, null, false); }
    detector.observe(160, 1800, 0, 0, 0, null, null, null, false);
    detector.observe(200, 1000, 0, 0, 0, null, null, null, false);
    detector.finish();
    return detector.confirmed() == 0 && detector.rejected() == 1
        && detector.tracesJson().find("\"landingMilliseconds\":160") != null
        && detector.tracesJson().find("\"endMilliseconds\":200}") != null;
}

(:test)
function locomotionContextIsPeriodicAndBounded(logger) {
    var context = new JrLocomotionContext();
    for (var index = 0; index < 12; index += 1) {
        var timestamp = index * 500;
        context.observe(timestamp, 1600, 0);
        context.observe(timestamp + 80, 900, 0);
    }
    return context.used() == 8
        && context.totalImpacts() == 12
        && context.state(2000, 5500).equals("LOCOMOTION_PERIODIC")
        && context.intervalMean(2000, 5500) == 500;
}

(:test)
function operatorReferenceMarkersAreBounded(logger) {
    var reference = new JrOperatorReference("AT3-r1", "TUNING", "CONTROLLED_HOP");
    var first = reference.add("TRIAL_START", 0, null, null, 0, 0, "OPERATOR_START");
    var second = reference.add("GO_SIGNAL", 3000, 0, 0, 0, 500, "COUNTDOWN_GO_SENSOR_REGISTRATION");
    var third = reference.add("POST_EVENT_MARK", 4200, 4200, 105, 2500, 100, "OPERATOR_POST_EVENT_SELECT");
    var fourth = reference.add("POST_EVENT_MARK", 4300, 4300, 108, 2500, 100, "OPERATOR_POST_EVENT_SELECT");
    var overflow = reference.add("POST_EVENT_MARK", 4400, 4400, 110, 2500, 100, "OPERATOR_POST_EVENT_SELECT");
    var serialized = reference.toJson();
    return first && second && third && fourth && !overflow
        && reference.size() == JrConstants.MAX_OPERATOR_MARKERS
        && serialized.length() > 0;
}

class PackedTestSource {
    private var _buffer;
    private var _stats;
    private var _detector;
    function initialize() {
        _buffer = new JrCaptureBuffer(225);
        _stats = new JrStats();
        _detector = new JrDetector("MEDIUM");
        for (var i = 0; i < 225; i += 1) {
            _buffer.append(i, i * 40, null, 4000000000l + i * 40, i * 40, -123.25, 0.125, 1000.5, null, null, null, 2);
            _buffer.setLastState(3);
            _stats.gyroOutlier();
        }
        for (var cb = 0; cb < 9; cb += 1) { _stats.observeCallback(cb * 1100, cb * 1100 + 120, 25); }
        for (var n = 0; n < 8; n += 1) {
            _detector.observe(n * 2000, 3999.75, 0, 0, 0, null, null, null, false);
            for (var f = 40; f < 400; f += 40) { _detector.observe(n * 2000 + f, 212.345, 0, 0, 0, null, null, null, false); }
            _detector.observe(n * 2000 + 400, 3999.125, 0, 0, 0, null, null, null, false);
            _detector.observe(n * 2000 + 440, 4555.875, 0, 0, 0, null, null, null, false);
            _detector.finish();
        }
    }
    function buffer() { return _buffer; }
    function detector() { return _detector; }
    function stats() { return _stats; }
    function sequence() { return 225; }
    function diagnosticDiscarded() { return 0; }
}

(:test)
function packedDiagnosticIsBoundedAndLossless(logger) {
    var source = new PackedTestSource();
    var reference = new JrOperatorReference("jr-1788606843-914332807", "TUNING", "CONTROLLED_HOP");
    reference.add("TRIAL_START", 0, null, null, 0, 0, "OPERATOR_START_BUTTON");
    reference.add("GO_SIGNAL", 0, 0, 0, 0, 500, "COUNTDOWN_GO_SENSOR_REGISTRATION");
    reference.add("POST_EVENT_MARK", 6000, 5000, 125, 2500, 100, "OPERATOR_POST_EVENT_BUTTON");
    var packed = new JrPackedExport();
    var ok = packed.prepare("jr-1788606843-914332807", source, reference, 10000, "COMPLETED");
    if (!ok || packed.ready() || packed.size() != 1) { return false; }
    var steps = 0;
    while (!packed.ready() && steps < 16) {
        var previous = packed.size();
        if (!packed.step() || packed.size() - previous > 1) { return false; }
        steps += 1;
    }
    if (!packed.ready() || steps != 14) { return false; }
    var finalSize = packed.size();
    if (!packed.step() || packed.size() != finalSize) { return false; }
    logger.debug("PACKED_BYTES=" + packed.bytes());
    logger.debug("PACKED_FREE_BYTES=" + Toybox.System.getSystemStats().freeMemory);
    logger.debug("PACKED_GOLDEN=" + packed.motion(source.buffer(), 0, 1));
    for (var line = 0; line < packed.size(); line += 1) { logger.debug("PACKED_LINE=" + packed.line(line)); }
    if (!ok || packed.size() != 12 || source.buffer().size() != 225) { return false; }
    for (var extra = 0; extra < 100; extra += 1) { packed.add("0123456789012345678901234567890123456789"); }
    return !packed.valid();
}

(:test)
function diagnosticTailRequiresWallAndDeliveredSamples(logger) {
    return !JrDiagnosticTail.complete(6187, 6001, 5079)
        && !JrDiagnosticTail.complete(5000, 5000, 4000)
        && !JrDiagnosticTail.complete(5000, 4999, 5000)
        && !JrDiagnosticTail.complete(null, 6000, 5960)
        && !JrDiagnosticTail.complete(5000, 6000, null)
        && JrDiagnosticTail.complete(5000, 5500, 5000)
        && JrDiagnosticTail.result("COMPLETED", 6187, 6001, 5079).equals("INCOMPLETE")
        && JrDiagnosticTail.result("COMPLETED", 5000, 5500, 5000).equals("COMPLETED")
        && JrDiagnosticTail.result("CANCELLED", 5000, 5500, 5000).equals("CANCELLED");
}

(:test)
function diagnosticTailRejectsDegradedClock(logger) {
    var good = new PackedTestSource();
    if (!JrDiagnosticTail.samplesValid(good.buffer())) { return false; }
    var bad = new JrCaptureBuffer(2);
    bad.reset(false);
    if (JrDiagnosticTail.samplesValid(bad)) { return false; }
    bad.append(0, null, null, 4000000, 4000000, 0, 0, 1000, null, null, null, 1);
    return !JrDiagnosticTail.samplesValid(bad);
}
