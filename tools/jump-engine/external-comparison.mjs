// Host-only empirical comparison. No runtime detector or canonical schema coupling.
export const LIMITS = Object.freeze({
  events: 1000,
  seconds: 604800,
  tolerance: 60,
});
const finite = (x, min, max) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
function requireValue(ok, message) {
  if (!ok) throw new Error(message);
}
function closed(value, keys) {
  requireValue(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "Expected object",
  );
  requireValue(
    Object.keys(value).every((k) => keys.includes(k)),
    "Unexpected field",
  );
}

export function validateSeries(series) {
  closed(series, ["schemaVersion", "kind", "source", "timeBasis", "events"]);
  requireValue(
    series.schemaVersion === "1.0.0" &&
      series.kind === "SANITIZED_EXTERNAL_EVENT_SERIES",
    "Unsupported series schema",
  );
  requireValue(
    ["SURFR_GARMIN_FIT", "WOO_BOARD_SENSOR_BLE", "SYNTHETIC"].includes(
      series.source,
    ),
    "Unsupported source",
  );
  requireValue(
    series.timeBasis === "SECONDS_FROM_SOURCE_SESSION_START",
    "Relative seconds required",
  );
  requireValue(
    Array.isArray(series.events) && series.events.length <= LIMITS.events,
    "Event limit exceeded",
  );
  const bounds = {
    heightMeters: 200,
    airtimeSeconds: 120,
    distanceMeters: 10000,
    maximumSpeedMetersPerSecond: 150,
  };
  const vendor = [
    "heightErrorVendorValue",
    "maximumHorizontalPowerVendorValue",
    "popKineticEnergyVendorValue",
    "crashVelocityVendorValue",
    "crashGForceVendorValue",
  ];
  const ids = new Set();
  let previous = -1;
  for (const event of series.events) {
    closed(event, [
      "id",
      "eventTimeSeconds",
      ...Object.keys(bounds),
      ...vendor,
    ]);
    requireValue(
      typeof event.id === "string" &&
        /^[a-zA-Z0-9_-]{1,64}$/.test(event.id) &&
        !ids.has(event.id),
      "Invalid or duplicate event id",
    );
    ids.add(event.id);
    requireValue(
      finite(event.eventTimeSeconds, 0, LIMITS.seconds) &&
        event.eventTimeSeconds > previous,
      "Events must be strictly increasing in relative seconds",
    );
    previous = event.eventTimeSeconds;
    for (const [key, max] of Object.entries(bounds)) {
      if (event[key] !== undefined && event[key] !== null)
        requireValue(
          finite(event[key], 0, max),
          "Invalid metric or unit bound",
        );
    }
    for (const key of vendor)
      if (event[key] !== undefined)
        requireValue(finite(event[key], -1e9, 1e9), "Invalid vendor value");
  }
  return series;
}

export function validateClock(clock) {
  closed(clock, ["kind", "offsetSeconds", "scale", "provenance"]);
  requireValue(
    ["OFFSET", "AFFINE"].includes(clock.kind),
    "Unknown clock model",
  );
  requireValue(
    finite(clock.offsetSeconds, -LIMITS.seconds, LIMITS.seconds) &&
      finite(clock.scale, 0.9, 1.1),
    "Invalid clock bounds",
  );
  requireValue(
    clock.kind !== "OFFSET" || clock.scale === 1,
    "Offset model must have unit scale",
  );
  requireValue(
    [
      "FITTED_SAME_SESSION",
      "FITTED_SEPARATE_DATA_DECLARED",
      "EXTERNALLY_SUPPLIED_UNVERIFIED",
    ].includes(clock.provenance),
    "Clock provenance required",
  );
  return clock;
}

// Anchors must be explicitly supplied. Never estimate the clock during evaluation.
export function fitClock(anchors, kind, provenance = "FITTED_SAME_SESSION") {
  requireValue(
    ["FITTED_SAME_SESSION", "FITTED_SEPARATE_DATA_DECLARED"].includes(
      provenance,
    ),
    "Fitted clock must retain fitted provenance",
  );
  requireValue(
    Array.isArray(anchors) &&
      anchors.length >= (kind === "AFFINE" ? 2 : 1) &&
      anchors.length <= LIMITS.events,
    "Invalid anchor count",
  );
  let lastCandidate = -1,
    lastReference = -1;
  for (const a of anchors) {
    closed(a, ["candidateSeconds", "referenceSeconds"]);
    requireValue(
      finite(a.candidateSeconds, 0, LIMITS.seconds) &&
        finite(a.referenceSeconds, 0, LIMITS.seconds) &&
        a.candidateSeconds > lastCandidate &&
        a.referenceSeconds > lastReference,
      "Invalid or non-monotonic anchors",
    );
    lastCandidate = a.candidateSeconds;
    lastReference = a.referenceSeconds;
  }
  const mx =
    anchors.reduce((s, a) => s + a.candidateSeconds, 0) / anchors.length;
  const my =
    anchors.reduce((s, a) => s + a.referenceSeconds, 0) / anchors.length;
  let scale = 1;
  if (kind === "AFFINE") {
    const variance = anchors.reduce(
      (s, a) => s + (a.candidateSeconds - mx) ** 2,
      0,
    );
    requireValue(variance > 1e-12, "Degenerate anchor span");
    scale =
      anchors.reduce(
        (s, a) => s + (a.candidateSeconds - mx) * (a.referenceSeconds - my),
        0,
      ) / variance;
  }
  return Object.freeze(
    validateClock({ kind, offsetSeconds: my - scale * mx, scale, provenance }),
  );
}

