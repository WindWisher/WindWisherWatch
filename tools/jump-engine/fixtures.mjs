import fs from "node:fs/promises";

export async function loadScenarioCatalog(path) {
  const catalog = JSON.parse(await fs.readFile(path, "utf8"));
  if (catalog.fixtureKind !== "synthetic-motion-segment-catalog")
    throw new Error("Unsupported Jump Engine fixture catalog");
  return catalog;
}

function resolveScenario(catalog, id) {
  const scenario = catalog.scenarios.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown synthetic scenario: ${id}`);
  if (!scenario.extends) return structuredClone(scenario);
  const base = resolveScenario(catalog, scenario.extends);
  return { ...base, ...structuredClone(scenario), segments: base.segments };
}

export function generateScenario(catalog, id, profile = "MEDIUM") {
  const scenario = resolveScenario(catalog, id);
  const sampleRateHz = profile === "HIGH" ? 50 : 25;
  const interval = 1000 / sampleRateHz;
  const samples = [];
  let sequence = 0;
  let callbackTimestamp = 0;
  for (const segment of scenario.segments) {
    const count = Math.round(segment.durationMilliseconds / interval);
    for (let index = 0; index < count; index += 1) {
      if (sequence === scenario.callbackGapAtSample)
        callbackTimestamp += scenario.callbackGapMilliseconds;
      let rawSampleTimestamp = callbackTimestamp;
      if (sequence === scenario.duplicateRawTimestampAtSample)
        rawSampleTimestamp = samples.at(-1).rawSampleTimestamp;
      const accel = segment.accelPatternMps2
        ? segment.accelPatternMps2[index % segment.accelPatternMps2.length]
        : null;
      const accelVector = segment.accelVectorPatternMps2
        ? segment.accelVectorPatternMps2[
            index % segment.accelVectorPatternMps2.length
          ]
        : [accel, 0, 0];
      const outlier = sequence === scenario.gyroOutlierAtSample;
      samples.push({
        sequence,
        rawSampleTimestamp,
        callbackTimestamp,
        accel: { x: accelVector[0], y: accelVector[1], z: accelVector[2] },
        gyro: outlier ? { x: 32764, y: -16296, z: 0 } : { x: 20, y: 10, z: 5 },
      });
      sequence += 1;
      callbackTimestamp += interval;
    }
  }
  return { scenario, samples };
}
