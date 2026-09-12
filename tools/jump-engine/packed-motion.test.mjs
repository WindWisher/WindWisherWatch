import assert from "node:assert/strict";
import test from "node:test";
import { decodePackedMotion } from "./packed-motion.mjs";
import { parseGarminResearchCapture } from "./garmin-capture.mjs";
import { diagnoseBT4 } from "./diagnose-bt4.mjs";

function deltaBlock(start = 0, count = 25, mutate = () => {}) {
  const b = Buffer.alloc(12 + count * 19);
  b.writeUInt32LE(start * 40, 0);
  b.writeUInt32LE(start * 40, 4);
  b.writeUInt32LE(0xfffffff0, 8);
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 19;
    b.writeUInt16LE(i * 40, at);
    b.writeUInt16LE(i * 40, at + 2);
    b.writeUInt16LE(i * 40, at + 4);
    [-123.25, 0.125, 1000.5].forEach((v, j) =>
      b.writeFloatLE(v, at + 6 + j * 4),
    );
    b[at + 18] = 0x72;
  }
  mutate(b);
  let a = 1,
    c = 0;
  for (const v of b) {
    a = (a + v) % 65521;
    c = (c + a) % 65521;
  }
  return `E|${start}|${b.toString("base64")}|${c * 65536 + a}`;
}

test("delta codec retains exact floats, clock wrap, flags and missing raw clock", () => {
  const rows = decodePackedMotion(deltaBlock());
  assert.equal(rows.length, 25);
  for (let i = 0; i < rows.length; i++) {
    assert.deepEqual(rows[i].accelMillig, [-123.25, 0.125, 1000.5]);
    assert.equal(rows[i].rawSampleTimestamp, i * 40);
    assert.equal(rows[i].normalizedTimestamp, i * 40);
    assert.equal(
      rows[i].callbackTimestamp,
      (0xfffffff0 + i * 40) % 0x100000000,
    );
    assert.equal(rows[i].qualityMask, 2);
    assert.equal(rows[i].garminLandingStable, true);
  }
  assert.equal(
    decodePackedMotion(deltaBlock(0, 1, (b) => b.writeUInt16LE(65535, 12)))[0]
      .rawSampleTimestamp,
    null,
  );
  for (const invalid of [
    deltaBlock(220),
    deltaBlock(0, 26),
    deltaBlock(0, 1, (b) => b.writeUInt16LE(65535, 14)),
    deltaBlock(0, 1, (b) => {
      b[30] = 128;
    }),
    deltaBlock(0, 1, (b) => b.writeFloatLE(Infinity, 18)),
    deltaBlock().slice(0, -1),
  ])
    assert.throws(() => decodePackedMotion(invalid));
});

