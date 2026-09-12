import { pathToFileURL } from "node:url";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { ExperimentalJumpEngine } from "./engine.mjs";

export function perturbAcceleration(samples, amplitude, seed) {
  if (
    !Array.isArray(samples) ||
    samples.length > 10000 ||
    !Number.isFinite(amplitude) ||
    amplitude < 0 ||
    amplitude > 2 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  )
    throw new Error("Invalid bounded stress input");
  let state = seed;
  return samples.map((sample) => {
    const result = structuredClone(sample);
    for (const axis of ["x", "y", "z"]) {
      if (!Number.isFinite(sample.accel?.[axis]))
        throw new Error("Invalid acceleration");
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      result.accel[axis] += amplitude * ((2 * state) / 4294967296 - 1);
    }
    return result;
  });
}

const ids = [
  "no-motion",
  "walking-like",
  "periodic-brisk-walking-context",
  "arm-swing",
  "holdout-double-impact-no-flight",
  "brisk-walking-false-positive-envelope-v1",
  "clean-synthetic-jump",
  "noisy-synthetic-jump",
  "walking-jump-walking-context",
  "j4-three-separated-controlled-hop-structure",
];

// Fixed exploration matrix, not a search for a passing threshold or marine model.
export function runNoiseStress(catalog) {
  const groups = [];
  for (const peak of [3000, 2600])
    for (const amplitude of [0, 0.5, 1, 2]) {
      const group = {
        peakMillig: peak,
        amplitudeMps2PerAxis: amplitude,
        runs: 0,
        mismatches: [],
      };
      for (const profile of ["MEDIUM", "HIGH"])
        for (const id of ids)
          for (const seed of [1, 7, 19]) {
            const generated = generateScenario(catalog, id, profile);
            const engine = new ExperimentalJumpEngine({
              sessionId: "synthetic-stress",
              profile,
              config: {
                takeoffPeakThresholdMillig: peak,
                minimumTakeoffPeakMps2: peak * 0.00980665,
              },
            });
            for (const sample of perturbAcceleration(
              generated.samples,
              amplitude,
              seed,
            ))
              engine.process(sample);
            engine.endSession();
            group.runs++;
            if (
              engine.totalConfirmedCandidates !==
              generated.scenario.expectedConfirmed
            )
              group.mismatches.push({
                id,
                profile,
                seed,
                expected: generated.scenario.expectedConfirmed,
                observed: engine.totalConfirmedCandidates,
              });
          }
      groups.push(group);
    }
  return {
    evidence: "SYNTHETIC_ADDITIVE_STRESS_NOT_KITESURF_VALIDATION",
    totalRuns: 480,
    groups,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("No input captures or overrides accepted");
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  console.log(JSON.stringify(runNoiseStress(catalog), null, 2));
}
