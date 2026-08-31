import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const sourceDirectory = path.join(root, "tools/jump-engine");
const required = [
  "config.mjs",
  "engine.mjs",
  "features.mjs",
  "fixtures.mjs",
  "garmin-capture.mjs",
  "inspect.mjs",
  "inspect-garmin.mjs",
  "model.mjs",
  "replay.mjs",
  "ring-buffer.mjs",
  "timestamp-normalizer.mjs",
];
const source = (
  await Promise.all(
    required.map(async (name) => {
      const value = await fs.readFile(path.join(sourceDirectory, name), "utf8");
      return value;
    }),
  )
).join("\n");

for (const forbidden of [
  "Supabase",
  "fetch(",
  "makeWebRequest",
  "process.env",
  "JumpEvent",
  "heightMeters",
  "horizontalDistanceMeters",
  "bigAirScore",
])
  if (source.includes(forbidden))
    throw new Error(
      `Experimental Jump Engine contains forbidden symbol: ${forbidden}`,
    );

for (const requiredMarker of [
  "FixedRingBuffer",
  "retainedCandidateLimit",
  "activeWindowCapacity",
  "experimental-0.2-discrimination",
  "GYRO_OUTLIER",
  "TIMESTAMP_DEGRADED",
  "ARM_MOTION_PATTERN",
])
  if (!source.includes(requiredMarker))
    throw new Error(
      `Experimental Jump Engine lacks bound/quality marker: ${requiredMarker}`,
    );

const canonicalSource = await fs.readFile(
  path.join(root, "contracts/session/v1/canonical-session-record.schema.json"),
  "utf8",
);
if (/experimentalJump|jumpCandidate|jumpAlgorithm/.test(canonicalSource))
  throw new Error("M5 research output leaked into Canonical Session v1");

console.log(
  `Jump Engine source guards passed: ${required.length} experimental modules; scope, bounds and canonical isolation verified.`,
);
