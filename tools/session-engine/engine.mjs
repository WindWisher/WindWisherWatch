import { FrameType, SESSION_SCHEMA_VERSION, encodeFrame } from "./journal.mjs";
import { CoreMetricProjector } from "./core-metrics.mjs";

export const SessionState = Object.freeze({
  IDLE: "IDLE",
  PREPARING: "PREPARING",
  RECORDING: "RECORDING",
  STOPPING: "STOPPING",
  COMPLETED: "COMPLETED",
  RECOVERED: "RECOVERED",
  FAILED: "FAILED",
});

export const QualityCode = Object.freeze({
  TIMESTAMP_DUPLICATE: "TIMESTAMP_DUPLICATE",
  TIMESTAMP_OUT_OF_ORDER: "TIMESTAMP_OUT_OF_ORDER",
  TIMESTAMP_IMPLAUSIBLE: "TIMESTAMP_IMPLAUSIBLE",
  GPS_UNAVAILABLE: "GPS_UNAVAILABLE",
  GPS_POOR_FIX: "GPS_POOR_FIX",
  SENSOR_UNAVAILABLE: "SENSOR_UNAVAILABLE",
  SAMPLE_GAP: "SAMPLE_GAP",
  PERSISTENCE_RETRY: "PERSISTENCE_RETRY",
  LOW_MEMORY: "LOW_MEMORY",
  LOW_STORAGE: "LOW_STORAGE",
  RECOVERY_APPLIED: "RECOVERY_APPLIED",
  PARTIAL_TAIL_DISCARDED: "PARTIAL_TAIL_DISCARDED",
  BUFFER_OVERFLOW: "BUFFER_OVERFLOW",
  GPS_DUPLICATE: "GPS_DUPLICATE",
  GPS_BACKWARD_TIMESTAMP: "GPS_BACKWARD_TIMESTAMP",
  GPS_INVALID_SPEED: "GPS_INVALID_SPEED",
  GPS_SPIKE: "GPS_SPIKE",
  HR_UNAVAILABLE: "HR_UNAVAILABLE",
  HR_INVALID: "HR_INVALID",
});

export const QualitySeverity = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
});
export const Priority = Object.freeze({
  CRITICAL: 3,
  HIGH: 2,
  MEDIUM: 1,
  LOW: 0,
});

export class BoundedRecordBuffer {
  constructor(limit = 32) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error("Buffer limit must be positive");
    this.limit = limit;
    this.records = [];
    this.dropped = 0;
  }

  push(record) {
    if (this.records.length < this.limit) {
      this.records.push(record);
      return true;
    }
    const lowestIndex = this.records.findIndex(
      (item) => item.priority < record.priority,
    );
    if (lowestIndex >= 0) {
      this.records.splice(lowestIndex, 1, record);
      this.dropped += 1;
      return true;
    }
    this.dropped += 1;
    return false;
  }

  shift() {
    return this.records.shift();
  }

  get length() {
    return this.records.length;
  }
}

export class SessionEngine {
  constructor({
    store,
    clock,
    idFactory,
    checkpointIntervalMilliseconds = 60_000,
    bufferLimit = 32,
    qualityEventLimit = 16,
    minimumFreeMemoryBytes = 24_576,
    metricProjector = new CoreMetricProjector(),
  }) {
    this.store = store;
    this.clock = clock;
    this.idFactory = idFactory;
    this.checkpointIntervalMilliseconds = checkpointIntervalMilliseconds;
    this.qualityEventLimit = qualityEventLimit;
    this.minimumFreeMemoryBytes = minimumFreeMemoryBytes;
    this.buffer = new BoundedRecordBuffer(bufferLimit);
    this.metrics = metricProjector;
    this.reset();
  }

  reset() {
    this.state = SessionState.IDLE;
    this.sessionId = null;
    this.sequence = 0;
    this.startedMonotonic = null;
    this.wallClockAnchorEpochSeconds = null;
    this.elapsedBeforeSegment = 0;
    this.lastMonotonic = null;
    this.lastCheckpointElapsed = 0;
    this.latestPosition = null;
    this.latestHeartRate = null;
    this.currentSpeedMps = null;
    this.sampleCounters = {
      position: 0,
      heartRate: 0,
      pressure: 0,
      motion: 0,
      runtime: 0,
    };
    this.qualityCounters = {};
    this.qualityEvents = [];
    this.lastPersistedSequence = -1;
    this.persistenceError = null;
    this.metrics.reset();
  }

