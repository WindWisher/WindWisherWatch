import assert from "node:assert/strict";
import test from "node:test";
import { loadScenarioCatalog } from "./fixtures.mjs";
import {
  TimeoutReseedExperiment,
  compareTimeoutReseed,
} from "./timeout-reseed-experiment.mjs";

test("offline reseed hypothesis improves target but fails broader promotion gate", async () => {
  const result = compareTimeoutReseed(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
  );
  assert.equal(result.pairedCases, 1496);
  assert.equal(result.engineReplays, 2992);
  assert.equal(result.cleanMismatches, 0);
  assert.equal(result.boundViolations, 0);
  const find = (id, profile, variant) =>
    result.changes.find(
      (row) =>
        row.id === id && row.profile === profile && row.variant === variant,
    );
  const target = find("clean-synthetic-jump", "MEDIUM", "pulse-320-8-phase-0");
  assert.equal(target.baseline, 0);
  assert.equal(target.experiment, 1);
  // Characterize an unsuccessful hypothesis, not acceptable detector behavior.
  const negative = find(
    "brisk-walking-false-positive-envelope-v1",
    "HIGH",
    "pulse-320-8-phase-0",
  );
  assert.equal(negative.baseline, 0);
  assert.equal(negative.experiment, 1);
  const missed = find(
    "brisk-walking-hop-brisk-walking-phase-v1",
    "MEDIUM",
    "pulse-640-8-phase-40",
  );
  assert.equal(missed.baseline, 1);
  assert.equal(missed.experiment, 0);
});

test("expiry reseeds once without processing clocks, smoothing or buffers twice", () => {
  const engine = new TimeoutReseedExperiment({ sessionId: "once" });
  let smoothingCalls = 0;
  const add = engine.smoother.add.bind(engine.smoother);
  engine.smoother.add = (value) => {
    smoothingCalls++;
    return add(value);
  };
  let finalized = null;
  for (let sequence = 0; sequence <= 26; sequence++) {
    finalized = engine.process({
      sequence,
      rawSampleTimestamp: sequence * 40,
      callbackTimestamp: sequence * 40,
      accel: { x: 32, y: 0, z: 0 },
    });
  }
  assert.equal(finalized.status, "REJECTED");
  assert.equal(engine.reseedCount, 1);
  assert.equal(engine.active.candidateStartTime, 1040);
  assert.equal(engine.active.candidateSequence, 1);
  assert.equal(engine.processedSamples, 27);
  assert.equal(smoothingCalls, 27);
  const window = engine.active.window.map((o) => o.sequence);
  assert.equal(new Set(window).size, window.length);
  assert.equal(engine.rolling.snapshot().length, 27);
});

test("four virtual hours of repeated expiry remain bounded in offline hypothesis", (t) => {
  const engine = new TimeoutReseedExperiment({ sessionId: "four-hour-reseed" });
  const started = performance.now();
  for (let sequence = 0; sequence < 360000; sequence++)
    engine.process({
      sequence,
      rawSampleTimestamp: sequence * 40,
      callbackTimestamp: sequence * 40,
      accel: { x: 18, y: 0, z: 0 },
    });
  engine.endSession();
  const { bounds, processedSamples } = engine.summary();
  assert.equal(processedSamples, 360000);
  assert.ok(engine.reseedCount > 10000);
  assert.equal(engine.totalConfirmedCandidates, 0);
  assert.ok(bounds.retainedCandidates <= 8);
  assert.ok(bounds.maxActiveSamples <= bounds.activeWindowCapacity);
  assert.ok(bounds.rollingUsed <= bounds.rollingCapacity);
  t.diagnostic(
    `offline reseed 4h: ${engine.reseedCount} reseeds; ${(performance.now() - started).toFixed(1)} ms host replay; not Garmin callback timing`,
  );
});
