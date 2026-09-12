import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { PeriodicBackgroundExperiment } from "./periodic-background-experiment.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";

// Frozen before evaluation: new periods/widths/phases, plus abrupt background
// cessation and half-cycle shift at 900 ms. No inference of physical ground truth.
export function backgroundOffset(time, { period, width, phase, mode }) {
  if (
    ![280, 480, 800].includes(period) ||
    ![60, 140].includes(width) ||
    ![35, 125].includes(phase) ||
    !["steady", "stop", "shift"].includes(mode) ||
    !Number.isFinite(time) ||
    time < 0
  )
    throw new Error("Invalid fixed holdout input");
  if (mode === "stop" && time >= 900) return 0;
  const shift = mode === "shift" && time >= 900 ? period / 2 : 0;
  return (time + phase + shift) % period < width ? 8 : 0;
}

export async function runBackgroundHoldout(catalog) {
  const changes = [];
  let pairedCases = 0,
    baselineMismatches = 0,
    experimentMismatches = 0,
    boundViolations = 0;
  for (const { id } of catalog.scenarios)
    for (const profile of ["MEDIUM", "HIGH"])
      for (const period of [280, 480, 800])
        for (const width of [60, 140])
          for (const phase of [35, 125])
            for (const mode of ["steady", "stop", "shift"]) {
              const variant = { period, width, phase, mode };
              const { samples, scenario } = generateScenario(
                catalog,
                id,
                profile,
              );
              const pair = [
                ExperimentalJumpEngine,
                PeriodicBackgroundExperiment,
              ].map(
                (Engine) =>
                  new Engine({
                    sessionId: "background-frozen-holdout",
                    profile,
                  }),
              );
              for (const source of samples) {
                const sample = structuredClone(source);
                delete sample.gyro;
                sample.accel.x += backgroundOffset(
                  sample.rawSampleTimestamp,
                  variant,
                );
                for (const engine of pair) engine.process(sample);
              }
              for (const engine of pair) {
                engine.endSession();
                const { bounds, processedSamples } = engine.summary();
                if (
                  processedSamples !== samples.length ||
                  bounds.retainedCandidates > bounds.retainedCandidateLimit ||
                  bounds.maxActiveSamples > bounds.activeWindowCapacity ||
                  bounds.rollingUsed > bounds.rollingCapacity ||
                  (engine.backgroundPulses?.length ?? 0) > 3
                )
                  boundViolations++;
              }
              pairedCases++;
              const [baseline, experiment] = pair.map(
                (e) => e.totalConfirmedCandidates,
              );
              if (baseline !== scenario.expectedConfirmed) baselineMismatches++;
              if (experiment !== scenario.expectedConfirmed)
                experimentMismatches++;
              if (baseline !== experiment)
                changes.push({
                  id,
                  profile,
                  ...variant,
                  baseExpected: scenario.expectedConfirmed,
                  baseline,
                  experiment,
                  corrections: pair[1].backgroundCorrections,
                });
            }
  const sourceHashes = {};
  for (const name of [
    "engine.mjs",
    "config.mjs",
    "model.mjs",
    "features.mjs",
    "fixtures.mjs",
    "timestamp-normalizer.mjs",
    "locomotion-context.mjs",
    "ring-buffer.mjs",
    "ground-segmentation-experiment.mjs",
    "sustained-segmentation-experiment.mjs",
    "periodic-background-experiment.mjs",
    "periodic-background-holdout.mjs",
  ])
    sourceHashes[name] = createHash("sha256")
      .update(await readFile(new URL(name, import.meta.url)))
      .digest("hex");
  sourceHashes.catalog = createHash("sha256")
    .update(JSON.stringify(catalog))
    .digest("hex");
  const regressions = changes.filter((row) =>
    row.baseExpected === 0
      ? row.experiment > row.baseline
      : row.experiment < row.baseline,
  );
  return {
    evidence: "FROZEN_NONSTATIONARY_SYNTHETIC_HOLDOUT_NOT_MARINE_VALIDATION",
    sourceHashes,
    pairedCases,
    engineReplays: pairedCases * 2,
    boundViolations,
    baselineMismatches,
    experimentMismatches,
    countNonRegressionGate: regressions.length ? "FAIL" : "PASS",
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
      await runBackgroundHoldout(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
      ),
      null,
      2,
    ),
  );
}
