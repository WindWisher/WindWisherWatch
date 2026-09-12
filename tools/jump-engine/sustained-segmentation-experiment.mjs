import { pathToFileURL } from "node:url";
import { GroundSegmentationExperiment } from "./ground-segmentation-experiment.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

// Offline phase-persistence hypothesis. The existing 160-ms stabilization guard
// is reused as a provisional research duration, not a validated sport parameter.
export class SustainedSegmentationExperiment extends GroundSegmentationExperiment {
  constructor(options) {
    super(options);
    this.config = Object.freeze({
      ...this.config,
      algorithmVersion: "experimental-sustained-segmentation-offline-v1",
    });
    this.groundedSince = null;
    this.groundedCandidateSequence = null;
  }

  shouldSegment(observation) {
    const candidateSequence = this.active?.candidateSequence ?? null;
    if (candidateSequence !== this.groundedCandidateSequence) {
      this.groundedCandidateSequence = candidateSequence;
      this.groundedSince = null;
    }
    if (
      !super.shouldSegment(observation) ||
      observation.timestamp.qualityFlags.length > 0
    ) {
      this.groundedSince = null;
      return false;
    }
    const time = observation.timestamp.normalizedTimestamp;
    this.groundedSince ??= time;
    return (
      time - this.groundedSince >= this.config.landingStabilizationMilliseconds
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("Fixed study accepts no arguments");
  console.log(
    JSON.stringify(
      compareTimeoutReseed(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
        SustainedSegmentationExperiment,
      ),
      null,
      2,
    ),
  );
}
