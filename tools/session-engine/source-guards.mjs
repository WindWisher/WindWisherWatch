import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const project = path.join(root, "platforms/garmin/session-engine");
const required = [
  "manifest.xml",
  "monkey.jungle",
  "source/SessionEngine.mc",
  "source/GarminSessionStore.mc",
  "source/SeFrame.mc",
  "source/SeChecksum.mc",
  "source/SeClock.mc",
  "source/CoreMetricProjector.mc",
  "source/SessionPositionSource.mc",
  "source/SessionHealthSource.mc",
  "source/SessionDevApp.mc",
  "tests/SessionEngineTests.mc",
  "scripts/build.sh",
  "scripts/test.sh",
];

for (const relative of required) await fs.access(path.join(project, relative));

const sourceNames = (await fs.readdir(path.join(project, "source"))).filter(
  (name) => name.endsWith(".mc"),
);
const source = (
  await Promise.all(
    sourceNames.map((name) =>
      fs.readFile(path.join(project, "source", name), "utf8"),
    ),
  )
).join("\n");

for (const forbidden of [
  "JumpEngine",
  "jumpHeight",
  "airtime",
  "Supabase",
  "Communications.makeWebRequest",
  "ActivityRecording",
  "windSpeed",
  "gust",
  "FRAME_MOTION",
]) {
  if (source.includes(forbidden))
    throw new Error(
      `Garmin M2 source contains out-of-scope symbol: ${forbidden}`,
    );
}

for (const forbidden of [
  "averageSpeed",
  "p95",
  "activeTime",
  "VMG",
  "tack",
  "jibe",
])
  if (source.includes(forbidden))
    throw new Error(
      `Garmin M3 source contains post-session metric: ${forbidden}`,
    );

const manifest = await fs.readFile(path.join(project, "manifest.xml"), "utf8");
for (const permission of ["Positioning", "Sensor"])
  if (!manifest.includes(`id="${permission}"`))
    throw new Error(`M2 manifest is missing ${permission}`);
for (const permission of [
  "Communications",
  "Background",
  "SensorHistory",
  "FitContributor",
])
  if (manifest.includes(`id="${permission}"`))
    throw new Error(`M2 manifest has forbidden permission ${permission}`);

if (
  !source.includes("MAX_FRAMES_PER_CHUNK") ||
  !source.includes("MAX_PAYLOAD_CHARACTERS")
)
  throw new Error("M2 Garmin storage bounds are not explicit");
if (
  !source.includes("FRAME_SESSION_FINAL") ||
  !source.includes("FRAME_CHECKPOINT")
)
  throw new Error("M2 Garmin journal lacks checkpoint/final frame semantics");

const engineSource = await fs.readFile(
  path.join(project, "source/SessionEngine.mc"),
  "utf8",
);
const stopBody = engineSource.substring(
  engineSource.indexOf("function stop()"),
  engineSource.indexOf("function recoverFirst()"),
);
if (stopBody.includes("for (") || stopBody.includes("frames("))
  throw new Error("M3 stop complexity must remain bounded");
if (
  !source.includes("CoreMetricProjector") ||
  !source.includes("distanceMeters")
)
  throw new Error("M3 core metric projection is missing");
if (
  !source.includes('metadata["checkpointChunk"]') ||
  !source.includes('metadata["checkpointFrame"]')
)
  throw new Error("M3 Garmin recovery lacks a direct checkpoint pointer");

console.log(
  `Session Engine source guards passed: ${required.length} artifacts; M3 bounds, stop complexity, permissions and scope verified.`,
);
