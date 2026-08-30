import { Crc32Accumulator, crc32 } from "../crc32.mjs";

export const CANONICAL_SCHEMA_VERSION = "1.0.0";
export const MAX_CANONICAL_LINE_BYTES = 16_384;

export function checksumHex(bytes) {
  return crc32(bytes).toString(16).padStart(8, "0");
}

export function recordCore({ recordSequence, recordType, payload }) {
  return {
    canonicalSchemaVersion: CANONICAL_SCHEMA_VERSION,
    recordSequence,
    recordType,
    payload,
  };
}

export function encodeCanonicalRecord(input) {
  const core = recordCore(input);
  const checksum = checksumHex(Buffer.from(JSON.stringify(core), "utf8"));
  const record = {
    ...core,
    checksumAlgorithm: "crc32",
    checksum,
  };
  const line = `${JSON.stringify(record)}\n`;
  if (Buffer.byteLength(line, "utf8") > MAX_CANONICAL_LINE_BYTES)
    throw new Error("Canonical record exceeds line bound");
  return { record, line };
}

export function validateRecordChecksum(record) {
  if (record.checksumAlgorithm !== "crc32") return false;
  return (
    record.checksum ===
    checksumHex(Buffer.from(JSON.stringify(recordCore(record)), "utf8"))
  );
}

export { Crc32Accumulator };
