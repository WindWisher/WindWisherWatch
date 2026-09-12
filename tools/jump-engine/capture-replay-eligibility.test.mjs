import assert from "node:assert/strict";
import test from "node:test";
import { captureReplayEligibility } from "./capture-replay-eligibility.mjs";

function capture(count, observed = count) {
  return {
    manifest: { captureMode: "CONTROLLED_FULL_WINDOW" },
    summary: {
      result: "COMPLETED",
      observedSamples: observed,
      exportedSamples: count,
      overwrittenOrDroppedSamples: observed - count,
    },
    samples: Array.from({ length: count }, (_, i) => ({
      sequence: i,
      normalizedTimestamp: i * 40,
    })),
  };
}
test("full-window label cannot override missing observed samples", () => {
  for (const observed of [75, 275, 550]) {
    const result = captureReplayEligibility(capture(64, observed));
    assert.equal(result.status, "INELIGIBLE_FULL_SESSION_REPLAY");
    assert.ok(result.issues.includes("OBSERVED_COUNT_MISMATCH"));
    assert.ok(result.issues.includes("DROPPED_OR_UNVERIFIED_SAMPLES"));
  }
});
test("coverage eligibility requires explicit completion and continuous origins", () => {
  const good = capture(64);
  assert.equal(captureReplayEligibility(good).status, "ELIGIBLE_COVERAGE_ONLY");
  for (const mutate of [
    (c) => delete c.summary.overwrittenOrDroppedSamples,
    (c) => (c.summary.result = "CANCELED"),
    (c) => (c.samples[0].sequence = 9),
    (c) => (c.samples[0].normalizedTimestamp = 5),
    (c) => (c.samples[5].normalizedTimestamp = NaN),
    (c) =>
      (c.samples[5].normalizedTimestamp = c.samples[4].normalizedTimestamp),
  ]) {
    const broken = structuredClone(good);
    mutate(broken);
    assert.equal(
      captureReplayEligibility(broken).status,
      "INELIGIBLE_FULL_SESSION_REPLAY",
    );
  }
});
