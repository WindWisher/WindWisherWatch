import test from "node:test";
import assert from "node:assert/strict";
import { FakeClock, SessionEngine } from "./engine.mjs";
import { MemorySessionStore } from "./store.mjs";
import { CanonicalSessionExporter } from "./canonical-export/exporter.mjs";
import {
  createSyncPlan,
  LocalSyncQueue,
  MAX_SYNC_SOURCE_BYTES,
} from "./sync-plan.mjs";

async function source() {
  const store = new MemorySessionStore({ chunkBytes: 4096 });
  const clock = new FakeClock(1000, 1700000000);
  const sessionId = "synthetic-sync-session";
  const engine = new SessionEngine({
    store,
    clock,
    idFactory: () => sessionId,
  });
  engine.prepare({ deviceReference: "synthetic-device" });
  engine.start();
  for (let i = 0; i < 500; i++) {
    clock.advance(1000);
    engine.ingestHeartRate({
      relativeMilliseconds: (i + 1) * 1000,
      bpm: 100,
      source: "SYNTHETIC",
      quality: "good",
    });
  }
  engine.stop();
  const lines = [];
  for await (const line of new CanonicalSessionExporter({
    store,
    sessionId,
  }).lines())
    lines.push(line);
  return lines.join("");
}
const ack = (p, c) => ({
  planId: p.planId,
  deviceReference: p.deviceReference,
  sequence: c.sequence,
  checksum: c.checksum,
  idempotencyKey: c.idempotencyKey,
});
test("sync plan is immutable, bounded, deterministic and preserves exact canonical bytes", async () => {
  const text = await source();
  const p = await createSyncPlan(text, "device-one");
  assert.ok(p.chunks.length > 1);
  assert.deepEqual(await createSyncPlan(text, "device-one"), p);
  assert.notEqual((await createSyncPlan(text, "device-two")).planId, p.planId);
  assert.equal(
    Buffer.concat(
      p.chunks.map((c) => Buffer.from(c.payloadBase64, "base64")),
    ).toString("utf8"),
    text,
  );
  assert.ok(p.chunks.every((c) => Object.isFrozen(c) && c.byteLength <= 32768));
  await assert.rejects(() => createSyncPlan(text.slice(0, -10), "device-one"));
  await assert.rejects(() =>
    createSyncPlan("x".repeat(MAX_SYNC_SOURCE_BYTES + 1), "device-one"),
  );
});
test("sync retry is byte-identical with backoff, bounded attempts and no source mutation", async () => {
  const p = await createSyncPlan(await source(), "device-one"),
    q = new LocalSyncQueue(p);
  const first = q.next(0);
  assert.equal(q.next(0), null);
  q.failed(first.sequence, 0);
  assert.equal(q.next(999), null);
  assert.deepEqual(q.next(1000), first);
  q.failed(first.sequence, 1000);
  for (const now of [3000, 7000, 15000]) {
    assert.deepEqual(q.next(now), first);
    q.failed(first.sequence, now);
  }
  assert.equal(q.status, "RETRY_EXHAUSTED");
  assert.equal(q.next(99999), null);
  assert.throws(() => q.next(1));
});
test("ACKs bind device, content and plan; duplicate/reordered replay resumes safely", async () => {
  const p = await createSyncPlan(await source(), "device-one"),
    q = new LocalSyncQueue(p);
  const first = p.chunks[0];
  for (const changed of [
    { planId: "wrong" },
    { deviceReference: "wrong" },
    { checksum: "wrong" },
    { idempotencyKey: "wrong" },
    { sequence: -1 },
  ])
    assert.throws(() => q.acknowledge({ ...ack(p, first), ...changed }));
  assert.equal(q.acknowledgedCount, 0);
  assert.throws(() => q.acknowledgeSession({}));
  const restored = new LocalSyncQueue(p);
  for (const c of [...p.chunks].reverse()) {
    assert.equal(restored.acknowledge(ack(p, c)), true);
    assert.equal(restored.acknowledge(ack(p, c)), false);
  }
  assert.equal(restored.next(0), null);
  assert.equal(restored.status, "AWAITING_FINAL_ACK");
  const final = {
    planId: p.planId,
    deviceReference: p.deviceReference,
    sourceChecksum: p.sourceChecksum,
    totalSequences: p.chunks.length,
  };
  assert.throws(() =>
    restored.acknowledgeSession({ ...final, sourceChecksum: "wrong" }),
  );
  restored.acknowledgeSession(final);
  assert.equal(restored.status, "ACKNOWLEDGED");
  assert.ok(p.chunks[0].payloadBase64.length > 0);
});
