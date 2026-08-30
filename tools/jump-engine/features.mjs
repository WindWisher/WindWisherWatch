import { GyroQuality } from "./model.mjs";

export function vectorMagnitude(vector) {
  if (!vector) return null;
  const values = [vector.x, vector.y, vector.z];
  if (!values.every(Number.isFinite)) return null;
  return Math.hypot(...values);
}

export function classifyGyro(gyro, config) {
  const magnitude = vectorMagnitude(gyro);
  if (magnitude === null)
    return {
      rawValue: gyro ?? null,
      magnitude: null,
      quality: GyroQuality.UNAVAILABLE,
    };
  if (
    magnitude > config.invalidGyroDegreesPerSecond ||
    [gyro.x, gyro.y, gyro.z].some(
      (value) => Math.abs(value) >= config.invalidGyroDegreesPerSecond,
    )
  )
    return {
      rawValue: structuredClone(gyro),
      magnitude,
      quality: GyroQuality.INVALID_OUTLIER_CANDIDATE,
    };
  return {
    rawValue: structuredClone(gyro),
    magnitude,
    quality:
      magnitude > config.suspiciousGyroDegreesPerSecond
        ? GyroQuality.SUSPICIOUS
        : GyroQuality.PLAUSIBLE,
  };
}

export class LightSmoother {
  constructor(samples) {
    this.samples = samples;
    this.values = [];
    this.total = 0;
  }

  add(value) {
    this.values.push(value);
    this.total += value;
    if (this.values.length > this.samples) this.total -= this.values.shift();
    return this.total / this.values.length;
  }
}
