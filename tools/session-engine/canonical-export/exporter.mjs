import { once } from "node:events";
import { FrameType, parseJournal } from "../journal.mjs";
import { Crc32Accumulator, encodeCanonicalRecord } from "./format.mjs";

const PRODUCER_VERSION = "0.1.0-m4";
const METRIC_PROJECTION_VERSION = "1.0.0";
const MAX_NOTABLE_EVENTS = 16;

function isoFromEpochSeconds(value) {
  if (!Number.isInteger(value) || value < 0)
    throw new Error("Canonical absolute timestamp is invalid");
  return new Date(value * 1000).toISOString();
}

function sourceCounts(finalPayload) {
  const samples = finalPayload.sampleCounters ?? {};
  return {
    track: samples.position ?? 0,
    heartRate: samples.heartRate ?? 0,
    pressure: samples.pressure ?? 0,
    quality: Object.values(finalPayload.qualityCounters ?? {}).reduce(
      (total, count) => total + count,
      0,
    ),
  };
}

function sectionsFor(counts) {
  return [
    ...(counts.track > 0 ? ["track"] : []),
    ...(counts.heartRate > 0 ? ["heart_rate"] : []),
    ...(counts.pressure > 0 ? ["pressure"] : []),
    "quality",
    "operational_summary",
    "completion",
  ];
}

function privacyFor(counts) {
  return [
    "PUBLIC_METADATA",
    "OPERATIONAL",
    ...(counts.track > 0 ? ["SENSITIVE_LOCATION"] : []),
    ...(counts.heartRate > 0 ? ["SENSITIVE_HEALTH"] : []),
  ];
}

function finite(value) {
  return Number.isFinite(value);
}

function mapTrack(frame) {
  const sample = frame.payload;
  if (
    !Number.isInteger(sample.relativeMilliseconds) ||
    sample.relativeMilliseconds < 0 ||
    !finite(sample.latitudeDegrees) ||
    sample.latitudeDegrees < -90 ||
    sample.latitudeDegrees > 90 ||
    !finite(sample.longitudeDegrees) ||
    sample.longitudeDegrees < -180 ||
    sample.longitudeDegrees > 180
  )
    return null;
  const speed =
    finite(sample.groundSpeedMps) &&
    sample.groundSpeedMps >= 0 &&
    sample.groundSpeedMps <= 80
      ? sample.groundSpeedMps
      : null;
  return {
    journalSequence: frame.sequence,
    relativeMilliseconds: sample.relativeMilliseconds,
    latitudeDegrees: sample.latitudeDegrees,
    longitudeDegrees: sample.longitudeDegrees,
    ...(finite(sample.altitudeMeters)
      ? { altitudeMeters: sample.altitudeMeters }
      : {}),
    groundSpeedMps: speed,
    ...(finite(sample.headingDegrees)
      ? { headingDegrees: sample.headingDegrees }
      : {}),
    ...(finite(sample.accuracyMeters)
      ? { horizontalAccuracyMeters: sample.accuracyMeters }
      : {}),
    fixQuality: sample.quality ?? "UNKNOWN",
    usable: sample.usable !== false,
    source: "device_gps",
    timestampProvenance: sample.timestampProvenance ?? "SESSION_MONOTONIC",
  };
}

function mapHeartRate(frame) {
  const sample = frame.payload;
  if (
    !Number.isInteger(sample.relativeMilliseconds) ||
    sample.relativeMilliseconds < 0 ||
    !Number.isInteger(sample.bpm) ||
    sample.bpm < 20 ||
    sample.bpm > 250
  )
    return null;
  const sourceMap = {
    SYNTHETIC: "platform_fused",
    platform: "platform_fused",
    PLATFORM: "platform_fused",
  };
  return {
    journalSequence: frame.sequence,
    relativeMilliseconds: sample.relativeMilliseconds,
    bpm: sample.bpm,
    source: sourceMap[sample.source] ?? "platform_fused",
    quality: sample.quality ?? "unknown",
  };
}

function mapPressure(frame) {
  const sample = frame.payload;
  const pressure = sample.pressurePascals ?? sample.pascals;
  if (
    !Number.isInteger(sample.relativeMilliseconds) ||
    sample.relativeMilliseconds < 0 ||
    !finite(pressure) ||
    pressure < 10_000 ||
    pressure > 120_000
  )
    return null;
  return {
    journalSequence: frame.sequence,
    relativeMilliseconds: sample.relativeMilliseconds,
    pressurePascals: pressure,
    source: "platform_sensor",
  };
}

