(:test)
function lowProfileClampsToSupportedRate(logger) {
    var profiles = new LabProfiles();
    return profiles.requestedRate("LOW", 8) == 8;
}

(:test)
function maxProfileUsesDiscoveredRate(logger) {
    var profiles = new LabProfiles();
    return profiles.requestedRate("MAX_SUPPORTED", 100) == 100;
}

(:test)
function unavailableRateFailsClosed(logger) {
    var profiles = new LabProfiles();
    return profiles.requestedRate("HIGH", 0) == 0;
}

(:test)
function elapsedHandlesTimerRollover(logger) {
    return LabClock.elapsed(4294967290l, 4) == 10;
}

(:test)
function timingStatsUsesJitterTolerantGapThreshold(logger) {
    var stats = new TimingStats(10);
    stats.observe(100);
    stats.observe(110);
    stats.observe(135);
    stats.observe(161);
    return stats.sampleCount() == 4 && stats.intervalCount() == 3 && stats.gapCount() == 1 && stats.largestGap() == 26;
}

(:test)
function timingStatsTracksDuplicateAndOutOfOrderSeparately(logger) {
    var stats = new TimingStats(20);
    stats.observe(100);
    stats.observe(100);
    stats.observe(90);
    stats.observe(110);
    return stats.sampleCount() == 4 && stats.intervalCount() == 1 && stats.gapCount() == 0;
}
