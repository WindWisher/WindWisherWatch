import assert from "node:assert/strict";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { CandidateStatus, QualityFlag, ReasonCode } from "./model.mjs";
import { replaySamples } from "./replay.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixturePath = path.join(
  root,
  "fixtures/jump-engine/synthetic-scenarios.json",
);
const catalog = await loadScenarioCatalog(fixturePath);

test("finalization uses latest sample across phases and batched callback clocks", () => {
  for (const stop of [400, 480, 640, 680, 840, 1680]) {
    const engine = new ExperimentalJumpEngine({
      sessionId: "timing",
      profile: "MEDIUM",
    });
    for (let t = 0; t <= stop; t += 40) {
      const a =
        t === 400 ? 3200 : t > 400 && t < 680 ? 200 : t === 680 ? 1800 : 1000;
      engine.process({
        sequence: t / 40,
        rawSampleTimestamp: t,
        callbackTimestamp: 0,
        accel: { x: a * 0.00980665, y: 0, z: 0 },
      });
    }
    engine.endSession();
    const candidate = engine.candidates[0];
    assert.equal(candidate.endMilliseconds, stop);
    const times = [
      candidate.startMilliseconds,
      candidate.takeoffCandidateMilliseconds,
      candidate.landingCandidateMilliseconds,
      candidate.endMilliseconds,
    ].filter(Number.isFinite);
    assert.deepEqual(
      times,
      [...times].sort((a, b) => a - b),
    );
    const snapshot = JSON.stringify(candidate);
    engine.endSession();
    assert.equal(JSON.stringify(candidate), snapshot);
  }
});

function generated(id, profile = "MEDIUM") {
  return generateScenario(catalog, id, profile);
}

function stableResult(result) {
  return { candidates: result.candidates, engine: result.engine };
}

function candidateWithFeatures(id, profile = "MEDIUM") {
  const engine = new ExperimentalJumpEngine({
    sessionId: `features-${id}`,
    profile,
  });
  for (const sample of generated(id, profile).samples) engine.process(sample);
  engine.endSession();
  return { candidate: engine.candidates[0], config: engine.config };
}

for (const profile of ["MEDIUM", "HIGH"])
  test(`${profile} classifies all synthetic positive and negative scenarios`, () => {
    for (const scenario of catalog.scenarios) {
      const { samples } = generated(scenario.id, profile);
      const result = replaySamples(samples, {
        sessionId: `synthetic-${scenario.id}`,
        profile,
      });
      assert.equal(
        result.engine.confirmedCandidates,
        scenario.expectedConfirmed,
        scenario.id,
      );
    }
  });

test("timestamp anomalies preserve provenance and degrade confidence", () => {
  const result = replaySamples(generated("timestamp-anomaly").samples, {
    sessionId: "timestamp-anomaly",
  });
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.ok(
    result.candidates[0].qualityFlags.includes(QualityFlag.TIMESTAMP_DEGRADED),
  );
  assert.equal(result.candidates[0].confidence, "LOW");
});

test("gyro outliers remain flagged and do not create or invalidate a jump", () => {
  const result = replaySamples(generated("gyro-outlier").samples, {
    sessionId: "gyro-outlier",
  });
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.ok(
    result.candidates[0].qualityFlags.includes(QualityFlag.GYRO_OUTLIER),
  );
  assert.equal(result.candidates[0].confidence, "MEDIUM");
});

test("ACCEL_ONLY and valid gyro preserve the same base classification", () => {
  const samples = generated("clean-synthetic-jump").samples;
  const withGyro = replaySamples(samples, { sessionId: "valid-gyro" });
  const accelOnly = replaySamples(
    samples.map((sample) => {
      const accelSample = structuredClone(sample);
      delete accelSample.gyro;
      return accelSample;
    }),
    { sessionId: "accel-only" },
  );
  assert.equal(withGyro.engine.confirmedCandidates, 1);
  assert.equal(accelOnly.engine.confirmedCandidates, 1);
  assert.equal(
    withGyro.candidates[0].experimentalAirtimeMilliseconds,
    accelOnly.candidates[0].experimentalAirtimeMilliseconds,
  );
});

