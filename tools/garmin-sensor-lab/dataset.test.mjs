import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { analyzeDataset, parseDataset } from "./dataset.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixture = (name) =>
  fs.readFile(path.join(root, "fixtures/garmin-sensor-lab", name), "utf8");

test("computes sampling, gaps, battery, and memory without session analytics", async () => {
  const parsed = parseDataset(await fixture("valid-capture.ndjson"));
  const report = analyzeDataset(parsed);
  assert.deepEqual(parsed.issues, []);
  assert.equal(report.sensors.accelerometer.sampleCount, 5);
  assert.equal(report.sensors.accelerometer.observedHz, 50);
  assert.equal(report.sensors.accelerometer.gapCount, 0);
  assert.equal(report.battery.deltaPercentagePoints, 1);
  assert.equal(report.memory.peakUsedBytes, 125000);
});

test("detects a large gap", async () => {
  const report = analyzeDataset(parseDataset(await fixture("gap.ndjson")));
  assert.equal(report.sensors.accelerometer.gapCount, 1);
  assert.equal(report.sensors.accelerometer.largestGapMilliseconds, 200);
});

test("detects duplicate and out-of-order timestamps", async () => {
  const duplicate = analyzeDataset(
    parseDataset(await fixture("duplicate.ndjson")),
  );
  const unordered = analyzeDataset(
    parseDataset(await fixture("out-of-order.ndjson")),
  );
  assert.equal(duplicate.sensors.gyroscope.duplicateTimestampCount, 1);
  assert.equal(unordered.sensors.gyroscope.outOfOrderTimestampCount, 1);
});

test("classifies corrupted, partial, and missing timestamp records", async () => {
  const corrupted = parseDataset(await fixture("corrupted.ndjson"), {
    allowPartial: true,
  });
  const partial = parseDataset(await fixture("partial-record.ndjson"), {
    allowPartial: true,
  });
  const missing = parseDataset(await fixture("missing-timestamp.ndjson"), {
    allowPartial: true,
  });
  assert.ok(corrupted.issues.some((entry) => entry.code === "CORRUPTED_JSON"));
  assert.ok(partial.issues.some((entry) => entry.code === "PARTIAL_RECORD"));
  assert.ok(missing.issues.some((entry) => entry.code === "MISSING_TIMESTAMP"));
});
