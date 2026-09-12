import { pathToFileURL } from "node:url";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { ExperimentalJumpEngine } from "./engine.mjs";

// Hypothetical algebraic perturbations, not reconstructed physical motion.
export const STRUCTURED_VARIANTS = Object.freeze([
  "control",
  "fixed-rotation",
  "varying-rotation",
  "pulses-320-4",
  "pulses-320-8",
  "pulses-640-4",
  "pulses-640-8",
]);

export function structuredSample(sample, variant) {
  if (
    !STRUCTURED_VARIANTS.includes(variant) ||
    !Number.isFinite(sample.rawSampleTimestamp) ||
    sample.rawSampleTimestamp < 0 ||
    ["x", "y", "z"].some((axis) => !Number.isFinite(sample.accel?.[axis]))
  )
    throw new Error("Invalid structured stress input");
  const result = structuredClone(sample);
  const t = sample.rawSampleTimestamp;
  if (variant.endsWith("rotation")) {
    const angle =
      variant === "fixed-rotation"
        ? Math.PI / 3
        : (Math.PI / 2) * Math.sin((2 * Math.PI * t) / 800);
    const { x, y } = sample.accel;
    result.accel.x = x * Math.cos(angle) - y * Math.sin(angle);
    result.accel.y = x * Math.sin(angle) + y * Math.cos(angle);
  } else if (variant.startsWith("pulses-")) {
    const [, period, amplitude] = variant.split("-").map(Number);
    // Half-open 80-ms pulses, elapsed native fixture time, not sample count.
    if (t % period < 80) result.accel.x += amplitude;
  }
  return result;
}

export function runStructuredStress(catalog) {
  const rows = [];
  for (const id of [
    "no-motion",
    "walking-like",
    "brisk-walking-false-positive-envelope-v1",
    "clean-synthetic-jump",
    "j4-three-separated-controlled-hop-structure",
  ])
    for (const profile of ["MEDIUM", "HIGH"])
      for (const peak of [3000, 2600]) {
        const generated = generateScenario(catalog, id, profile);
        for (const variant of STRUCTURED_VARIANTS) {
          const engine = new ExperimentalJumpEngine({
            sessionId: "structured-stress",
            profile,
            config: {
              takeoffPeakThresholdMillig: peak,
              minimumTakeoffPeakMps2: peak * 0.00980665,
            },
          });
          for (const sample of generated.samples) {
            const transformed = structuredSample(sample, variant);
            // Rotated acceleration is not paired with invented gyro measurements.
            delete transformed.gyro;
            engine.process(transformed);
          }
          engine.endSession();
          rows.push({
            id,
            profile,
            peakMillig: peak,
            variant,
            baseExpected: generated.scenario.expectedConfirmed,
            confirmed: engine.totalConfirmedCandidates,
          });
        }
      }
  return {
    evidence: "SYNTHETIC_STRUCTURED_STRESS_ACCEL_ONLY_NOT_MARINE_VALIDATION",
    totalRuns: rows.length,
    rows,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("Fixed synthetic study accepts no arguments");
  console.log(
    JSON.stringify(
      runStructuredStress(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
      ),
      null,
      2,
    ),
  );
}
