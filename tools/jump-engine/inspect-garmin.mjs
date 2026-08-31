import path from "node:path";
import { pathToFileURL } from "node:url";
import { inspectGarminCaptureFiles } from "./garmin-capture.mjs";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const files = process.argv.slice(2);
  if (files.length === 0 || files.length > 2) {
    console.error("Usage: node inspect-garmin.mjs [rotated.BAK] <active.TXT>");
    process.exitCode = 2;
  } else {
    try {
      console.log(
        JSON.stringify(
          await inspectGarminCaptureFiles(
            files.map((file) => path.resolve(file)),
          ),
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
