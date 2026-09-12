import assert from "node:assert/strict";
import test from "node:test";
import { SustainedSegmentationExperiment } from "./sustained-segmentation-experiment.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";
import { JumpState } from "./model.mjs";

test("grounded persistence uses elapsed milliseconds and resets on interrupted evidence", () => {
  for (const profile of ["MEDIUM", "HIGH"]) {
    const engine = new SustainedSegmentationExperiment({
      sessionId: "duration",
      profile,
    });
    engine.state = JumpState.POSSIBLE_TAKEOFF;
    engine.active = { candidateSequence: 0 };
    const observe = (time, magnitude = 9.8, flags = []) =>
      engine.shouldSegment({
        accelMagnitude: magnitude,
        timestamp: { normalizedTimestamp: time, qualityFlags: flags },
      });
    assert.equal(observe(100), false);
    assert.equal(observe(259), false);
    assert.equal(observe(260), true);
    assert.equal(observe(280, 3), false);
    assert.equal(observe(300), false);
    assert.equal(observe(459), false);
    assert.equal(observe(460), true);
    assert.equal(observe(480, 9.8, ["SAMPLE_GAP"]), false);
    assert.equal(observe(500), false);
    assert.equal(observe(660), true);
    engine.active.candidateSequence++;
    assert.equal(observe(680), false);
    assert.equal(observe(839), false);
    assert.equal(observe(840), true);
  }
});

test("sustained segmentation recovers counts but still fails negative promotion gate", async () => {
  const result = compareTimeoutReseed(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
    SustainedSegmentationExperiment,
  );
  assert.equal(result.pairedCases, 1496);
  assert.equal(result.cleanMismatches, 0);
  assert.equal(result.boundViolations, 0);
  assert.ok(result.changes.every((row) => row.experiment >= row.baseline));
  assert.ok(
    result.changes.some(
      (row) =>
        row.id === "clean-synthetic-jump" &&
        row.profile === "MEDIUM" &&
        row.variant === "pulse-320-8-phase-0" &&
        row.experiment === 1,
    ),
  );
  assert.ok(
    result.changes.some(
      (row) =>
        row.id === "brisk-walking-false-positive-envelope-v1" &&
        row.baseline === 0 &&
        row.experiment === 1,
    ),
  );
});

test("four virtual hours of sustained segmentation retain bounded state", (t) => {
  const engine = new SustainedSegmentationExperiment({
    sessionId: "four-hour-segments",
  });
  const started = performance.now();
  for (let sequence = 0; sequence < 360000; sequence++) {
    const time = sequence * 40;
    engine.process({
      sequence,
      rawSampleTimestamp: time,
      callbackTimestamp: time,
      accel: { x: time % 320 < 80 ? 18 : 9.8, y: 0, z: 0 },
    });
  }
  engine.endSession();
  const { bounds, processedSamples } = engine.summary();
  assert.equal(processedSamples, 360000);
  assert.ok(engine.segmentedImpulses > 40000);
  assert.equal(engine.totalConfirmedCandidates, 0);
  assert.ok(bounds.retainedCandidates <= 8);
  assert.ok(bounds.maxActiveSamples <= bounds.activeWindowCapacity);
  assert.ok(bounds.rollingUsed <= bounds.rollingCapacity);
  t.diagnostic(
    `offline sustained segmentation: ${engine.segmentedImpulses} segments, ${(performance.now() - started).toFixed(1)} ms host replay; not hardware timing`,
  );
});
