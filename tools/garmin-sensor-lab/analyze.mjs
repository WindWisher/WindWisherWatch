import path from "node:path";
import process from "node:process";
import { analyzeDataset, readDataset } from "./dataset.mjs";

const file = process.argv[2];
if (!file) {
  console.error(
    "Usage: node tools/garmin-sensor-lab/analyze.mjs <capture.ndjson>",
  );
  process.exitCode = 2;
} else {
  try {
    const dataset = await readDataset(path.resolve(file), {
      allowPartial: true,
    });
    console.log(JSON.stringify(analyzeDataset(dataset), null, 2));
    if (
      dataset.issues.some(
        (entry) =>
          !["MISSING_COMPLETION", "PARTIAL_RECORD"].includes(entry.code),
      )
    ) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