export class CanonicalSessionExporter {
  constructor({
    store,
    sessionId,
    producerPlatform = "host_reference",
    device = { platform: "host_reference" },
  }) {
    this.store = store;
    this.sessionId = sessionId;
    this.producerPlatform = producerPlatform;
    this.device = structuredClone(device);
  }

  async *lines() {
    const descriptor = this.store.exportDescriptor(this.sessionId);
    const start = descriptor.startFrame.payload;
    const final = descriptor.finalFrame.payload;
    const completionStatus = final.recovered
      ? "RECOVERED_THEN_COMPLETED"
      : "COMPLETED";
    const counts = sourceCounts(final);
    const streamChecksum = new Crc32Accumulator();
    let recordSequence = 0;
    const emittedCounts = { track: 0, heartRate: 0, pressure: 0, quality: 0 };
    const notableEvents = [];
    let expectedJournalSequence = 0;

    const emit = (recordType, payload, includeInStreamChecksum = true) => {
      const encoded = encodeCanonicalRecord({
        recordSequence,
        recordType,
        payload,
      });
      recordSequence += 1;
      if (includeInStreamChecksum)
        streamChecksum.update(Buffer.from(encoded.line, "utf8"));
      return encoded.line;
    };

    yield emit("manifest", {
      sessionId: this.sessionId,
      producer: {
        platform: this.producerPlatform,
        producerVersion: PRODUCER_VERSION,
        journalFormatVersion: descriptor.metadata.journalFormatVersion,
        metricProjectionVersion: METRIC_PROJECTION_VERSION,
      },
      device: this.device,
      lifecycle: { completionStatus },
      timing: {
        startedAt: isoFromEpochSeconds(start.wallClockAnchorEpochSeconds),
        endedAt: isoFromEpochSeconds(final.completedAtEpochSeconds),
        elapsedDurationMilliseconds: final.elapsedMilliseconds,
      },
      sections: sectionsFor(counts),
      privacy: {
        visibility: "private",
        classifications: privacyFor(counts),
      },
    });

    for (const chunk of descriptor.chunks()) {
      const parsed = parseJournal(chunk);
      if (parsed.issues.length > 0)
        throw new Error(
          `Source journal chunk is invalid: ${parsed.issues[0].code}`,
        );
      for (const frame of parsed.frames) {
        if (frame.sequence !== expectedJournalSequence)
          throw new Error(
            "Source journal sequence is duplicate or out of order",
          );
        expectedJournalSequence += 1;
        if (frame.type === FrameType.POSITION) {
          const payload = mapTrack(frame);
          if (payload !== null) {
            emittedCounts.track += 1;
            yield emit("track", payload);
          }
        } else if (frame.type === FrameType.HEART_RATE) {
          const payload = mapHeartRate(frame);
          if (payload !== null) {
            emittedCounts.heartRate += 1;
            yield emit("heart_rate", payload);
          }
        } else if (frame.type === FrameType.PRESSURE) {
          const payload = mapPressure(frame);
          if (payload !== null) {
            emittedCounts.pressure += 1;
            yield emit("pressure", payload);
          }
        } else if (frame.type === FrameType.QUALITY) {
          if (notableEvents.length < MAX_NOTABLE_EVENTS)
            notableEvents.push({
              code: frame.payload.code,
              relativeMilliseconds:
                frame.payload.elapsedMilliseconds ?? final.elapsedMilliseconds,
            });
        }
      }
    }

    yield emit("quality", {
      counters: final.qualityCounters ?? {},
      notableEvents,
    });
    emittedCounts.quality = 1;
    yield emit("operational_summary", {
      projectionKind: "WATCH_OPERATIONAL_PROJECTION",
      elapsedDurationMilliseconds: final.elapsedMilliseconds,
      distanceMeters: final.metricState?.distanceMeters ?? 0,
      maximumSpeedMps: final.metricState?.maximumSpeedMps ?? null,
      sampleCounts: counts,
      qualityCounters: final.qualityCounters ?? {},
    });
    yield emit(
      "completion",
      {
        completionStatus,
        sourceJournalIntegrity: "VALID",
        recordCounts: emittedCounts,
        streamChecksumAlgorithm: "crc32",
        streamChecksum: streamChecksum.hex(),
      },
      false,
    );
  }

  async writeTo(writable) {
    for await (const line of this.lines())
      if (!writable.write(line)) await once(writable, "drain");
    writable.end();
    await once(writable, "finish");
  }
}
