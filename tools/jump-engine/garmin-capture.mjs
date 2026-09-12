import fs from "node:fs";
import readline from "node:readline";
import { decodePackedMotion, expandCandidate } from "./packed-motion.mjs";
import { replaySamples } from "./replay.mjs";
import {
  alignOperatorReference,
  validateOperatorReference,
} from "./operator-reference.mjs";

const PREFIX = "WWJUMP|";
const MAX_RECORDS = 800;
const MAX_LOG_LINES = 1600;
const MILLIG_TO_METERS_PER_SECOND_SQUARED = 9.80665 / 1000;

async function* lines(input) {
  if (typeof input === "string") {
    for (const line of input.split("\n")) if (line.trim()) yield line;
    return;
  }
  const reader = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of reader) if (line.trim()) yield line;
}

function finiteVector(value, allowNull = false) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => (allowNull && item === null) || Number.isFinite(item))
  );
}

function compactNumber(value, allowNull = false) {
  if (allowNull && value === "null") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed))
    throw new Error("Garmin compact motion value is invalid");
  return parsed;
}

function parseCompactMotion(content) {
  const fields = content.split("|");
  if (fields.length !== 13 || fields[0] !== "M")
    throw new Error("Garmin compact motion record is malformed");
  return {
    recordType: "motion",
    sequence: compactNumber(fields[1]),
    rawSampleTimestamp: compactNumber(fields[2], true),
    rawGyroTimestamp: compactNumber(fields[3], true),
    callbackTimestamp: compactNumber(fields[4]),
    normalizedTimestamp: compactNumber(fields[5]),
    accelMillig: fields.slice(6, 9).map((value) => compactNumber(value)),
    gyroDegreesPerSecond: fields
      .slice(9, 12)
      .map((value) => compactNumber(value, true)),
    qualityMask: compactNumber(fields[12]),
  };
}

