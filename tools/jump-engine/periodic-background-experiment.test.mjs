import assert from "node:assert/strict";
import test from "node:test";
import { PeriodicBackgroundExperiment } from "./periodic-background-experiment.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

test("periodic model learns causally, preserves raw input and resets on gaps", () => {
  const engine = new PeriodicBackgroundExperiment({
    sessionId: "causal-background",
  });
  for (let sequence = 0; sequence < 30; sequence++) {
    const time = sequence * 40;
    const sample = {
      sequence,
      rawSampleTimestamp: time,
      callbackTimestamp: time,
      accel: { x: time % 320 < 80 ? 18 : 9.8, y: 0, z: 0 },
    };
    const original = structuredClone(sample);
    engine.process(sample);
    assert.deepEqual(sample, original);
    assert.ok(engine.backgroundPulses.length <= 3);
    if (time < 720) assert.equal(engine.backgroundModel, null);
    if (time === 720) assert.equal(engine.backgroundModel.period, 320);
  }
  assert.ok(engine.backgroundCorrections > 0);
  assert.equal(engine.processedSamples, 30);
  const prior = engine.backgroundCorrections;
  engine.process({
    sequence: 30,
    rawSampleTimestamp: 4000,
    callbackTimestamp: 4000,
    accel: { x: 18, y: 0, z: 0 },
  });
  assert.equal(engine.backgroundModel, null);
  assert.equal(engine.backgroundCorrections, prior);
  for (let sequence = 31; sequence < 531; sequence++) {
    const time = 4000 + (sequence - 30) * 40;
    engine.process({
      sequence,
      rawSampleTimestamp: time,
      callbackTimestamp: time,
      accel: { x: 18, y: 0, z: 0 },
    });
  }
  assert.ok(engine.pendingBackground.count <= 25);
  assert.equal(engine.backgroundPulses.length, 0);
});

test("periodic background hypothesis meets tuning count gates without the persistence veto", async () => {
  const result = compareTimeoutReseed(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
    PeriodicBackgroundExperiment,
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
