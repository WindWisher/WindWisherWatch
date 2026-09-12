import { ExperimentalJumpEngine } from "./engine.mjs";
import { SustainedSegmentationExperiment } from "./sustained-segmentation-experiment.mjs";
import { PersistentImpulseExperiment } from "./persistent-impulse-experiment.mjs";
import { measureImpulseDuration } from "./impulse-duration-audit.mjs";
import { captureReplayEligibility } from "./capture-replay-eligibility.mjs";

// Caller supplies a locally parsed capture. No file discovery, network, GPS/HR,
// raw sample output or inferred physical event labels.
export function compareArchivedCapture(capture, AdditionalExperiment = null) {
  if (
    capture.manifest.researchSchemaVersion !== "1.3.0" ||
    capture.manifest.sensorProfile !== "MEDIUM" ||
    !capture.samples.length ||
    capture.samples.length > 225
  )
    throw new Error("Parsed bounded MEDIUM diagnostic capture required");
  if (captureReplayEligibility(capture).status !== "ELIGIBLE_COVERAGE_ONLY")
    throw new Error("Full-session coverage is missing or unverified");
  const rows = [];
  for (const Engine of [
    ExperimentalJumpEngine,
    SustainedSegmentationExperiment,
    PersistentImpulseExperiment,
    ...(AdditionalExperiment ? [AdditionalExperiment] : []),
  ]) {
    const engine = new Engine({
      sessionId: "private-local-regression",
      profile: "MEDIUM",
    });
    for (const sample of capture.samples)
      engine.process({
        sequence: sample.sequence,
        rawSampleTimestamp: sample.rawSampleTimestamp,
        callbackTimestamp: sample.callbackTimestamp,
        accel: {
          x: sample.accelMillig[0] * 0.00980665,
          y: sample.accelMillig[1] * 0.00980665,
          z: sample.accelMillig[2] * 0.00980665,
        },
      });
    engine.endSession();
    rows.push({
      algorithmVersion: engine.config.algorithmVersion,
      confirmed: engine.totalConfirmedCandidates,
      rejected: engine.totalRejectedCandidates,
      processedSamples: engine.processedSamples,
      phaseEvidence: engine.candidates
        .filter((candidate) => candidate.takeoffCandidateMilliseconds !== null)
        .map((candidate) => ({
          sequence: candidate.candidateSequence,
          status: candidate.status,
          reasons: candidate.reasonCodes,
          observedPeakSpanMilliseconds:
            measureImpulseDuration(
              candidate,
              engine.config.minimumTakeoffPeakMps2,
            )?.maximumObservedSpanMilliseconds ?? null,
          takeoffPeakMps2: candidate.featureSummary.takeoffPeakAccelMps2,
          landingPeakMps2: candidate.featureSummary.landingPeakAccelMps2,
        })),
    });
  }
  return {
    evidence: "LOCAL_CAPTURE_COUNTERFACTUAL_NOT_EVENT_MATCHED",
    sampleCount: capture.samples.length,
    rows,
  };
}