  requireState(...allowed) {
    if (!allowed.includes(this.state))
      throw new Error(`Invalid transition from ${this.state}`);
  }

  prepare({ deviceReference }) {
    this.requireState(SessionState.IDLE);
    this.state = SessionState.PREPARING;
    this.sessionId = this.idFactory();
    this.startedMonotonic = this.clock.monotonicMilliseconds();
    this.lastMonotonic = this.startedMonotonic;
    this.wallClockAnchorEpochSeconds = this.clock.epochSeconds();
    try {
      this.store.create({
        sessionId: this.sessionId,
        startedAtEpochSeconds: this.wallClockAnchorEpochSeconds,
        deviceReference,
        journalFormatVersion: 1,
        sessionSchemaVersion: SESSION_SCHEMA_VERSION,
      });
    } catch (error) {
      this.failPersistence(error);
      throw error;
    }
    return this.liveState();
  }

  start() {
    this.requireState(SessionState.PREPARING, SessionState.RECOVERED);
    if (this.state === SessionState.RECOVERED)
      throw new Error(
        "Automatic resume is deferred; finalize recovered data explicitly",
      );
    this.appendCritical(FrameType.SESSION_START, {
      sessionId: this.sessionId,
      sessionSchemaVersion: SESSION_SCHEMA_VERSION,
      wallClockAnchorEpochSeconds: this.wallClockAnchorEpochSeconds,
      monotonicStartMilliseconds: this.startedMonotonic,
    });
    this.store.updateIndex(this.sessionId, {
      state: SessionState.RECORDING,
      lastSequence: this.lastPersistedSequence,
    });
    this.state = SessionState.RECORDING;
    return this.liveState();
  }

  elapsedMilliseconds() {
    if (this.startedMonotonic === null) return this.elapsedBeforeSegment;
    const now = this.clock.monotonicMilliseconds();
    const delta =
      now >= this.startedMonotonic
        ? now - this.startedMonotonic
        : 0x1_0000_0000 - this.startedMonotonic + now;
    return this.elapsedBeforeSegment + delta;
  }

  sessionRelativeTimestamp(sourceTimestamp, callbackMonotonic) {
    const callbackRelative = this.relativeFromMonotonic(callbackMonotonic);
    if (sourceTimestamp === null || sourceTimestamp === undefined)
      return {
        milliseconds: callbackRelative,
        provenance: "CALLBACK_FALLBACK",
      };
    return { milliseconds: sourceTimestamp, provenance: "SOURCE_RAW" };
  }

  relativeFromMonotonic(value) {
    if (this.startedMonotonic === null) return this.elapsedBeforeSegment;
    return value >= this.startedMonotonic
      ? this.elapsedBeforeSegment + value - this.startedMonotonic
      : this.elapsedBeforeSegment +
          (0x1_0000_0000 - this.startedMonotonic + value);
  }

  ingestPosition(sample) {
    this.requireState(SessionState.RECORDING);
    this.sampleCounters.position += 1;
    this.latestPosition = structuredClone(sample);
    for (const code of this.metrics.ingestPosition(sample))
      this.recordQuality(code, QualitySeverity.WARNING);
    this.currentSpeedMps = this.metrics.snapshot(
      this.elapsedMilliseconds(),
    ).currentSpeedMps;
    this.enqueue(FrameType.POSITION, sample, Priority.HIGH);
    this.flush();
  }

  ingestHeartRate(sample) {
    this.requireState(SessionState.RECORDING);
    this.sampleCounters.heartRate += 1;
    this.latestHeartRate = structuredClone(sample);
    for (const code of this.metrics.ingestHeartRate(sample))
      this.recordQuality(code, QualitySeverity.WARNING);
    this.enqueue(FrameType.HEART_RATE, sample, Priority.MEDIUM);
    this.flush();
  }

  ingestPressure(sample) {
    this.requireState(SessionState.RECORDING);
    this.sampleCounters.pressure += 1;
    this.enqueue(FrameType.PRESSURE, sample, Priority.MEDIUM);
    this.flush();
  }

