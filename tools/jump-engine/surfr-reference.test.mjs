import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const fixtureUrl = new URL(
  "../../fixtures/jump-engine/surfr-reference-session.json",
  import.meta.url,
);

async function loadReference() {
  return JSON.parse(await fs.readFile(fixtureUrl, "utf8"));
}

test("SurfR reference remains an explicitly limited external comparator", async () => {
  const reference = await loadReference();

  assert.equal(reference.fixtureSchemaVersion, "1.0.0");
  assert.equal(reference.fixtureKind, "sanitized-external-jump-reference");
  assert.equal(reference.source, "SURFR_GARMIN_FIT");
  assert.equal(
    reference.referenceRole,
    "EMPIRICAL_COMPARATOR_NOT_GROUND_TRUTH",
  );
  assert.ok(reference.limitations.includes("NO_PHYSICAL_GROUND_TRUTH"));
  assert.ok(
    reference.limitations.includes("NO_SIMULTANEOUS_WINDWISHER_CAPTURE"),
  );
});

test("SurfR aggregate and display values preserve their observed mapping", async () => {
  const { session, firstJump, mobileDisplay } = await loadReference();

  assert.equal(session.jumpCount, mobileDisplay.jumpCount);
  assert.equal(Number(session.maximumHeightMeters.toFixed(1)), 6.4);
  assert.equal(Number(session.maximumAirtimeSeconds.toFixed(1)), 6.9);
  assert.equal(Math.round(session.maximumJumpDistanceMeters), 54);
  assert.equal(Math.round(session.maximumSpeedKilometersPerHour), 40);
  assert.equal(Number(firstJump.heightMeters.toFixed(2)), 2.52);
  assert.equal(Number(firstJump.airtimeSeconds.toFixed(2)), 3.29);
  assert.equal(Math.round(firstJump.distanceMeters), 13);
  assert.equal(firstJump.elapsedSeconds, 2 * 60 + 15);
});

test("SurfR repository fixture contains no personal location or absolute time", async () => {
  const reference = await loadReference();
  const keys = [];
  const collectKeys = (value) => {
    if (Array.isArray(value)) {
      value.forEach(collectKeys);
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      keys.push(key.toLowerCase());
      collectKeys(child);
    }
  };
  collectKeys(reference);

  assert.deepEqual(reference.privacy, {
    containsAbsoluteTimestamps: false,
    containsCoordinates: false,
    containsAccountIdentifiers: false,
    containsRawSensorSamples: false,
  });
  for (const forbiddenKey of [
    "latitude",
    "longitude",
    "recordedat",
    "startedat",
    "accountid",
  ]) {
    assert.equal(keys.includes(forbiddenKey), false);
  }
});
