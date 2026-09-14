import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createSyncPlan, LocalSyncQueue } from "./sync-plan.mjs";

const MAX_EVENTS = 1024;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const eventName = (index) => `event-${String(index).padStart(4, "0")}.json`;
function check(ok) {
  if (!ok) throw new Error("Invalid or unavailable private outbox");
}
async function readBounded(file, maximum) {
  const h = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await h.stat();
    check(stat.isFile() && stat.size <= maximum && (stat.mode & 0o077) === 0);
    const buffer = Buffer.alloc(maximum + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await h.read(
        buffer,
        offset,
        buffer.length - offset,
        null,
      );
      if (!bytesRead) break;
      offset += bytesRead;
    }
    check(offset <= maximum);
    return buffer.subarray(0, offset).toString("utf8");
  } finally {
    await h.close();
  }
}
async function publish(directory, name, content, hook) {
  const temporary = path.join(directory, `.pending-${randomUUID()}`);
  const h = await fs.open(temporary, "wx", 0o600);
  try {
    await h.writeFile(content);
    await h.sync();
  } finally {
    await h.close();
  }
  await hook?.("beforePublish");
  // Exclusive hard-link publication: incomplete files never become committed events.
  await fs.link(temporary, path.join(directory, name));
  const dir = await fs.open(directory, "r");
  try {
    await dir.sync();
  } finally {
    await dir.close();
  }
  await hook?.("afterPublish");
  await fs.unlink(temporary); // Only our temporary link; committed content remains.
}

// Host-only, one queue instance per directory. Conflicting writers fail closed on
// exclusive event publication. No network, automatic source deletion or fake ACKs.
export class PersistentSyncOutbox {
  #directory;
  #plan;
  #events;
  #digest;
  #busy = false;
  #failed = false;
  #hook;
  #resumed = true;
  constructor(directory, plan, events, digest, hook) {
    this.#directory = directory;
    this.#plan = plan;
    this.#events = events;
    this.#digest = digest;
    this.#hook = hook;
  }
  static async create(parent, canonical, deviceReference) {
    const plan = await createSyncPlan(canonical, deviceReference);
    const directory = await fs.mkdtemp(
      path.join(parent, "private-sync-outbox-"),
    );
    await fs.chmod(directory, 0o700);
    const parentHandle = await fs.open(parent, "r");
    try {
      await parentHandle.sync();
    } finally {
      await parentHandle.close();
    }
    const payload = JSON.stringify({
      version: 1,
      canonical,
      deviceReference,
      planId: plan.planId,
    });
    await publish(
      directory,
      "plan.json",
      JSON.stringify({ payload, checksum: hash(payload) }),
    );
    return PersistentSyncOutbox.open(directory);
  }
  static async open(directory, { hook } = {}) {
    const stat = await fs.lstat(directory);
    check(
      stat.isDirectory() && !stat.isSymbolicLink() && (stat.mode & 0o077) === 0,
    );
    const names = await fs.readdir(directory);
    check(names.length <= MAX_EVENTS + 10);
    check(
      names.every(
        (n) =>
          n === "plan.json" ||
          /^event-\d{4}\.json$/.test(n) ||
          /^\.pending-[a-f0-9-]+$/.test(n),
      ),
    );
    check(names.filter((n) => n.startsWith(".pending-")).length <= 8);
    const envelope = JSON.parse(
      await readBounded(path.join(directory, "plan.json"), 5 * 1024 * 1024),
    );
    check(
      typeof envelope.payload === "string" &&
        hash(envelope.payload) === envelope.checksum,
    );
    const source = JSON.parse(envelope.payload);
    check(source.version === 1);
    const plan = await createSyncPlan(source.canonical, source.deviceReference);
    check(plan.planId === source.planId);
    const files = names.filter((n) => n.startsWith("event-")).sort();
    check(files.length <= MAX_EVENTS);
    const events = [];
    let digest = envelope.checksum;
    for (let i = 0; i < files.length; i++) {
      check(files[i] === eventName(i));
      const event = JSON.parse(
        await readBounded(path.join(directory, files[i]), 4096),
      );
      check(
        event.index === i &&
          event.previous === digest &&
          event.checksum === hash(JSON.stringify([i, digest, event.action])),
      );
      events.push(event.action);
      digest = event.checksum;
    }
    const box = new PersistentSyncOutbox(directory, plan, events, digest, hook);
    box.#replay();
    return box;
  }
  get directory() {
    return this.#directory;
  }
  get plan() {
    return this.#plan;
  }
  get status() {
    return this.#failed ? "REOPEN_REQUIRED" : this.#replay().queue.status;
  }
  #replay() {
    const queue = new LocalSyncQueue(this.#plan);
    let inFlight = null;
    for (const action of this.#events) {
      if (action.op === "next") {
        const c = queue.next(action.now);
        check(c && c.sequence === action.sequence);
        inFlight = c.sequence;
      } else if (action.op === "failed") {
        queue.failed(action.sequence, action.now);
        inFlight = null;
      } else if (action.op === "ack") {
        queue.acknowledge(action.ack);
        if (inFlight === action.ack.sequence) inFlight = null;
      } else if (action.op === "final") queue.acknowledgeSession(action.ack);
      else check(false);
    }
    return { queue, inFlight };
  }
  async #commit(action) {
    check(this.#events.length < MAX_EVENTS);
    const index = this.#events.length;
    const checksum = hash(JSON.stringify([index, this.#digest, action]));
    const content = JSON.stringify({
      index,
      previous: this.#digest,
      action,
      checksum,
    });
    check(Buffer.byteLength(content) <= 4096);
    await publish(this.#directory, eventName(index), content, this.#hook);
    this.#events.push(action);
    this.#digest = checksum;
  }
  async #run(operation) {
    check(!this.#busy && !this.#failed);
    this.#busy = true;
    try {
      return await operation();
    } catch {
      this.#failed = true;
      throw new Error("Outbox operation failed; reopen before retry");
    } finally {
      this.#busy = false;
    }
  }
  async next(now) {
    return this.#run(async () => {
      const { queue, inFlight } = this.#replay();
      // An unacknowledged persisted reservation is uncertain after restart/timeout.
      // Charge the attempt and back off; never pretend it was received.
      if (inFlight !== null) {
        if (!this.#resumed) return null;
        queue.failed(inFlight, now);
        await this.#commit({ op: "failed", sequence: inFlight, now });
        this.#resumed = false;
        return null;
      }
      const chunk = queue.next(now);
      if (chunk)
        await this.#commit({ op: "next", sequence: chunk.sequence, now });
      this.#resumed = false;
      return chunk; // Reservation is durable BEFORE exposing bytes to a transport.
    });
  }
  async failed(sequence, now) {
    return this.#run(async () => {
      const { queue } = this.#replay();
      queue.failed(sequence, now);
      await this.#commit({ op: "failed", sequence, now });
      this.#resumed = false;
    });
  }
  async acknowledge(ack) {
    return this.#run(async () => {
      const copy = structuredClone(ack);
      const { queue } = this.#replay();
      if (queue.acknowledge(copy)) await this.#commit({ op: "ack", ack: copy });
    });
  }
  async acknowledgeSession(ack) {
    return this.#run(async () => {
      const copy = structuredClone(ack);
      const { queue } = this.#replay();
      queue.acknowledgeSession(copy);
      if (this.status !== "ACKNOWLEDGED")
        await this.#commit({ op: "final", ack: copy });
    });
  }
}
