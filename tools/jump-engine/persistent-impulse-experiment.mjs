import { pathToFileURL } from "node:url";
import { SustainedSegmentationExperiment } from "./sustained-segmentation-experiment.mjs";
import { measureImpulseDuration } from "./impulse-duration-audit.mjs";
import { CandidateStatus } from "./model.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

export const PersistenceReason = Object.freeze({
  INSUFFICIENT_OBSERVED_IMPULSE_SPAN: "INSUFFICIENT_OBSERVED_IMPULSE_SPAN",
});

// Frozen tuning hypothesis: observed positive spans >=40 ms, constructed
// adversarial spans 0..20 ms. Not a calibrated physical duration or probability.
export class PersistentImpulseExperiment extends SustainedSegmentationExperiment {
  constructor(options) {
    super(options);
    this.config = Object.freeze({
      ...this.config,
      algorithmVersion: "experimental-persistent-impulse-offline-v1",
    });
  }

  finish(status, time) {
    if (status === CandidateStatus.CONFIRMED) {
      // Evaluate before immutable finalization and normal counter updates.
      // Scan only the existing bounded active window, not session history.
      const support = measureImpulseDuration(
        {
          takeoffCandidateMilliseconds: this.active.takeoffTime,
          evidence: {
            takeoffEvidence: {
              candidateToFlightMilliseconds:
                this.active.takeoffTime - this.active.candidateStartTime,
            },
          },
          researchWindow: this.active.window,
        },
        this.config.minimumTakeoffPeakMps2,
      );
      if (
        !support?.startCovered ||
        support.maximumObservedSpanMilliseconds < 40
      ) {
        status = CandidateStatus.REJECTED;
        if (this.active.reasons.length >= this.config.notableFlagLimit)
          this.active.reasons.pop();
        this.active.reasons.push(
          PersistenceReason.INSUFFICIENT_OBSERVED_IMPULSE_SPAN,
        );
      }
    }
    return super.finish(status, time);
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
        PersistentImpulseExperiment,
      ),
      null,
      2,
    ),
  );
}
