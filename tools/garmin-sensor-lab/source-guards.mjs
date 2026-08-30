import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const garmin = path.join(root, "platforms/garmin");
const required = [
  "manifest.xml",
  "monkey.jungle",
  "source/SensorLabApp.mc",
  "source/SensorLabView.mc",
  "source/SensorLabDelegate.mc",
  "source/LabController.mc",
  "source/DeviceProbe.mc",
  "source/PositionProbe.mc",
  "source/MotionProbe.mc",
  "source/HealthProbe.mc",
  "source/RuntimeProbe.mc",
  "source/StorageProbe.mc",
  "tests/LabCoreTests.mc",
  "scripts/build.sh",
  "scripts/test.sh",
];

for (const relative of required) await fs.access(path.join(garmin, relative));

const sourceFiles = (await fs.readdir(path.join(garmin, "source"))).filter(
  (name) => name.endsWith(".mc"),
);
const source = await Promise.all(
  sourceFiles.map((name) =>
    fs.readFile(path.join(garmin, "source", name), "utf8"),
  ),
);
const combined = source.join("\n");
for (const forbidden of [
  "SessionEngine",
  "JumpEngine",
  "ActivityRecording",
  "Supabase",
  "Communications.makeWebRequest",
  "windSpeed",
  "gust",
]) {
  if (combined.includes(forbidden))
    throw new Error(
      `Garmin M1 source contains out-of-scope symbol: ${forbidden}`,
    );
}

const manifest = await fs.readFile(path.join(garmin, "manifest.xml"), "utf8");
for (const permission of ["Positioning", "Sensor"]) {
  if (!manifest.includes(`id="${permission}"`))
    throw new Error(`Missing required permission ${permission}`);
}
for (const forbiddenPermission of [
  "Communications",
  "Background",
  "SensorHistory",
  "UserProfile",
  "FitContributor",
]) {
  if (manifest.includes(`id="${forbiddenPermission}"`))
    throw new Error(`Unexpected permission ${forbiddenPermission}`);
}

console.log(
  `Garmin source guards passed: ${required.length} required artifacts; scope and permissions verified.`,
);
