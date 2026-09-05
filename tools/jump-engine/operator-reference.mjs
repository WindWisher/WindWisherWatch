export const MarkerType = Object.freeze({
  TRIAL_START: "TRIAL_START",
  GO_SIGNAL: "GO_SIGNAL",
  POST_EVENT_MARK: "POST_EVENT_MARK",
  NEGATIVE_TRIAL: "NEGATIVE_TRIAL",
});

export const ExpectedEventType = Object.freeze({
  NONE: "NONE",
  CONTROLLED_HOP: "CONTROLLED_HOP",
});

export const DatasetSplit = Object.freeze({
  TUNING: "TUNING",
  HOLDOUT: "HOLDOUT",
});

export const AlignmentCategory = Object.freeze({
  MATCHED: "MATCHED",
  MISSED: "MISSED",
  EXTRA_DETECTION: "EXTRA_DETECTION",
  FALSE_POSITIVE: "FALSE_POSITIVE",
  AMBIGUOUS: "AMBIGUOUS",
});

export const MAX_OPERATOR_MARKERS = 4;

function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be finite and non-negative`);
  return value;
}

export function validateOperatorReference(reference) {
  if (!reference || reference.referenceSchemaVersion !== "1.0.0")
    throw new Error("Unsupported operator reference schema");
  if (typeof reference.trialId !== "string" || reference.trialId.length === 0)
    throw new Error("Operator reference trialId is required");
  if (!Object.values(ExpectedEventType).includes(reference.expectedEventType))
    throw new Error("Unsupported expected event type");
  if (!Object.values(DatasetSplit).includes(reference.datasetSplit))
    throw new Error("Unsupported dataset split");
  if (
    !Array.isArray(reference.markers) ||
    reference.markers.length === 0 ||
    reference.markers.length > MAX_OPERATOR_MARKERS
  )
    throw new Error("Operator marker count is outside its fixed bound");

  let previousTimestamp = -1;
  const ids = new Set();
  for (const marker of reference.markers) {
    if (!Object.values(MarkerType).includes(marker.markerType))
      throw new Error("Unsupported operator marker type");
    if (typeof marker.referenceId !== "string" || ids.has(marker.referenceId))
      throw new Error("Operator marker id is missing or duplicated");
    ids.add(marker.referenceId);
    finiteNonNegative(marker.timestampMilliseconds, "marker timestamp");
    if (
      marker.normalizedTimestampMilliseconds !== null &&
      marker.normalizedTimestampMilliseconds !== undefined
    )
      finiteNonNegative(
        marker.normalizedTimestampMilliseconds,
        "normalized marker timestamp",
      );
    finiteNonNegative(
      marker.uncertaintyBeforeMilliseconds,
      "marker uncertainty",
    );
    finiteNonNegative(
      marker.uncertaintyAfterMilliseconds,
      "marker uncertainty",
    );
    if (marker.timestampMilliseconds < previousTimestamp)
      throw new Error("Operator markers are not monotonic");
    previousTimestamp = marker.timestampMilliseconds;
    if (typeof marker.provenance !== "string" || marker.provenance.length === 0)
      throw new Error("Operator marker provenance is required");
  }
  return reference;
}

export function referenceWindows(reference) {
  validateOperatorReference(reference);
  if (reference.expectedEventType === ExpectedEventType.NONE) return [];
  const postMarkers = reference.markers.filter(
    (marker) => marker.markerType === MarkerType.POST_EVENT_MARK,
  );
  return postMarkers.map((marker) => {
    const hasNormalizedTime = Number.isFinite(
      marker.normalizedTimestampMilliseconds,
    );
    const timestamp = hasNormalizedTime
      ? marker.normalizedTimestampMilliseconds
      : marker.timestampMilliseconds;
    const callbackLagMilliseconds = hasNormalizedTime
      ? Math.max(0, marker.timestampMilliseconds - timestamp)
      : 0;
    return {
      referenceId: marker.referenceId,
      timestampBasis: hasNormalizedTime
        ? "NORMALIZED_SENSOR_TIME_WITH_MEASURED_CALLBACK_LAG"
        : "CONTROLLER_ELAPSED_TIME",
      callbackLagMilliseconds,
      earliestMilliseconds: timestamp - marker.uncertaintyBeforeMilliseconds,
      latestMilliseconds:
        timestamp +
        marker.uncertaintyAfterMilliseconds +
        callbackLagMilliseconds,
      markerType: marker.markerType,
      provenance: marker.provenance,
    };
  });
}

function candidateInterval(candidate, sampleIntervalMilliseconds) {
  if (
    candidate.status !== "CONFIRMED" ||
    !Number.isFinite(candidate.takeoffMilliseconds) ||
    !Number.isFinite(candidate.landingMilliseconds)
  )
    return null;
  return {
    candidate,
    start: candidate.takeoffMilliseconds - sampleIntervalMilliseconds,
    end: candidate.landingMilliseconds + sampleIntervalMilliseconds,
  };
}

function overlaps(reference, candidate) {
  return (
    reference.earliestMilliseconds <= candidate.end &&
    candidate.start <= reference.latestMilliseconds
  );
}

export function alignOperatorReference({
  reference,
  candidates,
  sampleIntervalMilliseconds = 40,
}) {
  validateOperatorReference(reference);
  finiteNonNegative(sampleIntervalMilliseconds, "sample interval");
  const detections = candidates
    .map((candidate) =>
      candidateInterval(candidate, sampleIntervalMilliseconds),
    )
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.start - right.start ||
        String(left.candidate.candidateId).localeCompare(
          String(right.candidate.candidateId),
        ),
    );

  if (reference.expectedEventType === ExpectedEventType.NONE) {
    return {
      trialId: reference.trialId,
      expectedEventType: reference.expectedEventType,
      matches: detections.map(({ candidate }) => ({
        category: AlignmentCategory.FALSE_POSITIVE,
        candidateId: candidate.candidateId,
      })),
      counts: {
        matched: 0,
        missed: 0,
        extraDetections: 0,
        falsePositives: detections.length,
        ambiguous: 0,
      },
    };
  }

  const windows = referenceWindows(reference).sort(
    (left, right) =>
      left.earliestMilliseconds - right.earliestMilliseconds ||
      left.referenceId.localeCompare(right.referenceId),
  );
  const edges = windows.map((window) =>
    detections
      .map((detection, index) => (overlaps(window, detection) ? index : -1))
      .filter((index) => index >= 0),
  );
  const detectionDegrees = detections.map((_, detectionIndex) =>
    edges.reduce(
      (count, windowEdges) =>
        count + (windowEdges.includes(detectionIndex) ? 1 : 0),
      0,
    ),
  );
  const matches = [];
  const usedDetections = new Set();
  windows.forEach((window, windowIndex) => {
    const compatible = edges[windowIndex];
    if (compatible.length === 0) {
      matches.push({
        category: AlignmentCategory.MISSED,
        referenceId: window.referenceId,
      });
      return;
    }
    if (
      compatible.length !== 1 ||
      detectionDegrees[compatible[0]] !== 1 ||
      reference.timestampQuality === "DEGRADED"
    ) {
      matches.push({
        category: AlignmentCategory.AMBIGUOUS,
        referenceId: window.referenceId,
        candidateIds: compatible.map(
          (index) => detections[index].candidate.candidateId,
        ),
      });
      compatible.forEach((index) => usedDetections.add(index));
      return;
    }
    const detectionIndex = compatible[0];
    usedDetections.add(detectionIndex);
    const detection = detections[detectionIndex];
    matches.push({
      category: AlignmentCategory.MATCHED,
      referenceId: window.referenceId,
      candidateId: detection.candidate.candidateId,
      referenceWindow: [window.earliestMilliseconds, window.latestMilliseconds],
      timestampBasis: window.timestampBasis,
      callbackLagMilliseconds: window.callbackLagMilliseconds,
      candidateWindow: [detection.start, detection.end],
      overlapMilliseconds:
        Math.min(window.latestMilliseconds, detection.end) -
        Math.max(window.earliestMilliseconds, detection.start),
    });
  });
  detections.forEach((detection, index) => {
    if (detectionDegrees[index] === 0 && !usedDetections.has(index))
      matches.push({
        category: AlignmentCategory.EXTRA_DETECTION,
        candidateId: detection.candidate.candidateId,
      });
  });

  const count = (category) =>
    matches.filter((match) => match.category === category).length;
  return {
    trialId: reference.trialId,
    expectedEventType: reference.expectedEventType,
    matches,
    counts: {
      matched: count(AlignmentCategory.MATCHED),
      missed: count(AlignmentCategory.MISSED),
      extraDetections: count(AlignmentCategory.EXTRA_DETECTION),
      falsePositives: 0,
      ambiguous: count(AlignmentCategory.AMBIGUOUS),
    },
  };
}
