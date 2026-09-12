import assert from "node:assert/strict";
import test from "node:test";
import { measureImpulseDuration } from "./impulse-duration-audit.mjs";

function candidate(times, end = 120) {
  return {
    takeoffCandidateMilliseconds: end,
    evidence: { takeoffEvidence: { candidateToFlightMilliseconds: end } },
    researchWindow: times.map((time) => ({
      accelMagnitude: 32,
      timestamp: { normalizedTimestamp: time, qualityFlags: [] },
    })),
  };
}

test("impulse duration is observed time span, not sample count or inferred final interval", () => {
  for (const times of [
    [0, 40, 80],
    [0, 20, 40, 60, 80],
  ])
    assert.equal(
      measureImpulseDuration(candidate(times), 29)
        .maximumObservedSpanMilliseconds,
      80,
    );
  assert.equal(
    measureImpulseDuration(candidate([0]), 29).maximumObservedSpanMilliseconds,
    0,
  );
  const data = candidate([0, 40, 80, 120, 160]);
  const original = structuredClone(data);
  assert.equal(
    measureImpulseDuration(data, 29).maximumObservedSpanMilliseconds,
    80,
  );
  assert.deepEqual(data, original);
});

test("impulse duration cannot join spans across quality flags, dips or missing phase start", () => {
  const data = candidate([0, 20, 40, 60, 80, 100]);
  data.researchWindow[2].timestamp.qualityFlags = ["SAMPLE_GAP"];
  assert.equal(
    measureImpulseDuration(data, 29).maximumObservedSpanMilliseconds,
    40,
  );
  data.researchWindow[4].accelMagnitude = 20;
  assert.equal(
    measureImpulseDuration(data, 29).maximumObservedSpanMilliseconds,
    20,
  );
  assert.equal(
    measureImpulseDuration(candidate([20, 40]), 29).startCovered,
    false,
  );
  assert.equal(
    measureImpulseDuration({ takeoffCandidateMilliseconds: null }, 29),
    null,
  );
  assert.throws(() => measureImpulseDuration(data, NaN));
});
