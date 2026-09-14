import assert from "node:assert/strict";
import test from "node:test";
import { adler32, encodeGarminTransfer } from "./garmin-transfer.mjs";
import { canonicalFromGarminTransfer } from "./garmin-canonical.mjs";
import { parseCanonicalStream } from "./canonical-export/parser.mjs";

function source(recovered = false) {
  return [
    ["SESSION_START", "schema=1.0.0;wall=1700000000;mono=100"],
    ["POSITION", "t=100;lat=0;lon=0;speed=2;quality=4;usable=1"],
    ["HEART_RATE", "t=200;bpm=80;source=platform"],
    ["PRESSURE", "t=300;pascals=101325"],
    ["QUALITY", "t=400;code=GPS_UNAVAILABLE"],
    [
      "SESSION_FINAL",
      `elapsed=1000;pos=1;hr=1;pressure=1;quality=${recovered ? 2 : 1};dist=2;max=2;completed=1700000001${recovered ? ";recovered=true" : ""}`,
    ],
  ];
}
function wire(entries, id = "synthetic-session") {
  return encodeGarminTransfer(
    id,
    entries.map(([frameType, payload], sequence) => ({
      magic: "WWJF",
      formatVersion: 1,
      sequence,
      frameType,
      payloadLength: payload.length,
      payload,
      checksum: adler32(`WWJF|1|${sequence}|${frameType}|${payload}`),
    })),
  );
}
test("Garmin canonical bridge validates normal and recovered sessions without source mutation", async () => {
  for (const recovered of [false, true]) {
    const input = wire(source(recovered));
    const before = structuredClone(input);
    const result = await canonicalFromGarminTransfer(input);
    await parseCanonicalStream(result.lines.join(""));
    assert.deepEqual(input, before);
    assert.deepEqual(
      (await canonicalFromGarminTransfer(input)).lines,
      result.lines,
    );
    assert.equal(result.sourceFrames.length, 6);
    assert.equal(result.privacy, "PRIVATE_SESSION_TELEMETRY");
    assert.equal(
      result.lines.join("").includes("UNCLASSIFIED_SOURCE_QUALITY"),
      recovered,
    );
  }
});
test("Garmin bridge rejects malformed semantics even with valid source checksums", async () => {
  for (const [index, from, to] of [
    [0, "schema=1.0.0", "schema=2.0.0"],
    [1, "lat=0", "lat=91"],
    [1, "t=100", "t=100;t=100"],
    [2, "t=200", "t=50"],
    [2, "bpm=80", "bpm=NaN"],
    [5, "pos=1", "pos=2"],
    [5, "quality=1", "quality=0"],
    [5, "elapsed=1000", "elapsed=10"],
  ]) {
    const entries = source();
    entries[index][1] = entries[index][1].replace(from, to);
    await assert.rejects(() => canonicalFromGarminTransfer(wire(entries)));
  }
});
test("Garmin bridge accepts nullable speed and rejects incomplete transfers before retry", async () => {
  const entries = source();
  entries[1][1] = entries[1][1].replace("speed=2", "speed=-");
  entries[5][1] = entries[5][1].replace("max=2", "max=-");
  const input = wire(entries);
  await assert.rejects(() => canonicalFromGarminTransfer(input.slice(0, -1)));
  const result = await canonicalFromGarminTransfer(input);
  await parseCanonicalStream(result.lines.join(""));
});
