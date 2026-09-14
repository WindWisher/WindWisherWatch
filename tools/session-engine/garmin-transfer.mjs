import { FrameType } from "./journal.mjs";

// Private, bounded transfer envelope for short completed Garmin journals.
// Not Canonical Session v1, not a DAT/IDX decoder and not a network transport.
export const MAX_TRANSFER_FRAMES = 1024;
const MAX_LINE_BYTES = 4096;
function check(value) {
  if (!value) throw new Error("Invalid or incomplete Garmin transfer");
}
function exact(value, keys) {
  check(value !== null && typeof value === "object" && !Array.isArray(value));
  check(
    Object.keys(value).length === keys.length &&
      keys.every((k) => Object.hasOwn(value, k)),
  );
}
export function adler32(text, seed = 1) {
  let a = seed & 0xffff,
    b = seed >>> 16;
  for (let i = 0; i < text.length; i++) {
    a = (a + text.charCodeAt(i)) % 65521;
    b = (b + a) % 65521;
  }
  return b * 65536 + a;
}
function canonical(frame) {
  return `WWJF|1|${frame.sequence}|${frame.frameType}|${frame.payload}`;
}
export function validateGarminFrame(frame) {
  exact(frame, [
    "magic",
    "formatVersion",
    "sequence",
    "frameType",
    "payloadLength",
    "payload",
    "checksum",
  ]);
  check(frame.magic === "WWJF" && frame.formatVersion === 1);
  check(
    Number.isInteger(frame.sequence) &&
      frame.sequence >= 0 &&
      frame.sequence < MAX_TRANSFER_FRAMES,
  );
  check(Object.hasOwn(FrameType, frame.frameType));
  // Current Garmin engine emits ASCII scalar fields. Reject unknown encodings
  // rather than guessing Unicode checksum semantics across platforms.
  check(
    typeof frame.payload === "string" &&
      /^[\x20-\x7e]*$/.test(frame.payload) &&
      frame.payload.length <= 512,
  );
  check(
    frame.payloadLength === frame.payload.length &&
      Number.isInteger(frame.checksum) &&
      frame.checksum === adler32(canonical(frame)),
  );
  return frame;
}
function manifestSeed(sessionId) {
  return adler32(`WWSE_TRANSFER|1|${sessionId}\n`);
}

export function encodeGarminTransfer(sessionId, frames) {
  check(
    typeof sessionId === "string" && /^[A-Za-z0-9_-]{1,96}$/.test(sessionId),
  );
  check(
    Array.isArray(frames) &&
      frames.length >= 2 &&
      frames.length <= MAX_TRANSFER_FRAMES,
  );
  const records = [{ recordType: "manifest", transferVersion: 1, sessionId }];
  let checksum = manifestSeed(sessionId);
  for (const frame of frames) {
    validateGarminFrame(frame);
    records.push({ recordType: "frame", frame });
    checksum = adler32(canonical(frame) + "\n", checksum);
  }
  records.push({
    recordType: "completion",
    frameCount: frames.length,
    streamAdler32: checksum,
  });
  return records.map((record) => JSON.stringify(record) + "\n");
}

export async function parseGarminTransfer(lines) {
  // Caller supplies bounded lines from a private local source. No writes until
  // the complete envelope is verified; returned frames retain original bytes as text.
  const frames = [];
  let sessionId = null,
    checksum = null,
    complete = false,
    count = 0;
  for await (const line of lines) {
    check(
      typeof line === "string" &&
        Buffer.byteLength(line, "utf8") <= MAX_LINE_BYTES &&
        ++count <= MAX_TRANSFER_FRAMES + 2 &&
        !complete,
    );
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error("Invalid Garmin transfer JSON");
    }
    check(record && typeof record === "object");
    if (sessionId === null) {
      exact(record, ["recordType", "transferVersion", "sessionId"]);
      check(
        record.recordType === "manifest" &&
          record.transferVersion === 1 &&
          typeof record.sessionId === "string" &&
          /^[A-Za-z0-9_-]{1,96}$/.test(record.sessionId),
      );
      sessionId = record.sessionId;
      checksum = manifestSeed(sessionId);
    } else if (record.recordType === "frame") {
      exact(record, ["recordType", "frame"]);
      const frame = validateGarminFrame(record.frame);
      check(
        frame.sequence === frames.length && frames.length < MAX_TRANSFER_FRAMES,
      );
      check(
        frames.length === 0
          ? frame.frameType === "SESSION_START"
          : frame.frameType !== "SESSION_START" &&
              frames.at(-1).frameType !== "SESSION_FINAL",
      );
      frames.push(frame);
      checksum = adler32(canonical(frame) + "\n", checksum);
    } else {
      exact(record, ["recordType", "frameCount", "streamAdler32"]);
      check(
        record.recordType === "completion" &&
          frames.length >= 2 &&
          frames.at(-1).frameType === "SESSION_FINAL" &&
          record.frameCount === frames.length &&
          record.streamAdler32 === checksum,
      );
      complete = true;
    }
  }
  check(complete);
  return {
    sessionId,
    frames,
    integrity: "VALID_TRANSFER_FRAMING",
    privacy: "PRIVATE_SESSION_TELEMETRY",
    canonicalMapping: "NOT_IMPLEMENTED",
  };
}
