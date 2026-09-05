import assert from "node:assert/strict";
import test from "node:test";
import { profileConfig } from "./config.mjs";
import { LocomotionContext, LocomotionState } from "./locomotion-context.mjs";

function observation(timestamp, accelMagnitude, qualityFlags = []) {
  return {
    accelMagnitude,
    timestamp: { normalizedTimestamp: timestamp, qualityFlags },
  };
}

test("periodic impacts produce bounded observer context", () => {
  const context = new LocomotionContext(profileConfig("MEDIUM"));
  for (let index = 0; index < 12; index += 1) {
    const timestamp = index * 500;
    context.observe(observation(timestamp, 16));
    context.observe(observation(timestamp + 80, 9.8));
  }
  const summary = context.summaryAt(5_500, 2_000);
  assert.equal(summary.state, LocomotionState.PERIODIC);
  assert.equal(summary.intervalMeanMilliseconds, 500);
  assert.equal(summary.intervalCoefficientOfVariation, 0);
  assert.deepEqual(context.bounds(), {
    capacity: 8,
    used: 8,
    totalImpacts: 12,
  });
});

test("irregular impacts remain possible rather than periodic", () => {
  const context = new LocomotionContext(profileConfig("MEDIUM"));
  for (const timestamp of [0, 310, 970, 1_870, 2_150]) {
    context.observe(observation(timestamp, 17));
    context.observe(observation(timestamp + 80, 9));
  }
  assert.equal(context.summaryAt(2_150, 0).state, LocomotionState.POSSIBLE);
});

test("degraded timestamps make locomotion evidence ambiguous", () => {
  const context = new LocomotionContext(profileConfig("MEDIUM"));
  context.observe(observation(0, 16, ["TIMESTAMP_DEGRADED"]));
  context.observe(observation(80, 9));
  assert.equal(context.summaryAt(100, 0).state, LocomotionState.AMBIGUOUS);
});
