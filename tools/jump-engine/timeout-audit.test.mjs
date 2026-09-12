import assert from "node:assert/strict";
import test from "node:test";
import { loadScenarioCatalog } from "./fixtures.mjs";
import { auditTimeoutBoundary } from "./timeout-audit.mjs";

test("timeout audit reproduces consumed impulse independently of smoothing", async () => {
  const catalog = await loadScenarioCatalog(
    "fixtures/jump-engine/synthetic-scenarios.json",
  );
  const original = structuredClone(catalog);
  const { rows } = auditTimeoutBoundary(catalog);
  assert.equal(rows.length, 8);
  assert.deepEqual(catalog, original);
  // Characterization of the current defect, not a desired product requirement.
  // A future fix must deliberately revise this diagnosis and its evidence.
  for (const row of rows) {
    assert.equal(row.processedSamples, row.inputSamples);
    const single = row.id === "clean-synthetic-jump";
    assert.equal(
      row.confirmed,
      row.profile === "MEDIUM" ? (single ? 0 : 2) : single ? 1 : 3,
    );
    const at1040 = row.boundary.find((entry) => entry.time === 1040);
    assert.equal(at1040.magnitude, 32);
    if (row.profile === "MEDIUM") {
      assert.equal(at1040.candidateStart, 0);
      assert.equal(at1040.finalized, "REJECTED");
      assert.equal(at1040.after, "GROUND");
      assert.equal(
        row.boundary.find((entry) => entry.time === 1080).after,
        "GROUND",
      );
    } else {
      assert.equal(
        row.boundary.find((entry) => entry.time === 1020).finalized,
        "REJECTED",
      );
      assert.equal(at1040.nextCandidateStart, 1040);
      assert.equal(at1040.after, "POSSIBLE_TAKEOFF");
      assert.equal(
        row.boundary.find((entry) => entry.time === 1120).after,
        "FLIGHT",
      );
    }
  }
});