export async function parseGarminResearchCapture(input) {
  let manifest = null;
  let summary = null;
  let completion = null;
  const samples = [];
  let expectedSequence = null;
  for await (const rawLine of expandedLines(input)) {
    const content = rawLine.startsWith(PREFIX)
      ? rawLine.slice(PREFIX.length)
      : rawLine;
    let record;
    if (content.startsWith("M|")) record = parseCompactMotion(content);
    else {
      try {
        record = JSON.parse(content);
      } catch {
        throw new Error("Garmin research capture contains malformed JSON");
      }
    }
    if (record.recordType === "manifest") {
      if (manifest) throw new Error("Garmin research manifest is duplicated");
      if (
        !["1.0.0", "1.1.0", "1.2.0", "1.3.0"].includes(
          record.researchSchemaVersion,
        )
      )
        throw new Error("Unsupported Garmin research capture version");
      if (!["MEDIUM", "HIGH"].includes(record.sensorProfile))
        throw new Error("Unsupported Garmin research sensor profile");
      if (record.limits?.maxSamples > MAX_RECORDS)
        throw new Error(
          "Garmin research capture declares an unsafe sample bound",
        );
      manifest = record;
    } else if (record.recordType === "motion") {
      if (!manifest || summary || completion)
        throw new Error("Garmin motion record is outside capture body");
      if (samples.length >= MAX_RECORDS)
        throw new Error("Garmin research capture exceeds parser bound");
      if (!Number.isInteger(record.sequence) || record.sequence < 0)
        throw new Error("Garmin motion sequence is invalid");
      if (expectedSequence !== null && record.sequence !== expectedSequence)
        throw new Error("Garmin exported motion sequence is not contiguous");
      if (!finiteVector(record.accelMillig))
        throw new Error("Garmin accelerometer vector is invalid");
      if (!finiteVector(record.gyroDegreesPerSecond, true))
        throw new Error("Garmin gyroscope vector is invalid");
      if (
        !Number.isFinite(record.callbackTimestamp) ||
        !Number.isFinite(record.normalizedTimestamp) ||
        !Number.isInteger(record.qualityMask)
      )
        throw new Error("Garmin motion timing/quality is invalid");
      samples.push(record);
      expectedSequence = record.sequence + 1;
    } else if (record.recordType === "summary") {
      if (!manifest || summary || completion)
        throw new Error("Garmin research summary order is invalid");
      summary = record;
      if (manifest.researchSchemaVersion === "1.3.0") {
        summary.detector.candidateTraces =
          summary.detector.compactCandidateTraces.map(expandCandidate);
      }
    } else if (record.recordType === "completion") {
      if (!summary || completion)
        throw new Error("Garmin research completion order is invalid");
      completion = record;
    } else throw new Error("Garmin research record type is unsupported");
  }
  if (!manifest || !summary || !completion)
    throw new Error("Garmin research capture is truncated");
  if (completion.records !== samples.length)
    throw new Error("Garmin research completion count does not match capture");
  if (summary.operatorReference)
    validateOperatorReference(summary.operatorReference);
  if (manifest.researchSchemaVersion === "1.3.0") {
    const noVideo = [
      "0.5.1-m5.4bd-novideo1",
      "0.5.1-m5.4bd-novideo1-export1",
    ].includes(manifest.appVersion);
    const negative =
      noVideo || manifest.appVersion === "0.5.1-m5.4bd-negative1";
    const synchronization = manifest.appVersion === "0.5.1-m5.4bd-sync1";
    const countOnly = manifest.appVersion === "0.5.1-m5.4bd-novideo2";
    if (
      !(countOnly ||
      negative ||
      synchronization ||
      manifest.appVersion === "0.5.1-m5.4bd-window1"
        ? manifest.encoding === "LE19_DELTA_ACCEL_STATE_V1" &&
          manifest.limits?.maxSamples === 225 &&
          manifest.limits?.maxDurationMilliseconds === 12000
        : manifest.encoding === "LE26_ACCEL_STATE_V1") ||
      manifest.sensorProfile !== "MEDIUM" ||
      manifest.captureMode !== "CONTROLLED_FULL_WINDOW" ||
      manifest.protocolId !==
        (countOnly
          ? "M54BD_NV_HOP_01"
          : noVideo
            ? "M54BD_NV_ARM_01"
            : synchronization
              ? "M54BD_SYNC_01"
              : negative
                ? "M54BD_WALK_NEG_01"
                : "M54BD_BT4_DIAG_01") ||
      manifest.jumpAlgorithmVersion !==
        "experimental-0.5-phase-scoped-envelope" ||
      ![
        "0.5.1-m5.4bd",
        "0.5.1-m5.4bd-tail1",
        "0.5.1-m5.4bd-window1",
        "0.5.1-m5.4bd-negative1",
        "0.5.1-m5.4bd-sync1",
        "0.5.1-m5.4bd-novideo1",
        "0.5.1-m5.4bd-novideo1-export1",
        "0.5.1-m5.4bd-novideo2",
      ].includes(manifest.appVersion)
    )
      throw new Error("Unexpected diagnostic identity");
    if (
      !samples.length ||
      samples[0].sequence !== 0 ||
      samples.length !== summary.observedSamples ||
      samples.length !== summary.exportedSamples ||
      summary.overwrittenOrDroppedSamples !== 0 ||
      summary.unprocessedDeliveredSamples !== 0 ||
      completion.result !== "COMPLETED" ||
      summary.result !== "COMPLETED"
    )
      throw new Error("Incomplete diagnostic capture");
    if (
      negative &&
      (summary.operatorReference?.expectedEventType !== "NONE" ||
        summary.operatorReference?.datasetSplit !== "TUNING" ||
        !summary.operatorReference?.markers.some(
          (m) =>
            m.markerType === "NEGATIVE_TRIAL" &&
            m.provenance === "PREDECLARED_PROTOCOL",
        ) ||
        summary.operatorReference?.markers.some(
          (m) => m.markerType === "POST_EVENT_MARK",
        ))
    )
      throw new Error("Invalid negative diagnostic reference");
    if (
      !negative &&
      !countOnly &&
      !synchronization &&
      !summary.operatorReference?.markers.some(
        (m) => m.markerType === "POST_EVENT_MARK",
      )
    )
      throw new Error("Diagnostic marker missing");
    const mark = summary.operatorReference.markers.find(
      (m) => m.markerType === "POST_EVENT_MARK",
    );
    if (
      (synchronization || countOnly) &&
      (summary.operatorReference?.expectedEventType !==
        (countOnly ? "OPERATOR_COUNT_ONLY" : "SYNCHRONIZATION_ONLY") ||
        summary.operatorReference?.datasetSplit !== "TUNING" ||
        !summary.operatorReference?.markers.some(
          (m) =>
            m.markerType === "TRIAL_START" &&
            m.provenance === "OPERATOR_START_BUTTON",
        ) ||
        summary.operatorReference?.markers.some(
          (m) =>
            m.markerType === "POST_EVENT_MARK" ||
            m.markerType === "NEGATIVE_TRIAL",
        ))
    )
      throw new Error("Invalid synchronization-only reference");
    const requiredEnd =
      synchronization || noVideo || countOnly
        ? 8000
        : negative
          ? 6000
          : mark.timestampMilliseconds + 2000;
    if (
      !Number.isFinite(summary.durationMilliseconds) ||
      summary.durationMilliseconds < requiredEnd
    )
      throw new Error("Diagnostic post-marker tail incomplete");
    // Normalized zero starts at the first acquired sample, not at the marker's
    // most recently delivered (potentially stale) sample. This is conservative.
    if (
      samples[0].normalizedTimestamp !== 0 ||
      samples.some(
        (s) =>
          s.rawSampleTimestamp !== s.normalizedTimestamp ||
          (s.qualityMask & 5) !== 0,
      )
    )
      throw new Error("Diagnostic sample clock cannot establish tail coverage");
    if (samples.at(-1).normalizedTimestamp < requiredEnd)
      throw new Error("Diagnostic delivered-sample tail incomplete");
    for (let i = 0; i < samples.length; i++) {
      if (
        !samples[i].garminState ||
        (i &&
          samples[i].normalizedTimestamp <= samples[i - 1].normalizedTimestamp)
      )
        throw new Error("Invalid diagnostic sample timeline");
    }
  }
  return { manifest, samples, summary, completion };
}

