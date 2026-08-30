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
      startFrame: null,
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
    const decoded = parseJournal(frame).frames[0];
    if (decoded?.type === 1) session.startFrame = decoded;
    return { chunkIndex, chunkLength: session.chunks[chunkIndex].length };
  }

  appendRecord(sessionId, record) {
    return this.append(sessionId, encodeFrame(record));
  }

  updateIndex(sessionId, patch) {
    this.maybeFail("updateIndex");
    const current = this.index.get(sessionId);
    if (!current) throw new Error("Index entry does not exist");
    const checkpointLocation =
      patch.checkpointSequence === undefined
        ? {}
        : {
            checkpointChunkIndex:
              this.sessions.get(sessionId).chunks.length - 1,
          };
    this.index.set(sessionId, {
      ...current,
      ...structuredClone(patch),
      ...checkpointLocation,
    });
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

  *iterateChunks(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session does not exist");
    for (const chunk of session.chunks) yield Buffer.from(chunk);
  }

  exportDescriptor(sessionId) {
    const session = this.sessions.get(sessionId);
    const entry = this.index.get(sessionId);
    if (!session || !entry || !session.startFrame)
      throw new Error("Session does not exist or has no start frame");
    const tail = this.validateTail(sessionId, entry.lastSequence);
    if (tail.integrity !== "VALID")
      throw new Error("Only a completed valid session can be exported");
    return {
      metadata: structuredClone(session.metadata),
      index: structuredClone(entry),
      startFrame: structuredClone(session.startFrame),
      finalFrame: structuredClone(tail.frames.at(-1)),
      chunks: () => this.iterateChunks(sessionId),
    };
  }

  discoverRecoverable() {
    return [...this.sessions.keys()].filter((sessionId) => {
      const entry = this.index.get(sessionId);
      return (
        this.validateTail(sessionId, entry?.lastSequence ?? -1).integrity !==
        "VALID"
      );
    });
  }

  recoveryView(sessionId) {
    const session = this.sessions.get(sessionId);
    const entry = this.index.get(sessionId);
    if (!session || !session.startFrame) return null;
    if (!Number.isInteger(entry?.checkpointChunkIndex))
      return parseJournal(this.read(sessionId));
    const tail = parseJournal(
      Buffer.concat(session.chunks.slice(entry.checkpointChunkIndex)),
    );
    return {
      ...tail,
      frames: [
        session.startFrame,
        ...tail.frames.filter(
          (frame) => frame.sequence !== session.startFrame.sequence,
        ),
      ],
    };
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

  validateTail(sessionId, expectedFinalSequence) {
    const chunks = this.sessions.get(sessionId)?.chunks;
    if (!chunks || chunks.length === 0)
      return { integrity: "CORRUPT", frames: [], hasFinal: false };
    const parsed = parseJournal(chunks.at(-1));
    const finalFrame = parsed.frames.at(-1);
    return {
      ...parsed,
      integrity:
        parsed.issues.length === 0 &&
        finalFrame?.type === 9 &&
        finalFrame.sequence === expectedFinalSequence
          ? "VALID"
          : "RECOVERABLE",
    };
  }

  corruptTail(sessionId, transform) {
    const session = this.sessions.get(sessionId);
    const joined = Buffer.concat(session.chunks);
    const changed = transform(Buffer.from(joined));
    session.chunks = [changed];
    this.index.get(sessionId).checkpointChunkIndex = null;
  }

  delete(sessionId) {
    this.sessions.delete(sessionId);
    this.index.delete(sessionId);
  }
}
