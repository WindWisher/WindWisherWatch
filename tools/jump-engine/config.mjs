const base = Object.freeze({
  algorithmVersion: "experimental-0.1-medium",
  profile: "MEDIUM",
  sampleRateHz: 25,
  gravityMps2: 9.80665,
  smoothingSamples: 3,
  takeoffImpulseMps2: 14,
  lowGEnterMps2: 6.5,
  groundedMinimumMps2: 7,
  groundedMaximumMps2: 13,
  landingImpulseMps2: 15,
  takeoffToLowGMaximumMilliseconds: 360,
  minimumFlightMilliseconds: 240,
  maximumFlightMilliseconds: 3000,
  landingStabilizationMilliseconds: 160,
  sampleGapMultiplier: 3,
  suspiciousGyroDegreesPerSecond: 1200,
  invalidGyroDegreesPerSecond: 3000,
  rollingWindowSeconds: 3,
  postEventSeconds: 1,
  retainedCandidateLimit: 8,
  notableFlagLimit: 12,
});

export const ExperimentalProfiles = Object.freeze({
  MEDIUM: base,
  HIGH: Object.freeze({
    ...base,
    algorithmVersion: "experimental-0.1-high",
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
