import fs from "node:fs/promises";

const REQUIRED_MANIFEST_FIELDS = [
  "labSchemaVersion",
  "experimentId",
  "appVersion",
  "sdkVersion",
  "ciqApiLevel",
  "profile",
  "environment",
  "startedAt",
  "device",
  "requestedRatesHz",
];

function issue(code, line, detail) {
  return { code, line, detail };
}

export function parseDataset(text, { allowPartial = false } = {}) {
  const lines = text.split(/\r?\n/);
  const records = [];
  const issues = [];

  for (let index = 0; index < lines.length; index += 1) {
    const source = lines[index].trim();
    if (!source) continue;
    try {
      const record = JSON.parse(source);
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        issues.push(
          issue("INVALID_RECORD", index + 1, "Record must be an object"),
        );
      } else {
        records.push({ ...record, _line: index + 1 });
      }
    } catch (error) {
      const isLastContent = lines
        .slice(index + 1)
        .every((line) => !line.trim());
      issues.push(
        issue(
          isLastContent && allowPartial ? "PARTIAL_RECORD" : "CORRUPTED_JSON",
          index + 1,
          error instanceof Error ? error.message : "JSON parse error",
        ),
      );
    }
  }

  const manifest = records.find((record) => record.recordType === "manifest");
  if (!manifest) {
    issues.push(
      issue("MISSING_MANIFEST", 0, "One manifest record is required"),
    );
  } else {
    for (const field of REQUIRED_MANIFEST_FIELDS) {
      if (
        manifest[field] === undefined ||
        manifest[field] === null ||
        manifest[field] === ""
      ) {
        issues.push(issue("MISSING_MANIFEST_FIELD", manifest._line, field));
      }
    }
    if (manifest.labSchemaVersion !== "1.0.0") {
      issues.push(
        issue(
          "UNSUPPORTED_SCHEMA_VERSION",
          manifest._line,
          String(manifest.labSchemaVersion),
        ),
      );
    }
  }

  const samples = records.filter((record) => record.recordType === "sample");
  for (const sample of samples) {
    if (
      typeof sample.sensor !== "string" ||
      typeof sample.sequence !== "number"
    ) {
      issues.push(
        issue(
          "INVALID_SAMPLE",
          sample._line,
          "sensor and numeric sequence are required",
        ),
      );
    }
    if (typeof sample.monotonicMilliseconds !== "number") {
      issues.push(
        issue("MISSING_TIMESTAMP", sample._line, sample.sensor ?? "unknown"),
      );
    }
    if (sample.raw === undefined)
      issues.push(
        issue("MISSING_RAW", sample._line, sample.sensor ?? "unknown"),
      );
  }

  const completion = records.find(
    (record) => record.recordType === "completion",
  );
  if (!completion)
    issues.push(issue("MISSING_COMPLETION", 0, "Capture may be incomplete"));

  return { manifest, samples, completion, records, issues };
}

export async function readDataset(file, options) {
  return parseDataset(await fs.readFile(file, "utf8"), options);
}

function percentile(sorted, fraction) {
  if (!sorted.length) return null;
  const index = Math.ceil(fraction * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function summarizeSensor(samples, gapFactor) {
  const orderedByInput = [...samples];
  const intervals = [];
  let duplicates = 0;
  let outOfOrder = 0;
  for (let index = 1; index < orderedByInput.length; index += 1) {
    const delta =
      orderedByInput[index].monotonicMilliseconds -
      orderedByInput[index - 1].monotonicMilliseconds;
    intervals.push(delta);
    if (delta === 0) duplicates += 1;
    if (delta < 0) outOfOrder += 1;
  }
  const positive = intervals.filter((value) => value > 0).sort((a, b) => a - b);
  const mean = positive.length
    ? positive.reduce((sum, value) => sum + value, 0) / positive.length
    : null;
  const variance = positive.length
    ? positive.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      positive.length
    : null;
  const median = percentile(positive, 0.5);
  const gapThreshold = median === null ? null : median * gapFactor;
  return {
    sampleCount: samples.length,
    observedHz: mean && mean > 0 ? 1000 / mean : null,
    meanIntervalMilliseconds: mean,
    medianIntervalMilliseconds: median,
    minIntervalMilliseconds: positive.length ? positive[0] : null,
    maxIntervalMilliseconds: positive.length ? positive.at(-1) : null,
    standardDeviationMilliseconds:
      variance === null ? null : Math.sqrt(variance),
    p95IntervalMilliseconds: percentile(positive, 0.95),
    p99IntervalMilliseconds: percentile(positive, 0.99),
    largestGapMilliseconds: positive.length ? positive.at(-1) : null,
    gapCount:
      gapThreshold === null
        ? 0
        : positive.filter((value) => value > gapThreshold).length,
    duplicateTimestampCount: duplicates,
    outOfOrderTimestampCount: outOfOrder,
  };
}

export function analyzeDataset(dataset, { gapFactor = 2.5 } = {}) {
  const sensorNames = [
    ...new Set(dataset.samples.map((sample) => sample.sensor)),
  ].sort();
  const sensors = Object.fromEntries(
    sensorNames.map((sensor) => [
      sensor,
      summarizeSensor(
        dataset.samples.filter(
          (sample) =>
            sample.sensor === sensor &&
            typeof sample.monotonicMilliseconds === "number",
        ),
        gapFactor,
      ),
    ]),
  );
  const runtime = dataset.records.filter(
    (record) => record.recordType === "runtime",
  );
  const batteries = runtime
    .map((record) => record.batteryPercent)
    .filter(Number.isFinite);
  const usedMemory = runtime
    .map((record) => record.usedMemoryBytes)
    .filter(Number.isFinite);
  const freeMemory = runtime
    .map((record) => record.freeMemoryBytes)
    .filter(Number.isFinite);
  return {
    experimentId: dataset.manifest?.experimentId ?? null,
    sensors,
    battery: {
      startPercent: batteries[0] ?? null,
      endPercent: batteries.at(-1) ?? null,
      deltaPercentagePoints:
        batteries.length > 1 ? batteries[0] - batteries.at(-1) : null,
    },
    memory: {
      peakUsedBytes: usedMemory.length ? Math.max(...usedMemory) : null,
      minimumFreeBytes: freeMemory.length ? Math.min(...freeMemory) : null,
    },
    issues: dataset.issues,
  };
}
