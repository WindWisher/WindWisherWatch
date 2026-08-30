import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readDataset } from "./dataset.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixtureDirectory = path.join(root, "fixtures/garmin-sensor-lab");
const expectations = JSON.parse(
  await fs.readFile(path.join(fixtureDirectory, "expectations.json"), "utf8"),
);

for (const [name, expectedCodes] of Object.entries(expectations)) {
  const parsed = await readDataset(path.join(fixtureDirectory, name), {
    allowPartial: true,
  });
  const actualCodes = [
    ...new Set(parsed.issues.map((entry) => entry.code)),
  ].sort();
  const expected = [...expectedCodes].sort();
  if (JSON.stringify(actualCodes) !== JSON.stringify(expected)) {
    throw new Error(
      `${name}: expected ${expected.join(",") || "no issues"}; got ${actualCodes.join(",") || "no issues"}`,
    );
  }
}

console.log(
  `Garmin Sensor Lab fixture validation passed: ${Object.keys(expectations).length} datasets checked.`,
);
