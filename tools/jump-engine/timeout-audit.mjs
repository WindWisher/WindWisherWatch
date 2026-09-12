import { pathToFileURL } from "node:url";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { structuredSample } from "./structured-stress.mjs";

// Fixed synthetic diagnosis. Observes the unmodified engine; never reprocesses a sample.
export function auditTimeoutBoundary(catalog) {
  const rows = [];
  for (const id of [
    "clean-synthetic-jump",
    "j4-three-separated-controlled-hop-structure",
  ])
    for (const profile of ["MEDIUM", "HIGH"])
      for (const smoothingSamples of [1, 3]) {
        const engine = new ExperimentalJumpEngine({
          sessionId: "timeout-audit",
          profile,
          config: { smoothingSamples },
        });
        const transitions = [];
        const boundary = [];
        const { samples } = generateScenario(catalog, id, profile);
        for (const sample of samples) {
          const input = structuredSample(sample, "pulses-320-8");
          delete input.gyro;
          const before = engine.state;
          const candidateStart = engine.active?.candidateStartTime ?? null;
          const result = engine.process(input);
          const time = input.rawSampleTimestamp;
          const entry = {
            time,
            magnitude: Math.hypot(input.accel.x, input.accel.y, input.accel.z),
            before,
            after: engine.state,
            candidateStart,
            nextCandidateStart: engine.active?.candidateStartTime ?? null,
            finalized: result?.status ?? null,
          };
          if (before !== engine.state) transitions.push(entry);
          if (time >= 960 && time <= 1120) boundary.push(entry);
        }
        engine.endSession();
        rows.push({
          id,
          profile,
          smoothingSamples,
          confirmed: engine.totalConfirmedCandidates,
          processedSamples: engine.processedSamples,
          inputSamples: samples.length,
          boundary,
          transitions,
        });
      }
  return {
    evidence: "SYNTHETIC_TIMEOUT_DIAGNOSIS_NOT_HARDWARE_ROOT_CAUSE",
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
      auditTimeoutBoundary(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
      ),
      null,
      2,
    ),
  );
}
