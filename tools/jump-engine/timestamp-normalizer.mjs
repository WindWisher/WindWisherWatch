import { QualityFlag } from "./model.mjs";

export class TimestampNormalizer {
  constructor({ sampleRateHz, sampleGapMultiplier }) {
    this.expectedIntervalMilliseconds = 1000 / sampleRateHz;
    this.sampleGapMultiplier = sampleGapMultiplier;
    this.previousRaw = null;
    this.previousCallback = null;
    this.previousNormalized = null;
  }

  normalize(rawSampleTimestamp, callbackTimestamp) {
    if (!Number.isFinite(callbackTimestamp) || callbackTimestamp < 0)
      throw new Error(
        "Callback timestamp must use a non-negative monotonic clock",
      );
    const flags = [];
    const rawValid =
      Number.isFinite(rawSampleTimestamp) &&
      rawSampleTimestamp >= 0 &&
      (this.previousRaw === null || rawSampleTimestamp > this.previousRaw);
    let normalizedTimestamp = rawValid ? rawSampleTimestamp : callbackTimestamp;
    let provenance = rawValid ? "RAW_SAMPLE" : "CALLBACK_FALLBACK";
    if (!rawValid) flags.push(QualityFlag.TIMESTAMP_DEGRADED);
    if (
      this.previousNormalized !== null &&
      normalizedTimestamp <= this.previousNormalized
    ) {
      normalizedTimestamp =
        this.previousNormalized + this.expectedIntervalMilliseconds;
      provenance = "CALLBACK_INTERPOLATED";
      if (!flags.includes(QualityFlag.TIMESTAMP_DEGRADED))
        flags.push(QualityFlag.TIMESTAMP_DEGRADED);
    }
    if (
      this.previousNormalized !== null &&
      normalizedTimestamp - this.previousNormalized >
        this.expectedIntervalMilliseconds * this.sampleGapMultiplier
    )
      flags.push(QualityFlag.SAMPLE_GAP);
    this.previousRaw = rawValid ? rawSampleTimestamp : this.previousRaw;
    this.previousCallback = callbackTimestamp;
    this.previousNormalized = normalizedTimestamp;
    return {
      rawSampleTimestamp,
      callbackTimestamp,
      normalizedTimestamp,
      provenance,
      qualityFlags: flags,
    };
  }
}
