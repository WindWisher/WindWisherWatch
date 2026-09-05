import { performance } from "node:perf_hooks";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";

export function safeCandidate(candidate) {
  return {
    candidateId: candidate.candidateId,
    status: candidate.status,
    takeoffCandidateMilliseconds: candidate.takeoffCandidateMilliseconds,
    landingCandidateMilliseconds: candidate.landingCandidateMilliseconds,
    experimentalAirtimeMilliseconds: candidate.experimentalAirtimeMilliseconds,
    confidence: candidate.confidence,
    qualityFlags: candidate.qualityFlags,
    reasonCodes: candidate.reasonCodes,
    evidence: candidate.evidence,
    featureSummary: candidate.featureSummary,
    jumpAlgorithmVersion: candidate.jumpAlgorithmVersion,
  };
}

export function replaySamples(samples, { sessionId, profile = "MEDIUM" }) {
  const engine = new ExperimentalJumpEngine({ sessionId, profile });
  const started = performance.now();
  for (const sample of samples) engine.process(sample);
  engine.endSession();
  const elapsedMilliseconds = performance.now() - started;
  return {
    researchStatus: "EXPERIMENTAL",
    candidates: engine.candidates.map(safeCandidate),
    engine: engine.summary(),
    performance: {
      replayMilliseconds: elapsedMilliseconds,
      processingMicrosecondsPerSample:
        samples.length === 0
          ? 0
          : (elapsedMilliseconds * 1000) / samples.length,
    },
  };
}

export async function replayScenario(
  catalogPath,
  scenarioId,
  profile = "MEDIUM",
) {
  const catalog = await loadScenarioCatalog(catalogPath);
  const generated = generateScenario(catalog, scenarioId, profile);
  return replaySamples(generated.samples, {
    sessionId: `synthetic-${scenarioId}`,
    profile,
  });
}
