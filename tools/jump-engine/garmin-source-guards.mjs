import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const project = path.join(root, "platforms/garmin/jump-research");
const required = [
  "manifest.xml",
  "monkey.jungle",
  "source/JrConstants.mc",
  "source/JrCaptureBuffer.mc",
  "source/JrDetector.mc",
  "source/JrMotionSource.mc",
  "source/JrStats.mc",
  "source/JrWriter.mc",
  "source/JrController.mc",
  "source/JumpResearchApp.mc",
  "source/JumpResearchDelegate.mc",
  "source/JumpResearchView.mc",
  "tests/JumpResearchTests.mc",
  "scripts/build.sh",
  "scripts/test.sh",
];
for (const relative of required) await fs.access(path.join(project, relative));

const sourceNames = (await fs.readdir(path.join(project, "source"))).filter(
  (name) => name.endsWith(".mc"),
);
const sources = new Map(
  await Promise.all(
    sourceNames.map(async (name) => [
      name,
      await fs.readFile(path.join(project, "source", name), "utf8"),
    ]),
  ),
);
const allSource = [...sources.values()].join("\n");
for (const forbidden of [
  "Supabase",
  "Communications",
  "makeWebRequest",
  "JumpEvent",
  "heightMeters",
  "horizontalDistanceMeters",
  "ActivityRecording",
  "Positioning",
  "process.env",
])
  if (allSource.includes(forbidden))
    throw new Error(
      `Garmin jump research contains forbidden symbol: ${forbidden}`,
    );

const callbackSource = sources.get("JrMotionSource.mc");
for (const forbidden of [
  "System.println",
  "Storage.",
  "JSON",
  "toJson",
  "sort(",
])
  if (callbackSource.includes(forbidden))
    throw new Error(
      `Garmin motion callback contains blocking work: ${forbidden}`,
    );

for (const marker of [
  "MAX_CAPTURE_SAMPLES",
  "MAX_CONTROLLED_DURATION_MILLISECONDS",
  "MAX_RESEARCH_DURATION_MILLISECONDS",
  "MAX_CANDIDATES",
  "MAX_EXPORT_RECORDS",
  "MAX_RAW_WINDOW_BYTES",
  "EXPORT_RECORDS_PER_TICK",
])
  if (!allSource.includes(marker))
    throw new Error(`Garmin research capture lacks hard bound: ${marker}`);

const controller = sources.get("JrController.mc");
if (
  !controller.includes("STATE_EXPORTING") ||
  !controller.includes("drainExport")
)
  throw new Error("Garmin export is not separated from sensor capture");

const manifest = await fs.readFile(path.join(project, "manifest.xml"), "utf8");
if (!manifest.includes('id="Sensor"'))
  throw new Error("Garmin jump research requires Sensor permission");
for (const permission of [
  "Communications",
  "Positioning",
  "Background",
  "FitContributor",
])
  if (manifest.includes(`id="${permission}"`))
    throw new Error(
      `Garmin jump research has forbidden permission: ${permission}`,
    );

console.log(
  `Garmin jump research guards passed: ${required.length} artifacts; callback, limits, permissions and export isolation verified.`,
);
