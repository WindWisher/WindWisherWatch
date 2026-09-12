import assert from "node:assert/strict";
import test from "node:test";
import {
  dominatesMonotonicGuards,
  jointGuardEvidence,
} from "./joint-evidence.mjs";
import { profileConfig } from "./config.mjs";

test("monotonic guard dominance includes landing and all four scalar dimensions", () => {
  // Synthetic counterexample, not personal raw samples or a physical label.
  const hop = {
    takeoff: 23,
    lowG: 3.6,
    flight: 245,
    sustained: 123,
    landingStable: true,
  };
  const adverse = {
    takeoff: 24,
    lowG: 2.7,
    flight: 280,
    sustained: 240,
    landingStable: true,
  };
  assert.equal(dominatesMonotonicGuards(adverse, hop), true);
  for (const change of [
    { takeoff: 22 },
    { lowG: 4 },
    { flight: 200 },
    { sustained: 100 },
    { landingStable: false },
  ])
    assert.equal(
      dominatesMonotonicGuards({ ...adverse, ...change }, hop),
      false,
    );
  assert.equal(dominatesMonotonicGuards(null, hop), false);
});

test("joint margins preserve near-boundary evidence rather than rounding to pass", () => {
  const snapshot = {
    takeoffPeakAccelMps2: 23,
    flightMinimumAccelMps2: 3.6,
    flightDurationMilliseconds: 246,
    sustainedLowGMilliseconds: 124,
  };
  const e = jointGuardEvidence(snapshot, true, profileConfig("MEDIUM"));
  assert.equal(e.margins.flightMilliseconds, 6);
  assert.equal(e.margins.sustainedMilliseconds, 4);
  assert.ok(e.margins.takeoffMps2 < 0);
  assert.equal(jointGuardEvidence(null, false, profileConfig("MEDIUM")), null);
  assert.throws(() => jointGuardEvidence({}, true, profileConfig("MEDIUM")));
});
