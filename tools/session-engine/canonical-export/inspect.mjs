import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { parseCanonicalStream } from "./parser.mjs";

const file = process.argv[2];

export function publicInspection(result) {
  return {
    sessionId: result.sessionId,
    completion: result.completionStatus,
    durationMilliseconds: result.timing.elapsedDurationMilliseconds,
    trackCount: result.recordCounts.track,
    hrCount: result.recordCounts.heartRate,
    pressureCount: result.recordCounts.pressure,
    qualitySummaryCount: result.recordCounts.quality,
    checksumStatus: result.checksumStatus,
    schemaVersion: result.schemaVersion,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  !file
) {
  console.error("Usage: node inspect.mjs <canonical-session.ndjson>");
  process.exitCode = 2;
} else if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const result = await parseCanonicalStream(fs.createReadStream(file));
    console.log(JSON.stringify(publicInspection(result), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