test("extended window accepts a six-second marker with full delivered tail", async () => {
  const manifest = {
    recordType: "manifest",
    researchSchemaVersion: "1.3.0",
    appVersion: "0.5.1-m5.4bd-window1",
    protocolId: "M54BD_BT4_DIAG_01",
    jumpAlgorithmVersion: "experimental-0.5-phase-scoped-envelope",
    sensorProfile: "MEDIUM",
    captureMode: "CONTROLLED_FULL_WINDOW",
    encoding: "LE19_DELTA_ACCEL_STATE_V1",
    limits: { maxSamples: 225, maxDurationMilliseconds: 12000 },
  };
  const summary = {
    recordType: "summary",
    result: "COMPLETED",
    durationMilliseconds: 10000,
    observedSamples: 225,
    exportedSamples: 225,
    overwrittenOrDroppedSamples: 0,
    unprocessedDeliveredSamples: 0,
    detector: {
      compactCandidateTraces: [],
      confirmedCandidates: 0,
      rejectedCandidates: 0,
    },
    operatorReference: {
      referenceSchemaVersion: "1.0.0",
      trialId: "synthetic",
      datasetSplit: "TUNING",
      expectedEventType: "CONTROLLED_HOP",
      markers: [
        {
          referenceId: "mark",
          markerType: "POST_EVENT_MARK",
          timestampMilliseconds: 6000,
          normalizedTimestampMilliseconds: 5000,
          uncertaintyBeforeMilliseconds: 2500,
          uncertaintyAfterMilliseconds: 100,
          provenance: "SYNTHETIC_TEST",
        },
      ],
    },
  };
  const make = (
    m = manifest,
    blocks = Array.from({ length: 9 }, (_, i) => deltaBlock(i * 25)),
  ) =>
    [
      JSON.stringify(m),
      ...blocks,
      JSON.stringify(summary),
      JSON.stringify({
        recordType: "completion",
        result: "COMPLETED",
        records: 225,
      }),
    ].join("\n");
  const capture = await parseGarminResearchCapture(make());
  assert.equal(capture.samples.length, 225);
  assert.equal(capture.samples.at(-1).normalizedTimestamp, 8960);
  const negativeManifest = {
    ...manifest,
    appVersion: "0.5.1-m5.4bd-negative1",
    protocolId: "M54BD_WALK_NEG_01",
  };
  const originalReference = structuredClone(summary.operatorReference);
  summary.operatorReference.expectedEventType = "NONE";
  summary.operatorReference.markers = [
    {
      ...originalReference.markers[0],
      markerType: "NEGATIVE_TRIAL",
      timestampMilliseconds: 0,
      normalizedTimestampMilliseconds: null,
      provenance: "PREDECLARED_PROTOCOL",
    },
  ];
  assert.equal(
    (await parseGarminResearchCapture(make(negativeManifest))).samples.length,
    225,
  );
  summary.durationMilliseconds = 5999;
  await assert.rejects(parseGarminResearchCapture(make(negativeManifest)));
  summary.durationMilliseconds = 10000;
  const noVideoManifest = {
    ...negativeManifest,
    appVersion: "0.5.1-m5.4bd-novideo1",
    protocolId: "M54BD_NV_ARM_01",
  };
  assert.equal(
    (await parseGarminResearchCapture(make(noVideoManifest))).samples.length,
    225,
  );
  summary.durationMilliseconds = 7999;
  await assert.rejects(parseGarminResearchCapture(make(noVideoManifest)));
  summary.durationMilliseconds = 10000;
  assert.equal(
    (
      await parseGarminResearchCapture(
        make({
          ...noVideoManifest,
          appVersion: "0.5.1-m5.4bd-novideo1-export1",
        }),
      )
    ).samples.length,
    225,
  );
  await assert.rejects(
    parseGarminResearchCapture(
      make({ ...noVideoManifest, protocolId: "M54BD_SYNC_01" }),
    ),
  );
  summary.operatorReference.expectedEventType = "SYNCHRONIZATION_ONLY";
  await assert.rejects(parseGarminResearchCapture(make(noVideoManifest)));
  summary.operatorReference.expectedEventType = "CONTROLLED_HOP";
  await assert.rejects(parseGarminResearchCapture(make(negativeManifest)));
  const syncManifest = {
    ...manifest,
    appVersion: "0.5.1-m5.4bd-sync1",
    protocolId: "M54BD_SYNC_01",
  };
  summary.operatorReference.expectedEventType = "SYNCHRONIZATION_ONLY";
  summary.operatorReference.markers[0].markerType = "TRIAL_START";
  summary.operatorReference.markers[0].provenance = "OPERATOR_START_BUTTON";
  assert.equal(
    (await parseGarminResearchCapture(make(syncManifest))).samples.length,
    225,
  );
  summary.durationMilliseconds = 7999;
  await assert.rejects(parseGarminResearchCapture(make(syncManifest)));
  summary.durationMilliseconds = 10000;
  const hopManifest = {
    ...syncManifest,
    appVersion: "0.5.1-m5.4bd-novideo2",
    protocolId: "M54BD_NV_HOP_01",
  };
  summary.operatorReference.expectedEventType = "OPERATOR_COUNT_ONLY";
  assert.equal(
    (await parseGarminResearchCapture(make(hopManifest))).samples.length,
    225,
  );
  summary.durationMilliseconds = 7999;
  await assert.rejects(parseGarminResearchCapture(make(hopManifest)));
  summary.durationMilliseconds = 10000;
  await assert.rejects(
    parseGarminResearchCapture(
      make({ ...hopManifest, protocolId: "M54BD_NV_ARM_01" }),
    ),
  );
  summary.operatorReference.expectedEventType = "NONE";
  await assert.rejects(parseGarminResearchCapture(make(hopManifest)));
  summary.operatorReference.expectedEventType = "OPERATOR_COUNT_ONLY";
  summary.operatorReference.markers[0].markerType = "POST_EVENT_MARK";
  await assert.rejects(parseGarminResearchCapture(make(hopManifest)));
  summary.operatorReference.markers[0].markerType = "TRIAL_START";
  summary.operatorReference.expectedEventType = "SYNCHRONIZATION_ONLY";
  await assert.rejects(
    parseGarminResearchCapture(
      make({ ...syncManifest, protocolId: "M54BD_WALK_NEG_01" }),
    ),
  );
  summary.operatorReference.expectedEventType = "NONE";
  await assert.rejects(parseGarminResearchCapture(make(syncManifest)));
  summary.operatorReference.expectedEventType = "SYNCHRONIZATION_ONLY";
  summary.operatorReference.markers[0].markerType = "NEGATIVE_TRIAL";
  await assert.rejects(parseGarminResearchCapture(make(syncManifest)));
  summary.operatorReference = originalReference;
  await assert.rejects(parseGarminResearchCapture(make(negativeManifest)));
  await assert.rejects(
    parseGarminResearchCapture(
      make({
        ...manifest,
        limits: { maxSamples: 226, maxDurationMilliseconds: 12000 },
      }),
    ),
  );
  await assert.rejects(parseGarminResearchCapture(make(manifest, [encoded()])));
});

