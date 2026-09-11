import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const fixtureUrl = new URL(
  "../../fixtures/jump-engine/woo-surfr-parallel-reference-session.json",
  import.meta.url,
);

async function loadReference() {
  return JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
}

test("parallel reference preserves capture completeness without equating counts", async () => {
  const reference = await loadReference();

  assert.equal(reference.counts.woo, reference.woo.airRecords);
  assert.equal(reference.woo.airRecords, reference.woo.completeQhDataBlobs);
  assert.equal(reference.woo.completeRawDataStaticBlobs, 3);
  assert.notEqual(reference.counts.woo, reference.counts.surfr);
  assert.ok(reference.limitations.includes("DIFFERENT_RECORDING_WINDOWS"));
});

test("parallel comparison cannot be promoted to independent validation", async () => {
  const reference = await loadReference();

  assert.equal(reference.clockAlignment.fittedOnSameSession, true);
  assert.equal(
    reference.referenceRole,
    "EMPIRICAL_COMPARISON_NOT_GROUND_TRUTH",
  );
  assert.ok(reference.limitations.includes("NO_WINDWISHER_WATCH_CAPTURE"));
  assert.ok(reference.limitations.includes("NO_PHYSICAL_GROUND_TRUTH"));
});

test("parallel reference counts remain arithmetically consistent", async () => {
  const { counts, primaryExploratoryComparison, strictAirtimeComparison } =
    await loadReference();

  assert.equal(
    primaryExploratoryComparison.matchedEvents +
      primaryExploratoryComparison.surfrUnmatchedEvents,
    counts.surfr,
  );
  assert.equal(
    primaryExploratoryComparison.matchedEvents +
      primaryExploratoryComparison.wooUnmatchedEvents,
    counts.woo,
  );
  assert.ok(
    strictAirtimeComparison.matchedEvents <=
      primaryExploratoryComparison.matchedEvents,
  );
});

test("parallel repository fixture excludes direct personal telemetry", async () => {
  const reference = await loadReference();

  assert.deepEqual(reference.privacy, {
    containsAbsoluteTimestamps: false,
    containsCoordinates: false,
    containsAccountIdentifiers: false,
    containsRawSensorSamples: false,
  });
  assert.equal("jumps" in reference, false);
});
