import assert from "node:assert/strict";
import test from "node:test";
import { backgroundOffset } from "./periodic-background-holdout.mjs";
import { PeriodicBackgroundExperiment } from "./periodic-background-experiment.mjs";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";

test("frozen background changes use elapsed time with half-open pulse boundaries", () => {
  const variant = { period: 280, width: 60, phase: 35, mode: "steady" };
  for (const [time, expected] of [
    [0, 8],
    [24, 8],
    [25, 0],
    [245, 8],
    [305, 0],
  ])
    assert.equal(backgroundOffset(time, variant), expected);
  assert.equal(backgroundOffset(1100, variant), 8);
  assert.equal(backgroundOffset(1100, { ...variant, mode: "stop" }), 0);
  assert.equal(backgroundOffset(945, variant), 0);
  assert.equal(backgroundOffset(945, { ...variant, mode: "shift" }), 8);
  assert.throws(() => backgroundOffset(NaN, variant));
  assert.throws(() => backgroundOffset(0, { ...variant, mode: "unknown" }));
});

test("stale periodic prediction subtracts a real synthetic takeoff after background stops", async () => {
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  const { samples } = generateScenario(
    catalog,
    "clean-synthetic-jump",
    "MEDIUM",
  );
  const baseline = new ExperimentalJumpEngine({ sessionId: "unmodified" });
  const experiment = new PeriodicBackgroundExperiment({
    sessionId: "stale-prediction",
  });
  const variant = { period: 280, width: 60, phase: 125, mode: "stop" };
  for (const source of samples) {
    const sample = structuredClone(source);
    delete sample.gyro;
    sample.accel.x += backgroundOffset(sample.rawSampleTimestamp, variant);
    baseline.process(sample);
    experiment.process(sample);
    if (sample.rawSampleTimestamp === 1000) {
      assert.equal(sample.accel.x, 32);
      assert.equal(experiment.rolling.snapshot().at(-1).accel.x, 24);
      assert.equal(backgroundOffset(1000, variant), 0);
    }
  }
  baseline.endSession();
  experiment.endSession();
  assert.equal(baseline.totalConfirmedCandidates, 1);
  assert.equal(experiment.totalConfirmedCandidates, 0);
});