test("artifact-heavy gyro is quality evidence and never a required phase", () => {
  const samples = generated("clean-synthetic-jump").samples.map(
    (sample, index) => ({
      ...sample,
      gyro:
        index >= 25 && index <= 55
          ? { x: 32764, y: -16296, z: 0 }
          : sample.gyro,
    }),
  );
  const result = replaySamples(samples, { sessionId: "artifact-heavy" });
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.ok(
    result.candidates[0].qualityFlags.includes(QualityFlag.GYRO_OUTLIER),
  );
  assert.ok(result.candidates[0].evidence.gyroEvidence.outlierSamples > 0);
});

test("J5 structural hypothesis is rejected for missing sustained flight and stable landing", () => {
  const result = replaySamples(
    generated("j5-arm-motion-structural-hypothesis-v1").samples,
    { sessionId: "j5-structural-hypothesis" },
  );
  assert.equal(result.engine.confirmedCandidates, 0);
  assert.ok(
    result.candidates.some((candidate) =>
      candidate.reasonCodes.includes(ReasonCode.LOW_G_TOO_BRIEF),
    ),
  );
});

test("directional arm-motion hypothesis is rejected with a typed reason", () => {
  const result = replaySamples(
    generated("arm-direction-discrimination-hypothesis-v1").samples,
    { sessionId: "arm-direction-hypothesis" },
  );
  assert.equal(result.engine.confirmedCandidates, 0);
  assert.ok(
    result.candidates.some((candidate) =>
      candidate.reasonCodes.includes(ReasonCode.ARM_MOTION_PATTERN),
    ),
  );
});

test("aligned AT2 aggregate is rejected when the impulse-low-g envelope is missing", () => {
  const result = replaySamples(
    generated("brisk-walking-false-positive-envelope-v1").samples,
    { sessionId: "at2-envelope-regression" },
  );
  assert.equal(result.engine.confirmedCandidates, 0);
  assert.ok(
    result.candidates.some((candidate) =>
      candidate.reasonCodes.includes(
        ReasonCode.JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING,
      ),
    ),
  );
});

for (const id of [
  "hp1-like-late-post-event-peak-v1",
  "hp2-like-late-post-event-peak-v1",
])
  test(`${id} keeps decision features immutable after a late peak`, () => {
    const { candidate, config } = candidateWithFeatures(id);
    const features = candidate.featureSummary;
    assert.equal(candidate.status, CandidateStatus.REJECTED);
    assert.ok(Object.isFrozen(features.featuresAtDecision));
    assert.equal(
      features.takeoffPeakAccelMps2,
      features.featuresAtDecision.takeoffPeakAccelMps2,
    );
    assert.ok(
      features.postEventDiagnostics.peakAccelMps2 >
        features.featuresAtDecision.takeoffPeakAccelMps2,
    );
    assert.equal(features.featuresAtDecision.envelopeMatched, false);
    assert.ok(
      features.featuresAtDecision.takeoffPeakAccelMps2 <
        config.minimumTakeoffPeakMps2,
    );
    assert.ok(
      features.featuresAtDecision.flightMinimumAccelMps2 <=
        config.maximumJumpEnvelopeFlightMinimumMps2,
    );
    assert.ok(
      candidate.reasonCodes.includes(
        ReasonCode.JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING,
      ),
    );
  });

test("AT2-like late walking peak cannot retroactively satisfy takeoff evidence", () => {
  const { candidate } = candidateWithFeatures(
    "brisk-walking-false-positive-envelope-v1",
  );
  assert.equal(candidate.status, CandidateStatus.REJECTED);
  assert.equal(
    candidate.featureSummary.featuresAtDecision.envelopeMatched,
    false,
  );
  assert.ok(
    candidate.featureSummary.postEventDiagnostics.peakAccelMps2 >
      candidate.featureSummary.featuresAtDecision.takeoffPeakAccelMps2,
  );
});

test("HP4-like brisk walking transition preserves the phase-scoped hop", () => {
  const result = replaySamples(
    generated("brisk-walking-hop-brisk-walking-phase-v1").samples,
    { sessionId: "hp4-phase-scoped" },
  );
  assert.equal(result.engine.confirmedCandidates, 1);
  const confirmed = result.candidates.find(
    (candidate) => candidate.status === CandidateStatus.CONFIRMED,
  );
  assert.equal(
    confirmed.featureSummary.featuresAtDecision.envelopeMatched,
    true,
  );
});

