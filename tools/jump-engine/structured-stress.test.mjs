import assert from "node:assert/strict";
import test from "node:test";
import {
  structuredSample,
  runStructuredStress,
  STRUCTURED_VARIANTS,
} from "./structured-stress.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";
const sample = {
  rawSampleTimestamp: 120,
  callbackTimestamp: 1000,
  sequence: 3,
  accel: { x: 3, y: 4, z: 5 },
  gyro: { x: 10000, y: 0, z: 0 },
};

test("rotations preserve raw magnitude, source data and timestamps", () => {
  const original = structuredClone(sample);
  for (const variant of STRUCTURED_VARIANTS) {
    const result = structuredSample(sample, variant);
    assert.equal(result.rawSampleTimestamp, 120);
    assert.equal(result.callbackTimestamp, 1000);
    if (variant.endsWith("rotation"))
      assert.ok(
        Math.abs(Math.hypot(...Object.values(result.accel)) - Math.sqrt(50)) <
          1e-10,
      );
    result.accel.x = 999;
    assert.deepEqual(sample, original);
  }
  assert.deepEqual(structuredSample(sample, "control"), sample);
});

test("pulse boundaries depend on milliseconds rather than sample indices", () => {
  for (const [time, increment] of [
    [0, 4],
    [79, 4],
    [80, 0],
    [319, 0],
    [320, 4],
  ])
    for (const sequence of [0, 100]) {
      const result = structuredSample(
        { ...sample, sequence, rawSampleTimestamp: time },
        "pulses-320-4",
      );
      assert.equal(result.accel.x, sample.accel.x + increment);
    }
  assert.throws(() => structuredSample(sample, "unknown"));
  assert.throws(() =>
    structuredSample({ ...sample, rawSampleTimestamp: NaN }, "control"),
  );
});

test("fixed matrix has complete rows and fixed-rotation count invariance", async () => {
  const result = runStructuredStress(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
  );
  assert.equal(result.totalRuns, 140);
  for (const row of result.rows.filter((r) => r.variant === "fixed-rotation")) {
    const control = result.rows.find(
      (r) =>
        r.id === row.id &&
        r.profile === row.profile &&
        r.peakMillig === row.peakMillig &&
        r.variant === "control",
    );
    assert.equal(row.confirmed, control.confirmed);
  }
});
