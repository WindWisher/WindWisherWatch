// Diagnostic acquisition contract only; never participates in jump decisions.
module JrDiagnosticTail {
    function samplesValid(buffer) {
        if (buffer.size() == 0 || buffer.dropped() != 0) { return false; }
        var previous = -1;
        for (var i = 0; i < buffer.size(); i += 1) {
            var row = buffer.record(i);
            if (row[0] != i || row[1] == null || row[1] != row[4]
                || (i == 0 && row[4] != 0) || row[4] <= previous
                || (row[11] & (JrConstants.FLAG_TIMESTAMP_DEGRADED | JrConstants.FLAG_SAMPLE_GAP)) != 0) { return false; }
            previous = row[4];
        }
        return true;
    }
    function complete(deadline, elapsed, lastNormalized) {
        // Caller must verify samplesValid before publishing COMPLETED.
        // Normalized zero is the first acquired sample, after acquisition starts.
        // Using the controller deadline on this later origin is conservative.
        // Do not use the stale last sample at MARKED as the tail origin.
        return deadline != null && lastNormalized != null
            && elapsed >= deadline && lastNormalized >= deadline;
    }
    function result(requested, deadline, elapsed, lastNormalized) {
        if (!requested.equals(JrConstants.STATE_COMPLETED)) { return requested; }
        return complete(deadline, elapsed, lastNormalized)
            ? JrConstants.STATE_COMPLETED : JrConstants.STATE_INCOMPLETE;
    }
}
