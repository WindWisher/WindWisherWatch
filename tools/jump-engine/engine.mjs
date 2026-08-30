import { profileConfig } from "./config.mjs";
import { classifyGyro, LightSmoother, vectorMagnitude } from "./features.mjs";
import {
  CandidateStatus,
  Confidence,
  GyroQuality,
  JumpState,
  QualityFlag,
} from "./model.mjs";
import { FixedRingBuffer } from "./ring-buffer.mjs";
import { TimestampNormalizer } from "./timestamp-normalizer.mjs";

function addBoundedFlag(active, flag, limit) {
  if (!active || active.flags.includes(flag) || active.flags.length >= limit)
    return;
  active.flags.push(flag);
}

export class ExperimentalJumpEngine {
  constructor({ sessionId, profile = "MEDIUM", config = {} }) {
    if (!sessionId)
      throw new Error("Experimental Jump Engine requires sessionId");
    this.sessionId = sessionId;
    this.config = profileConfig(profile, config);
    this.state = JumpState.GROUND;
    this.normalizer = new TimestampNormalizer(this.config);
    this.smoother = new LightSmoother(this.config.smoothingSamples);
    this.rolling = new FixedRingBuffer(
      Math.ceil(this.config.sampleRateHz * this.config.rollingWindowSeconds),
    );
    this.activeWindowCapacity =
      this.rolling.capacity +
      Math.ceil(
        this.config.sampleRateHz *
          ((this.config.takeoffToLowGMaximumMilliseconds +
            this.config.maximumFlightMilliseconds) /
            1000 +
            this.config.postEventSeconds),
      );
    this.candidates = [];
    this.active = null;
    this.lastSequence = -1;
    this.candidateSequence = 0;
    this.totalConfirmedCandidates = 0;
    this.totalRejectedCandidates = 0;
    this.processedSamples = 0;
    this.duplicateOrOutOfOrderSamples = 0;
    this.maxActiveSamples = 0;
  }

  process(sample) {
    if (!Number.isInteger(sample.sequence) || sample.sequence < 0)
      throw new Error("Motion sample requires a non-negative integer sequence");
    if (sample.sequence <= this.lastSequence) {
      this.duplicateOrOutOfOrderSamples += 1;
      return null;
    }
    this.lastSequence = sample.sequence;
    const accelMagnitude = vectorMagnitude(sample.accel);
    if (accelMagnitude === null)
      throw new Error("Accelerometer vector is required and must be finite");
    const timestamp = this.normalizer.normalize(
      sample.rawSampleTimestamp,
      sample.callbackTimestamp,
    );
    const gyro = classifyGyro(sample.gyro, this.config);
    const smoothedAccelMagnitude = this.smoother.add(accelMagnitude);
    const observation = {
      sequence: sample.sequence,
      timestamp,
      accelMagnitude,
      smoothedAccelMagnitude,
      gyro,
      ...(Number.isFinite(sample.pressurePascals)
        ? { pressurePascals: sample.pressurePascals }
        : {}),
      ...(Number.isFinite(sample.speedMps)
        ? { speedMps: sample.speedMps }
        : {}),
    };
    this.rolling.push(observation);
    this.processedSamples += 1;
    if (this.active) {
      if (this.active.window.length < this.activeWindowCapacity)
        this.active.window.push(observation);
      this.maxActiveSamples = Math.max(
        this.maxActiveSamples,
        this.active.window.length,
      );
      for (const flag of timestamp.qualityFlags)
        addBoundedFlag(this.active, flag, this.config.notableFlagLimit);
      if (gyro.quality === GyroQuality.INVALID_OUTLIER_CANDIDATE)
        addBoundedFlag(
          this.active,
          QualityFlag.GYRO_OUTLIER,
          this.config.notableFlagLimit,
        );
    }
    return this.advance(observation);
  }

