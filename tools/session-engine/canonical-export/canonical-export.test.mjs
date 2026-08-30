import assert from "node:assert/strict";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import test from "node:test";
import { FakeClock, SessionEngine } from "../engine.mjs";
import { MemorySessionStore } from "../store.mjs";
import { CanonicalSessionExporter } from "./exporter.mjs";
import { encodeCanonicalRecord } from "./format.mjs";
import { parseCanonicalStream } from "./parser.mjs";
import { publicInspection } from "./inspect.mjs";

function createHarness(sessionId = "synthetic-canonical-session") {
  const store = new MemorySessionStore({ chunkBytes: 4096 });
  const clock = new FakeClock(1000, 1_700_000_000);
  const engine = new SessionEngine({
    store,
    clock,
    idFactory: () => sessionId,
    checkpointIntervalMilliseconds: 60_000,
  });
  engine.prepare({ deviceReference: "synthetic-device" });
  engine.start();
  return { store, clock, engine, sessionId };
}

function addObservations(harness, index = 0) {
  const relativeMilliseconds = index * 10_000;
  harness.engine.ingestPosition({
    relativeMilliseconds,
    latitudeDegrees: 0,
    longitudeDegrees: index * 0.0001,
    groundSpeedMps: index + 1,
    quality: "GOOD",
    usable: true,
    timestampProvenance: "SESSION_MONOTONIC",
  });
  harness.engine.ingestHeartRate({
    relativeMilliseconds,
    bpm: 120 + index,
    source: "SYNTHETIC",
    quality: "good",
  });
  harness.engine.ingestPressure({
    relativeMilliseconds,
    pressurePascals: 101_325,
  });
}

function completedHarness(sessionId) {
  const harness = createHarness(sessionId);
  addObservations(harness, 0);
  harness.clock.advance(10_000);
  addObservations(harness, 1);
  harness.engine.stop();
  return harness;
}

function exporterFor(harness) {
  return new CanonicalSessionExporter({
    store: harness.store,
    sessionId: harness.sessionId,
    producerPlatform: "host_reference",
    device: {
      platform: "host_reference",
      manufacturer: "Synthetic",
      model: "Fixture",
    },
  });
}

async function collect(exporter) {
  let output = "";
  for await (const line of exporter.lines()) output += line;
  return output;
}

