# Host and Garmin detector parity

## Finalization follow-up

M5.4B-T found stop-flush end parity diverged despite the classification scope below. The Garmin correction now uses the latest normalized observation, matching host endSession semantics. Corresponding host and Garmin synthetic schedules pass. `HOST_GARMIN_FINALIZATION_PARITY = MATCHED` for finalization under normalized-input contracts. Both device builds pass; Run No Evil reports 14/14 logical PASS with process exit 1. See [integrity report](CANDIDATE_TIMESTAMP_INTEGRITY.md).

## M5.4B decision semantics

Host and Garmin share:

- algorithm version `experimental-0.5-phase-scoped-envelope`;
- takeoff peak scope;
- flight minimum scope;
- landing-trigger peak scope;
- immutable decision fields;
- post-event peak isolation;
- `3000 mg` canonical takeoff threshold;
- `408 mg` Garmin flight-minimum threshold and its existing host SI counterpart;
- the same envelope reason semantics;
- MEDIUM as the primary research profile;
- gyro as quality-only and locomotion as observer-only.

The host performs the exact `3000 mg` conversion as `29.41995 m/s²`; Garmin avoids conversion and compares native mg. This removes the accidental former `30 m/s² ≈ 3059 mg` mismatch.

Garmin now retains a short-flight candidate through the same bounded landing-stabilization phase as the host and rejects it at finalization. This prevents a late landing peak from being split into a new candidate. Locomotion observation order still differs diagnostically but cannot affect classification while it remains observer-only.

```text
HOST_GARMIN_DETECTOR_PARITY = MATCHED
PARITY_SCOPE = DECISIONAL_CLASSIFICATION_SEMANTICS
```
