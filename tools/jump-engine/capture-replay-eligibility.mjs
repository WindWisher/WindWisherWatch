// Coverage gate only, never a jump label or hardware accuracy verdict.
export function captureReplayEligibility(capture) {
  const samples = capture.samples ?? [];
  const summary = capture.summary ?? {};
  const issues = [];
  if (summary.result !== "COMPLETED") issues.push("SESSION_NOT_COMPLETED");
  if (samples.length === 0) issues.push("NO_SAMPLES");
  if (summary.observedSamples !== samples.length)
    issues.push("OBSERVED_COUNT_MISMATCH");
  if (summary.exportedSamples !== samples.length)
    issues.push("EXPORTED_COUNT_MISMATCH");
  if (summary.overwrittenOrDroppedSamples !== 0)
    issues.push("DROPPED_OR_UNVERIFIED_SAMPLES");
  if (samples[0]?.sequence !== 0) issues.push("MISSING_SEQUENCE_ORIGIN");
  if (samples[0]?.normalizedTimestamp !== 0) issues.push("MISSING_TIME_ORIGIN");
  if (samples.some((s, i) => s.sequence !== i))
    issues.push("NONCONTIGUOUS_SEQUENCE");
  if (
    samples.some(
      (s, i) =>
        !Number.isFinite(s.normalizedTimestamp) ||
        (i > 0 && s.normalizedTimestamp <= samples[i - 1].normalizedTimestamp),
    )
  )
    issues.push("INVALID_NORMALIZED_TIMELINE");
  return {
    status: issues.length
      ? "INELIGIBLE_FULL_SESSION_REPLAY"
      : "ELIGIBLE_COVERAGE_ONLY",
    exported: samples.length,
    observed: summary.observedSamples ?? null,
    issues,
  };
}
