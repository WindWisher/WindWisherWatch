import {
  Crc32Accumulator,
  MAX_CANONICAL_LINE_BYTES,
  validateRecordChecksum,
} from "./format.mjs";
import { validateCanonicalRecord } from "./validator.mjs";

async function* inputLines(input) {
  if (typeof input === "string") {
    if (input.length > 0 && !input.endsWith("\n"))
      throw new Error("Canonical stream is truncated");
    for (const line of input.split("\n")) if (line.length > 0) yield line;
    return;
  }
  let pending = "";
  for await (const chunk of input) {
    pending += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    let newline;
    while ((newline = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, newline);
      pending = pending.slice(newline + 1);
      if (Buffer.byteLength(line, "utf8") > MAX_CANONICAL_LINE_BYTES)
        throw new Error("Canonical input line exceeds parser bound");
      if (line.length > 0) yield line;
    }
    if (Buffer.byteLength(pending, "utf8") > MAX_CANONICAL_LINE_BYTES)
      throw new Error("Canonical input line exceeds parser bound");
  }
  if (pending.length > 0) throw new Error("Canonical stream is truncated");
}

export async function parseCanonicalStream(input, { onRecord } = {}) {
  const streamChecksum = new Crc32Accumulator();
  let expectedSequence = 0;
  let manifest = null;
  let completion = null;
  let completed = false;
  const observedCounts = { track: 0, heartRate: 0, pressure: 0, quality: 0 };

  for await (const line of inputLines(input)) {
    if (completed) throw new Error("Unexpected record after completion");
    if (Buffer.byteLength(line, "utf8") > MAX_CANONICAL_LINE_BYTES)
      throw new Error("Canonical record exceeds line bound");
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error("Canonical record is malformed JSON");
    }
    if (record.canonicalSchemaVersion !== "1.0.0")
      throw new Error("Unsupported canonical schema version");
    const schema = validateCanonicalRecord(record);
    if (!schema.accepted)
      throw new Error(
        `Canonical schema validation failed: ${JSON.stringify(schema.errors)}`,
      );
    if (!validateRecordChecksum(record))
      throw new Error("Canonical record checksum failed");
    if (record.recordSequence !== expectedSequence)
      throw new Error(
        "Canonical record sequence is duplicate, missing or out of order",
      );
    expectedSequence += 1;
    if (record.recordType === "manifest") {
      if (manifest !== null || record.recordSequence !== 0)
        throw new Error("Canonical manifest must be first and unique");
      manifest = record.payload;
    } else if (record.recordType === "completion") {
      if (manifest === null)
        throw new Error("Canonical completion lacks manifest");
      if (record.payload.streamChecksum !== streamChecksum.hex())
        throw new Error("Canonical stream checksum failed");
      completion = record.payload;
      completed = true;
    } else {
      if (manifest === null)
        throw new Error("Canonical data precedes manifest");
      if (record.recordType === "track") observedCounts.track += 1;
      else if (record.recordType === "heart_rate")
        observedCounts.heartRate += 1;
      else if (record.recordType === "pressure") observedCounts.pressure += 1;
      else if (record.recordType === "quality") observedCounts.quality += 1;
    }
    if (record.recordType !== "completion")
      streamChecksum.update(Buffer.from(`${line}\n`, "utf8"));
    if (onRecord) await onRecord(record);
  }
  if (!completed) throw new Error("Canonical stream has no completion record");
  for (const key of Object.keys(observedCounts))
    if (completion.recordCounts[key] !== observedCounts[key])
      throw new Error(`Canonical ${key} count does not match completion`);
  return {
    integrity: "VALID",
    schemaVersion: "1.0.0",
    sessionId: manifest.sessionId,
    completionStatus: completion.completionStatus,
    timing: manifest.timing,
    recordCounts: observedCounts,
    checksumStatus: "VALID",
  };
}
