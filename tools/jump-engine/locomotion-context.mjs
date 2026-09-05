export const LocomotionState = Object.freeze({
  NONE: "LOCOMOTION_NONE",
  POSSIBLE: "LOCOMOTION_POSSIBLE",
  PERIODIC: "LOCOMOTION_PERIODIC",
  AMBIGUOUS: "LOCOMOTION_AMBIGUOUS",
});

function summarize(timestamps, start, end, degraded) {
  const selected = timestamps.filter(
    (timestamp) => timestamp >= start && timestamp <= end,
  );
  const intervals = selected
    .slice(1)
    .map((value, index) => value - selected[index]);
  const mean = intervals.length
    ? intervals.reduce((total, value) => total + value, 0) / intervals.length
    : null;
  const variance = intervals.length
    ? intervals.reduce((total, value) => total + (value - mean) ** 2, 0) /
      intervals.length
    : null;
  const coefficientOfVariation =
    mean && variance !== null ? Math.sqrt(variance) / mean : null;
  const periodic =
    selected.length >= 4 &&
    mean >= 250 &&
    mean <= 1200 &&
    coefficientOfVariation <= 0.25;
  return Object.freeze({
    state: degraded
      ? LocomotionState.AMBIGUOUS
      : periodic
        ? LocomotionState.PERIODIC
        : selected.length >= 2
          ? LocomotionState.POSSIBLE
          : LocomotionState.NONE,
    impactCount: selected.length,
    intervalMeanMilliseconds: mean,
    intervalVarianceMillisecondsSquared: variance,
    intervalCoefficientOfVariation: coefficientOfVariation,
    previousImpactDeltaMilliseconds:
      selected.length === 0 ? null : end - selected.at(-1),
  });
}

export class LocomotionContext {
  constructor(config) {
    this.capacity = config.locomotionImpactCapacity;
    this.enterThreshold = config.locomotionImpactEnterMps2;
    this.exitThreshold = config.locomotionImpactExitMps2;
    this.debounceMilliseconds = config.locomotionImpactDebounceMilliseconds;
    this.windowMilliseconds = config.locomotionContextWindowMilliseconds;
    this.timestamps = new Array(this.capacity);
    this.writeIndex = 0;
    this.length = 0;
    this.aboveThreshold = false;
    this.lastImpactTimestamp = null;
    this.degraded = false;
    this.totalImpacts = 0;
  }

  observe(observation) {
    if (observation.timestamp.qualityFlags.length > 0) this.degraded = true;
    const magnitude = observation.accelMagnitude;
    if (magnitude <= this.exitThreshold) this.aboveThreshold = false;
    if (
      magnitude < this.enterThreshold ||
      this.aboveThreshold ||
      (this.lastImpactTimestamp !== null &&
        observation.timestamp.normalizedTimestamp - this.lastImpactTimestamp <
          this.debounceMilliseconds)
    )
      return false;
    this.aboveThreshold = true;
    this.lastImpactTimestamp = observation.timestamp.normalizedTimestamp;
    this.timestamps[this.writeIndex] = this.lastImpactTimestamp;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.length = Math.min(this.length + 1, this.capacity);
    this.totalImpacts += 1;
    return true;
  }

  orderedTimestamps() {
    const output = [];
    const start =
      (this.writeIndex - this.length + this.capacity) % this.capacity;
    for (let index = 0; index < this.length; index += 1)
      output.push(this.timestamps[(start + index) % this.capacity]);
    return output;
  }

  summaryAt(end, start = end - this.windowMilliseconds) {
    return summarize(this.orderedTimestamps(), start, end, this.degraded);
  }

  bounds() {
    return Object.freeze({
      capacity: this.capacity,
      used: this.length,
      totalImpacts: this.totalImpacts,
    });
  }
}
