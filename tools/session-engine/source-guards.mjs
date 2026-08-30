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

console.log(
  `Session Engine source guards passed: ${required.length} artifacts; bounds, permissions and scope verified.`,
);
