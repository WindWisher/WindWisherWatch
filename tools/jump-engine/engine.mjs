import { profileConfig } from "./config.mjs";
import { classifyGyro, LightSmoother, vectorMagnitude } from "./features.mjs";
import {
  CandidateStatus,
  Confidence,
  GyroQuality,
  JumpState,
  QualityFlag,
  ReasonCode,
} from "./model.mjs";
import { FixedRingBuffer } from "./ring-buffer.mjs";
import { LocomotionContext } from "./locomotion-context.mjs";
import { TimestampNormalizer } from "./timestamp-normalizer.mjs";

function addBoundedFlag(active, flag, limit) {
  if (!active || active.flags.includes(flag) || active.flags.length >= limit)
    return;
  active.flags.push(flag);
}

function addBoundedReason(active, reason, limit) {
  if (
    !active ||
    active.reasons.includes(reason) ||
    active.reasons.length >= limit
  )
    return;
  active.reasons.push(reason);
}

function vectorCosine(first, second) {
  if (!first || !second) return null;
  const denominator =
    Math.hypot(first.x, first.y, first.z) *
    Math.hypot(second.x, second.y, second.z);
  if (denominator === 0) return null;
  return (
    (first.x * second.x + first.y * second.y + first.z * second.z) / denominator
  );
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
    this.locomotion = new LocomotionContext(this.config);
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
      accel: sample.accel,
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
      if (gyro.quality === GyroQuality.INVALID_OUTLIER_CANDIDATE)
        addBoundedReason(
          this.active,
          ReasonCode.GYRO_CORRUPTED,
          this.config.notableFlagLimit,
        );
    }
    const result = this.advance(observation);
    this.locomotion.observe(observation);
    return result;
  }

  advance(observation) {
    const time = observation.timestamp.normalizedTimestamp;
    if (this.state === JumpState.GROUND) {
      if (observation.accelMagnitude >= this.config.takeoffImpulseMps2) {
        this.active = {
          candidateId: `${this.sessionId}:${this.config.algorithmVersion}:${String(this.candidateSequence).padStart(6, "0")}`,
          candidateSequence: this.candidateSequence,
          impulseTime: time,
          candidateStartTime: time,
          flightStartTime: null,
          lowGLastTime: null,
          lowGStreakStartTime: null,
          maximumSustainedLowGMilliseconds: 0,
          takeoffTime: null,
          landingTime: null,
          landingStable: false,
          takeoffPeakAccelMps2: observation.accelMagnitude,
          landingPeakAccelMps2: null,
          postEventPeakAccelMps2: null,
          decisionSnapshot: null,
          takeoffImpulseVector: structuredClone(observation.accel),
          landingImpulseVector: null,
          flightMinimumAccelMps2: observation.accelMagnitude,
          flags: [...observation.timestamp.qualityFlags],
          reasons: [ReasonCode.TAKEOFF_IMPULSE_FOUND],
          preLocomotionContext: this.locomotion.summaryAt(time),
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
        if (this.active.gyroOutlierSamples > 0)
          addBoundedReason(
            this.active,
            ReasonCode.GYRO_CORRUPTED,
            this.config.notableFlagLimit,
          );
        if (observation.timestamp.qualityFlags.length > 0)
          addBoundedReason(
            this.active,
            ReasonCode.TIMESTAMP_DEGRADED,
            this.config.notableFlagLimit,
          );
        this.candidateSequence += 1;
        this.state = JumpState.POSSIBLE_TAKEOFF;
      }
      return null;
    }

    if (observation.pressurePascals !== undefined)
      this.active.latestPressurePascals = observation.pressurePascals;
    if (observation.speedMps !== undefined)
      this.active.speedContextMps = observation.speedMps;
    if (observation.gyro.quality === GyroQuality.PLAUSIBLE)
      this.active.gyroPlausibleSamples += 1;
    if (observation.gyro.quality === GyroQuality.INVALID_OUTLIER_CANDIDATE)
      this.active.gyroOutlierSamples += 1;

    if (this.state === JumpState.POSSIBLE_TAKEOFF) {
      this.active.takeoffPeakAccelMps2 = Math.max(
        this.active.takeoffPeakAccelMps2,
        observation.accelMagnitude,
      );
      if (
        time - this.active.candidateStartTime >
        this.config.maximumTakeoffCandidateMilliseconds
      ) {
        addBoundedFlag(
          this.active,
          QualityFlag.TAKEOFF_AMBIGUOUS,
          this.config.notableFlagLimit,
        );
        addBoundedReason(
          this.active,
          ReasonCode.NO_FLIGHT_PHASE,
          this.config.notableFlagLimit,
        );
        return this.finish(CandidateStatus.REJECTED, time);
      } else if (observation.accelMagnitude >= this.config.takeoffImpulseMps2) {
        this.active.impulseTime = time;
        this.active.takeoffImpulseVector = structuredClone(observation.accel);
        addBoundedReason(
          this.active,
          ReasonCode.TAKEOFF_IMPULSE_UPDATED,
          this.config.notableFlagLimit,
        );
      } else if (
        time - this.active.impulseTime >
        this.config.takeoffToLowGMaximumMilliseconds
      ) {
        addBoundedFlag(
          this.active,
          QualityFlag.TAKEOFF_AMBIGUOUS,
          this.config.notableFlagLimit,
        );
        addBoundedReason(
          this.active,
          ReasonCode.NO_FLIGHT_PHASE,
          this.config.notableFlagLimit,
        );
        addBoundedReason(
          this.active,
          ReasonCode.IMPACT_ONLY,
          this.config.notableFlagLimit,
        );
        return this.finish(CandidateStatus.REJECTED, time);
      } else if (
        observation.smoothedAccelMagnitude <= this.config.lowGEnterMps2
      ) {
        this.active.takeoffTime = time;
        this.active.flightStartTime = time;
        this.active.lowGLastTime = time;
        this.active.lowGStreakStartTime = time;
        this.active.flightMinimumAccelMps2 = observation.smoothedAccelMagnitude;
        addBoundedReason(
          this.active,
          ReasonCode.LOW_G_PHASE_FOUND,
          this.config.notableFlagLimit,
        );
        this.state = JumpState.FLIGHT;
      }
      return null;
    }

    if (this.state === JumpState.FLIGHT) {
      this.active.flightMinimumAccelMps2 = Math.min(
        this.active.flightMinimumAccelMps2,
        observation.smoothedAccelMagnitude,
      );
      if (observation.smoothedAccelMagnitude <= this.config.lowGEnterMps2) {
        if (this.active.lowGStreakStartTime === null)
          this.active.lowGStreakStartTime = time;
        this.active.lowGLastTime = time;
        this.active.maximumSustainedLowGMilliseconds = Math.max(
          this.active.maximumSustainedLowGMilliseconds,
          time - this.active.lowGStreakStartTime,
        );
      } else this.active.lowGStreakStartTime = null;
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
        this.active.landingPeakAccelMps2 = observation.accelMagnitude;
        this.active.landingImpulseVector = structuredClone(observation.accel);
        const directionCosine = vectorCosine(
          this.active.takeoffImpulseVector,
          this.active.landingImpulseVector,
        );
        this.active.takeoffLandingDirectionCosine = directionCosine;
        const hasJumpImpulseLowGEnvelope =
          this.active.takeoffPeakAccelMps2 >=
            this.config.minimumTakeoffPeakMps2 &&
          this.active.flightMinimumAccelMps2 !== null &&
          this.active.flightMinimumAccelMps2 <=
            this.config.maximumJumpEnvelopeFlightMinimumMps2;
        this.active.decisionSnapshot = Object.freeze({
          takeoffPeakAccelMps2: this.active.takeoffPeakAccelMps2,
          flightMinimumAccelMps2: this.active.flightMinimumAccelMps2,
          landingPeakAccelMps2: this.active.landingPeakAccelMps2,
          flightDurationMilliseconds: duration,
          sustainedLowGMilliseconds:
            this.active.maximumSustainedLowGMilliseconds,
          takeoffPeakThresholdMillig: this.config.takeoffPeakThresholdMillig,
          takeoffPeakThresholdMps2: this.config.minimumTakeoffPeakMps2,
          maximumFlightMinimumMps2:
            this.config.maximumJumpEnvelopeFlightMinimumMps2,
          envelopeMatched: hasJumpImpulseLowGEnvelope,
        });
        if (!hasJumpImpulseLowGEnvelope) {
          addBoundedFlag(
            this.active,
            QualityFlag.ARM_MOTION_PATTERN,
            this.config.notableFlagLimit,
          );
          addBoundedReason(
            this.active,
            ReasonCode.ARM_MOTION_PATTERN,
            this.config.notableFlagLimit,
          );
          addBoundedReason(
            this.active,
            ReasonCode.JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING,
            this.config.notableFlagLimit,
          );
        } else {
          addBoundedReason(
            this.active,
            ReasonCode.JUMP_IMPULSE_LOW_G_ENVELOPE_FOUND,
            this.config.notableFlagLimit,
          );
        }
        if (
          directionCosine !== null &&
          directionCosine >= this.config.minimumTakeoffLandingDirectionCosine
        )
          addBoundedReason(
            this.active,
            ReasonCode.IMPULSE_DIRECTION_CONSISTENT,
            this.config.notableFlagLimit,
          );
        addBoundedReason(
          this.active,
          ReasonCode.LANDING_IMPULSE_FOUND,
          this.config.notableFlagLimit,
        );
        if (duration < this.config.minimumFlightMilliseconds)
          addBoundedFlag(
            this.active,
            QualityFlag.SHORT_FLIGHT,
            this.config.notableFlagLimit,
          );
        if (
          this.active.maximumSustainedLowGMilliseconds <
          this.config.minimumSustainedLowGMilliseconds
        ) {
          addBoundedFlag(
            this.active,
            QualityFlag.SHORT_FLIGHT,
            this.config.notableFlagLimit,
          );
          addBoundedReason(
            this.active,
            ReasonCode.LOW_G_TOO_BRIEF,
            this.config.notableFlagLimit,
          );
        } else {
          addBoundedReason(
            this.active,
            ReasonCode.LOW_G_DURATION_PLAUSIBLE,
            this.config.notableFlagLimit,
          );
        }
        if (duration >= this.config.minimumFlightMilliseconds)
          addBoundedReason(
            this.active,
            ReasonCode.FLIGHT_DURATION_PLAUSIBLE,
            this.config.notableFlagLimit,
          );
        this.state = JumpState.POSSIBLE_LANDING;
      }
      return null;
    }

    this.active.postEventPeakAccelMps2 = Math.max(
      this.active.postEventPeakAccelMps2 ?? 0,
      observation.accelMagnitude,
    );
    if (
      observation.smoothedAccelMagnitude >= this.config.groundedMinimumMps2 &&
      observation.smoothedAccelMagnitude <= this.config.groundedMaximumMps2 &&
      time - this.active.landingTime >=
        this.config.landingStabilizationMilliseconds
    ) {
      this.active.landingStable = true;
      addBoundedReason(
        this.active,
        ReasonCode.LANDING_STABLE,
        this.config.notableFlagLimit,
      );
    }
    if (time - this.active.landingTime >= this.config.postEventSeconds * 1000) {
      if (!this.active.landingStable)
        addBoundedFlag(
          this.active,
          QualityFlag.LANDING_AMBIGUOUS,
          this.config.notableFlagLimit,
        );
      if (!this.active.landingStable)
        addBoundedReason(
          this.active,
          ReasonCode.LANDING_NOT_STABLE,
          this.config.notableFlagLimit,
        );
      const rejected =
        this.active.flags.includes(QualityFlag.SHORT_FLIGHT) ||
        this.active.flags.includes(QualityFlag.ARM_MOTION_PATTERN) ||
        !this.active.landingStable;
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
      reasonCodes: Object.freeze([...active.reasons]),
      evidence: Object.freeze({
        takeoffEvidence: Object.freeze({
          impulseFound: active.reasons.includes(
            ReasonCode.TAKEOFF_IMPULSE_FOUND,
          ),
          impulseToFlightMilliseconds:
            active.flightStartTime === null
              ? null
              : active.flightStartTime - active.impulseTime,
          candidateToFlightMilliseconds:
            active.flightStartTime === null
              ? null
              : active.flightStartTime - active.candidateStartTime,
        }),
        flightEvidence: Object.freeze({
          lowGFound: active.reasons.includes(ReasonCode.LOW_G_PHASE_FOUND),
          sustainedLowGMilliseconds: active.maximumSustainedLowGMilliseconds,
          flightToLandingMilliseconds: airtimeMilliseconds,
        }),
        landingEvidence: Object.freeze({
          impulseFound: active.reasons.includes(
            ReasonCode.LANDING_IMPULSE_FOUND,
          ),
          stable: active.landingStable,
          takeoffLandingDirectionCosine: vectorCosine(
            active.takeoffImpulseVector,
            active.landingImpulseVector,
          ),
        }),
        gyroEvidence: Object.freeze({
          plausibleSamples: active.gyroPlausibleSamples,
          outlierSamples: active.gyroOutlierSamples,
        }),
        locomotionContext: Object.freeze({
          observerOnly: true,
          preEvent: active.preLocomotionContext,
          postEvent:
            active.landingTime === null
              ? null
              : this.locomotion.summaryAt(endTime, active.landingTime + 100),
        }),
      }),
      featureSummary: Object.freeze({
        takeoffPeakAccelMps2: active.takeoffPeakAccelMps2,
        flightMinimumAccelMps2: active.flightMinimumAccelMps2,
        landingPeakAccelMps2: active.landingPeakAccelMps2,
        featuresAtDecision: active.decisionSnapshot,
        postEventDiagnostics: Object.freeze({
          peakAccelMps2: active.postEventPeakAccelMps2,
        }),
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
    if (this.candidates.length > this.config.retainedCandidateLimit) {
      const rejectedIndex = this.candidates.findIndex(
        (retained) => retained.status === CandidateStatus.REJECTED,
      );
      this.candidates.splice(rejectedIndex >= 0 ? rejectedIndex : 0, 1);
    }
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
    addBoundedReason(
      this.active,
      ReasonCode.SESSION_ENDED,
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
        locomotionContext: this.locomotion.bounds(),
      },
    };
  }
}