function encoded(count = 10, start = 0) {
  const b = Buffer.alloc(26 * count);
  for (let i = 0; i < count; i++) {
    b.writeUInt32LE((start + i) * 40, i * 26);
    b.writeUInt32LE((start + i) * 40, i * 26 + 4);
    b.writeUInt32LE(4000000000, i * 26 + 8);
    [-123.25, 0.125, 1000.5].forEach((n, a) =>
      b.writeFloatLE(n, i * 26 + 12 + a * 4),
    );
    b[i * 26 + 24] = 2;
    b[i * 26 + 25] = 3;
  }
  let s1 = 1,
    s2 = 0;
  for (const byte of b) {
    s1 = (s1 + byte) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return "D|" + start + "|" + b.toString("base64") + "|" + (s2 * 65536 + s1);
}
test("packed Float32 preserves negative fractional accel and unsigned clocks", () => {
  const samples = decodePackedMotion(encoded());
  assert.equal(samples.length, 10);
  for (let i = 0; i < 10; i++) {
    assert.deepEqual(samples[i].accelMillig, [-123.25, 0.125, 1000.5]);
    assert.equal(samples[i].callbackTimestamp, 4000000000);
    assert.equal(samples[i].normalizedTimestamp, i * 40);
    assert.equal(samples[i].garminState, "POSSIBLE_LANDING");
  }
});
test("packed decoder rejects malformed encoding, truncation and bounds", () => {
  for (const bad of [
    "D|0|",
    encoded().slice(0, -2),
    encoded(11),
    encoded().replace("D|0|", "D|145|"),
    "D|-1|AAAA",
    "D|0|!!!",
  ])
    assert.throws(() => decodePackedMotion(bad));
});
test("packed diagnostic parser and analysis enforce completeness and identity", async () => {
  const manifest = {
    recordType: "manifest",
    researchSchemaVersion: "1.3.0",
    encoding: "LE26_ACCEL_STATE_V1",
    appVersion: "0.5.1-m5.4bd",
    protocolId: "M54BD_BT4_DIAG_01",
    jumpAlgorithmVersion: "experimental-0.5-phase-scoped-envelope",
    sensorProfile: "MEDIUM",
    captureMode: "CONTROLLED_FULL_WINDOW",
    limits: { maxSamples: 150 },
  };
  const reference = {
    referenceSchemaVersion: "1.0.0",
    trialId: "synthetic",
    datasetSplit: "TUNING",
    expectedEventType: "CONTROLLED_HOP",
    markers: [
      {
        referenceId: "mark",
        markerType: "POST_EVENT_MARK",
        timestampMilliseconds: 400,
        normalizedTimestampMilliseconds: 360,
        uncertaintyBeforeMilliseconds: 2500,
        uncertaintyAfterMilliseconds: 100,
        provenance: "SYNTHETIC_TEST",
      },
    ],
  };
  const summary = {
    recordType: "summary",
    result: "COMPLETED",
    observedSamples: 70,
    exportedSamples: 70,
    overwrittenOrDroppedSamples: 0,
    unprocessedDeliveredSamples: 0,
    durationMilliseconds: 2800,
    operatorReference: reference,
    detector: {
      compactCandidateTraces: [],
      confirmedCandidates: 0,
      rejectedCandidates: 0,
    },
  };
  const end = { recordType: "completion", result: "COMPLETED", records: 70 };
  const make = (m = manifest, s = summary) =>
    [
      JSON.stringify(m),
      ...Array.from({ length: 7 }, (_, i) => encoded(10, i * 10)),
      JSON.stringify(s),
      JSON.stringify(end),
    ].join("\n");
  const capture = await parseGarminResearchCapture(make());
  const result = diagnoseBT4(capture);
  assert.equal(result.timeline.length, 70);
  assert.equal(result.diagnosticParity, "DIVERGED"); // deliberately inconsistent synthetic Garmin state
  await assert.rejects(
    parseGarminResearchCapture(make({ ...manifest, protocolId: "BT4" })),
  );
  await assert.rejects(
    parseGarminResearchCapture(
      make(manifest, { ...summary, observedSamples: 11 }),
    ),
  );
  await assert.rejects(
    parseGarminResearchCapture(
      make(manifest, { ...summary, overwrittenOrDroppedSamples: 1 }),
    ),
  );
  await assert.rejects(
    parseGarminResearchCapture(make().split("\n").slice(0, -1).join("\n")),
  );
  const damaged = encoded().split("|");
  damaged[2] = "B" + damaged[2].slice(1);
  assert.throws(() => decodePackedMotion(damaged.join("|")), /checksum/);
  await parseGarminResearchCapture(
    make({ ...manifest, appVersion: "0.5.1-m5.4bd-tail1" }),
  );
  const withMark = (timestampMilliseconds, durationMilliseconds) =>
    make(manifest, {
      ...summary,
      durationMilliseconds,
      operatorReference: {
        ...reference,
        markers: [{ ...reference.markers[0], timestampMilliseconds }],
      },
    });
  await assert.rejects(
    parseGarminResearchCapture(withMark(4187, 6001)),
    /post-marker tail incomplete/,
  );
  await assert.rejects(
    parseGarminResearchCapture(withMark(1000, 3000)),
    /delivered-sample tail incomplete/,
  );
  await parseGarminResearchCapture(withMark(760, 2800)); // exact sample deadline
  await assert.rejects(
    parseGarminResearchCapture(withMark(761, 2800)),
    /delivered-sample tail incomplete/,
  );
  await assert.rejects(
    parseGarminResearchCapture(
      make(manifest, { ...summary, result: "INCOMPLETE" }),
    ),
  );
});
