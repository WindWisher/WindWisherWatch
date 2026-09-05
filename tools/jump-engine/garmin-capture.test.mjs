import assert from "node:assert/strict";
import test from "node:test";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import {
  parseGarminResearchCapture,
  parseLatestGarminResearchCapture,
  replayGarminResearchCapture,
} from "./garmin-capture.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const catalog = await loadScenarioCatalog(
  path.join(root, "fixtures/jump-engine/synthetic-scenarios.json"),
);

function syntheticCapture(
  scenarioId = "clean-synthetic-jump",
  profile = "MEDIUM",
) {
  const generated = generateScenario(catalog, scenarioId, profile);
  const rate = profile === "HIGH" ? 50 : 25;
  const motion = generated.samples.map((sample) => ({
    recordType: "motion",
    sequence: sample.sequence,
    rawSampleTimestamp: sample.rawSampleTimestamp,
    rawGyroTimestamp: sample.rawSampleTimestamp,
    callbackTimestamp: sample.callbackTimestamp,
    normalizedTimestamp: sample.rawSampleTimestamp,
    accelMillig: [
      sample.accel.x / (9.80665 / 1000),
      sample.accel.y,
      sample.accel.z,
    ],
    gyroDegreesPerSecond: [sample.gyro.x, sample.gyro.y, sample.gyro.z],
    qualityMask: 0,
  }));
  const records = [
    {
      recordType: "manifest",
      researchSchemaVersion: "1.0.0",
      experimentId: `synthetic-hardware-${scenarioId}`,
      protocolId: "J3",
      sensorProfile: profile,
      captureMode: "CONTROLLED_FULL_WINDOW",
      requestedRateHz: rate,
      limits: { maxSamples: 768 },
    },
    ...motion,
    {
      recordType: "summary",
      observedSamples: motion.length,
      callbackStatistics: { callbacks: 4 },
      memory: { startFreeBytes: 700000, endFreeBytes: 690000 },
      detector: { confirmedCandidates: 1 },
    },
    {
      recordType: "completion",
      result: "COMPLETED",
      records: motion.length,
    },
  ];
  return `${records.map((record) => `WWJUMP|${JSON.stringify(record)}`).join("\n")}\n`;
}

test("parses bounded Garmin telemetry and replays the shared host detector", async () => {
  const capture = await parseGarminResearchCapture(syntheticCapture());
  const result = replayGarminResearchCapture(capture);
  assert.equal(result.exportedSamples, 80);
  assert.equal(result.accelOnly.summary.confirmedCandidates, 1);
  assert.equal(result.accelPlusGyro.summary.confirmedCandidates, 1);
  assert.doesNotMatch(
    JSON.stringify(result),
    /accelMillig|gyroDegreesPerSecond|latitude|longitude|bpm/i,
  );
});

test("parses the compact physical-device motion transport", async () => {
  const verbose = syntheticCapture("clean-synthetic-jump", "MEDIUM");
  const compact = verbose
    .trimEnd()
    .split("\n")
    .map((line) => {
      const record = JSON.parse(line.slice("WWJUMP|".length));
      if (record.recordType !== "motion") return line;
      return `WWJUMP|M|${record.sequence}|${record.rawSampleTimestamp}|${record.rawGyroTimestamp}|${record.callbackTimestamp}|${record.normalizedTimestamp}|${record.accelMillig.join("|")}|${record.gyroDegreesPerSecond.join("|")}|${record.qualityMask}`;
    })
    .join("\n");
  const capture = await parseGarminResearchCapture(`${compact}\n`);
  assert.equal(capture.samples.length, 80);
  assert.equal(capture.samples[0].recordType, "motion");
});

test("selects the latest capture after a stale rotated-log prefix", async () => {
  const current = syntheticCapture();
  const staleTail = current.trimEnd().split("\n").slice(-3).join("\n");
  const capture = await parseLatestGarminResearchCapture(
    `${staleTail}\n${current}`,
  );
  assert.equal(capture.manifest.protocolId, "J3");
  assert.equal(capture.samples.length, 80);
});

test("rejects truncation, count mismatch, sequence gaps and unsafe bounds", async () => {
  const capture = syntheticCapture();
  const lines = capture.trimEnd().split("\n");
  await assert.rejects(
    () => parseGarminResearchCapture(`${lines.slice(0, -1).join("\n")}\n`),
    /truncated/,
  );
  const mismatch = JSON.parse(lines.at(-1).slice("WWJUMP|".length));
  mismatch.records += 1;
  await assert.rejects(
    () =>
      parseGarminResearchCapture(
        `${[...lines.slice(0, -1), `WWJUMP|${JSON.stringify(mismatch)}`].join("\n")}\n`,
      ),
    /count does not match/,
  );
  await assert.rejects(
    () =>
      parseGarminResearchCapture(
        `${[lines[0], lines[1], ...lines.slice(3)].join("\n")}\n`,
      ),
    /sequence is not contiguous/,
  );
  const manifest = JSON.parse(lines[0].slice("WWJUMP|".length));
  manifest.limits.maxSamples = 10000;
  await assert.rejects(
    () =>
      parseGarminResearchCapture(
        `${[`WWJUMP|${JSON.stringify(manifest)}`, ...lines.slice(1)].join("\n")}\n`,
      ),
    /unsafe sample bound/,
  );
});

test("preserves operator reference and aligns it to an on-device candidate", async () => {
  const records = syntheticCapture()
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line.slice("WWJUMP|".length)));
  records[0].researchSchemaVersion = "1.1.0";
  const summary = records.find((record) => record.recordType === "summary");
  summary.detector.candidateTraces = [
    {
      candidateId: "candidate-1",
      status: "CONFIRMED",
      takeoffMilliseconds: 400,
      landingMilliseconds: 1120,
    },
  ];
  summary.operatorReference = {
    referenceSchemaVersion: "1.0.0",
    trialId: "AT3-r1",
    datasetSplit: "TUNING",
    expectedEventType: "CONTROLLED_HOP",
    timestampQuality: "VALID",
    markers: [
      {
        referenceId: "AT3-r1:m0",
        markerType: "TRIAL_START",
        timestampMilliseconds: 0,
        normalizedTimestampMilliseconds: null,
        nearestSequence: null,
        uncertaintyBeforeMilliseconds: 0,
        uncertaintyAfterMilliseconds: 0,
        provenance: "OPERATOR_START",
      },
      {
        referenceId: "AT3-r1:m1",
        markerType: "POST_EVENT_MARK",
        timestampMilliseconds: 1200,
        normalizedTimestampMilliseconds: 1200,
        nearestSequence: 30,
        uncertaintyBeforeMilliseconds: 1000,
        uncertaintyAfterMilliseconds: 100,
        provenance: "OPERATOR_POST_EVENT_SELECT",
      },
    ],
  };
  const capture = await parseGarminResearchCapture(
    `${records.map((record) => `WWJUMP|${JSON.stringify(record)}`).join("\n")}\n`,
  );
  const replay = replayGarminResearchCapture(capture);
  assert.equal(replay.operatorReference.trialId, "AT3-r1");
  assert.deepEqual(replay.referenceAlignment.counts, {
    matched: 1,
    missed: 0,
    extraDetections: 0,
    falsePositives: 0,
    ambiguous: 0,
  });
});
