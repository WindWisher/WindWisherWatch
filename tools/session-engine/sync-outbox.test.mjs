import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PersistentSyncOutbox } from "./sync-outbox.mjs";
import { FakeClock, SessionEngine } from "./engine.mjs";
import { MemorySessionStore } from "./store.mjs";
import { CanonicalSessionExporter } from "./canonical-export/exporter.mjs";
async function setup(t) {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "ww-outbox-test-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const store = new MemorySessionStore({ chunkBytes: 4096 }),
    clock = new FakeClock(1000, 1700000000);
  const sessionId = "synthetic-outbox-session";
  const e = new SessionEngine({ store, clock, idFactory: () => sessionId });
  e.prepare({ deviceReference: "synthetic-device" });
  e.start();
  clock.advance(1000);
  e.stop();
  let text = "";
  for await (const line of new CanonicalSessionExporter({
    store,
    sessionId,
  }).lines())
    text += line;
  return PersistentSyncOutbox.create(parent, text, "synthetic-device");
}
const ack = (box, c) => ({
  planId: box.plan.planId,
  deviceReference: box.plan.deviceReference,
  sequence: c.sequence,
  checksum: c.checksum,
  idempotencyKey: c.idempotencyKey,
});
test("outbox persists reservations, backoff, attempts and ACKs across restart", async (t) => {
  let box = await setup(t);
  const directory = box.directory;
  const first = await box.next(1000);
  assert.equal(await box.next(1000), null);
  box = await PersistentSyncOutbox.open(directory);
  assert.equal(await box.next(2000), null); // Recover uncertain send as failed, not ACKed.
  box = await PersistentSyncOutbox.open(directory);
  assert.equal(await box.next(2999), null);
  assert.deepEqual(await box.next(3000), first);
  await box.acknowledge(ack(box, first));
  const count = (await fs.readdir(directory)).length;
  await box.acknowledge(ack(box, first));
  assert.equal((await fs.readdir(directory)).length, count);
  box = await PersistentSyncOutbox.open(directory);
  assert.equal(box.status, "AWAITING_FINAL_ACK");
  await box.acknowledgeSession({
    planId: box.plan.planId,
    deviceReference: box.plan.deviceReference,
    sourceChecksum: box.plan.sourceChecksum,
    totalSequences: box.plan.chunks.length,
  });
  box = await PersistentSyncOutbox.open(directory);
  assert.equal(box.status, "ACKNOWLEDGED");
  assert.equal(await box.next(4000), null);
  assert.equal((await fs.stat(directory)).mode & 0o777, 0o700);
  for (const name of await fs.readdir(directory))
    assert.equal(
      (await fs.stat(path.join(directory, name))).mode & 0o777,
      0o600,
    );
  assert.ok((await fs.stat(path.join(directory, "plan.json"))).size > 0);
});
test("power interruption before/after publication never exposes an unpersisted send", async (t) => {
  for (const stage of ["beforePublish", "afterPublish"]) {
    let box = await setup(t);
    const dir = box.directory;
    box = await PersistentSyncOutbox.open(dir, {
      hook: (point) => {
        if (point === stage) throw Error("simulated interruption");
      },
    });
    await assert.rejects(() => box.next(1000));
    assert.equal(box.status, "REOPEN_REQUIRED");
    await assert.rejects(() => box.next(1000));
    box = await PersistentSyncOutbox.open(dir);
    if (stage === "beforePublish") assert.ok(await box.next(2000));
    else {
      assert.equal(await box.next(2000), null);
      assert.ok(await box.next(3000));
    }
  }
});
test("ACK interruption requires safe replay, never premature finalization", async (t) => {
  for (const stage of ["beforePublish", "afterPublish"]) {
    let box = await setup(t);
    const c = await box.next(1000),
      dir = box.directory;
    box = await PersistentSyncOutbox.open(dir, {
      hook: (point) => {
        if (point === stage) throw Error("interruption");
      },
    });
    await assert.rejects(() => box.acknowledge(ack(box, c)));
    box = await PersistentSyncOutbox.open(dir);
    assert.equal(
      box.status,
      stage === "beforePublish" ? "IN_FLIGHT" : "AWAITING_FINAL_ACK",
    );
    assert.notEqual(box.status, "ACKNOWLEDGED");
  }
});
test("corruption, missing events, symlinks and competing writers fail closed", async (t) => {
  const box = await setup(t),
    dir = box.directory;
  const other = await PersistentSyncOutbox.open(dir);
  await box.next(1000);
  await assert.rejects(() => other.next(1000));
  const event = path.join(dir, "event-0000.json");
  await fs.writeFile(event, "{truncated");
  await assert.rejects(() => PersistentSyncOutbox.open(dir));
  const fresh = await setup(t);
  await fresh.next(1000);
  await fresh.failed(0, 2000);
  await fs.unlink(path.join(fresh.directory, "event-0000.json"));
  await assert.rejects(() => PersistentSyncOutbox.open(fresh.directory));
  const linked = await setup(t);
  await fs.rename(
    path.join(linked.directory, "plan.json"),
    path.join(linked.directory, ".pending-source"),
  );
  await fs.symlink(
    path.join(linked.directory, ".pending-source"),
    path.join(linked.directory, "plan.json"),
  );
  await assert.rejects(() => PersistentSyncOutbox.open(linked.directory));
});
test("restart cannot reset the five-attempt budget", async (t) => {
  let box = await setup(t);
  const dir = box.directory;
  for (let i = 0; i < 5; i++) {
    assert.ok(await box.next(100000 * i));
    box = await PersistentSyncOutbox.open(dir);
    assert.equal(await box.next(100000 * i + 1), null);
    box = await PersistentSyncOutbox.open(dir);
  }
  assert.equal(box.status, "RETRY_EXHAUSTED");
  assert.equal(await box.next(1000000), null);
});

test("final ACK survives publication interruption only when committed", async (t) => {
  for (const stage of ["beforePublish", "afterPublish"]) {
    let box = await setup(t);
    const chunk = await box.next(1000);
    await box.acknowledge(ack(box, chunk));
    const directory = box.directory;
    box = await PersistentSyncOutbox.open(directory, {
      hook: (point) => {
        if (point === stage) throw Error("interruption");
      },
    });
    await assert.rejects(() =>
      box.acknowledgeSession({
        planId: box.plan.planId,
        deviceReference: box.plan.deviceReference,
        sourceChecksum: box.plan.sourceChecksum,
        totalSequences: box.plan.chunks.length,
      }),
    );
    box = await PersistentSyncOutbox.open(directory);
    assert.equal(
      box.status,
      stage === "afterPublish" ? "ACKNOWLEDGED" : "AWAITING_FINAL_ACK",
    );
    assert.ok((await fs.stat(path.join(directory, "plan.json"))).size > 0);
  }
});