function differences(values) {
  if (!values.length)
    return { count: 0, bias: null, meanAbsoluteDifference: null };
  return {
    count: values.length,
    bias: values.reduce((s, x) => s + x, 0) / values.length,
    meanAbsoluteDifference:
      values.reduce((s, x) => s + Math.abs(x), 0) / values.length,
  };
}

export function compareExternal(
  candidate,
  reference,
  { clock, toleranceSeconds },
) {
  validateSeries(candidate);
  validateSeries(reference);
  validateClock(clock);
  requireValue(
    finite(toleranceSeconds, 0, LIMITS.tolerance),
    "Invalid matching tolerance",
  );
  const a = candidate.events,
    b = reference.events,
    width = b.length + 1;
  const cells = (a.length + 1) * width;
  const counts = new Uint16Array(cells),
    costs = new Float64Array(cells),
    actions = new Uint8Array(cells);
  // Prefix DP: max cardinality, then min sum absolute time residual. Exact ties
  // prefer skipping candidate, then reference, then matching; no metric-based ties.
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const at = i * width + j,
        up = at - width,
        left = at - 1,
        diag = up - 1;
      let count = counts[up],
        cost = costs[up],
        action = 1;
      const choose = (n, c, d) => {
        if (n > count || (n === count && c < cost)) {
          count = n;
          cost = c;
          action = d;
        }
      };
      choose(counts[left], costs[left], 2);
      const delta = Math.abs(
        clock.offsetSeconds +
          clock.scale * a[i - 1].eventTimeSeconds -
          b[j - 1].eventTimeSeconds,
      );
      if (delta <= toleranceSeconds)
        choose(counts[diag] + 1, costs[diag] + delta, 3);
      counts[at] = count;
      costs[at] = cost;
      actions[at] = action;
    }
  const pairs = [];
  let i = a.length,
    j = b.length;
  while (i > 0 && j > 0) {
    const action = actions[i * width + j];
    if (action === 3) {
      pairs.push({ candidateIndex: i - 1, referenceIndex: j - 1 });
      i--;
      j--;
    } else if (action === 1) i--;
    else j--;
  }
  pairs.reverse();
  const usedA = new Set(pairs.map((p) => p.candidateIndex)),
    usedB = new Set(pairs.map((p) => p.referenceIndex));
  const metric = (key) =>
    differences(
      pairs.flatMap((p) => {
        const x = a[p.candidateIndex][key],
          y = b[p.referenceIndex][key];
        return typeof x === "number" && typeof y === "number" ? [x - y] : [];
      }),
    );
  return {
    comparisonVersion: "1.0.0",
    status: "EXPERIMENTAL_VENDOR_AGREEMENT_NOT_PHYSICAL_ACCURACY",
    candidateSource: candidate.source,
    referenceSource: reference.source,
    clock: { ...clock },
    independentClockValidation: "NOT_ESTABLISHED",
    toleranceSeconds,
    matchingPolicy: "MONOTONIC_MAX_COUNT_THEN_MIN_ABSOLUTE_TIME_ERROR",
    windowPolicy: "ALL_SUPPLIED_EVENTS_NO_SILENT_CROPPING",
    matched: pairs.length,
    candidateCount: a.length,
    referenceCount: b.length,
    descriptivePrecision: a.length ? pairs.length / a.length : null,
    descriptiveRecall: b.length ? pairs.length / b.length : null,
    ratioDefinition:
      "precision=matched/candidateCount; recall=matched/referenceCount; comparator is not truth",
    pairs,
    unmatchedCandidateIndices: a.flatMap((_, k) => (usedA.has(k) ? [] : [k])),
    unmatchedReferenceIndices: b.flatMap((_, k) => (usedB.has(k) ? [] : [k])),
    alignedTimeDifferenceSeconds: differences(
      pairs.map(
        (p) =>
          clock.offsetSeconds +
          clock.scale * a[p.candidateIndex].eventTimeSeconds -
          b[p.referenceIndex].eventTimeSeconds,
      ),
    ),
    metricDifferenceDirection: "CANDIDATE_MINUS_REFERENCE",
    heightDifferenceMeters: metric("heightMeters"),
    airtimeDifferenceSeconds: metric("airtimeSeconds"),
    WATCH_VS_VENDOR_EVENT_MATCHING: "NOT_RUN",
    JUMP_HEIGHT_VALIDATED: "NO",
    JUMP_AIRTIME_VALIDATED: "NO",
    JUMP_DETECTION_PRODUCT_READY: "NO",
  };
}
