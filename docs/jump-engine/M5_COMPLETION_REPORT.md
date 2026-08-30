# M5 Jump Engine Research & Experimental Detection — Completion Report

## 1. Status

`IMPLEMENTATION_COMPLETE_HARDWARE_RESEARCH_PENDING`

## 2. Executive Summary

A host-only experimental detector now transforms typed motion/timing samples into reproducible confirmed or rejected research candidates. Its memory, candidates and event windows are bounded. Synthetic evidence is insufficient for a sports or sensor-profile claim, so M6 remains closed.

## 3. Git baseline

M5 began from clean `main` with local and `origin/main` at `1975531bbc7bb40d2ae0da190efdaafc15867e0d`.

## 4. Repository changes

Added `tools/jump-engine`, a synthetic fixture catalog, tests, inspector, guards and nine research documents; updated scripts and ADR-004. Canonical Session v1 and Garmin runtime code are unchanged.

## 5. Jump Engine architecture

Host-first deterministic pipeline: timestamp normalization → small signal features → bounded state machine → experimental candidate.

## 6. Session Engine boundary

Passive capability only. It does not control lifecycle, persistence, recovery, GPS, HR, canonical export, sync or UI and is not integrated into the product Session Engine path.

## 7. Sensor inputs

Accelerometer required; gyro optional and quality-aware; pressure/GPS optional context only.

## 8. Sensor profile

MEDIUM (25 Hz) and HIGH (50 Hz) configurations exist. Synthetic behavior does not decide physical sufficiency: `JUMP_RESEARCH_SENSOR_PROFILE = INSUFFICIENT_EVIDENCE`.

## 9. Rolling buffer

Three seconds: 75 MEDIUM or 150 HIGH observations. Active windows and retained candidates also have explicit fixed caps. `FULL_SESSION_RAW_IMU = FORBIDDEN_BY_DEFAULT`.

## 10. Timestamp normalization

Raw, callback and normalized monotonic time plus provenance are retained. Invalid raw time uses marked callback fallback/interpolation and lowers confidence.

## 11. Preprocessing

Orientation-independent acceleration magnitude and light fixed-window smoothing. No complex fusion.

## 12. Features

Raw/smoothed acceleration magnitude, peak/minimum magnitude, gyro magnitude/quality and optional pressure/speed context.

## 13. Candidate state machine

`GROUND → POSSIBLE_TAKEOFF → FLIGHT → POSSIBLE_LANDING`, followed by a separate confirmed/rejected result. Timeouts and session end fail closed.

## 14. Takeoff detection

Experimental acceleration impulse followed by low-acceleration signature. Thresholds are centralized/versioned, not physically validated.

## 15. Flight detection

Sustained low-acceleration region with minimum/maximum duration bounds; not assumed to be ideal free fall.

## 16. Landing detection

Landing impulse, ground-like stabilization and fixed post-event tail. Ambiguity is flagged.

## 17. Apex status

`APEX_ESTIMATION = EXPERIMENTAL_UNKNOWN`; midpoint is metadata only.

## 18. Airtime status

Boundary difference exists as `experimentalAirtimeMilliseconds`; `JUMP_AIRTIME_VALIDATED = NO`.

## 19. Height status

`JUMP_HEIGHT_VALIDATED = NO`; no height estimator exists.

## 20. Horizontal distance status

`NOT_IMPLEMENTED`.

## 21. Gyro outlier handling

Raw vectors are classified plausible/suspicious/invalid/unavailable. Extreme values are not clamped and do not independently trigger candidates.

## 22. Pressure role

Optional slow contextual signal only; not used for fine timing or altitude inference.

## 23. GPS role

Optional speed/context only; no flight-boundary timing or distance inference.

## 24. Confidence

Typed LOW/MEDIUM/HIGH research label from boundary and quality evidence; not a probability or accuracy claim.

## 25. Quality flags

Typed flags cover degraded timestamps, gyro outlier, gaps, low rate, ambiguous boundaries, short/excessive flight and session end.