test("canonical 3000 mg takeoff threshold converts without rounding", () => {
  const engine = new ExperimentalJumpEngine({ sessionId: "threshold-units" });
  assert.equal(engine.config.takeoffPeakThresholdMillig, 3000);
  assert.equal(engine.config.minimumTakeoffPeakMps2, 29.41995);
});

test("aligned AT5 aggregate accepts a strong deep-low-g hop despite divergent wrist direction", () => {
  const result = replaySamples(
    generated("locomotion-hop-direction-divergent-envelope-v1").samples,
    { sessionId: "at5-envelope-regression" },
  );
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.ok(
    result.candidates[0].reasonCodes.includes(
      ReasonCode.JUMP_IMPULSE_LOW_G_ENVELOPE_FOUND,
    ),
  );
  assert.ok(
    !result.candidates[0].reasonCodes.includes(
      ReasonCode.IMPULSE_DIRECTION_CONSISTENT,
    ),
  );
});

test("J3 HIGH boundary hypothesis has time-equivalent classification", () => {
  for (const profile of ["MEDIUM", "HIGH"]) {
    const result = replaySamples(
      generated("j3-high-boundary-hypothesis-v1", profile).samples,
      { sessionId: `j3-boundary-${profile}`, profile },
    );
    assert.equal(result.engine.confirmedCandidates, 1, profile);
    assert.ok(
      result.candidates[0].reasonCodes.includes(
        ReasonCode.LOW_G_DURATION_PLAUSIBLE,
      ),
    );
  }
});

test("J4 separation invariant retains three confirmed candidates", () => {
  const result = replaySamples(
    generated("j4-three-separated-controlled-hop-structure").samples,
    { sessionId: "j4-separation" },
  );
  assert.equal(result.engine.confirmedCandidates, 3);
  assert.equal(result.engine.rejectedCandidates, 0);
});

test("periodic brisk walking is rejected with bounded locomotion context", () => {
  const result = replaySamples(
    generated("periodic-brisk-walking-context").samples,
    { sessionId: "periodic-walking" },
  );
  assert.equal(result.engine.confirmedCandidates, 0);
  assert.equal(result.engine.bounds.locomotionContext.capacity, 8);
  assert.equal(result.engine.bounds.locomotionContext.used, 8);
});

test("walking to jump to walking preserves the controlled jump despite periodic pre-context", () => {
  for (const profile of ["MEDIUM", "HIGH"]) {
    const result = replaySamples(
      generated("walking-jump-walking-context", profile).samples,
      { sessionId: `walking-jump-${profile}`, profile },
    );
    assert.equal(result.engine.confirmedCandidates, 1, profile);
    const confirmed = result.candidates.find(
      (candidate) => candidate.status === CandidateStatus.CONFIRMED,
    );
    assert.equal(
      confirmed.evidence.locomotionContext.preEvent.state,
      "LOCOMOTION_PERIODIC",
      profile,
    );
  }
});

test("pressure and speed remain optional context, never primary timing", () => {
  const engine = new ExperimentalJumpEngine({ sessionId: "optional-context" });
  const samples = generated("clean-synthetic-jump").samples.map(
    (sample, index) => ({
      ...sample,
      pressurePascals: 101_325 - index,
      speedMps: 8,
    }),
  );
  for (const sample of samples) engine.process(sample);
  engine.endSession();
  const candidate = engine.candidates[0];
  assert.equal(candidate.status, CandidateStatus.CONFIRMED);
  assert.ok(Number.isFinite(candidate.featureSummary.pressureDeltaPascals));
  assert.equal(candidate.featureSummary.speedContextMps, 8);
});

test("sample gaps are explicit and do not silently create absurd duration", () => {
  const result = replaySamples(generated("sample-gap").samples, {
    sessionId: "sample-gap",
  });
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.ok(result.candidates[0].qualityFlags.includes(QualityFlag.SAMPLE_GAP));
  assert.ok(result.candidates[0].experimentalAirtimeMilliseconds < 1500);
});

