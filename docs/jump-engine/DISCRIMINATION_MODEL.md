# Experimental jump discrimination model

## M5.4B phase semantics

Algorithm `experimental-0.5-phase-scoped-envelope` uses takeoff-only peak acceleration and flight-only minimum acceleration for the physical envelope. Landing-trigger acceleration is supporting evidence; post-event acceleration is diagnostic only. The immutable `featuresAtDecision` snapshot is the sole source for envelope reason reconstruction. See `PHASE_SCOPED_FEATURES.md` and `DECISION_SNAPSHOT.md`.

## M5.3 observer boundary

`LocomotionContext` supplies bounded aggregate evidence but is not a classifier or veto. `LOCOMOTION_PERIODIC` overlaps a physically observed controlled hop, so M5.2 multi-phase decision semantics remain unchanged. Timestamp-degraded context becomes `LOCOMOTION_AMBIGUOUS`.

## Status

`IMPLEMENTED`, `SYNTHETIC_VERIFIED`, `HARDWARE_RESEARCH_INCONCLUSIVE`.

The detector remains an experimental capability below Session Engine. It does not own lifecycle, persistence, recovery, sync, backend, UI or canonical export.

## Candidate policy

A peak is never sufficient. A confirmed candidate requires, in timestamp order:

1. a takeoff-like acceleration impulse;
2. a low-g transition within 360 ms of the most recent plausible impulse;
3. at least 120 ms of genuinely consecutive low-g evidence;
4. at least 240 ms from low-g entry to landing impulse;
5. takeoff/landing direction cosine of at least 0.90;
6. grounded stabilization after landing.

The initial candidate remains bounded to 1,000 ms even when a newer impulse rebases the transition window. All temporal decisions use normalized milliseconds. Only smoothing storage differs by profile: three samples at MEDIUM and five at HIGH.

These values are experimental guards, not sport constants. Airtime remains the difference between low-g entry and landing impulse and is `UNVALIDATED`.

## Typed explanation

Candidates retain bounded typed reason codes including `TAKEOFF_IMPULSE_FOUND`, `TAKEOFF_IMPULSE_UPDATED`, `LOW_G_PHASE_FOUND`, `LOW_G_DURATION_PLAUSIBLE`, `LOW_G_TOO_BRIEF`, `LANDING_IMPULSE_FOUND`, `LANDING_STABLE`, `LANDING_NOT_STABLE`, `FLIGHT_DURATION_PLAUSIBLE`, `NO_FLIGHT_PHASE`, `IMPACT_ONLY`, `IMPULSE_DIRECTION_CONSISTENT`, `ARM_MOTION_PATTERN`, `GYRO_CORRUPTED`, `TIMESTAMP_DEGRADED` and `SESSION_ENDED`.

The compact feature trace contains no full-session IMU: timing aggregates, peak/minimum acceleration, consecutive low-g duration, landing stability, direction cosine, gyro quality counts and flags only. Retention remains at most eight candidates and prioritizes confirmed candidates for diagnosis.

## Finding

Direction coherence separated the observed J5 arm false candidate (`0.757`) from eight controlled hops measured with the feature (`0.948–0.998`). It did not separate brisk walking: three false confirmations produced `0.934–0.988`. Therefore this model improves the original arm-motion boundary but does not robustly distinguish all adversarial motion.
