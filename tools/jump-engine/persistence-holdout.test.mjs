import assert from "node:assert/strict";
import test from "node:test";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { PersistentImpulseExperiment } from "./persistent-impulse-experiment.mjs";
import { loadScenarioCatalog, generateScenario } from "./fixtures.mjs";
import { measureImpulseDuration } from "./impulse-duration-audit.mjs";

test("reserved 100-ms pulses expose persistence false confirmations; version remains rejected", async () => {
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  for (const phase of [10, 300]) {
    const engines = [ExperimentalJumpEngine, PersistentImpulseExperiment].map(
      (Engine) =>
        new Engine({
          sessionId: "consumed-holdout-regression",
          profile: "MEDIUM",
        }),
    );
    const { samples } = generateScenario(
      catalog,
      "brisk-walking-false-positive-envelope-v1",
      "MEDIUM",
    );
    for (const sample of samples) {
      delete sample.gyro;
      if ((sample.rawSampleTimestamp + phase) % 320 < 100) sample.accel.x += 8;
      for (const engine of engines) engine.process(sample);
    }
    for (const engine of engines) engine.endSession();
    assert.equal(engines[0].totalConfirmedCandidates, 0);
    assert.equal(engines[1].totalConfirmedCandidates, 1);
    const confirmed = engines[1].candidates.find(
      (candidate) => candidate.status === "CONFIRMED",
    );
    assert.equal(
      measureImpulseDuration(
        confirmed,
        engines[1].config.minimumTakeoffPeakMps2,
      ).maximumObservedSpanMilliseconds,
      40,
    );
  }
});
