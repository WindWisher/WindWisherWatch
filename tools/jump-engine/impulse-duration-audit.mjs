import { pathToFileURL } from "node:url";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { SustainedSegmentationExperiment } from "./sustained-segmentation-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

// Observed span, not reconstructed physical impulse duration. No interpolation
// across missing/flagged samples; no last-sample interval is manufactured.
export function measureImpulseDuration(candidate, threshold) {
  if (!Number.isFinite(threshold) || threshold <= 0)
    throw new Error("Invalid threshold");
  const end = candidate.takeoffCandidateMilliseconds;
  const duration =
    candidate.evidence?.takeoffEvidence?.candidateToFlightMilliseconds;
  if (!Number.isFinite(end) || !Number.isFinite(duration) || duration < 0)
    return null;
  const start = end - duration;
  let firstHigh = null;
  let previousTime = null;
  let maximumObservedSpanMilliseconds = 0;
  let highSamples = 0;
  let phaseSamples = 0;
  let degradedSamples = 0;
  let firstPhaseTime = null;
  for (const observation of candidate.researchWindow ?? []) {
    const time = observation.timestamp.normalizedTimestamp;
    if (time < start || time >= end) continue;
    phaseSamples++;
    firstPhaseTime ??= time;
    const valid =
      Number.isFinite(time) &&
      Number.isFinite(observation.accelMagnitude) &&
      (previousTime === null || time > previousTime) &&
      observation.timestamp.qualityFlags.length === 0;
    previousTime = time;
    if (!valid) {
      firstHigh = null;
      degradedSamples++;
      continue;
    }
    if (observation.accelMagnitude < threshold) {
      firstHigh = null;
      continue;
    }
    highSamples++;
    firstHigh ??= time;
    maximumObservedSpanMilliseconds = Math.max(
      maximumObservedSpanMilliseconds,
      time - firstHigh,
    );
  }
  return {
    phaseStartMilliseconds: start,
    phaseEndMilliseconds: end,
    maximumObservedSpanMilliseconds,
    highSamples,
    phaseSamples,
    degradedSamples,
    startCovered: firstPhaseTime === start,
  };
}

export function auditImpulseDuration(catalog) {
  const rows = [];
  const comparison = compareTimeoutReseed(
    catalog,
    SustainedSegmentationExperiment,
    ([baseline, experiment], context) => {
      // Inspect all tuning candidates with a flight phase, not only confirmations.
      for (const [kind, engine] of [
        ["baseline", baseline],
        ["sustained", experiment],
      ])
        for (const candidate of engine.candidates) {
          const support = measureImpulseDuration(
            candidate,
            engine.config.minimumTakeoffPeakMps2,
          );
          if (support)
            rows.push({
              ...context,
              kind,
              sequence: candidate.candidateSequence,
              status: candidate.status,
              peak: candidate.featureSummary.takeoffPeakAccelMps2,
              ...support,
            });
        }
    },
  );
  return {
    evidence: "SYNTHETIC_IMPULSE_DURATION_OBSERVER_NOT_CLASSIFIER",
    pairedCases: comparison.pairedCases,
    rows,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("Fixed audit accepts no arguments");
  console.log(
    JSON.stringify(
      auditImpulseDuration(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
      ),
      null,
      2,
    ),
  );
}