  advance(observation) {
    const time = observation.timestamp.normalizedTimestamp;
    if (this.state === JumpState.GROUND) {
      if (observation.accelMagnitude >= this.config.takeoffImpulseMps2) {
        this.active = {
          candidateId: `${this.sessionId}:${this.config.algorithmVersion}:${String(this.candidateSequence).padStart(6, "0")}`,
          candidateSequence: this.candidateSequence,
          impulseTime: time,
          takeoffTime: null,
          landingTime: null,
          landingStable: false,
          peakAccelMps2: observation.accelMagnitude,
          minimumFlightAccelMps2: observation.accelMagnitude,
          flags: [...observation.timestamp.qualityFlags],
          window: this.rolling.snapshot(),
          gyroPlausibleSamples:
            observation.gyro.quality === GyroQuality.PLAUSIBLE ? 1 : 0,
          gyroOutlierSamples:
            observation.gyro.quality === GyroQuality.INVALID_OUTLIER_CANDIDATE
              ? 1
              : 0,
          initialPressurePascals: observation.pressurePascals ?? null,
          latestPressurePascals: observation.pressurePascals ?? null,
          speedContextMps: observation.speedMps ?? null,
        };
        if (this.active.gyroOutlierSamples > 0)
          addBoundedFlag(
            this.active,
            QualityFlag.GYRO_OUTLIER,
            this.config.notableFlagLimit,
          );
        this.candidateSequence += 1;
        this.state = JumpState.POSSIBLE_TAKEOFF;
      }
      return null;
    }

    this.active.peakAccelMps2 = Math.max(
      this.active.peakAccelMps2,
      observation.accelMagnitude,
    );
    if (observation.pressurePascals !== undefined)
      this.active.latestPressurePascals = observation.pressurePascals;
    if (observation.speedMps !== undefined)
      this.active.speedContextMps = observation.speedMps;
    if (observation.gyro.quality === GyroQuality.PLAUSIBLE)
      this.active.gyroPlausibleSamples += 1;
    if (observation.gyro.quality === GyroQuality.INVALID_OUTLIER_CANDIDATE)
      this.active.gyroOutlierSamples += 1;

    if (this.state === JumpState.POSSIBLE_TAKEOFF) {
      if (observation.smoothedAccelMagnitude <= this.config.lowGEnterMps2) {
        this.active.takeoffTime = this.active.impulseTime;
        this.active.minimumFlightAccelMps2 = observation.smoothedAccelMagnitude;
        this.state = JumpState.FLIGHT;
      } else if (
        time - this.active.impulseTime >
        this.config.takeoffToLowGMaximumMilliseconds
      ) {
        addBoundedFlag(
          this.active,
          QualityFlag.TAKEOFF_AMBIGUOUS,
          this.config.notableFlagLimit,
        );
        return this.finish(CandidateStatus.REJECTED, time);
      }
      return null;
    }

    if (this.state === JumpState.FLIGHT) {
      this.active.minimumFlightAccelMps2 = Math.min(
        this.active.minimumFlightAccelMps2,
        observation.smoothedAccelMagnitude,
      );
      const duration = time - this.active.takeoffTime;
      if (duration > this.config.maximumFlightMilliseconds) {
        addBoundedFlag(
          this.active,
          QualityFlag.EXCESSIVE_DURATION,
          this.config.notableFlagLimit,
        );
        return this.finish(CandidateStatus.REJECTED, time);
      }
      if (observation.accelMagnitude >= this.config.landingImpulseMps2) {
        this.active.landingTime = time;
        if (duration < this.config.minimumFlightMilliseconds)
          addBoundedFlag(
            this.active,
            QualityFlag.SHORT_FLIGHT,
            this.config.notableFlagLimit,
          );
        this.state = JumpState.POSSIBLE_LANDING;
      }
      return null;
    }

    if (
      observation.smoothedAccelMagnitude >= this.config.groundedMinimumMps2 &&
      observation.smoothedAccelMagnitude <= this.config.groundedMaximumMps2 &&
      time - this.active.landingTime >=
        this.config.landingStabilizationMilliseconds
    )
      this.active.landingStable = true;
    if (time - this.active.landingTime >= this.config.postEventSeconds * 1000) {
      if (!this.active.landingStable)
        addBoundedFlag(
          this.active,
          QualityFlag.LANDING_AMBIGUOUS,
          this.config.notableFlagLimit,
        );
      const rejected = this.active.flags.includes(QualityFlag.SHORT_FLIGHT);
      return this.finish(
        rejected ? CandidateStatus.REJECTED : CandidateStatus.CONFIRMED,
        time,
      );
    }
    return null;
  }

