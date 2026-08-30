import { crc32 } from "./crc32.mjs";

export const JOURNAL_MAGIC = "WWJF";
export const JOURNAL_FORMAT_VERSION = 1;
export const SESSION_SCHEMA_VERSION = "1.0.0";
export const HEADER_BYTES = 20;
export const MAX_PAYLOAD_BYTES = 4096;
export const DEFAULT_CHUNK_BYTES = 8192;

export const FrameType = Object.freeze({
  SESSION_START: 1,
  POSITION: 2,
  HEART_RATE: 3,
  PRESSURE: 4,
  RUNTIME: 5,
  QUALITY: 6,
  CHECKPOINT: 7,
  SESSION_STOP: 8,
  SESSION_FINAL: 9,
});

const knownFrameTypes = new Set(Object.values(FrameType));

export class JournalError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "JournalError";
    this.code = code;
  }
}

export function encodeFrame({
  sequence,
  type,
  payload,
  version = JOURNAL_FORMAT_VERSION,
}) {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 0xffffffff)
    throw new JournalError(
      "INVALID_SEQUENCE",
      "Frame sequence is outside uint32 bounds",
    );
  if (!knownFrameTypes.has(type))
    throw new JournalError("INVALID_FRAME_TYPE", "Unknown frame type");
  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  if (payloadBytes.length > MAX_PAYLOAD_BYTES)
    throw new JournalError(
      "PAYLOAD_TOO_LARGE",
      `Payload exceeds ${MAX_PAYLOAD_BYTES} bytes`,
    );
  const frame = Buffer.alloc(HEADER_BYTES + payloadBytes.length);
  frame.write(JOURNAL_MAGIC, 0, 4, "ascii");
  frame.writeUInt8(version, 4);
  frame.writeUInt8(type, 5);
  frame.writeUInt16BE(0, 6);
  frame.writeUInt32BE(sequence, 8);
  frame.writeUInt32BE(payloadBytes.length, 12);
  payloadBytes.copy(frame, HEADER_BYTES);
  frame.writeUInt32BE(
    crc32(Buffer.concat([frame.subarray(0, 16), payloadBytes])),
    16,
  );
  return frame;
}

export function parseJournal(
  input,
  { maxPayloadBytes = MAX_PAYLOAD_BYTES } = {},
) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const frames = [];
  const issues = [];
  let offset = 0;
  let expectedSequence = null;
  while (offset < bytes.length) {
    const remaining = bytes.length - offset;
    if (remaining < HEADER_BYTES) {
      issues.push({
        code: "TAIL_INCOMPLETE",
        offset,
        remainingBytes: remaining,
      });
      break;
    }
    if (bytes.toString("ascii", offset, offset + 4) !== JOURNAL_MAGIC) {
      issues.push({ code: "JOURNAL_CORRUPT", offset, detail: "bad_magic" });
      break;
    }
    const version = bytes.readUInt8(offset + 4);
    if (version !== JOURNAL_FORMAT_VERSION) {
      issues.push({ code: "UNSUPPORTED_VERSION", offset, version });
      break;
    }
    const type = bytes.readUInt8(offset + 5);
    if (!knownFrameTypes.has(type)) {
      issues.push({ code: "UNKNOWN_FRAME_TYPE", offset, type });
      break;
    }
    const sequence = bytes.readUInt32BE(offset + 8);
    const payloadLength = bytes.readUInt32BE(offset + 12);
    if (payloadLength > maxPayloadBytes) {
      issues.push({ code: "PAYLOAD_LENGTH_INVALID", offset, payloadLength });
      break;
    }
    const frameLength = HEADER_BYTES + payloadLength;
    if (remaining < frameLength) {
      issues.push({
        code: "TAIL_INCOMPLETE",
        offset,
        expectedBytes: frameLength,
        remainingBytes: remaining,
      });
      break;
    }
    const payloadBytes = bytes.subarray(
      offset + HEADER_BYTES,
      offset + frameLength,
    );
    const expectedChecksum = bytes.readUInt32BE(offset + 16);
    const actualChecksum = crc32(
      Buffer.concat([bytes.subarray(offset, offset + 16), payloadBytes]),
    );
    if (actualChecksum !== expectedChecksum) {
      issues.push({ code: "CHECKSUM_FAILED", offset, sequence });
      break;
    }
    if (expectedSequence !== null && sequence !== expectedSequence) {
      issues.push({
        code:
          sequence < expectedSequence
            ? "DUPLICATE_OR_OUT_OF_ORDER_SEQUENCE"
            : "SEQUENCE_GAP",
        offset,
        expectedSequence,
        actualSequence: sequence,
      });
      break;
    }
    let payload;
    try {
      payload = JSON.parse(payloadBytes.toString("utf8"));
    } catch {
      issues.push({ code: "MALFORMED_PAYLOAD", offset, sequence });
      break;
    }
    frames.push({
      version,
      type,
      sequence,
      payload,
      offset,
      frameLength,
      checksum: expectedChecksum,
    });
    expectedSequence = sequence + 1;
    offset += frameLength;
  }
  const finalFrame = frames.at(-1);
  const hasFinal = finalFrame?.type === FrameType.SESSION_FINAL;
  let integrity = "VALID";
  if (issues.some((issue) => issue.code === "UNSUPPORTED_VERSION"))
    integrity = "UNSUPPORTED_VERSION";
  else if (issues.length > 0 && frames.length === 0) integrity = "CORRUPT";
  else if (issues.length > 0 || !hasFinal) integrity = "RECOVERABLE";
  return {
    integrity,
    frames,
    issues,
    validBytes: offset,
    discardedBytes: bytes.length - offset,
    hasFinal,
  };
}

export function frameTypeName(type) {
  return (
    Object.entries(FrameType).find(([, value]) => value === type)?.[0] ??
    "UNKNOWN"
  );
}
