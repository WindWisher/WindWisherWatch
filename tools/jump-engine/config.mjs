const GRAVITY_METERS_PER_SECOND_SQUARED = 9.80665;
const TAKEOFF_PEAK_THRESHOLD_MILLIG = 3000;
const MILLIG_TO_METERS_PER_SECOND_SQUARED =
  GRAVITY_METERS_PER_SECOND_SQUARED / 1000;

const base = Object.freeze({
  algorithmVersion: "experimental-0.5-phase-scoped-envelope",
  profile: "MEDIUM",
  sampleRateHz: 25,
  gravityMps2: GRAVITY_METERS_PER_SECOND_SQUARED,
  smoothingSamples: 3,
  takeoffImpulseMps2: 14,
  lowGEnterMps2: 6.5,
  groundedMinimumMps2: 7,
  groundedMaximumMps2: 13,
  landingImpulseMps2: 15,
  takeoffPeakThresholdMillig: TAKEOFF_PEAK_THRESHOLD_MILLIG,
  minimumTakeoffPeakMps2:
    TAKEOFF_PEAK_THRESHOLD_MILLIG * MILLIG_TO_METERS_PER_SECOND_SQUARED,
  maximumJumpEnvelopeFlightMinimumMps2: 4,
  minimumTakeoffLandingDirectionCosine: 0.9,
  takeoffToLowGMaximumMilliseconds: 360,
  maximumTakeoffCandidateMilliseconds: 1000,
  minimumFlightMilliseconds: 240,
  minimumSustainedLowGMilliseconds: 120,
  maximumFlightMilliseconds: 3000,
  landingStabilizationMilliseconds: 160,
  sampleGapMultiplier: 3,
  suspiciousGyroDegreesPerSecond: 1200,
  invalidGyroDegreesPerSecond: 3000,
  rollingWindowSeconds: 3,
  postEventSeconds: 1,
  retainedCandidateLimit: 8,
  notableFlagLimit: 12,
  locomotionImpactCapacity: 8,
  locomotionImpactEnterMps2: 14,
  locomotionImpactExitMps2: 11,
  locomotionImpactDebounceMilliseconds: 180,
  locomotionContextWindowMilliseconds: 3000,
});

export const ExperimentalProfiles = Object.freeze({
  MEDIUM: base,
  HIGH: Object.freeze({
    ...base,
    algorithmVersion: "experimental-0.5-phase-scoped-envelope",
    profile: "HIGH",
    sampleRateHz: 50,
    smoothingSamples: 5,
  }),
});

export function profileConfig(profile = "MEDIUM", overrides = {}) {
  const selected = ExperimentalProfiles[profile];
  if (!selected)
    throw new Error(`Unsupported experimental profile: ${profile}`);
  const config = { ...selected, ...overrides };
  if (!config.algorithmVersion.startsWith("experimental-"))
    throw new Error("Jump algorithm version must remain experimental");
  return Object.freeze(config);
}
