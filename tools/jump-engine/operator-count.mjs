// Preliminary trial counts, never temporal matching or airtime validation.
export function assessOperatorCount({
  observedHops,
  confirmedDetections,
  captureVerified,
  operatorConfirmsCoverage,
  protocolDeviation,
}) {
  if (
    !Number.isInteger(observedHops) ||
    observedHops < 0 ||
    !Number.isInteger(confirmedDetections) ||
    confirmedDetections < 0
  )
    throw new Error(
      "Explicit nonnegative operator and detector counts required",
    );
  if (
    captureVerified !== true ||
    operatorConfirmsCoverage !== true ||
    protocolDeviation !== false
  )
    return {
      status: "INCONCLUSIVE_REFERENCE_OR_CAPTURE",
      eventMatching: "NOT_ESTABLISHED",
    };
  const status =
    observedHops === 0
      ? confirmedDetections === 0
        ? "NEGATIVE_TRIAL_NO_DETECTION"
        : "NEGATIVE_TRIAL_FALSE_DETECTION"
      : confirmedDetections === 0
        ? "NO_DETECTION_FOR_REPORTED_HOPS"
        : confirmedDetections === observedHops
          ? "COUNT_COMPATIBLE_NOT_EVENT_MATCHED"
          : "COUNT_MISMATCH_NOT_EVENT_MATCHED";
  return {
    status,
    eventMatching: "NOT_ESTABLISHED",
    observedHops,
    confirmedDetections,
  };
}
