import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { compareExternal, validateClock } from "./external-comparison.mjs";

export async function loadBoundedJson(file) {
  // Hard read bound, including a file that grows after opening. No raw error output.
  const handle = await fs.open(file, "r");
  try {
    if (!(await handle.stat()).isFile())
      throw new Error("Regular file required");
    const bytes = Buffer.alloc(4 * 1024 * 1024 + 1);
    let size = 0;
    while (size < bytes.length) {
      const result = await handle.read(bytes, size, bytes.length - size, null);
      if (!result.bytesRead) break;
      size += result.bytesRead;
    }
    if (size === bytes.length) throw new Error("JSON byte bound exceeded");
    const snapshot = bytes.subarray(0, size);
    return {
      value: JSON.parse(snapshot.toString("utf8")),
      sha256: createHash("sha256").update(snapshot).digest("hex"),
    };
  } finally {
    await handle.close();
  }
}

export async function compareFiles(
  candidatePath,
  referencePath,
  clockPath,
  toleranceSeconds,
) {
  const [candidate, reference, clockInput] = await Promise.all(
    [candidatePath, referencePath, clockPath].map(loadBoundedJson),
  );
  let clock = clockInput.value;
  if (clock.clockAlignment) {
    // Adapter for the pre-existing aggregate reference; never refits its values.
    const alignment = clock.clockAlignment;
    if (
      alignment.model !==
        "surfrElapsedSeconds = intercept + slope * wooElapsedSeconds" ||
      alignment.fittedOnSameSession !== true ||
      candidate.value.source !== "WOO_BOARD_SENSOR_BLE" ||
      reference.value.source !== "SURFR_GARMIN_FIT"
    )
      throw new Error("Unsupported exploratory clock direction/provenance");
    clock = {
      kind: "AFFINE",
      offsetSeconds: alignment.interceptSeconds,
      scale: alignment.slope,
      provenance: "FITTED_SAME_SESSION",
    };
  }
  validateClock(clock);
  return {
    ...compareExternal(candidate.value, reference.value, {
      clock,
      toleranceSeconds,
    }),
    inputSha256: {
      candidate: candidate.sha256,
      reference: reference.sha256,
      clock: clockInput.sha256,
    },
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length !== 6 || process.argv[5].trim() === "")
      throw new Error("Arguments required");
    const result = await compareFiles(
      ...process.argv.slice(2, 5),
      Number(process.argv[5]),
    );
    console.log(JSON.stringify(result, null, 2));
  } catch {
    console.error(
      "Comparison failed: check sanitized JSON schema, file bounds, clock and tolerance. Usage: node tools/jump-engine/compare-external.mjs candidate.json reference.json clock.json toleranceSeconds",
    );
    process.exitCode = 1;
  }
}
