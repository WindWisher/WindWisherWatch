import assert from "node:assert/strict";
import test from "node:test";
import { compareArchivedCapture } from "./archived-regression.mjs";
import { generateScenario } from "./fixtures.mjs";
import { PeriodicBackgroundExperiment } from "./periodic-background-experiment.mjs";

// Deliberately synthesized short impulse / soft landing contrast. No copied
// hardware samples, timestamps or personal sensor measurements.
function contrastCapture() {
  const scenario = {
    id: "short-impulse-soft-landing",
    expectedConfirmed: 1,
    segments: [
      [1000, 9.80665],
      [40, 31],
      [40, 20],
      [400, 1],
      [40, 28],
      [1600, 9.80665],
    ].map(([durationMilliseconds, accel]) => ({
      durationMilliseconds,
      accelPatternMps2: [accel],
    })),
  };
  const { samples } = generateScenario(
    { scenarios: [scenario] },
    scenario.id,
    "MEDIUM",
  );
  return {
    manifest: { researchSchemaVersion: "1.3.0", sensorProfile: "MEDIUM" },
    summary: {
      result: "COMPLETED",
      observedSamples: samples.length,
      exportedSamples: samples.length,
      overwrittenOrDroppedSamples: 0,
    },
    privateMarker: "DO_NOT_EXPORT_PERSONAL_FIELDS",
    samples: samples.map((sample) => ({
      sequence: sample.sequence,
      rawSampleTimestamp: sample.rawSampleTimestamp,
      normalizedTimestamp: sample.rawSampleTimestamp,
      callbackTimestamp: sample.callbackTimestamp,
      accelMillig: [sample.accel.x / 0.00980665, 0, 0],
      heartRate: "DO_NOT_EXPORT_PERSONAL_FIELDS",
      gps: "DO_NOT_EXPORT_PERSONAL_FIELDS",
    })),
  };
}

test("synthetic short impulse remains a positive contrast against universal persistence veto", () => {
  const capture = contrastCapture();
  const original = structuredClone(capture);
  const result = compareArchivedCapture(capture, PeriodicBackgroundExperiment);
  assert.deepEqual(
    result.rows.map((row) => row.confirmed),
    [1, 1, 0, 1],
  );
  assert.equal(result.rows[0].phaseEvidence[0].observedPeakSpanMilliseconds, 0);
  assert.ok(
    result.rows[2].phaseEvidence[0].reasons.includes(
      "INSUFFICIENT_OBSERVED_IMPULSE_SPAN",
    ),
  );
  assert.deepEqual(capture, original);
  assert.ok(!JSON.stringify(result).includes("DO_NOT_EXPORT_PERSONAL_FIELDS"));
});

test("archived comparison rejects unsupported profiles and oversized inputs", () => {
  const capture = contrastCapture();
  capture.manifest.sensorProfile = "HIGH";
  assert.throws(() => compareArchivedCapture(capture));
  capture.manifest.sensorProfile = "MEDIUM";
  capture.samples = Array(226).fill(capture.samples[0]);
  assert.throws(() => compareArchivedCapture(capture));
});