## 26. Negative scenarios

Stationary, walking-like, arm swing, short false jump and long invalid flight produce no confirmed candidates in MEDIUM and HIGH synthetic tests.

## 27. Synthetic fixtures

Ten scenarios cover positive, negative, noisy, timestamp, gyro, gap and duration behavior. They contain no personal data and have `STATE_MACHINE_TEST_ONLY` scientific status.

## 28. Replay tooling

`npm run inspect:jump-research -- fixtures/jump-engine/synthetic-scenarios.json <id> [MEDIUM|HIGH]` reports only safe candidate summaries and performance aggregates.

## 29. Long-session simulation

Four virtual hours and 360,000 MEDIUM samples complete deterministically with occasional candidates.

## 30. Memory/resource bounds

Observed rolling use remained at its 75-sample cap and retention at eight candidates. Final host runs measured 2.09–2.23 seconds total and 5.79–6.19 microseconds/sample. Garmin resource impact is unknown.

## 31. Determinism

Identical sample input produces identical candidates, states, flags and aggregate bounds; wall-clock benchmark values are excluded from equality.

## 32. Host tests

Twelve M5-directed tests pass; the complete repository suite passes 55/55. Coverage includes profiles, negatives, anomalies, gyro, optional context, gaps, determinism, duplicates, edge endings, long session, timing comparison and privacy.

## 33. Garmin builds

`NOT_RUN_NOT_REQUIRED`: no Garmin code changed.

## 34. Run No Evil

`NOT_RUN_NOT_REQUIRED`; no logical or exit-code result is claimed for M5.

## 35. Hardware controlled tests

`NOT_RUN`; J0–J6 remain required.

## 36. Kitesurf capture

`NOT_RUN`; it must follow safe controlled characterization.

## 37. Battery observations

No new observation. Existing M1.1-B evidence cannot quantify this detector or candidate capture.

## 38. Woo validation preparation

Reference record, temporal matching and future precision/recall/offset/MAE concepts are documented. Woo remains an empirical reference; no API or scoring exists.

## 39. Product readiness

```text
JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```

## 40. M6 gate

`M6_WOO_VALIDATION_GATE = NO_GO` pending controlled hardware evidence and a defensible MEDIUM/HIGH recommendation.

## 41. Security/privacy

No environment access, credentials, network, backend or Supabase. Real research windows are sensitive, temporary and excluded from Git by policy. Safe inspector excludes raw vectors, GPS and HR.

## 42. Independent review

Signal, Garmin, embedded, timing, sports, kitesurf plausibility, QA, Session Engine boundary, privacy and Woo-readiness concerns were applied as review lenses. Automated guards enforce scope/bounds; separate human review is `NOT_RUN`.

## 43. Risks

Synthetic thresholds may not transfer to wrist motion; arm/chop/crash false positives are underrepresented; gyro cause is unknown; bounded capture may affect callbacks; one device cannot establish portability.

## 44. Unknowns

Real takeoff/landing signatures, MEDIUM versus HIGH timing value, false-positive rate, safe callback budget, airtime bias, battery cost and real kitesurf separability.

## 45. Deferred

Garmin adapter/capture, controlled hardware tests, kitesurf data, Woo matching, calibrated metrics, height/distance, canonical event, product UI, sync and backend.

## 46. Documentation

Architecture, signals, detection, timestamp and gyro policies, safe protocols, Woo plan, findings and this report live under `docs/jump-engine/`.

## 47. Git status

M5 changes remain uncommitted; no add, commit or push is authorized.

## 48. Recommended next milestone

Remain in M5 for a bounded Garmin research adapter and controlled J0–J6 evidence. M6 is not yet recommended.

## 49. Suggested next prompt

Implement a dev-only bounded Garmin candidate-window capture, build sequentially, execute safe J0–J6 at MEDIUM and HIGH, replay sanitized temporary captures on the host, and decide the M5 sensor profile/M6 gate without sports-accuracy claims.
