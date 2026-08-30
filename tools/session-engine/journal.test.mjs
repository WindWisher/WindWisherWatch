import assert from "node:assert/strict";
import test from "node:test";
import {
  FrameType,
  HEADER_BYTES,
  MAX_PAYLOAD_BYTES,
  encodeFrame,
  parseJournal,
} from "./journal.mjs";

const frame = (
  sequence,
  type = FrameType.SESSION_START,
  payload = { sessionId: "synthetic-session" },
) => encodeFrame({ sequence, type, payload });

test("encodes and validates a complete checksum-protected journal", () => {
  const bytes = Buffer.concat([
    frame(0),
    frame(1, FrameType.CHECKPOINT, { elapsedMilliseconds: 1000 }),
    frame(2, FrameType.SESSION_FINAL, { elapsedMilliseconds: 1000 }),
  ]);
  const parsed = parseJournal(bytes);
  assert.equal(parsed.integrity, "VALID");
  assert.equal(parsed.frames.length, 3);
  assert.equal(parsed.discardedBytes, 0);
});

test("detects one changed payload byte by checksum", () => {
  const bytes = frame(0);
  bytes[HEADER_BYTES] ^= 1;
  const parsed = parseJournal(bytes);
  assert.equal(parsed.integrity, "CORRUPT");
  assert.equal(parsed.issues[0].code, "CHECKSUM_FAILED");
});

test("keeps the valid prefix when the final frame checksum is bad", () => {
  const start = frame(0);
  const final = frame(1, FrameType.SESSION_FINAL, { elapsedMilliseconds: 10 });
  final[final.length - 1] ^= 1;
  const parsed = parseJournal(Buffer.concat([start, final]));
  assert.equal(parsed.integrity, "RECOVERABLE");
  assert.equal(parsed.frames.length, 1);
  assert.equal(parsed.issues[0].code, "CHECKSUM_FAILED");
});

test("falls back to an earlier valid checkpoint when a later checkpoint is corrupt", () => {
  const first = frame(0);
  const checkpoint = frame(1, FrameType.CHECKPOINT, {
    elapsedMilliseconds: 1000,
  });
  const corruptCheckpoint = frame(2, FrameType.CHECKPOINT, {
    elapsedMilliseconds: 2000,
  });
  corruptCheckpoint[corruptCheckpoint.length - 2] ^= 1;
  const parsed = parseJournal(
    Buffer.concat([first, checkpoint, corruptCheckpoint]),
  );
  assert.equal(parsed.integrity, "RECOVERABLE");
  assert.equal(parsed.frames.at(-1).type, FrameType.CHECKPOINT);
  assert.equal(parsed.frames.at(-1).payload.elapsedMilliseconds, 1000);
});

test("keeps valid frames and marks a truncated tail recoverable", () => {
  const first = frame(0);
  const second = frame(1, FrameType.POSITION, { groundSpeedMps: 3 });
  const parsed = parseJournal(
    Buffer.concat([first, second.subarray(0, second.length - 3)]),
  );
  assert.equal(parsed.integrity, "RECOVERABLE");
  assert.equal(parsed.frames.length, 1);
  assert.equal(parsed.issues[0].code, "TAIL_INCOMPLETE");
});

test("rejects huge declared payload lengths before allocation", () => {
  const bytes = frame(0);
  bytes.writeUInt32BE(MAX_PAYLOAD_BYTES + 1, 12);
  const parsed = parseJournal(bytes);
  assert.equal(parsed.integrity, "CORRUPT");
  assert.equal(parsed.issues[0].code, "PAYLOAD_LENGTH_INVALID");
});

test("reports unsupported journal versions without crashing", () => {
  const bytes = frame(0);
  bytes.writeUInt8(99, 4);
  const parsed = parseJournal(bytes);
  assert.equal(parsed.integrity, "UNSUPPORTED_VERSION");
});

test("rejects duplicate and out-of-order sequence at the valid prefix", () => {
  const parsed = parseJournal(Buffer.concat([frame(0), frame(1), frame(1)]));
  assert.equal(parsed.integrity, "RECOVERABLE");
  assert.equal(parsed.frames.length, 2);
  assert.equal(parsed.issues[0].code, "DUPLICATE_OR_OUT_OF_ORDER_SEQUENCE");
});

test("rejects sequence gaps", () => {
  const parsed = parseJournal(Buffer.concat([frame(0), frame(2)]));
  assert.equal(parsed.integrity, "RECOVERABLE");
  assert.equal(parsed.issues[0].code, "SEQUENCE_GAP");
});