async function* expandedLines(input) {
  let packedAllowed = false;
  let packedPrefix = "D|";
  for await (const rawLine of lines(input)) {
    const content = rawLine.startsWith(PREFIX)
      ? rawLine.slice(PREFIX.length)
      : rawLine;
    if (content.startsWith("D|") || content.startsWith("E|")) {
      if (!packedAllowed || !content.startsWith(packedPrefix))
        throw new Error("Packed records require diagnostic manifest");
      for (const record of decodePackedMotion(content))
        yield JSON.stringify(record);
    } else {
      if (content.includes('"recordType":"manifest"')) {
        packedAllowed = JSON.parse(content).researchSchemaVersion === "1.3.0";
        packedPrefix =
          JSON.parse(content).encoding === "LE19_DELTA_ACCEL_STATE_V1"
            ? "E|"
            : "D|";
      }
      yield rawLine;
    }
  }
}

export async function parseLatestGarminResearchCapture(input) {
  let selected = [];
  let lineCount = 0;
  for await (const rawLine of lines(input)) {
    lineCount += 1;
    if (lineCount > MAX_LOG_LINES)
      throw new Error("Garmin research log exceeds parser line bound");
    const content = rawLine.startsWith(PREFIX)
      ? rawLine.slice(PREFIX.length)
      : rawLine;
    if (content.includes('"recordType":"manifest"')) selected = [rawLine];
    else if (selected.length > 0) selected.push(rawLine);
  }
  if (selected.length === 0)
    throw new Error("Garmin research capture manifest is missing");
  return parseGarminResearchCapture(`${selected.join("\n")}\n`);
}

function hostSamples(capture, includeGyro) {
  return capture.samples.map((sample) => ({
    sequence: sample.sequence,
    rawSampleTimestamp: sample.rawSampleTimestamp,
    callbackTimestamp: sample.callbackTimestamp,
    accel: {
      x: sample.accelMillig[0] * MILLIG_TO_METERS_PER_SECOND_SQUARED,
      y: sample.accelMillig[1] * MILLIG_TO_METERS_PER_SECOND_SQUARED,
      z: sample.accelMillig[2] * MILLIG_TO_METERS_PER_SECOND_SQUARED,
    },
    ...(includeGyro && sample.gyroDegreesPerSecond.every(Number.isFinite)
      ? {
          gyro: {
            x: sample.gyroDegreesPerSecond[0],
            y: sample.gyroDegreesPerSecond[1],
            z: sample.gyroDegreesPerSecond[2],
          },
        }
      : {}),
  }));
}

export function replayGarminResearchCapture(capture) {
  const common = {
    sessionId: capture.manifest.experimentId,
    profile: capture.manifest.sensorProfile,
  };
  const accelOnly = replaySamples(hostSamples(capture, false), common);
  const accelPlusGyro = replaySamples(hostSamples(capture, true), common);
  const onDeviceCandidates = (
    capture.summary.detector.candidateTraces ?? []
  ).map((candidate) => ({
    candidateId: candidate.candidateId,
    status: candidate.status,
    takeoffMilliseconds: candidate.takeoffMilliseconds,
    landingMilliseconds: candidate.landingMilliseconds,
  }));
  const operatorReference = capture.summary.operatorReference ?? null;
  const referenceAlignment = operatorReference
    ? alignOperatorReference({
        reference: operatorReference,
        candidates: onDeviceCandidates,
        sampleIntervalMilliseconds:
          capture.manifest.sensorProfile === "HIGH" ? 20 : 40,
      })
    : null;
  return {
    evidenceLevel: "HOST_REPLAY_OF_HARDWARE_CAPTURE",
    experimentId: capture.manifest.experimentId,
    protocolId: capture.manifest.protocolId,
    sensorProfile: capture.manifest.sensorProfile,
    captureMode: capture.manifest.captureMode,
    observedSamples: capture.summary.observedSamples,
    exportedSamples: capture.samples.length,
    callbackStatistics: capture.summary.callbackStatistics,
    memory: capture.summary.memory,
    onDeviceDetector: capture.summary.detector,
    operatorReference,
    referenceAlignment,
    accelOnly: {
      candidates: accelOnly.candidates,
      summary: accelOnly.engine,
    },
    accelPlusGyro: {
      candidates: accelPlusGyro.candidates,
      summary: accelPlusGyro.engine,
    },
  };
}

export async function inspectGarminCaptureFile(file) {
  const capture = await parseLatestGarminResearchCapture(
    fs.createReadStream(file),
  );
  return replayGarminResearchCapture(capture);
}

export async function inspectGarminCaptureFiles(files) {
  if (!Array.isArray(files) || files.length === 0 || files.length > 2)
    throw new Error("Inspect one active log or an ordered BAK/TXT log pair");
  const payloads = await Promise.all(
    files.map((file) => fs.promises.readFile(file, "utf8")),
  );
  const capture = await parseLatestGarminResearchCapture(payloads.join(""));
  return replayGarminResearchCapture(capture);
}
