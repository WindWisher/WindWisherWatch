import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compareFiles, loadBoundedJson } from "./compare-external.mjs";

test("file comparison loads sanitized inputs, fingerprints bytes and rejects wrong clock direction", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ww-comparator-test-"));
  t.after(() => fs.rm(dir, { recursive: true })); // Only this test's unique synthetic files.
  const candidate = path.join(dir, "candidate.json"),
    reference = path.join(dir, "reference.json"),
    clock = path.join(dir, "clock.json");
  const series = (source) => ({
    schemaVersion: "1.0.0",
    kind: "SANITIZED_EXTERNAL_EVENT_SERIES",
    timeBasis: "SECONDS_FROM_SOURCE_SESSION_START",
    source,
    events: [{ id: "synthetic-0", eventTimeSeconds: 10, heightMeters: 3 }],
  });
  await fs.writeFile(candidate, JSON.stringify(series("WOO_BOARD_SENSOR_BLE")));
  await fs.writeFile(reference, JSON.stringify(series("SURFR_GARMIN_FIT")));
  await fs.writeFile(
    clock,
    JSON.stringify({
      clockAlignment: {
        model: "surfrElapsedSeconds = intercept + slope * wooElapsedSeconds",
        interceptSeconds: 0,
        slope: 1,
        fittedOnSameSession: true,
      },
    }),
  );
  const result = await compareFiles(candidate, reference, clock, 0);
  assert.equal(result.matched, 1);
  assert.equal(result.clock.provenance, "FITTED_SAME_SESSION");
  assert.match(result.inputSha256.candidate, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result).includes("synthetic-0"), false);
  await assert.rejects(() => compareFiles(reference, candidate, clock, 0));
  await fs.writeFile(clock, "not JSON");
  await assert.rejects(() => loadBoundedJson(clock));
  await fs.writeFile(clock, Buffer.alloc(4 * 1024 * 1024 + 1, 32));
  await assert.rejects(() => loadBoundedJson(clock), /bound/);
});
