import assert from "node:assert/strict";
import test from "node:test";
import {
  BoundedRecordBuffer,
  FakeClock,
  Priority,
  QualityCode,
  SessionEngine,
  SessionState,
} from "./engine.mjs";
import { FrameType, encodeFrame } from "./journal.mjs";
import { MemorySessionStore } from "./store.mjs";

function harness(options = {}) {
  const store = options.store ?? new MemorySessionStore(options.storeOptions);
  const clock = new FakeClock();
  const engine = new SessionEngine({
    store,
    clock,
    idFactory: () => options.sessionId ?? "ww-1700000000-0001",
    checkpointIntervalMilliseconds:
      options.checkpointIntervalMilliseconds ?? 1000,
    bufferLimit: options.bufferLimit ?? 4,
  });
  return { engine, store, clock };
}

test("runs valid lifecycle and verifies durable final before completed", () => {
  const { engine, store, clock } = harness();
  engine.prepare({ deviceReference: "synthetic-garmin" });
  assert.equal(engine.state, SessionState.PREPARING);
  engine.start();
  clock.advance(500);
  engine.ingestPosition({
    relativeMilliseconds: 500,
    latitudeDegrees: 0,
    longitudeDegrees: 0,
    groundSpeedMps: 4,
    quality: "GOOD",
    usable: true,
  });
  engine.ingestHeartRate({
    relativeMilliseconds: 500,
    bpm: 120,
    source: "SYNTHETIC",
  });
  clock.advance(600);
  engine.tick();
  const completed = engine.stop();
  assert.equal(completed.state, SessionState.COMPLETED);
  assert.equal(store.validate(completed.sessionId).integrity, "VALID");
  assert.equal(completed.sampleCounters.position, 1);
  assert.equal(completed.sampleCounters.heartRate, 1);
});

test("rejects invalid transitions and new samples after finalization", () => {
  const { engine } = harness();
  assert.throws(() => engine.start(), /Invalid transition/);
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  engine.stop();
  assert.throws(() => engine.ingestPosition({}), /Invalid transition/);
  assert.equal(engine.stop().state, SessionState.COMPLETED);
});

test("elapsed uses monotonic time and handles rollover", () => {
  const store = new MemorySessionStore();
  const clock = new FakeClock(0xfffffff0, 100);
  const engine = new SessionEngine({
    store,
    clock,
    idFactory: () => "rollover",
  });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  clock.advance(32);
  assert.equal(engine.liveState().elapsedMilliseconds, 32);
});

test("bounded buffer never exceeds its limit and favors higher priority", () => {
  const buffer = new BoundedRecordBuffer(2);
  buffer.push({ id: "low-a", priority: Priority.LOW });
  buffer.push({ id: "low-b", priority: Priority.LOW });
  buffer.push({ id: "critical", priority: Priority.CRITICAL });
  assert.equal(buffer.length, 2);
  assert.equal(buffer.dropped, 1);
  assert.equal(
    buffer.records.some((item) => item.id === "critical"),
    true,
  );
});

test("motion is counted and quality-observed but not persisted raw", () => {
  const { engine, store } = harness();
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  engine.ingestMotion({
    x: 32764,
    qualityCode: QualityCode.TIMESTAMP_IMPLAUSIBLE,
  });
  assert.equal(engine.liveState().sampleCounters.motion, 1);
  const parsed = store.validate(engine.sessionId);
  assert.equal(
    parsed.frames.some((item) => item.type === FrameType.QUALITY),
    false,
  );
  engine.flush();
  assert.equal(
    store
      .validate(engine.sessionId)
      .frames.some((item) => item.type === FrameType.QUALITY),
    true,
  );
  assert.equal(
    store
      .validate(engine.sessionId)
      .frames.some((item) => item.payload?.x === 32764),
    false,
  );
});

test("storage failure fails closed and surfaces persistence error", () => {
  const store = new MemorySessionStore({ failAtOperation: 2 });
  const { engine } = harness({ store });
  engine.prepare({ deviceReference: "synthetic" });
  assert.throws(() => engine.start(), /Injected failure/);
  assert.equal(engine.liveState().state, SessionState.FAILED);
  assert.equal(engine.liveState().persistenceError, "STORAGE_WRITE_FAILED");
});

