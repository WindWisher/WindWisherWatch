// Offline reasoning aid, not a classifier. Applies only to these monotonic
// guards: higher peak/durations and lower flight minimum are accepted more easily.
export function jointGuardEvidence(snapshot, landingStable, config) {
  if (!snapshot) return null;
  const values = [
    snapshot.takeoffPeakAccelMps2,
    snapshot.flightMinimumAccelMps2,
    snapshot.flightDurationMilliseconds,
    snapshot.sustainedLowGMilliseconds,
  ];
  if (values.some((v) => !Number.isFinite(v)))
    throw new Error("Incomplete snapshot");
  return {
    takeoff: values[0],
    lowG: values[1],
    flight: values[2],
    sustained: values[3],
    landingStable: landingStable === true,
    margins: {
      takeoffMps2: values[0] - config.minimumTakeoffPeakMps2,
      lowGMps2: config.maximumJumpEnvelopeFlightMinimumMps2 - values[1],
      flightMilliseconds: values[2] - config.minimumFlightMilliseconds,
      sustainedMilliseconds:
        values[3] - config.minimumSustainedLowGMilliseconds,
    },
  };
}

export function dominatesMonotonicGuards(a, b) {
  if (!a || !b) return false;
  return (
    a.takeoff >= b.takeoff &&
    a.lowG <= b.lowG &&
    a.flight >= b.flight &&
    a.sustained >= b.sustained &&
    (a.landingStable || !b.landingStable)
  );
}