  finish(status, endTime) {
    const active = this.active;
    const airtimeMilliseconds =
      active.takeoffTime !== null && active.landingTime !== null
        ? active.landingTime - active.takeoffTime
        : null;
    const degrading = active.flags.some((flag) =>
      [
        QualityFlag.TIMESTAMP_DEGRADED,
        QualityFlag.SAMPLE_GAP,
        QualityFlag.TAKEOFF_AMBIGUOUS,
        QualityFlag.LANDING_AMBIGUOUS,
        QualityFlag.SHORT_FLIGHT,
        QualityFlag.EXCESSIVE_DURATION,
      ].includes(flag),
    );
    const confidence =
      status === CandidateStatus.REJECTED || degrading
        ? Confidence.LOW
        : active.gyroOutlierSamples > 0
          ? Confidence.MEDIUM
          : Confidence.HIGH;
    const candidate = Object.freeze({
      candidateId: active.candidateId,
      candidateSequence: active.candidateSequence,
      sessionId: this.sessionId,
      status,
      startMilliseconds: active.impulseTime,
      endMilliseconds: endTime,
      takeoffCandidateMilliseconds: active.takeoffTime,
      landingCandidateMilliseconds: active.landingTime,
      apexEstimation: "EXPERIMENTAL_UNKNOWN",
      apexCandidateMilliseconds:
        airtimeMilliseconds === null
          ? null
          : active.takeoffTime + airtimeMilliseconds / 2,
      experimentalAirtimeMilliseconds: airtimeMilliseconds,
      sensorProfile: this.config.profile,
      confidence,
      qualityFlags: Object.freeze([...active.flags]),
      featureSummary: Object.freeze({
        peakAccelMps2: active.peakAccelMps2,
        minimumFlightAccelMps2: active.minimumFlightAccelMps2,
        gyroPlausibleSamples: active.gyroPlausibleSamples,
        gyroOutlierSamples: active.gyroOutlierSamples,
        ...(active.initialPressurePascals !== null &&
        active.latestPressurePascals !== null
          ? {
              pressureDeltaPascals:
                active.latestPressurePascals - active.initialPressurePascals,
            }
          : {}),
        ...(active.speedContextMps !== null
          ? { speedContextMps: active.speedContextMps }
          : {}),
      }),
      jumpAlgorithmVersion: this.config.algorithmVersion,
      researchWindow: Object.freeze(active.window),
    });
    this.candidates.push(candidate);
    if (status === CandidateStatus.CONFIRMED)
      this.totalConfirmedCandidates += 1;
    else this.totalRejectedCandidates += 1;
    if (this.candidates.length > this.config.retainedCandidateLimit)
      this.candidates.shift();
    this.active = null;
    this.state = JumpState.GROUND;
    return candidate;
  }

  endSession() {
    if (!this.active) return null;
    addBoundedFlag(
      this.active,
      QualityFlag.SESSION_ENDED,
      this.config.notableFlagLimit,
    );
    if (this.active.takeoffTime === null)
      addBoundedFlag(
        this.active,
        QualityFlag.TAKEOFF_AMBIGUOUS,
        this.config.notableFlagLimit,
      );
    else if (this.active.landingTime === null)
      addBoundedFlag(
        this.active,
        QualityFlag.LANDING_AMBIGUOUS,
        this.config.notableFlagLimit,
      );
    return this.finish(
      CandidateStatus.REJECTED,
      this.normalizer.previousNormalized ?? 0,
    );
  }

  summary() {
    return {
      status: "EXPERIMENTAL",
      algorithmVersion: this.config.algorithmVersion,
      sensorProfile: this.config.profile,
      processedSamples: this.processedSamples,
      confirmedCandidates: this.totalConfirmedCandidates,
      rejectedCandidates: this.totalRejectedCandidates,
      duplicateOrOutOfOrderSamples: this.duplicateOrOutOfOrderSamples,
      bounds: {
        rollingCapacity: this.rolling.capacity,
        rollingUsed: this.rolling.length,
        retainedCandidateLimit: this.config.retainedCandidateLimit,
        retainedCandidates: this.candidates.length,
        activeWindowCapacity: this.activeWindowCapacity,
        maxActiveSamples: this.maxActiveSamples,
      },
    };
  }
}
