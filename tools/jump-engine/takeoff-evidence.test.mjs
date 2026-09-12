import assert from "node:assert/strict";
import test from "node:test";
import {
  measureTakeoffEvidence,
  measurePreflightWindow,
  measureLastImpulse,
} from "./takeoff-evidence.mjs";

test("fixed windows interpolate edges and exclude later peaks", () => {
  for (const interval of [20, 40]) {
    const points = Array.from({ length: 400 / interval + 1 }, (_, i) => ({
      time: i * interval,
      magnitudeMps2: 20,
    }));
    const result = measurePreflightWindow(points, 355, 240);
    assert.equal(result.durationMilliseconds, 240);
    assert.ok(Math.abs(result.excessAreaMps - (20 - 9.80665) * 0.24) < 1e-12);
    points.push({ time: 440, magnitudeMps2: 100 });
    assert.deepEqual(measurePreflightWindow(points, 355, 240), result);
    assert.throws(() => measurePreflightWindow(points, 100, 240));
  }
});

test("last impulse excludes earlier separate impulses and interpolates crossings", () => {
  const points = [10, 18, 10, 10, 22, 10].map((magnitudeMps2, i) => ({
    time: i * 40,
    magnitudeMps2,
  }));
  const last = measureLastImpulse(points);
  assert.ok(Math.abs(last.durationMilliseconds - 160 / 3) < 1e-10);
  assert.ok(
    Math.abs(last.excessAboveImpulseMps - (8 * (160 / 3)) / 2000) < 1e-10,
  );
  assert.equal(
    measureLastImpulse([
      { time: 0, magnitudeMps2: 10 },
      { time: 40, magnitudeMps2: 10 },
    ]),
    null,
  );
});

test("takeoff area uses elapsed time, not sample count", () => {
  for (const interval of [20, 40]) {
    const points = Array.from({ length: 400 / interval + 1 }, (_, i) => ({
      time: i * interval,
      magnitudeMps2: 20,
    }));
    const result = measureTakeoffEvidence(points);
    assert.ok(Math.abs(result.excessAreaMps - (20 - 9.80665) * 0.4) < 1e-12);
    assert.equal(result.aboveImpulseMilliseconds, 400);
    assert.equal(result.durationMilliseconds, 400);
  }
});

test("linear threshold crossings are integrated without negative-area cancellation", () => {
  const result = measureTakeoffEvidence([
    { time: 0, magnitudeMps2: 0 },
    { time: 100, magnitudeMps2: 19.6133 },
  ]);
  assert.ok(Math.abs(result.excessAreaMps - (9.80665 * 0.05) / 2) < 1e-12);
  assert.ok(
    Math.abs(
      result.aboveImpulseMilliseconds - (100 * (19.6133 - 14)) / 19.6133,
    ) < 1e-12,
  );
});

test("phase measurement rejects missing, degraded and invalid input", () => {
  const first = { time: 0, magnitudeMps2: 10 };
  for (const points of [
    [],
    [first],
    [first, first],
    [first, { time: 121, magnitudeMps2: 10 }],
    [first, { time: 40, magnitudeMps2: NaN }],
  ])
    assert.throws(() => measureTakeoffEvidence(points));
});
