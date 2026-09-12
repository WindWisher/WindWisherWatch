import assert from "node:assert/strict";
import test from "node:test";
import { GroundSegmentationExperiment } from "./ground-segmentation-experiment.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

test("single-sample grounded segmentation is not a robust replacement for expiry", async () => {
  const result = compareTimeoutReseed(
    await loadScenarioCatalog("fixtures/jump-engine/synthetic-scenarios.json"),
    GroundSegmentationExperiment,
  );
  assert.equal(result.pairedCases, 1496);
  assert.equal(result.cleanMismatches, 0);
  assert.equal(result.boundViolations, 0);
  // Explicit failure evidence: clean fixtures alone would wrongly approve this.
  assert.ok(
    result.changes.some(
      (row) =>
        row.id === "clean-synthetic-jump" &&
        row.baseline === 1 &&
        row.experiment === 0,
    ),
  );
  assert.ok(
    result.changes.some(
      (row) =>
        row.id === "brisk-walking-false-positive-envelope-v1" &&
        row.baseline === 0 &&
        row.experiment === 1,
    ),
  );
});
