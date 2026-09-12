import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { PersistentImpulseExperiment } from "./persistent-impulse-experiment.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";

// Reserved before outputs were inspected. Single frozen evaluation, not tuning.
export async function runPersistenceHoldout(catalog) {
  const changes = [];
  let pairedCases = 0;
  let boundViolations = 0;
  let baselineCountMismatches = 0;
  let experimentCountMismatches = 0;
  for (const { id } of catalog.scenarios)
    for (const profile of ["MEDIUM", "HIGH"])
      for (const period of [320, 640])
        for (const amplitude of [4, 8])
          for (const phase of [10, 30, 60, 100, 200, 300])
            for (const width of [60, 100]) {
              const { samples, scenario } = generateScenario(
                catalog,
                id,
                profile,
              );
              const pair = [
                ExperimentalJumpEngine,
                PersistentImpulseExperiment,
              ].map(
                (Engine) =>
                  new Engine({
                    sessionId: "frozen-persistence-holdout",
                    profile,
                  }),
              );
              for (const source of samples) {
                const sample = structuredClone(source);
                delete sample.gyro;
                if ((sample.rawSampleTimestamp + phase) % period < width)
                  sample.accel.x += amplitude;
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
              pairedCases++;
              const [baseline, experiment] = pair.map(
                (e) => e.totalConfirmedCandidates,
              );
              if (baseline !== scenario.expectedConfirmed)
                baselineCountMismatches++;
              if (experiment !== scenario.expectedConfirmed)
                experimentCountMismatches++;
              if (baseline !== experiment)
                changes.push({
                  id,
                  profile,
                  period,
                  amplitude,
                  phase,
                  width,
                  baseExpected: scenario.expectedConfirmed,
                  baseline,
                  experiment,
                });
            }
  const sourceHashes = {};
  for (const name of [
    "engine.mjs",
    "config.mjs",
    "features.mjs",
    "model.mjs",
    "timestamp-normalizer.mjs",
    "locomotion-context.mjs",
    "ring-buffer.mjs",
    "ground-segmentation-experiment.mjs",
    "sustained-segmentation-experiment.mjs",
    "persistent-impulse-experiment.mjs",
    "impulse-duration-audit.mjs",
    "fixtures.mjs",
    "persistence-holdout.mjs",
  ])
    sourceHashes[name] = createHash("sha256")
      .update(await readFile(new URL(name, import.meta.url)))
      .digest("hex");
  sourceHashes["synthetic-scenarios.json"] = createHash("sha256")
    .update(await readFile("fixtures/jump-engine/synthetic-scenarios.json"))
    .digest("hex");
  const regressions = changes.filter((row) =>
    row.baseExpected === 0
      ? row.experiment > row.baseline
      : row.experiment < row.baseline,
  );
  return {
    evidence: "RESERVED_SYNTHETIC_HOLDOUT_NOT_MARINE_VALIDATION",
    algorithmVersion: "experimental-persistent-impulse-offline-v1",
    sourceHashes,
    pairedCases,
    engineReplays: pairedCases * 2,
    boundViolations,
    baselineCountMismatches,
    experimentCountMismatches,
    countNonRegressionGate: regressions.length === 0 ? "PASS" : "FAIL",
    regressions,
    changes,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("Frozen holdout accepts no arguments");
  console.log(
    JSON.stringify(
      await runPersistenceHoldout(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
      ),
      null,
      2,
    ),
  );
}