test("exports, parses and validates a deterministic canonical round trip", async () => {
  const harness = completedHarness("synthetic-round-trip");
  const exporter = exporterFor(harness);
  const first = await collect(exporter);
  const second = await collect(exporter);
  assert.equal(second, first);
  const types = [];
  let operationalSummary;
  const parsed = await parseCanonicalStream(first, {
    onRecord: (record) => {
      types.push(record.recordType);
      if (record.recordType === "operational_summary")
        operationalSummary = record.payload;
    },
  });
  assert.equal(parsed.integrity, "VALID");
  assert.equal(parsed.completionStatus, "COMPLETED");
  assert.deepEqual(parsed.recordCounts, {
    track: 2,
    heartRate: 2,
    pressure: 2,
    quality: 1,
  });
  assert.deepEqual(types, [
    "manifest",
    "track",
    "heart_rate",
    "pressure",
    "track",
    "heart_rate",
    "pressure",
    "quality",
    "operational_summary",
    "completion",
  ]);
  const liveState = harness.engine.liveState();
  assert.equal(operationalSummary.distanceMeters, liveState.distanceMeters);
  assert.equal(operationalSummary.maximumSpeedMps, liveState.maximumSpeedMps);
  const inspection = JSON.stringify(publicInspection(parsed));
  assert.doesNotMatch(inspection, /latitude|longitude|\"bpm\"/i);
});

test("export is read-only and retry-safe after interruption", async () => {
  const harness = completedHarness("synthetic-interruption");
  const before = Buffer.from(harness.store.read(harness.sessionId));
  let observed = 0;
  await assert.rejects(async () => {
    for await (const line of exporterFor(harness).lines()) {
      assert.ok(line.endsWith("\n"));
      observed += 1;
      if (observed === 3) throw new Error("synthetic export interruption");
    }
  }, /synthetic export interruption/);
  assert.deepEqual(harness.store.read(harness.sessionId), before);
  const retry = await collect(exporterFor(harness));
  assert.equal((await parseCanonicalStream(retry)).integrity, "VALID");
  assert.deepEqual(harness.store.read(harness.sessionId), before);
});

test("exports recovered completion without changing session identity", async () => {
  const harness = createHarness("synthetic-recovered-export");
  addObservations(harness, 0);
  harness.clock.advance(60_000);
  harness.engine.tick();
  const recovered = new SessionEngine({
    store: harness.store,
    clock: harness.clock,
    idFactory: () => "unused",
  });
  recovered.recover(harness.sessionId);
  recovered.finalizeRecovered();
  const parsed = await parseCanonicalStream(
    await collect(exporterFor(harness)),
  );
  assert.equal(parsed.sessionId, harness.sessionId);
  assert.equal(parsed.completionStatus, "RECOVERED_THEN_COMPLETED");
});

test("rejects incomplete source sessions", async () => {
  const harness = createHarness("synthetic-incomplete-export");
  await assert.rejects(
    async () => collect(exporterFor(harness)),
    /Only a completed valid session can be exported/,
  );
});

test("parser rejects bad checksum, truncation and duplicate sequence", async () => {
  const stream = await collect(
    exporterFor(completedHarness("synthetic-corruption")),
  );
  const lines = stream.trimEnd().split("\n");
  const damaged = JSON.parse(lines[1]);
  damaged.checksum = "00000000";
  await assert.rejects(
    () =>
      parseCanonicalStream(
        [lines[0], JSON.stringify(damaged), ...lines.slice(2)].join("\n") +
          "\n",
      ),
    /record checksum failed/,
  );
  await assert.rejects(
    () => parseCanonicalStream(`${lines.slice(0, -1).join("\n")}\n`),
    /no completion record/,
  );
  await assert.rejects(
    () =>
      parseCanonicalStream(
        [lines[0], lines[0], ...lines.slice(1)].join("\n") + "\n",
      ),
    /sequence is duplicate/,
  );
});

test("parser fails safely on unsupported schema and unexpected section", async () => {
  const stream = await collect(
    exporterFor(completedHarness("synthetic-schema-failure")),
  );
  const lines = stream.trimEnd().split("\n");
  const manifest = JSON.parse(lines[0]);
  const unsupported = encodeCanonicalRecord({
    recordSequence: 0,
    recordType: "manifest",
    payload: manifest.payload,
  }).record;
  unsupported.canonicalSchemaVersion = "2.0.0";
  await assert.rejects(
    () => parseCanonicalStream(`${JSON.stringify(unsupported)}\n`),
    /Unsupported canonical schema version/,
  );
  manifest.payload.sections.push("wind");
  const unexpected = encodeCanonicalRecord({
    recordSequence: 0,
    recordType: "manifest",
    payload: manifest.payload,
  }).line;
  await assert.rejects(
    () => parseCanonicalStream(unexpected),
    /schema validation failed/,
  );
});

test("four virtual hours export thousands of records with bounded lines", async (t) => {
  const harness = createHarness("synthetic-four-hour-export");
  for (let step = 0; step <= 4 * 60 * 60; step += 5) {
    const relativeMilliseconds = step * 1000;
    harness.engine.ingestPosition({
      relativeMilliseconds,
      latitudeDegrees: 0,
      longitudeDegrees: step * 0.000001,
      groundSpeedMps: 1,
      quality: "GOOD",
      usable: true,
      timestampProvenance: "SESSION_MONOTONIC",
    });
    if (step % 10 === 0)
      harness.engine.ingestHeartRate({
        relativeMilliseconds,
        bpm: 120,
        source: "SYNTHETIC",
        quality: "good",
      });
    harness.clock.advance(5000);
    harness.engine.tick();
  }
  harness.engine.stop();
  const temporaryDirectory = await fsPromises.mkdtemp(
    path.join(os.tmpdir(), "windwisher-m4-"),
  );
  const output = path.join(temporaryDirectory, "long-session.ndjson");
  try {
    await exporterFor(harness).writeTo(fs.createWriteStream(output));
    let records = 0;
    const parsed = await parseCanonicalStream(fs.createReadStream(output), {
      onRecord: () => {
        records += 1;
      },
    });
    const bytes = (await fsPromises.stat(output)).size;
    const sectionBytes = { track: 0, heart_rate: 0 };
    const lines = readline.createInterface({
      input: fs.createReadStream(output),
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      const type = JSON.parse(line).recordType;
      if (Object.hasOwn(sectionBytes, type))
        sectionBytes[type] += Buffer.byteLength(`${line}\n`, "utf8");
    }
    assert.equal(parsed.integrity, "VALID");
    assert.ok(parsed.recordCounts.track > 2800);
    assert.ok(parsed.recordCounts.heartRate > 1400);
    assert.ok(records > 4200);
    assert.ok(bytes / 4 > 100_000);
    t.diagnostic(
      `M4_LONG_SESSION bytes=${bytes} records=${records} trackBytes=${sectionBytes.track} heartRateBytes=${sectionBytes.heart_rate}`,
    );
  } finally {
    await fsPromises.rm(temporaryDirectory, { recursive: true });
  }
});
