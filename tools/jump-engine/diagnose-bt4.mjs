import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseLatestGarminResearchCapture } from "./garmin-capture.mjs";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { referenceWindows } from "./operator-reference.mjs";

export function diagnoseBT4(capture) {
  if (
    capture.manifest.researchSchemaVersion !== "1.3.0" ||
    !capture.samples.length
  )
    throw new Error("Full diagnostic raw capture required");
  const engine = new ExperimentalJumpEngine({
    sessionId: "bt4-diagnostic",
    profile: "MEDIUM",
  });
  const timeline = [];
  let mismatches = 0;
  for (const sample of capture.samples) {
    const before = engine.state;
    const candidate = engine.process({
      sequence: sample.sequence,
      rawSampleTimestamp: sample.rawSampleTimestamp,
      callbackTimestamp: sample.callbackTimestamp,
      accel: {
        x: sample.accelMillig[0] * 0.00980665,
        y: sample.accelMillig[1] * 0.00980665,
        z: sample.accelMillig[2] * 0.00980665,
      },
    });
    const time = engine.normalizer.previousNormalized;
    if (time !== sample.normalizedTimestamp)
      throw new Error("Host/Garmin normalized timeline differs");
    if (engine.state !== sample.garminState) mismatches++;
    timeline.push({
      sequence: sample.sequence,
      time,
      callback: sample.callbackTimestamp,
      magnitudeMillig: Math.hypot(...sample.accelMillig),
      garminState: sample.garminState,
      garminLandingStable: sample.garminLandingStable,
      hostState: engine.state,
      hostTransition: before === engine.state ? null : [before, engine.state],
      hostDecision: candidate?.status ?? null,
    });
  }
  engine.endSession();
  const host = engine.candidates.map((c) => ({
    status: c.status,
    takeoff: c.takeoffCandidateMilliseconds,
    landing: c.landingCandidateMilliseconds,
    end: c.endMilliseconds,
    features: c.featureSummary,
  }));
  const garmin = capture.summary.detector.candidateTraces;
  const outcomesMatch =
    engine.totalConfirmedCandidates ===
      capture.summary.detector.confirmedCandidates &&
    engine.totalRejectedCandidates ===
      capture.summary.detector.rejectedCandidates;
  return {
    evidenceLevel: "RAW_HOST_REPLAY",
    protocolId: capture.manifest.protocolId,
    referenceWindows:
      capture.summary.operatorReference.expectedEventType ===
      "OPERATOR_COUNT_ONLY"
        ? []
        : referenceWindows(capture.summary.operatorReference),
    referenceMode:
      capture.summary.operatorReference.expectedEventType ===
      "OPERATOR_COUNT_ONLY"
        ? "COUNT_ONLY_NO_TEMPORAL_ALIGNMENT"
        : "OPERATOR_REFERENCE",
    sampleCount: timeline.length,
    stateMismatchSamples: mismatches,
    outcomeCountsMatch: outcomesMatch,
    // Retention policies and Float32 arithmetic can differ; never infer full parity solely from counts.
    diagnosticParity: mismatches || !outcomesMatch ? "DIVERGED" : "PARTIAL",
    diagnosticResult: "INCONCLUSIVE",
    hostCandidates: host,
    garminCandidates: garmin,
    callbackStatistics: capture.summary.callbackStatistics,
    timeline,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const files = process.argv.slice(2);
  if (
    !files.length ||
    files.length > 2 ||
    files.some((f) => !f.startsWith("/tmp/"))
  )
    throw new Error("Provide one or two /tmp capture files, BAK before TXT");
  const capture = await parseLatestGarminResearchCapture(
    (await Promise.all(files.map((f) => fs.readFile(f, "utf8")))).join(""),
  );
  console.log(JSON.stringify(diagnoseBT4(capture), null, 2));
}