  ingestMotion(sample) {
    this.requireState(SessionState.RECORDING);
    this.sampleCounters.motion += 1;
    if (sample.qualityCode)
      this.recordQuality(sample.qualityCode, QualitySeverity.WARNING);
  }

  ingestRuntime(sample) {
    this.requireState(SessionState.RECORDING);
    this.sampleCounters.runtime += 1;
    if (sample.freeMemoryBytes < this.minimumFreeMemoryBytes) {
      this.recordQuality(QualityCode.LOW_MEMORY, QualitySeverity.ERROR);
      this.flush();
      this.state = SessionState.FAILED;
      return;
    }
    this.enqueue(FrameType.RUNTIME, sample, Priority.LOW);
    this.flush();
  }

  tick() {
    this.requireState(SessionState.RECORDING);
    const elapsed = this.elapsedMilliseconds();
    if (
      elapsed - this.lastCheckpointElapsed >=
      this.checkpointIntervalMilliseconds
    )
      this.checkpoint();
    return this.liveState();
  }

  recordQuality(code, severity = QualitySeverity.WARNING, detail = null) {
    if (!Object.values(QualityCode).includes(code))
      throw new Error(`Unknown quality code: ${code}`);
    this.qualityCounters[code] = (this.qualityCounters[code] ?? 0) + 1;
    const event = {
      code,
      severity,
      elapsedMilliseconds: this.elapsedMilliseconds(),
      detail,
    };
    this.qualityEvents.push(event);
    if (this.qualityEvents.length > this.qualityEventLimit)
      this.qualityEvents.shift();
    if (this.state === SessionState.RECORDING)
      this.enqueue(FrameType.QUALITY, event, Priority.MEDIUM);
  }

  enqueue(type, payload, priority) {
    const accepted = this.buffer.push({
      type,
      payload: structuredClone(payload),
      priority,
    });
    if (!accepted && this.state === SessionState.RECORDING) {
      this.qualityCounters[QualityCode.BUFFER_OVERFLOW] =
        (this.qualityCounters[QualityCode.BUFFER_OVERFLOW] ?? 0) + 1;
    }
    return accepted;
  }

  flush() {
    while (this.buffer.length > 0) {
      const record = this.buffer.shift();
      try {
        this.append(record.type, record.payload);
      } catch (error) {
        this.failPersistence(error);
        throw error;
      }
    }
  }

  append(type, payload) {
    const frame = encodeFrame({ sequence: this.sequence, type, payload });
    this.store.append(this.sessionId, frame);
    this.lastPersistedSequence = this.sequence;
    this.sequence += 1;
  }

  appendCritical(type, payload) {
    try {
      this.append(type, payload);
    } catch (error) {
      this.failPersistence(error);
      throw error;
    }
  }

  checkpoint() {
    this.requireState(SessionState.RECORDING, SessionState.STOPPING);
    this.flush();
    const elapsed = this.elapsedMilliseconds();
    this.appendCritical(FrameType.CHECKPOINT, this.checkpointPayload(elapsed));
    this.store.updateIndex(this.sessionId, {
      state: this.state,
      lastSequence: this.lastPersistedSequence,
      checkpointSequence: this.lastPersistedSequence,
    });
    this.lastCheckpointElapsed = elapsed;
  }

  checkpointPayload(elapsed = this.elapsedMilliseconds()) {
    return {
      sessionId: this.sessionId,
      elapsedMilliseconds: elapsed,
      latestPosition: this.latestPosition,
      latestHeartRate: this.latestHeartRate,
      currentSpeedMps: this.currentSpeedMps,
      metricState: this.metrics.checkpointState(),
      sampleCounters: structuredClone(this.sampleCounters),
      qualityCounters: structuredClone(this.qualityCounters),
      lastDurableSequence: this.lastPersistedSequence,
    };
  }

