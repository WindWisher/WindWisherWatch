import { parseGarminTransfer } from "./garmin-transfer.mjs";
import { encodeFrame, FrameType } from "./journal.mjs";
import { CanonicalSessionExporter } from "./canonical-export/exporter.mjs";
import { parseCanonicalStream } from "./canonical-export/parser.mjs";

function requireValid(ok) {
  if (!ok) throw new Error("Unsupported or inconsistent Garmin payload");
}
function fields(text) {
  const result = Object.create(null);
  for (const part of text.split(";")) {
    const pair = part.split("=");
    requireValid(
      pair.length === 2 &&
        /^[A-Za-z][A-Za-z0-9]*$/.test(pair[0]) &&
        !Object.hasOwn(result, pair[0]),
    );
    result[pair[0]] = pair[1];
  }
  return result;
}
function num(
  p,
  k,
  {
    nullable = false,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    integer = false,
  } = {},
) {
  if (nullable && p[k] === "-") return null;
  requireValid(
    typeof p[k] === "string" &&
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(p[k]),
  );
  const n = Number(p[k]);
  requireValid(
    Number.isFinite(n) &&
      n >= min &&
      n <= max &&
      (!integer || Number.isSafeInteger(n)),
  );
  return n;
}

// Pure host bridge; no device/filesystem/network writes or source mutation.
export async function canonicalFromGarminTransfer(lines) {
  const transfer = await parseGarminTransfer(lines);
  const parsed = transfer.frames.map((f) => ({
    frame: f,
    p: fields(f.payload),
  }));
  const start = parsed[0].p,
    final = parsed.at(-1).p;
  requireValid(start.schema === "1.0.0");
  const elapsed = num(final, "elapsed", { integer: true });
  const started = num(start, "wall", { integer: true }),
    ended = num(final, "completed", { integer: true });
  requireValid(
    ended >= started &&
      (final.recovered === undefined || final.recovered === "true"),
  );
  const observed = { position: 0, heartRate: 0, pressure: 0 };
  const quality = Object.create(null);
  let previousTime = 0;
  const records = parsed.map(({ frame, p }) => {
    let payload = {};
    const type = FrameType[frame.frameType];
    if (p.t !== undefined) {
      const t = num(p, "t", { integer: true, max: elapsed });
      requireValid(t >= previousTime);
      previousTime = t;
      payload.relativeMilliseconds = t;
    }
    switch (frame.frameType) {
      case "SESSION_START":
        payload = { wallClockAnchorEpochSeconds: started };
        break;
      case "POSITION":
        observed.position++;
        requireValid(p.usable === "0" || p.usable === "1");
        payload = {
          relativeMilliseconds: num(p, "t", { integer: true, max: elapsed }),
          latitudeDegrees: num(p, "lat", { min: -90, max: 90 }),
          longitudeDegrees: num(p, "lon", { min: -180, max: 180 }),
          groundSpeedMps: num(p, "speed", { nullable: true, max: 80 }),
          quality: num(p, "quality", { integer: true, max: 100 }),
          usable: p.usable === "1",
          timestampProvenance: "SESSION_MONOTONIC",
        };
        break;
      case "HEART_RATE":
        observed.heartRate++;
        requireValid(p.source === "platform");
        payload = {
          relativeMilliseconds: num(p, "t", { integer: true, max: elapsed }),
          bpm: num(p, "bpm", { integer: true, min: 20, max: 250 }),
          source: "platform",
          quality: "unknown",
        };
        break;
      case "PRESSURE":
        observed.pressure++;
        payload = {
          relativeMilliseconds: num(p, "t", { integer: true, max: elapsed }),
          pressurePascals: num(p, "pascals", { min: 10000, max: 120000 }),
        };
        break;
      case "QUALITY":
        requireValid(
          typeof p.code === "string" && /^[A-Z][A-Z0-9_]{2,63}$/.test(p.code),
        );
        quality[p.code] = (quality[p.code] ?? 0) + 1;
        payload = {
          code: p.code,
          elapsedMilliseconds: num(p, "t", { integer: true, max: elapsed }),
        };
        break;
      case "SESSION_FINAL":
        payload = {
          elapsedMilliseconds: elapsed,
          completedAtEpochSeconds: ended,
          recovered: final.recovered === "true",
          sampleCounters: observed,
          qualityCounters: quality,
          metricState: {
            distanceMeters: num(final, "dist"),
            maximumSpeedMps: num(final, "max", { nullable: true, max: 80 }),
          },
        };
        break;
    }
    return { sequence: frame.sequence, type, payload };
  });
  requireValid(
    observed.position === num(final, "pos", { integer: true }) &&
      observed.heartRate === num(final, "hr", { integer: true }) &&
      observed.pressure === num(final, "pressure", { integer: true }),
  );
  const recordedQuality = Object.values(quality).reduce((a, b) => a + b, 0),
    declaredQuality = num(final, "quality", { integer: true });
  // Recovery increments a counter without necessarily emitting a QUALITY frame.
  // Preserve the unexplained count explicitly, never invent a specific cause.
  requireValid(declaredQuality >= recordedQuality);
  if (declaredQuality > recordedQuality)
    quality.UNCLASSIFIED_SOURCE_QUALITY = declaredQuality - recordedQuality;
  const descriptor = {
    metadata: { journalFormatVersion: 1 },
    startFrame: records[0],
    finalFrame: records.at(-1),
    *chunks() {
      for (const record of records) yield encodeFrame(record);
    },
  };
  const exporter = new CanonicalSessionExporter({
    store: { exportDescriptor: () => descriptor },
    sessionId: transfer.sessionId,
    producerPlatform: "garmin",
    device: { platform: "garmin" },
  });
  const output = [];
  for await (const line of exporter.lines()) output.push(line);
  // Validate before returning anything to an external caller or writable sink.
  await parseCanonicalStream(output.join(""));
  return {
    lines: output,
    privacy: "PRIVATE_SESSION_TELEMETRY",
    sourceIntegrity: transfer.integrity,
    mappingVersion: "garmin-text-to-canonical-1",
    sourceFrames: transfer.frames,
  };
}