test("recovers missing finalization and preserves session identity", () => {
  const { engine, store, clock } = harness({
    sessionId: "recoverable-session",
  });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  engine.ingestPosition({
    relativeMilliseconds: 0,
    latitudeDegrees: 0,
    longitudeDegrees: 0,
    groundSpeedMps: 5,
    quality: "GOOD",
    usable: true,
  });
  clock.advance(1200);
  engine.tick();

  const recoveredEngine = new SessionEngine({
    store,
    clock,
    idFactory: () => "must-not-be-used",
  });
  const recovered = recoveredEngine.recover("recoverable-session");
  assert.equal(recovered.integrity, "RECOVERABLE");
  assert.equal(recovered.liveState.sessionId, "recoverable-session");
  assert.equal(recovered.liveState.state, SessionState.RECOVERED);
  assert.throws(() => recoveredEngine.start(), /Automatic resume is deferred/);
  assert.equal(
    recoveredEngine.finalizeRecovered().state,
    SessionState.COMPLETED,
  );
  assert.equal(store.validate("recoverable-session").integrity, "VALID");
});

test("discards only partial tail and records recovery quality", () => {
  const { engine, store, clock } = harness({ sessionId: "partial-session" });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  clock.advance(1200);
  engine.tick();
  store.corruptTail("partial-session", (bytes) =>
    Buffer.concat([
      bytes,
      encodeFrame({
        sequence: 2,
        type: FrameType.POSITION,
        payload: { groundSpeedMps: 2 },
      }).subarray(0, 9),
    ]),
  );

  const recovery = new SessionEngine({
    store,
    clock,
    idFactory: () => "unused",
  });
  const result = recovery.recover("partial-session");
  assert.equal(result.integrity, "RECOVERABLE");
  assert.equal(result.issues[0].code, "TAIL_INCOMPLETE");
  assert.equal(result.liveState.qualityCounters.PARTIAL_TAIL_DISCARDED, 1);
});

test("journal remains source of truth when index is stale", () => {
  const { engine, store } = harness({ sessionId: "stale-index" });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  store.index.set("stale-index", {
    sessionId: "stale-index",
    state: "COMPLETED",
    lastSequence: 999,
  });
  assert.deepEqual(store.discoverRecoverable(), ["stale-index"]);
});

test("low memory stops accepting an apparently healthy recording", () => {
  const { engine } = harness();
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  engine.ingestRuntime({ freeMemoryBytes: 1000, usedMemoryBytes: 100 });
  assert.equal(engine.liveState().state, SessionState.FAILED);
  assert.equal(engine.liveState().qualityCounters.LOW_MEMORY, 1);
});

test("recovery restores metric projection without duplicating distance", () => {
  const { engine, store, clock } = harness({
    sessionId: "metric-recovery",
    checkpointIntervalMilliseconds: 1000,
  });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  engine.ingestPosition({
    relativeMilliseconds: 0,
    latitudeDegrees: 0,
    longitudeDegrees: 0,
    groundSpeedMps: 2,
    usable: true,
  });
  clock.advance(10_000);
  engine.ingestPosition({
    relativeMilliseconds: 10_000,
    latitudeDegrees: 0,
    longitudeDegrees: 0.0001,
    groundSpeedMps: 4,
    usable: true,
  });
  engine.ingestHeartRate({ relativeMilliseconds: 10_000, bpm: 121 });
  engine.tick();
  const before = engine.liveState();
  store.read = () => {
    throw new Error("whole journal read called during checkpoint recovery");
  };
  const recovered = new SessionEngine({
    store,
    clock,
    idFactory: () => "unused",
  });
  const after = recovered.recover("metric-recovery").liveState;
  assert.equal(after.distanceMeters, before.distanceMeters);
  assert.equal(after.maximumSpeedMps, before.maximumSpeedMps);
  assert.equal(after.currentSpeedMps, before.currentSpeedMps);
  assert.equal(after.heartRateBpm, before.heartRateBpm);
  assert.equal(after.validGpsSampleCount, before.validGpsSampleCount);
});

test("stop verifies only the bounded tail, never the whole journal", () => {
  const { engine, store } = harness({ checkpointIntervalMilliseconds: 60_000 });
  engine.prepare({ deviceReference: "synthetic" });
  engine.start();
  for (let index = 0; index < 1000; index += 1)
    engine.ingestPosition({
      relativeMilliseconds: index * 1000,
      latitudeDegrees: 0,
      longitudeDegrees: index * 0.000001,
      groundSpeedMps: 1,
      usable: true,
    });
  store.validate = () => {
    throw new Error("whole journal validation called during stop");
  };
  assert.equal(engine.stop().state, SessionState.COMPLETED);
});
