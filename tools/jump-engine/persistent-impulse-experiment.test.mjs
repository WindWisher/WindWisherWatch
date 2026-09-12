import assert from "node:assert/strict";
import test from "node:test";
import {
  PersistentImpulseExperiment,
  PersistenceReason,
} from "./persistent-impulse-experiment.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";

test("persistence hypothesis passes fixed tuning count gates without altering thresholds", async () => {
  const result = compareTimeoutReseed(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
    PersistentImpulseExperiment,
  );
  assert.equal(result.pairedCases, 1496);
  assert.equal(result.cleanMismatches, 0);
  assert.equal(result.boundViolations, 0);
  assert.ok(
    result.changes.every((row) =>
      row.baseExpected === 0
        ? row.experiment <= row.baseline
        : row.experiment >= row.baseline,
    ),
  );
  assert.ok(
    result.changes.some(
      (row) =>
        row.id === "clean-synthetic-jump" &&
        row.profile === "MEDIUM" &&
        row.variant === "pulse-320-8-phase-0" &&
        row.experiment === 1,
    ),
  );
});

test("persistence rejection is finalized once with consistent counts and immutable reason", async () => {
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  for (const profile of ["MEDIUM", "HIGH"]) {
    const engine = new PersistentImpulseExperiment({
      sessionId: "finalize-once",
      profile,
    });
    const finalized = [];
    const { samples } = generateScenario(
      catalog,
      "brisk-walking-false-positive-envelope-v1",
      profile,
    );
    for (const sample of samples) {
      delete sample.gyro;
      if (sample.rawSampleTimestamp % 320 < 80) sample.accel.x += 8;
      const result = engine.process(sample);
      if (result) finalized.push(result);
    }
    engine.endSession();
    const rejected = finalized.find((candidate) =>
      candidate.reasonCodes.includes(
        PersistenceReason.INSUFFICIENT_OBSERVED_IMPULSE_SPAN,
      ),
    );
    assert.ok(rejected);
    assert.equal(rejected.status, "REJECTED");
    assert.equal(rejected.confidence, "LOW");
    assert.ok(Object.isFrozen(rejected));
    assert.ok(Object.isFrozen(rejected.reasonCodes));
    assert.ok(rejected.reasonCodes.length <= engine.config.notableFlagLimit);
    assert.equal(engine.totalConfirmedCandidates, 0);
    assert.equal(engine.totalRejectedCandidates, engine.candidateSequence);
    assert.equal(engine.processedSamples, samples.length);
    assert.equal(engine.config.takeoffPeakThresholdMillig, 3000);
  }
});
