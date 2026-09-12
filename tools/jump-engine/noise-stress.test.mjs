import assert from "node:assert/strict";
import test from "node:test";
import { perturbAcceleration, runNoiseStress } from "./noise-stress.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

const samples = [
  {
    sequence: 0,
    rawSampleTimestamp: 42,
    callbackTimestamp: 1000,
    accel: { x: 1, y: -2, z: 9.8 },
    gyro: { x: 32764, y: null, z: 0 },
  },
];

test("perturbations are repeatable, bounded and preserve non-acceleration data", () => {
  const before = structuredClone(samples);
  const a = perturbAcceleration(samples, 2, 7);
  assert.deepEqual(a, perturbAcceleration(samples, 2, 7));
  assert.notDeepEqual(a, perturbAcceleration(samples, 2, 19));
  for (const axis of ["x", "y", "z"])
    assert.ok(Math.abs(a[0].accel[axis] - samples[0].accel[axis]) <= 2);
  assert.deepEqual(a[0].gyro, samples[0].gyro);
  assert.equal(a[0].rawSampleTimestamp, 42);
  assert.equal(a[0].callbackTimestamp, 1000);
  a[0].gyro.x = 0;
  assert.deepEqual(samples, before);
});

test("zero perturbation is an exact value-preserving control", () => {
  assert.deepEqual(perturbAcceleration(samples, 0, 1), samples);
});

test("invalid stress inputs fail instead of becoming calibrated noise", () => {
  for (const amplitude of [-1, NaN, Infinity, 3])
    assert.throws(() => perturbAcceleration(samples, amplitude, 1));
  for (const seed of [-1, 1.5, Infinity, 0x100000000])
    assert.throws(() => perturbAcceleration(samples, 1, seed));
  assert.throws(() => perturbAcceleration(Array(10001).fill(samples[0]), 1, 1));
  assert.throws(() =>
    perturbAcceleration([{ accel: { x: NaN, y: 0, z: 0 } }], 1, 1),
  );
});

test("fixed matrix exposes rather than hides the known lower-threshold sensitivity", async () => {
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  const before = structuredClone(catalog);
  const result = runNoiseStress(catalog);
  assert.deepEqual(catalog, before);
  assert.equal(result.totalRuns, 480);
  assert.equal(result.groups.length, 8);
  for (const group of result.groups) assert.equal(group.runs, 60);
  assert.ok(
    result.groups
      .filter((g) => g.peakMillig === 3000)
      .every((g) => g.mismatches.length === 0),
  );
  const last = result.groups.at(-1);
  assert.deepEqual(
    last.mismatches.map((m) => [
      m.id,
      m.profile,
      m.seed,
      m.expected,
      m.observed,
    ]),
    [
      ["brisk-walking-false-positive-envelope-v1", "MEDIUM", 1, 0, 1],
      ["brisk-walking-false-positive-envelope-v1", "MEDIUM", 7, 0, 1],
      ["brisk-walking-false-positive-envelope-v1", "HIGH", 19, 0, 1],
    ],
  );
});