  stop() {
    if (this.state === SessionState.COMPLETED) return this.liveState();
    this.requireState(SessionState.RECORDING);
    this.state = SessionState.STOPPING;
    try {
      this.flush();
      this.appendCritical(FrameType.SESSION_STOP, {
        sessionId: this.sessionId,
        elapsedMilliseconds: this.elapsedMilliseconds(),
      });
      this.checkpoint();
      const finalPayload = {
        ...this.checkpointPayload(),
        sessionSchemaVersion: SESSION_SCHEMA_VERSION,
        completedAtEpochSeconds: this.clock.epochSeconds(),
      };
      this.appendCritical(FrameType.SESSION_FINAL, finalPayload);
      const integrity = this.store.validateTail(
        this.sessionId,
        this.lastPersistedSequence,
      );
      if (integrity.integrity !== "VALID")
        throw Object.assign(
          new Error("Durable finalization verification failed"),
          { code: "JOURNAL_CORRUPT" },
        );
      this.store.updateIndex(this.sessionId, {
        state: SessionState.COMPLETED,
        lastSequence: this.lastPersistedSequence,
      });
      this.state = SessionState.COMPLETED;
      return this.liveState();
    } catch (error) {
      this.failPersistence(error);
      throw error;
    }
  }

  recover(sessionId) {
    this.requireState(SessionState.IDLE);
    const parsed = this.store.recoveryView?.(sessionId);
    if (parsed === null || parsed === undefined)
      throw new Error("Session does not exist");
    if (parsed.integrity === "VALID")
      throw new Error("Completed session does not require recovery");
    if (
      parsed.frames.length === 0 ||
      parsed.integrity === "UNSUPPORTED_VERSION"
    ) {
      this.state = SessionState.FAILED;
      return { ...parsed, liveState: this.liveState() };
    }
    this.reset();
    this.sessionId = sessionId;
    this.state = SessionState.RECOVERED;
    this.replay(parsed.frames);
    this.sequence = parsed.frames.at(-1).sequence + 1;
    this.lastPersistedSequence = parsed.frames.at(-1).sequence;
    if (parsed.discardedBytes > 0)
      this.addRecoveredQuality(
        QualityCode.PARTIAL_TAIL_DISCARDED,
        QualitySeverity.WARNING,
        {
          discardedBytes: parsed.discardedBytes,
        },
      );
    this.addRecoveredQuality(
      QualityCode.RECOVERY_APPLIED,
      QualitySeverity.INFO,
    );
    this.store.updateIndex(sessionId, {
      state: SessionState.RECOVERED,
      lastSequence: this.lastPersistedSequence,
    });
    return { ...parsed, liveState: this.liveState() };
  }

  replay(frames) {
    const start = frames.find(
      (frame) => frame.type === FrameType.SESSION_START,
    );
    if (!start) throw new Error("Recoverable journal has no session start");
    this.wallClockAnchorEpochSeconds =
      start.payload.wallClockAnchorEpochSeconds;
    this.startedMonotonic = null;
    const checkpoint = [...frames]
      .reverse()
      .find((frame) => frame.type === FrameType.CHECKPOINT);
    if (checkpoint) this.applyCheckpoint(checkpoint.payload);
    const replayAfter = checkpoint ? checkpoint.sequence : start.sequence;
    for (const frame of frames.filter((item) => item.sequence > replayAfter))
      this.applyFrame(frame);
  }

  applyCheckpoint(payload) {
    this.elapsedBeforeSegment = payload.elapsedMilliseconds;
    this.latestPosition = payload.latestPosition;
    this.latestHeartRate = payload.latestHeartRate;
    this.currentSpeedMps = payload.currentSpeedMps;
    this.metrics.restore(payload.metricState);
    this.sampleCounters = { ...this.sampleCounters, ...payload.sampleCounters };
    this.qualityCounters = { ...payload.qualityCounters };
  }

  applyFrame(frame) {
    if (frame.type === FrameType.POSITION) {
      this.latestPosition = frame.payload;
      this.metrics.ingestPosition(frame.payload);
      this.currentSpeedMps = this.metrics.snapshot(
        frame.payload.relativeMilliseconds ?? this.elapsedBeforeSegment,
      ).currentSpeedMps;
      this.sampleCounters.position += 1;
    } else if (frame.type === FrameType.HEART_RATE) {
      this.latestHeartRate = frame.payload;
      this.metrics.ingestHeartRate(frame.payload);
      this.sampleCounters.heartRate += 1;
    } else if (frame.type === FrameType.PRESSURE)
      this.sampleCounters.pressure += 1;
    else if (frame.type === FrameType.RUNTIME) this.sampleCounters.runtime += 1;
    else if (frame.type === FrameType.QUALITY)
      this.qualityCounters[frame.payload.code] =
        (this.qualityCounters[frame.payload.code] ?? 0) + 1;
    else if (frame.type === FrameType.SESSION_STOP)
      this.elapsedBeforeSegment = Math.max(
        this.elapsedBeforeSegment,
        frame.payload.elapsedMilliseconds,
      );
  }

