import assert from "node:assert/strict";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { CandidateStatus, QualityFlag } from "./model.mjs";
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

function generated(id, profile = "MEDIUM") {
  return generateScenario(catalog, id, profile);
}

function stableResult(result) {
  return { candidates: result.candidates, engine: result.engine };
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
