import { createHash } from "node:crypto";
import { parseCanonicalStream } from "./canonical-export/parser.mjs";

export const MAX_SYNC_SOURCE_BYTES = 2 * 1024 * 1024;
export const SYNC_CHUNK_BYTES = 32 * 1024;
const hash = (value) => createHash("sha256").update(value).digest("hex");
function requireValid(ok) {
  if (!ok) throw new Error("Invalid local sync plan or acknowledgement");
}

// Local scheduling model, deliberately NOT a SyncPackage v1 wire envelope.
// No network, authentication claims, source writes, deletion or cloud identity mapping.
export async function createSyncPlan(canonical, deviceReference) {
  requireValid(
    typeof canonical === "string" && typeof deviceReference === "string",
  );
  requireValid(/^[A-Za-z0-9._:-]{1,128}$/.test(deviceReference));
  requireValid(Buffer.byteLength(canonical) <= MAX_SYNC_SOURCE_BYTES);
  const source = Buffer.from(canonical, "utf8");
  const parsed = await parseCanonicalStream(canonical);
  const sourceChecksum = hash(source);
  const planId = hash(
    JSON.stringify([
      "local-sync-plan-1",
      deviceReference,
      parsed.sessionId,
      sourceChecksum,
    ]),
  );
  const chunks = [];
  for (let offset = 0; offset < source.length; offset += SYNC_CHUNK_BYTES) {
    const bytes = source.subarray(offset, offset + SYNC_CHUNK_BYTES);
    const sequence = chunks.length;
    chunks.push(
      Object.freeze({
        sequence,
        byteLength: bytes.length,
        checksum: hash(bytes),
        idempotencyKey: hash(`${planId}:${sequence}`),
        payloadBase64: bytes.toString("base64"),
      }),
    );
  }
  return Object.freeze({
    kind: "LOCAL_CANONICAL_SYNC_PLAN_V1",
    planId,
    deviceReference,
    sessionId: parsed.sessionId,
    sourceChecksum,
    sourceBytes: source.length,
    chunks: Object.freeze(chunks),
    transportStatus: "NOT_IMPLEMENTED",
  });
}

// ACKs are supplied by a future trusted adapter. These checks bind their content,
// not their authenticity. Restore only adapter-verified ACKs from durable storage.
export class LocalSyncQueue {
  #plan;
  #acknowledged = new Set();
  #inFlight = null;
  #attempts;
  #nextAt = 0;
  #lastNow = 0;
  #status = "READY";
  constructor(plan) {
    requireValid(
      plan?.kind === "LOCAL_CANONICAL_SYNC_PLAN_V1" && Object.isFrozen(plan),
    );
    this.#plan = plan;
    this.#attempts = new Array(plan.chunks.length).fill(0);
  }
  get status() {
    return this.#status;
  }
  get acknowledgedCount() {
    return this.#acknowledged.size;
  }
  #clock(now) {
    requireValid(
      Number.isSafeInteger(now) &&
        now >= this.#lastNow &&
        now <= Number.MAX_SAFE_INTEGER - 60000,
    );
    this.#lastNow = now;
  }
  next(now) {
    this.#clock(now);
    if (
      this.#inFlight !== null ||
      now < this.#nextAt ||
      this.#status === "RETRY_EXHAUSTED" ||
      this.#status === "ACKNOWLEDGED"
    )
      return null;
    const chunk = this.#plan.chunks.find(
      (c) => !this.#acknowledged.has(c.sequence),
    );
    if (!chunk) {
      this.#status = "AWAITING_FINAL_ACK";
      return null;
    }
    if (this.#attempts[chunk.sequence] >= 5) {
      this.#status = "RETRY_EXHAUSTED";
      return null;
    }
    this.#inFlight = chunk.sequence;
    this.#attempts[chunk.sequence]++;
    this.#status = "IN_FLIGHT";
    return chunk;
  }
  failed(sequence, now) {
    this.#clock(now);
    requireValid(this.#inFlight === sequence);
    this.#inFlight = null;
    const attempts = this.#attempts[sequence];
    this.#status = attempts >= 5 ? "RETRY_EXHAUSTED" : "BACKOFF";
    this.#nextAt = now + Math.min(60000, 1000 * 2 ** (attempts - 1));
  }
  acknowledge(ack) {
    requireValid(
      ack?.planId === this.#plan.planId &&
        ack.deviceReference === this.#plan.deviceReference &&
        Number.isInteger(ack.sequence),
    );
    const chunk = this.#plan.chunks[ack.sequence];
    requireValid(
      chunk &&
        ack.checksum === chunk.checksum &&
        ack.idempotencyKey === chunk.idempotencyKey,
    );
    if (this.#acknowledged.has(ack.sequence)) return false;
    // Permit verified replay on restart and late delivery after a timeout.
    this.#acknowledged.add(ack.sequence);
    if (this.#inFlight === ack.sequence) this.#inFlight = null;
    if (this.#acknowledged.size === this.#plan.chunks.length)
      this.#status = "AWAITING_FINAL_ACK";
    else if (this.#inFlight === null) {
      this.#status = "READY";
      this.#nextAt = 0;
    }
    return true;
  }
  acknowledgeSession(ack) {
    requireValid(
      this.#acknowledged.size === this.#plan.chunks.length &&
        ack?.planId === this.#plan.planId &&
        ack.deviceReference === this.#plan.deviceReference &&
        ack.sourceChecksum === this.#plan.sourceChecksum &&
        ack.totalSequences === this.#plan.chunks.length,
    );
    this.#status = "ACKNOWLEDGED";
    // Intentionally no delete/clear API: ACK is not automatic deletion authority.
  }
}
