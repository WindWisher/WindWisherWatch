import { pathToFileURL } from "node:url";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { CandidateStatus, JumpState, ReasonCode } from "./model.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

// Separate offline hypothesis: terminate pre-flight impulses when raw acceleration
// returns to the existing grounded band. No new threshold or lifetime extension.
// This is NOT an inference that the rider is physically on the ground.
export class GroundSegmentationExperiment extends ExperimentalJumpEngine {
  constructor(options) {
    super({
      ...options,
      config: {
        ...options.config,
        algorithmVersion: "experimental-ground-segmentation-offline-v1",
      },
    });
    this.segmentedImpulses = 0;
  }

  shouldSegment(observation) {
    return (
      this.state === JumpState.POSSIBLE_TAKEOFF &&
      observation.accelMagnitude >= this.config.groundedMinimumMps2 &&
      observation.accelMagnitude <= this.config.groundedMaximumMps2
    );
  }

  advance(observation) {
    if (this.shouldSegment(observation)) {
      for (const reason of [ReasonCode.NO_FLIGHT_PHASE, ReasonCode.IMPACT_ONLY])
        if (
          !this.active.reasons.includes(reason) &&
          this.active.reasons.length < this.config.notableFlagLimit
        )
          this.active.reasons.push(reason);
      this.segmentedImpulses++;
      return this.finish(
        CandidateStatus.REJECTED,
        observation.timestamp.normalizedTimestamp,
      );
    }
    return super.advance(observation);
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
        GroundSegmentationExperiment,
      ),
      null,
      2,
    ),
  );
}
