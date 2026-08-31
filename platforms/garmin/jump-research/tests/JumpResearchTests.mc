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
    detector.observe(400, 1800, 0, 0, 0, 0, 0, 0, false);
    detector.observe(440, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(480, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(520, 300, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 14; flight < 28; flight += 1) { detector.observe(flight * 40, 300, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(1120, 2200, 0, 0, 0, 0, 0, 0, false);
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
function incoherentImpulseDirectionsRejectArmPattern(logger) {
    var detector = new JrDetector("MEDIUM");
    for (var baseline = 0; baseline < 10; baseline += 1) { detector.observe(baseline * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(400, 1800, 0, 0, 0, 0, 0, 0, false);
    detector.observe(440, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(480, 300, 0, 0, 0, 0, 0, 0, false);
    detector.observe(520, 300, 0, 0, 0, 0, 0, 0, false);
    for (var flight = 14; flight < 24; flight += 1) { detector.observe(flight * 40, 300, 0, 0, 0, 0, 0, 0, false); }
    detector.observe(960, 1500, 1320, 0, 0, 0, 0, 0, false);
    for (var tail = 25; tail < 55; tail += 1) { detector.observe(tail * 40, 1000, 0, 0, 0, 0, 0, 0, false); }
    return detector.confirmed() == 0 && detector.rejected() == 1;
}
