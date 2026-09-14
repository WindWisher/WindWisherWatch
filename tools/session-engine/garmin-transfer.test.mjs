import assert from "node:assert/strict";
import test from "node:test";
import {
  adler32,
  encodeGarminTransfer,
  parseGarminTransfer,
  validateGarminFrame,
  MAX_TRANSFER_FRAMES,
} from "./garmin-transfer.mjs";

function frame(sequence, frameType, payload = "synthetic") {
  return {
    magic: "WWJF",
    formatVersion: 1,
    sequence,
    frameType,
    payloadLength: payload.length,
    payload,
    checksum: adler32(`WWJF|1|${sequence}|${frameType}|${payload}`),
  };
}
const source = () => [
  frame(0, "SESSION_START"),
  frame(1, "CHECKPOINT"),
  frame(2, "SESSION_FINAL"),
];
test("Garmin transfer preserves frames and is deterministic and read-only", async () => {
  assert.equal(adler32("Wikipedia"), 0x11e60398);
  assert.equal(adler32("pedia", adler32("Wiki")), adler32("Wikipedia"));
  const frames = source(),
    before = JSON.stringify(frames),
    lines = encodeGarminTransfer("synthetic", frames);
  const result = await parseGarminTransfer(lines);
  assert.deepEqual(result.frames, frames);
  assert.equal(result.privacy, "PRIVATE_SESSION_TELEMETRY");
  assert.equal(result.canonicalMapping, "NOT_IMPLEMENTED");
  assert.equal(JSON.stringify(frames), before);
  assert.deepEqual(encodeGarminTransfer("synthetic", frames), lines);
});
test("rejects changed payload, truncation, duplicate, reorder and cross-session envelope", async () => {
  const good = encodeGarminTransfer("synthetic", source());
  const variants = [
    good.slice(0, -1),
    [...good, good[0]],
    [good[0], good[2], good[1], ...good.slice(3)],
    [good[0], good[1], good[1], ...good.slice(2)],
    good.map((x, i) => (i === 0 ? x.replace("synthetic", "another") : x)),
    good.map((x, i) => (i === 2 ? x.replace("synthetic", "changed") : x)),
  ];
  for (const lines of variants)
    await assert.rejects(() => parseGarminTransfer(lines));
  await assert.rejects(() => parseGarminTransfer([" ".repeat(4097)]));
  await assert.rejects(() => parseGarminTransfer([]));
});
test("rejects premature final, missing start, unknown fields and unknown encoding", async () => {
  for (const frames of [
    [frame(0, "CHECKPOINT"), frame(1, "SESSION_FINAL")],
    [
      frame(0, "SESSION_START"),
      frame(1, "SESSION_FINAL"),
      frame(2, "SESSION_FINAL"),
    ],
  ])
    await assert.rejects(() =>
      parseGarminTransfer(encodeGarminTransfer("synthetic", frames)),
    );
  assert.throws(() => validateGarminFrame({ ...source()[0], unexpected: 1 }));
  assert.throws(() => validateGarminFrame(frame(0, "SESSION_START", "ñ")));
  assert.throws(() => validateGarminFrame(frame(0, "UNKNOWN")));
  assert.throws(() =>
    validateGarminFrame(frame(0, "SESSION_START", "x".repeat(513))),
  );
});
test("bounded transfer accepts its limit and rejects overflow", async () => {
  const frames = Array.from({ length: MAX_TRANSFER_FRAMES }, (_, i) =>
    frame(
      i,
      i === 0
        ? "SESSION_START"
        : i === MAX_TRANSFER_FRAMES - 1
          ? "SESSION_FINAL"
          : "CHECKPOINT",
    ),
  );
  assert.equal(
    (await parseGarminTransfer(encodeGarminTransfer("synthetic", frames)))
      .frames.length,
    MAX_TRANSFER_FRAMES,
  );
  assert.throws(() =>
    encodeGarminTransfer("synthetic", [...frames, frames[0]]),
  );
});
