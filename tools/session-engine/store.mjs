import { DEFAULT_CHUNK_BYTES, encodeFrame, parseJournal } from "./journal.mjs";

export class MemorySessionStore {
  constructor({
    chunkBytes = DEFAULT_CHUNK_BYTES,
    failAtOperation = null,
  } = {}) {
    this.chunkBytes = chunkBytes;
    this.failAtOperation = failAtOperation;
    this.operation = 0;
    this.sessions = new Map();
    this.index = new Map();
  }

  maybeFail(name) {
    this.operation += 1;
    if (this.failAtOperation === this.operation) {
      const error = new Error(`Injected failure during ${name}`);
      error.code = "STORAGE_WRITE_FAILED";
      throw error;
    }
  }

  create(metadata) {
    this.maybeFail("create");
    if (this.sessions.has(metadata.sessionId))
      throw new Error("Session already exists");
    this.sessions.set(metadata.sessionId, {
      chunks: [Buffer.alloc(0)],
      metadata: structuredClone(metadata),
    });
    this.index.set(metadata.sessionId, {
      sessionId: metadata.sessionId,
      state: "PREPARING",
      startedAtEpochSeconds: metadata.startedAtEpochSeconds,
      lastSequence: -1,
      checkpointSequence: null,
    });
  }

  append(sessionId, frame) {
    this.maybeFail("append");
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session does not exist");
    if (frame.length > this.chunkBytes)
      throw new Error("Frame exceeds chunk size");
    let chunkIndex = session.chunks.length - 1;
    if (session.chunks[chunkIndex].length + frame.length > this.chunkBytes) {
      session.chunks.push(Buffer.alloc(0));
      chunkIndex += 1;
    }
    session.chunks[chunkIndex] = Buffer.concat([
      session.chunks[chunkIndex],
      frame,
    ]);
    return { chunkIndex, chunkLength: session.chunks[chunkIndex].length };
  }

  appendRecord(sessionId, record) {
    return this.append(sessionId, encodeFrame(record));
  }

  updateIndex(sessionId, patch) {
    this.maybeFail("updateIndex");
    const current = this.index.get(sessionId);
    if (!current) throw new Error("Index entry does not exist");
    this.index.set(sessionId, { ...current, ...structuredClone(patch) });
  }

  read(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return Buffer.concat(session.chunks);
  }

  readChunks(sessionId) {
    return (
      this.sessions.get(sessionId)?.chunks.map((chunk) => Buffer.from(chunk)) ??
      null
    );
  }

  discoverRecoverable() {
    return [...this.sessions.keys()].filter(
      (sessionId) => parseJournal(this.read(sessionId)).integrity !== "VALID",
    );
  }

  validate(sessionId) {
    const bytes = this.read(sessionId);
    return bytes === null
      ? {
          integrity: "CORRUPT",
          frames: [],
          issues: [{ code: "SESSION_NOT_FOUND" }],
        }
      : parseJournal(bytes);
  }

  corruptTail(sessionId, transform) {
    const session = this.sessions.get(sessionId);
    const joined = Buffer.concat(session.chunks);
    const changed = transform(Buffer.from(joined));
    session.chunks = [changed];
  }

  delete(sessionId) {
    this.sessions.delete(sessionId);
    this.index.delete(sessionId);
  }
}
