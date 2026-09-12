import { pathToFileURL } from "node:url";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { JumpState } from "./model.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { perturbAcceleration } from "./noise-stress.mjs";

// Offline hypothesis only. Not selected by the normal replay or Garmin paths.
export class TimeoutReseedExperiment extends ExperimentalJumpEngine {
  constructor(options) {
    super({
      ...options,
      config: {
        ...options.config,
        algorithmVersion: "experimental-timeout-reseed-offline-v1",
      },
    });
    this.reseedCount = 0;
  }

  advance(observation) {
    const expiredImpulse =
      this.state === JumpState.POSSIBLE_TAKEOFF &&
      observation.timestamp.normalizedTimestamp -
        this.active.candidateStartTime >
        this.config.maximumTakeoffCandidateMilliseconds &&
      observation.accelMagnitude >= this.config.takeoffImpulseMps2;
    const finalized = super.advance(observation);
    if (expiredImpulse && finalized && this.state === JumpState.GROUND) {
      // Exactly one GROUND evaluation: no recursive dispatch, normalization,
      // smoother update, rolling-buffer insertion or locomotion observation.
      super.advance(observation);
      this.reseedCount += 1;
    }
    return finalized;
  }
}

export function compareTimeoutReseed(
  catalog,
  Experiment = TimeoutReseedExperiment,
  inspectPair = null,
) {
  const changes = [];
  let runs = 0;
  let boundViolations = 0;
  let cleanMismatches = 0;
  for (const item of catalog.scenarios)
    for (const profile of ["MEDIUM", "HIGH"]) {
      const { samples, scenario } = generateScenario(catalog, item.id, profile);
      const variants = [{ name: "control", samples }];
      for (const amplitude of [0.5, 1, 2])
        for (const seed of [1, 7, 19])
          variants.push({
            name: `noise-${amplitude}-${seed}`,
            samples: perturbAcceleration(samples, amplitude, seed),
          });
      for (const period of [320, 640])
        for (const amplitude of [4, 8])
          for (const phase of [0, 20, 40, 80, 160, 240])
            variants.push({
              name: `pulse-${period}-${amplitude}-phase-${phase}`,
              samples: samples.map((sample) => {
                const result = structuredClone(sample);
                if ((sample.rawSampleTimestamp + phase) % period < 80)
                  result.accel.x += amplitude;
                return result;
              }),
            });
      for (const variant of variants) {
        const pair = [ExperimentalJumpEngine, Experiment].map(
          (Engine) => new Engine({ sessionId: "reseed-study", profile }),
        );
        for (const source of variant.samples) {
          const sample = structuredClone(source);
          delete sample.gyro;
          for (const engine of pair) engine.process(sample);
        }
        for (const engine of pair) {
          engine.endSession();
          const { bounds, processedSamples } = engine.summary();
          if (
            processedSamples !== samples.length ||
            bounds.retainedCandidates > bounds.retainedCandidateLimit ||
            bounds.maxActiveSamples > bounds.activeWindowCapacity ||
            bounds.rollingUsed > bounds.rollingCapacity
          )
            boundViolations++;
        }
        runs++;
        const [baseline, experiment] = pair.map(
          (e) => e.totalConfirmedCandidates,
        );
        if (inspectPair)
          inspectPair(pair, {
            id: item.id,
            profile,
            variant: variant.name,
            baseExpected: scenario.expectedConfirmed,
          });
        if (
          variant.name === "control" &&
          experiment !== scenario.expectedConfirmed
        )
          cleanMismatches++;
        if (baseline !== experiment)
          changes.push({
            id: item.id,
            profile,
            variant: variant.name,
            baseExpected: scenario.expectedConfirmed,
            baseline,
            experiment,
          });
      }
    }
  return {
    evidence: "OFFLINE_COUNTERFACTUAL_NOT_MARINE_VALIDATION",
    pairedCases: runs,
    engineReplays: runs * 2,
    cleanMismatches,
    boundViolations,
    changes,
  };
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
      ),
      null,
      2,
    ),
  );
}
