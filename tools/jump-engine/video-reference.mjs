// Offline interval arithmetic only. No media upload, detector-derived labels,
// synchronization estimation or airtime validation.
function interval(value) {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((v) => !Number.isFinite(v)) ||
    value[0] > value[1]
  )
    throw new Error("Invalid timestamp interval");
  return value;
}

// Arithmetic consistency of independently bounded, corresponding anchors only.
// Agreement cannot establish calibration, clock stability or anchor identity.
export function checkConstantOffsetAnchors(anchors) {
  if (!Array.isArray(anchors) || anchors.length < 2 || anchors.length > 8)
    throw new Error("Provide two to eight independent anchor intervals");
  let lower = -Infinity;
  let upper = Infinity;
  let previousVideo = null;
  let previousSensor = null;
  for (const anchor of anchors) {
    const video = interval(anchor.videoMs);
    const sensor = interval(anchor.sensorMs);
    if (
      video[0] < 0 ||
      sensor[0] < 0 ||
      (previousVideo !== null && video[0] <= previousVideo) ||
      (previousSensor !== null && sensor[0] <= previousSensor)
    )
      throw new Error(
        "Anchors must be nonnegative, ordered and nonoverlapping",
      );
    lower = Math.max(lower, sensor[0] - video[1]);
    upper = Math.min(upper, sensor[1] - video[0]);
    previousVideo = video[1];
    previousSensor = sensor[1];
  }
  return lower > upper
    ? { status: "CONSTANT_OFFSET_INCONSISTENT", offsetMs: null }
    : {
        status: "CONSTANT_OFFSET_COMPATIBLE_NOT_CALIBRATED",
        offsetMs: [lower, upper],
      };
}

export function videoEventReference({
  takeoffVideoMs,
  landingVideoMs,
  sensorMinusVideoOffsetMs = null,
}) {
  const takeoff = interval(takeoffVideoMs);
  const landing = interval(landingVideoMs);
  if (takeoff[0] < 0 || landing[0] < takeoff[1])
    throw new Error("Ambiguous or reversed event boundaries");
  const durationMs = [landing[0] - takeoff[1], landing[1] - takeoff[0]];
  if (sensorMinusVideoOffsetMs === null)
    return { status: "VIDEO_ONLY_UNALIGNED", durationMs, sensorEvent: null };
  const offset = interval(sensorMinusVideoOffsetMs);
  const shift = (v) => [v[0] + offset[0], v[1] + offset[1]];
  return {
    status: "BOUNDED_OFFSET_PROVIDED_NOT_CALIBRATED",
    durationMs,
    sensorEvent: { takeoffMs: shift(takeoff), landingMs: shift(landing) },
  };
}
