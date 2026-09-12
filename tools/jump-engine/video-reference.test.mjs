import assert from "node:assert/strict";
import test from "node:test";
import {
  videoEventReference,
  checkConstantOffsetAnchors,
} from "./video-reference.mjs";

test("independent anchors intersect offset bounds without claiming calibration", () => {
  assert.deepEqual(
    checkConstantOffsetAnchors([
      { videoMs: [100, 120], sensorMs: [80, 90] },
      { videoMs: [1000, 1020], sensorMs: [990, 1000] },
    ]),
    {
      status: "CONSTANT_OFFSET_COMPATIBLE_NOT_CALIBRATED",
      offsetMs: [-30, -10],
    },
  );
});

test("incompatible anchors fail closed instead of averaging away clock disagreement", () => {
  assert.deepEqual(
    checkConstantOffsetAnchors([
      { videoMs: [0, 10], sensorMs: [0, 10] },
      { videoMs: [100, 110], sensorMs: [150, 160] },
    ]),
    { status: "CONSTANT_OFFSET_INCONSISTENT", offsetMs: null },
  );
});

test("anchor validation rejects missing, unbounded, unordered and repeated evidence", () => {
  const anchor = { videoMs: [10, 20], sensorMs: [30, 40] };
  for (const anchors of [
    [],
    [anchor],
    [anchor, anchor],
    Array(9).fill(anchor),
    [anchor, { videoMs: [50, Infinity], sensorMs: [60, 70] }],
    [anchor, { videoMs: [50, 60], sensorMs: [20, 25] }],
  ])
    assert.throws(() => checkConstantOffsetAnchors(anchors));
});

test("video boundaries retain uncertainty and do not invent sensor alignment", () => {
  const result = videoEventReference({
    takeoffVideoMs: [100, 120],
    landingVideoMs: [400, 420],
  });
  assert.deepEqual(result.durationMs, [280, 320]);
  assert.equal(result.status, "VIDEO_ONLY_UNALIGNED");
  assert.equal(result.sensorEvent, null);
});
test("provided bounded offset propagates uncertainty without calibration claim", () => {
  const result = videoEventReference({
    takeoffVideoMs: [100, 120],
    landingVideoMs: [400, 420],
    sensorMinusVideoOffsetMs: [-50, -20],
  });
  assert.deepEqual(result.sensorEvent, {
    takeoffMs: [50, 100],
    landingMs: [350, 400],
  });
  assert.deepEqual(result.durationMs, [280, 320]);
});
test("invalid and overlapping reference boundaries fail closed", () => {
  for (const takeoff of [
    [NaN, 120],
    [130, 120],
    [-1, 10],
    [300, 410],
  ])
    assert.throws(() =>
      videoEventReference({
        takeoffVideoMs: takeoff,
        landingVideoMs: [400, 420],
      }),
    );
});
