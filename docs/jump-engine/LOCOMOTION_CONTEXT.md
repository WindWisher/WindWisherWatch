# Locomotion Context

## Status and boundary

`LocomotionContext` is an experimental, observer-only input owned by the Jump Engine. It neither classifies activities nor confirms/rejects candidates, and it has no lifecycle, persistence, sync, backend, UI or Canonical Session responsibility.

## Model and bounds

Normalized acceleration magnitude feeds a threshold with hysteresis and 180 ms debounce. Rising impacts enter a fixed eight-entry ring. A bounded three-second neighborhood reports count, previous-impact distance, interval mean, interval variance/CV, and `LOCOMOTION_NONE`, `LOCOMOTION_POSSIBLE`, `LOCOMOTION_PERIODIC` or `LOCOMOTION_AMBIGUOUS`. Degraded timestamps force `AMBIGUOUS`.

Per-sample work is constant. Eight-entry scans occur only when candidate evidence is captured. No full-session IMU is retained. Garmin candidate diagnostics use a 40-sample circular window; TP3 may select the second confirmation for diagnosis without changing classification.

## Hardware conclusion

Periodicity is not a safe veto. One operator-observed TP3 hop was confirmed with four prior impacts, mean interval about 615 ms and CV about 0.149 (`LOCOMOTION_PERIODIC`). Other valid hops were `POSSIBLE`. The one-second post window usually held zero or one impact, insufficient to establish resumed cadence. Context therefore remains explanatory evidence only.

Only aggregates and typed states enter safe traces. Raw captures stay ignored and uncommitted; GPS, HR, serials, secrets and `.env` content are excluded.