  addRecoveredQuality(code, severity, detail = null) {
    this.qualityCounters[code] = (this.qualityCounters[code] ?? 0) + 1;
    this.qualityEvents.push({
      code,
      severity,
      elapsedMilliseconds: this.elapsedBeforeSegment,
      detail,
    });
  }

  finalizeRecovered() {
    this.requireState(SessionState.RECOVERED);
    this.state = SessionState.STOPPING;
    try {
      this.appendCritical(
        FrameType.CHECKPOINT,
        this.checkpointPayload(this.elapsedBeforeSegment),
      );
      this.appendCritical(FrameType.SESSION_FINAL, {
        ...this.checkpointPayload(this.elapsedBeforeSegment),
        sessionSchemaVersion: SESSION_SCHEMA_VERSION,
        completedAtEpochSeconds: this.clock.epochSeconds(),
        recovered: true,
      });
      if (
        this.store.validateTail(this.sessionId, this.lastPersistedSequence)
          .integrity !== "VALID"
      )
        throw new Error("Recovered finalization failed");
      this.store.updateIndex(this.sessionId, {
        state: SessionState.COMPLETED,
        lastSequence: this.lastPersistedSequence,
      });
      this.state = SessionState.COMPLETED;
      return this.liveState();
    } catch (error) {
      this.failPersistence(error);
      throw error;
    }
  }

  failPersistence(error) {
    this.persistenceError = error.code ?? "STORAGE_WRITE_FAILED";
    this.state = SessionState.FAILED;
  }

  liveState() {
    const elapsedMilliseconds = this.elapsedMilliseconds();
    const metricState = this.metrics.snapshot(elapsedMilliseconds);
    return Object.freeze({
      sessionId: this.sessionId,
      state: this.state,
      elapsedMilliseconds,
      wallClockEpochSeconds: this.clock.epochSeconds(),
      currentSpeedMps: metricState.currentSpeedMps,
      maximumSpeedMps: metricState.maximumSpeedMps,
      distanceMeters: metricState.distanceMeters,
      heartRateBpm: metricState.heartRateBpm,
      gpsStatus: metricState.gpsStatus,
      gpsAgeMilliseconds: metricState.gpsAgeMilliseconds,
      heartRateStatus: metricState.heartRateStatus,
      heartRateAgeMilliseconds: metricState.heartRateAgeMilliseconds,
      validGpsSampleCount: metricState.validGpsSampleCount,
      rejectedSegmentCount: metricState.rejectedSegmentCount,
      latestHeartRate: this.latestHeartRate,
      gpsQuality: this.latestPosition?.quality ?? null,
      sampleCounters: Object.freeze({ ...this.sampleCounters }),
      qualityCounters: Object.freeze({ ...this.qualityCounters }),
      recentQualityEvents: Object.freeze(
        this.qualityEvents.map((event) => Object.freeze({ ...event })),
      ),
      lastPersistedSequence: this.lastPersistedSequence,
      bufferedRecords: this.buffer.length,
      persistenceError: this.persistenceError,
      recordingHealth:
        this.state === SessionState.FAILED ? "FAILED" : "AVAILABLE",
      persistenceHealth: this.persistenceError === null ? "VALID" : "DEGRADED",
      qualitySummary:
        Object.keys(this.qualityCounters).length === 0 ? "VALID" : "DEGRADED",
    });
  }
}

export class FakeClock {
  constructor(monotonicMilliseconds = 1000, epochSeconds = 1_700_000_000) {
    this.monotonic = monotonicMilliseconds;
    this.epoch = epochSeconds;
  }

  monotonicMilliseconds() {
    return this.monotonic;
  }

  epochSeconds() {
    return this.epoch;
  }

  advance(milliseconds) {
    this.monotonic = (this.monotonic + milliseconds) % 0x1_0000_0000;
    this.epoch += Math.floor(milliseconds / 1000);
  }
}
