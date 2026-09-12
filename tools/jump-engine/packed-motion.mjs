// LE26: three UInt32 clocks, three Float32 accel axes, quality byte, state byte.
export function decodePackedMotion(line) {
  if (line.startsWith("E|")) return decodeDeltaMotion(line);
  const fields = line.split("|");
  if (
    fields.length !== 4 ||
    fields[0] !== "D" ||
    !/^\d+$/.test(fields[1]) ||
    !/^\d+$/.test(fields[3])
  )
    throw new Error("Invalid packed header");
  const start = Number(fields[1]);
  const bytes = Buffer.from(fields[2], "base64");
  if (
    bytes.toString("base64") !== fields[2] ||
    !bytes.length ||
    bytes.length % 26 ||
    bytes.length > 260 ||
    start + bytes.length / 26 > 150
  )
    throw new Error("Invalid packed length or encoding");
  let a = 1,
    b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  if (b * 65536 + a !== Number(fields[3]))
    throw new Error("Packed checksum mismatch");
  return Array.from({ length: bytes.length / 26 }, (_, i) => {
    const at = i * 26;
    const raw = bytes.readUInt32LE(at);
    const normalizedTimestamp = bytes.readUInt32LE(at + 4);
    const callbackTimestamp = bytes.readUInt32LE(at + 8);
    const accelMillig = [12, 16, 20].map((offset) =>
      bytes.readFloatLE(at + offset),
    );
    const state = bytes[at + 25];
    if (
      !accelMillig.every(Number.isFinite) ||
      normalizedTimestamp === 0xffffffff ||
      callbackTimestamp === 0xffffffff ||
      state > 7 ||
      bytes[at + 24] > 15
    )
      throw new Error("Invalid packed values");
    return {
      recordType: "motion",
      sequence: start + i,
      rawSampleTimestamp: raw === 0xffffffff ? null : raw,
      normalizedTimestamp,
      callbackTimestamp,
      rawGyroTimestamp: null,
      accelMillig,
      gyroDegreesPerSecond: [null, null, null],
      qualityMask: bytes[at + 24],
      garminState: ["GROUND", "POSSIBLE_TAKEOFF", "FLIGHT", "POSSIBLE_LANDING"][
        state & 3
      ],
      garminLandingStable: (state & 4) !== 0,
    };
  });
}

function decodeDeltaMotion(line) {
  const fields = line.split("|");
  if (
    fields.length !== 4 ||
    !/^\d+$/.test(fields[1]) ||
    !/^\d+$/.test(fields[3])
  )
    throw new Error("Invalid delta header");
  const start = Number(fields[1]);
  const bytes = Buffer.from(fields[2], "base64");
  const count = (bytes.length - 12) / 19;
  if (
    !Number.isSafeInteger(start) ||
    bytes.toString("base64") !== fields[2] ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 25 ||
    start + count > 225
  )
    throw new Error("Invalid delta length or encoding");
  let a = 1,
    b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  if (b * 65536 + a !== Number(fields[3]))
    throw new Error("Delta checksum mismatch");
  const bases = [0, 4, 8].map((offset) => bytes.readUInt32LE(offset));
  if (bases.includes(0xffffffff)) throw new Error("Invalid delta clock base");
  return Array.from({ length: count }, (_, i) => {
    const at = 12 + i * 19;
    const clocks = bases.map((base, j) => {
      const delta = bytes.readUInt16LE(at + j * 2);
      if (delta === 65535) {
        if (j !== 0) throw new Error("Invalid delta clock sentinel");
        return null;
      }
      const value = (base + delta) % 0x100000000;
      if (value === 0xffffffff) throw new Error("Invalid delta clock value");
      return value;
    });
    const accelMillig = [6, 10, 14].map((offset) =>
      bytes.readFloatLE(at + offset),
    );
    const flags = bytes[at + 18];
    if (!accelMillig.every(Number.isFinite) || flags > 127)
      throw new Error("Invalid delta sample");
    const state = flags >> 4;
    return {
      recordType: "motion",
      sequence: start + i,
      rawSampleTimestamp: clocks[0],
      normalizedTimestamp: clocks[1],
      callbackTimestamp: clocks[2],
      rawGyroTimestamp: null,
      accelMillig,
      gyroDegreesPerSecond: [null, null, null],
      qualityMask: flags & 15,
      garminState: ["GROUND", "POSSIBLE_TAKEOFF", "FLIGHT", "POSSIBLE_LANDING"][
        state & 3
      ],
      garminLandingStable: (state & 4) !== 0,
    };
  });
}

export function expandCandidate(row) {
  if (
    !Array.isArray(row) ||
    row.length !== 16 ||
    row.some((v) => v !== null && !Number.isFinite(v))
  )
    throw new Error("Invalid compact candidate");
  return {
    candidateId: row[0],
    status: row[1] ? "CONFIRMED" : "REJECTED",
    candidateStartedMilliseconds: row[2],
    takeoffMilliseconds: row[3],
    landingMilliseconds: row[4],
    endMilliseconds: row[5],
    reasonMask: row[6],
    qualityMask: row[7],
    featuresAtDecision: {
      takeoffPeakAccelMillig: row[8],
      flightMinimumAccelMillig: row[9],
      landingPeakAccelMillig: row[10],
      flightDurationMilliseconds: row[11],
      sustainedLowGMilliseconds: row[12],
      envelopeMatched: row[13] === 1,
      takeoffPeakThresholdMillig: 3000,
      maximumFlightMinimumMillig: 408,
    },
    postEventDiagnostics: { peakAccelMillig: row[14] },
    landingStable: row[15] === 1,
  };
}
