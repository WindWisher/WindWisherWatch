// Offline research only. Scalar magnitude excess is NOT vertical velocity,
// mechanical impulse or height: gravity direction and wrist motion are unknown.
function positiveArea(a, b, dt) {
  if (a <= 0 && b <= 0) return 0;
  if (a >= 0 && b >= 0) return ((a + b) * dt) / 2;
  const positive = Math.max(a, b);
  return (positive * positive * dt) / (2 * Math.abs(b - a));
}

// Fixed pre-flight window. Interpolate only between recorded observations;
// never extrapolate missing coverage or include a post-flight sample.
export function measurePreflightWindow(points, end, duration) {
  measureTakeoffEvidence(points);
  if (!Number.isFinite(end) || !Number.isFinite(duration) || duration <= 0)
    throw new Error("Invalid window");
  const start = end - duration;
  if (points[0].time > start || points.at(-1).time < end)
    throw new Error("Incomplete window coverage");
  function at(time) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (a.time <= time && time <= b.time)
        return {
          time,
          magnitudeMps2:
            a.magnitudeMps2 +
            ((b.magnitudeMps2 - a.magnitudeMps2) * (time - a.time)) /
              (b.time - a.time),
        };
    }
    throw new Error("Missing boundary");
  }
  const window = [
    at(start),
    ...points.filter((p) => p.time > start && p.time < end),
    at(end),
  ];
  return measureTakeoffEvidence(window);
}

// Last connected interval strictly above the existing 14 m/s² impulse level.
// Reports duration and scalar excess above 14, not momentum or velocity.
export function measureLastImpulse(points) {
  measureTakeoffEvidence(points);
  let current = null;
  let last = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const x = a.magnitudeMps2 - 14,
      y = b.magnitudeMps2 - 14;
    if (x <= 0 && y <= 0) {
      current = null;
      continue;
    }
    const start = x > 0 ? a.time : a.time + ((b.time - a.time) * -x) / (y - x);
    const end = y > 0 ? b.time : a.time + ((b.time - a.time) * x) / (x - y);
    if (!current || x <= 0) current = { start, end, excessAboveImpulseMps: 0 };
    current.end = end;
    current.excessAboveImpulseMps += positiveArea(
      x,
      y,
      (b.time - a.time) / 1000,
    );
    last = { ...current, durationMilliseconds: end - current.start };
    if (y <= 0) current = null;
  }
  return last;
}

// Input is exactly one candidate's start-through-flight-entry phase.
// No landing/post-event sample is permitted by the caller's phase selection.
export function measureTakeoffEvidence(points, maximumGapMilliseconds = 120) {
  if (!Array.isArray(points) || points.length < 2)
    throw new Error("At least two phase samples required");
  if (!Number.isFinite(maximumGapMilliseconds) || maximumGapMilliseconds <= 0)
    throw new Error("Invalid gap bound");
  let excessAreaMps = 0;
  let aboveImpulseMilliseconds = 0;
  let peakMps2 = 0;
  for (let i = 0; i < points.length; i++) {
    const { time, magnitudeMps2 } = points[i];
    if (
      !Number.isFinite(time) ||
      !Number.isFinite(magnitudeMps2) ||
      magnitudeMps2 < 0
    )
      throw new Error("Invalid phase sample");
    peakMps2 = Math.max(peakMps2, magnitudeMps2);
    if (!i) continue;
    const previous = points[i - 1];
    const dt = time - previous.time;
    if (dt <= 0 || dt > maximumGapMilliseconds)
      throw new Error("Invalid phase timeline or gap");
    excessAreaMps += positiveArea(
      previous.magnitudeMps2 - 9.80665,
      magnitudeMps2 - 9.80665,
      dt / 1000,
    );
    const a = previous.magnitudeMps2 - 14;
    const b = magnitudeMps2 - 14;
    aboveImpulseMilliseconds +=
      a > 0 && b > 0
        ? dt
        : a <= 0 && b <= 0
          ? 0
          : (dt * Math.max(a, b)) / Math.abs(b - a);
  }
  return {
    durationMilliseconds: points.at(-1).time - points[0].time,
    excessAreaMps,
    aboveImpulseMilliseconds,
    peakMps2,
  };
}