test("same input is deterministic apart from measured replay time", () => {
  const samples = generated("clean-synthetic-jump").samples;
  const first = replaySamples(samples, { sessionId: "deterministic" });
  const second = replaySamples(samples, { sessionId: "deterministic" });
  assert.deepEqual(stableResult(second), stableResult(first));
});

test("duplicate and out-of-order sample sequences cannot duplicate candidates", () => {
  const samples = generated("clean-synthetic-jump").samples;
  const duplicated = samples.flatMap((sample, index) =>
    index === 35 ? [sample, structuredClone(sample)] : [sample],
  );
  const result = replaySamples(duplicated, { sessionId: "duplicate" });
  assert.equal(result.engine.confirmedCandidates, 1);
  assert.equal(result.engine.duplicateOrOutOfOrderSamples, 1);
});

test("starting in low-g and ending an open candidate fail closed", () => {
  const lowGOnly = Array.from({ length: 50 }, (_, sequence) => ({
    sequence,
    rawSampleTimestamp: sequence * 40,
    callbackTimestamp: sequence * 40,
    accel: { x: 3, y: 0, z: 0 },
  }));
  assert.equal(
    replaySamples(lowGOnly, { sessionId: "starts-mid-pattern" }).candidates
      .length,
    0,
  );
  const { samples } = generated("clean-synthetic-jump");
  const cutBeforeLanding = samples.slice(0, 40);
  const result = replaySamples(cutBeforeLanding, {
    sessionId: "missing-landing",
  });
  assert.equal(result.candidates.at(-1).status, CandidateStatus.REJECTED);
  assert.ok(
    result.candidates.at(-1).qualityFlags.includes(QualityFlag.SESSION_ENDED),
  );
});

test("four virtual hours keep rolling and candidate memory bounded", (t) => {
  const engine = new ExperimentalJumpEngine({
    sessionId: "synthetic-four-hour-motion",
    profile: "MEDIUM",
  });
  const interval = 40;
  const count = (4 * 60 * 60 * 1000) / interval;
  const started = performance.now();
  for (let sequence = 0; sequence < count; sequence += 1) {
    const cycle = sequence % 45_000;
    const accel =
      cycle === 100
        ? 18
        : cycle > 100 && cycle < 118
          ? 3
          : cycle === 118
            ? 22
            : 9.80665;
    engine.process({
      sequence,
      rawSampleTimestamp: sequence * interval,
      callbackTimestamp: sequence * interval,
      accel: { x: accel, y: 0, z: 0 },
      gyro: { x: 10, y: 5, z: 2 },
    });
  }
  engine.endSession();
  const elapsed = performance.now() - started;
  const summary = engine.summary();
  assert.equal(summary.processedSamples, 360_000);
  assert.equal(summary.bounds.rollingUsed, summary.bounds.rollingCapacity);
  assert.ok(
    summary.bounds.retainedCandidates <= summary.bounds.retainedCandidateLimit,
  );
  assert.ok(
    summary.bounds.maxActiveSamples <= summary.bounds.activeWindowCapacity,
  );
  t.diagnostic(
    `M5_LONG_SESSION samples=${summary.processedSamples} replayMs=${elapsed.toFixed(2)} usPerSample=${((elapsed * 1000) / count).toFixed(3)} rolling=${summary.bounds.rollingCapacity} candidates=${summary.bounds.retainedCandidates}`,
  );
});

test("MEDIUM and HIGH preserve candidate timing within one MEDIUM interval", () => {
  const medium = replaySamples(
    generated("clean-synthetic-jump", "MEDIUM").samples,
    {
      sessionId: "profile-medium",
      profile: "MEDIUM",
    },
  ).candidates[0];
  const high = replaySamples(
    generated("clean-synthetic-jump", "HIGH").samples,
    {
      sessionId: "profile-high",
      profile: "HIGH",
    },
  ).candidates[0];
  assert.ok(
    Math.abs(
      medium.experimentalAirtimeMilliseconds -
        high.experimentalAirtimeMilliseconds,
    ) <= 40,
  );
});

test("safe replay output excludes raw vectors and contextual private payloads", () => {
  const output = JSON.stringify(
    replaySamples(generated("clean-synthetic-jump").samples, {
      sessionId: "privacy-safe",
    }),
  );
  assert.doesNotMatch(
    output,
    /rawValue|researchWindow|latitude|longitude|bpm/i,
  );
});
