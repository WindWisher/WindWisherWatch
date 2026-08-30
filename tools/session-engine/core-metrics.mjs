const EARTH_RADIUS_METERS = 6_371_000;

export const MetricAvailability = Object.freeze({
  VALID: "VALID",
  STALE: "STALE",
  UNAVAILABLE: "UNAVAILABLE",
  DEGRADED: "DEGRADED",
});

export const MetricQualityCode = Object.freeze({
  GPS_UNAVAILABLE: "GPS_UNAVAILABLE",
  GPS_POOR_FIX: "GPS_POOR_FIX",
  GPS_DUPLICATE: "GPS_DUPLICATE",
  GPS_BACKWARD_TIMESTAMP: "GPS_BACKWARD_TIMESTAMP",
  GPS_INVALID_SPEED: "GPS_INVALID_SPEED",
  GPS_SPIKE: "GPS_SPIKE",
  HR_UNAVAILABLE: "HR_UNAVAILABLE",
  HR_INVALID: "HR_INVALID",
});

function finiteInRange(value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function haversineMeters(first, second) {
  const radians = Math.PI / 180;
  const latitudeDelta =
    (second.latitudeDegrees - first.latitudeDegrees) * radians;
  const longitudeDelta =
    (second.longitudeDegrees - first.longitudeDegrees) * radians;
  const firstLatitude = first.latitudeDegrees * radians;
  const secondLatitude = second.latitudeDegrees * radians;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export class CoreMetricProjector {
  constructor({
    maximumSpeedMps = 80,
    maximumAccuracyMeters = 100,
    gpsStaleMilliseconds = 10_000,
    heartRateStaleMilliseconds = 15_000,
  } = {}) {
    this.policy = Object.freeze({
      maximumSpeedMps,
      maximumAccuracyMeters,
      gpsStaleMilliseconds,
      heartRateStaleMilliseconds,
    });
    this.reset();
  }

  reset() {
    this.distanceMeters = 0;
    this.maximumSpeedMps = null;
    this.latestValidSpeedMps = null;
    this.latestSpeedTimestamp = null;
    this.latestValidPosition = null;
    this.latestPositionTimestamp = null;
    this.latestHeartRateBpm = null;
    this.latestHeartRateTimestamp = null;
    this.validGpsSampleCount = 0;
    this.rejectedSegmentCount = 0;
    this.invalidGpsCount = 0;
    this.invalidHeartRateCount = 0;
  }

  ingestPosition(sample) {
    const issues = [];
    const timestamp = sample.relativeMilliseconds;
    const coordinatesValid =
      finiteInRange(sample.latitudeDegrees, -90, 90) &&
      finiteInRange(sample.longitudeDegrees, -180, 180);
    const accuracyValid =
      sample.accuracyMeters === null ||
      sample.accuracyMeters === undefined ||
      finiteInRange(
        sample.accuracyMeters,
        0,
        this.policy.maximumAccuracyMeters,
      );
    if (
      sample.usable === false ||
      !Number.isFinite(timestamp) ||
      !coordinatesValid ||
      !accuracyValid
    ) {
      this.invalidGpsCount += 1;
      issues.push(
        coordinatesValid && accuracyValid
          ? MetricQualityCode.GPS_POOR_FIX
          : MetricQualityCode.GPS_UNAVAILABLE,
      );
      return issues;
    }
    if (
      this.latestPositionTimestamp !== null &&
      timestamp < this.latestPositionTimestamp
    ) {
      this.invalidGpsCount += 1;
      issues.push(MetricQualityCode.GPS_BACKWARD_TIMESTAMP);
      return issues;
    }
    if (
      this.latestPositionTimestamp !== null &&
      timestamp === this.latestPositionTimestamp
    ) {
      this.invalidGpsCount += 1;
      issues.push(MetricQualityCode.GPS_DUPLICATE);
      return issues;
    }

    const speedValid = finiteInRange(
      sample.groundSpeedMps,
      0,
      this.policy.maximumSpeedMps,
    );
    if (sample.groundSpeedMps !== null && !speedValid)
      issues.push(MetricQualityCode.GPS_INVALID_SPEED);

    if (this.latestValidPosition !== null) {
      const elapsedSeconds = (timestamp - this.latestPositionTimestamp) / 1000;
      const segmentMeters = haversineMeters(this.latestValidPosition, sample);
      const impliedSpeedMps = segmentMeters / elapsedSeconds;
      if (
        elapsedSeconds <= 0 ||
        !Number.isFinite(segmentMeters) ||
        impliedSpeedMps > this.policy.maximumSpeedMps
      ) {
        this.rejectedSegmentCount += 1;
        issues.push(MetricQualityCode.GPS_SPIKE);
        return issues;
      }
      this.distanceMeters += segmentMeters;
    }

    this.latestValidPosition = {
      latitudeDegrees: sample.latitudeDegrees,
      longitudeDegrees: sample.longitudeDegrees,
      relativeMilliseconds: timestamp,
      accuracyMeters: sample.accuracyMeters ?? null,
      quality: sample.quality ?? null,
      source: sample.source ?? "GPS",
    };
    this.latestPositionTimestamp = timestamp;
    this.validGpsSampleCount += 1;
    if (speedValid) {
      this.latestValidSpeedMps = sample.groundSpeedMps;
      this.latestSpeedTimestamp = timestamp;
      this.maximumSpeedMps = Math.max(
        this.maximumSpeedMps ?? sample.groundSpeedMps,
        sample.groundSpeedMps,
      );
    }
    return issues;
  }

  ingestHeartRate(sample) {
    if (!finiteInRange(sample.bpm, 20, 250)) {
      this.invalidHeartRateCount += 1;
      return [
        sample.bpm === null || sample.bpm === undefined
          ? MetricQualityCode.HR_UNAVAILABLE
          : MetricQualityCode.HR_INVALID,
      ];
    }
    this.latestHeartRateBpm = sample.bpm;
    this.latestHeartRateTimestamp = sample.relativeMilliseconds;
    return [];
  }

  checkpointState() {
    return {
      distanceMeters: this.distanceMeters,
      maximumSpeedMps: this.maximumSpeedMps,
      latestValidSpeedMps: this.latestValidSpeedMps,
      latestSpeedTimestamp: this.latestSpeedTimestamp,
      latestValidPosition: this.latestValidPosition,
      latestPositionTimestamp: this.latestPositionTimestamp,
      latestHeartRateBpm: this.latestHeartRateBpm,
      latestHeartRateTimestamp: this.latestHeartRateTimestamp,
      validGpsSampleCount: this.validGpsSampleCount,
      rejectedSegmentCount: this.rejectedSegmentCount,
      invalidGpsCount: this.invalidGpsCount,
      invalidHeartRateCount: this.invalidHeartRateCount,
    };
  }

  restore(state = {}) {
    this.reset();
    for (const key of Object.keys(this.checkpointState()))
      if (state[key] !== undefined) this[key] = structuredClone(state[key]);
  }

  snapshot(nowMilliseconds) {
    const gpsAgeMilliseconds =
      this.latestPositionTimestamp === null
        ? null
        : Math.max(0, nowMilliseconds - this.latestPositionTimestamp);
    const heartRateAgeMilliseconds =
      this.latestHeartRateTimestamp === null
        ? null
        : Math.max(0, nowMilliseconds - this.latestHeartRateTimestamp);
    const speedAgeMilliseconds =
      this.latestSpeedTimestamp === null
        ? null
        : Math.max(0, nowMilliseconds - this.latestSpeedTimestamp);
    const gpsStatus =
      gpsAgeMilliseconds === null
        ? MetricAvailability.UNAVAILABLE
        : gpsAgeMilliseconds > this.policy.gpsStaleMilliseconds
          ? MetricAvailability.STALE
          : MetricAvailability.VALID;
    const heartRateStatus =
      heartRateAgeMilliseconds === null
        ? MetricAvailability.UNAVAILABLE
        : heartRateAgeMilliseconds > this.policy.heartRateStaleMilliseconds
          ? MetricAvailability.STALE
          : MetricAvailability.VALID;
    return Object.freeze({
      currentSpeedMps:
        gpsStatus === MetricAvailability.VALID &&
        speedAgeMilliseconds !== null &&
        speedAgeMilliseconds <= this.policy.gpsStaleMilliseconds
          ? this.latestValidSpeedMps
          : null,
      maximumSpeedMps: this.maximumSpeedMps,
      distanceMeters: this.distanceMeters,
      heartRateBpm:
        heartRateStatus === MetricAvailability.VALID
          ? this.latestHeartRateBpm
          : null,
      gpsStatus,
      gpsAgeMilliseconds,
      speedAgeMilliseconds,
      heartRateStatus,
      heartRateAgeMilliseconds,
      validGpsSampleCount: this.validGpsSampleCount,
      rejectedSegmentCount: this.rejectedSegmentCount,
      invalidGpsCount: this.invalidGpsCount,
      invalidHeartRateCount: this.invalidHeartRateCount,
    });
  }
}
