# M5.2 Jump Discrimination & Robustness — Completion Report

## 1. Status

`M5_2_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE`.

## 2. Executive Summary

Multi-phase discrimination improved and controlled MEDIUM hops became reproducible, but frozen brisk-walking holdout generated three false confirmations. Woo validation is not justified.

## 3. Git baseline

Started clean at local/origin `013fa8991d2945dd1f28737b4c12da6eecffd472`. No commit or push.

## 4. Repository changes

Experimental host/Garmin detectors, synthetic fixtures, tests and research docs changed. Session Engine, Canonical Session v1, backend and product UI did not.

## 5. J5 root cause

The historical event is unprovable because its raw window was not retained. Reproduction proved permissive phase semantics and a direction-incoherent false candidate; both were addressed.

## 6. J3 HIGH root cause

Not conclusively established. Its raw prefix omitted the event. First-impulse anchoring, smoothing-boundary sensitivity and human variance remain plausible.

## 7. State-machine changes

Newest plausible takeoff impulse, separately bounded candidate, consecutive low-g, expiry-before-transition, stable landing and direction consistency.

## 8. Feature changes

Compact timing, acceleration, direction, landing, gyro-quality and typed-reason evidence; no full-session IMU.

## 9. Temporal constraints

360 ms impulse-to-low-g, 1,000 ms takeoff candidate, 120 ms consecutive low-g, 240–3,000 ms flight, 160 ms stabilization and 1,000 ms post-event. All are experimental.

## 10. Sample-rate independence

Temporal rules and capture tail use milliseconds. Only smoothing samples and capacities vary by profile. Synthetic MEDIUM/HIGH parity passes.

## 11. Gyro role

`GYRO_ROLE = QUALITY_ONLY`.

## 12. Gyro artifact handling

Invalid samples are flagged, excluded from valid aggregates and never clamped. Gyro is not required.

## 13. ACCEL_ONLY results

Synthetic positives, negatives, J5/J3 hypotheses, direction, J4 and long-session cases pass without gyro. SUMMARY_ONLY hardware has no raw replay payload.

## 14. ACCEL_PLUS_GYRO results

Synthetic valid and artifact-heavy variants preserve classification. Hardware gyro supports quality reporting only.

## 15. MEDIUM results

Post-transition-fix controlled runs produced 4/4, 4/4 and 4/4. Frozen negatives passed N0/N1/N2/N4 and failed N5.

## 16. HIGH control results

Post-change physical HIGH was `NOT_RUN`; synthetic boundary parity passed. M5.1 showed no HIGH advantage.

## 17. Negative protocol results

Frozen holdout confirmations: N0 0, N1 0, N2 0, N4 0, N5 3. N3 was tuning/diagnostic. N6 stopped after the blocking N5 result.

## 18. Positive protocol results

Twelve of twelve controlled MEDIUM events were detected after transition correction. Final positive holdout stopped after N5 made the gate NO_GO.

## 19. Tuning dataset

J5 fast-arm, controlled hops and direction diagnostics. Synthetic fixtures are marked hypotheses or sanitized aggregate derivatives.

## 20. Holdout dataset

Frozen operator-labelled stationary, slow rotation, fast rotation, walking and brisk-walking trials.

## 21. Pre-Woo confusion matrix

At trial level: four expected-negative/rejected and one expected-negative/detected; no completed positive holdout. See `PRE_WOO_VALIDATION.md`.

## 22. False positives

Fast-arm improved; brisk walking produced three confirmed events and is systematic/blocking.

## 23. False negatives

No misses in twelve post-fix MEDIUM controlled events. Historical J3 HIGH remains unresolved.

## 24. J4 separation/refractory

Synthetic three-hop gives exactly three; physical four-hop runs gave exactly four. The landing state supplies bounded refractory behavior.

## 25. Airtime status

Landing minus low-g entry only; `JUMP_AIRTIME_VALIDATED = NO`.

## 26. Height status

Not implemented; `JUMP_HEIGHT_VALIDATED = NO`.

## 27. Performance

Reported MEDIUM callback means were about 37–51 ms per 25-sample callback; maxima 38–58 ms. Histogram only bounds p95/p99 above 8 ms.

## 28. Memory

Raw storage and candidates remain bounded; retention is at most eight and hardware used roughly 26–30 KiB in reported SUMMARY_ONLY trials.

## 29. Long-session regression

Four-hour MEDIUM synthetic replay: 360,000 samples, fixed rolling buffer and at most eight retained candidates.

## 30. Hardware stability

No reported timestamp duplicate, out-of-order, gap or fallback; no watchdog reset observed.

## 31. Tests

Host covers profiles, hypotheses, direction, gyro modes, separation, privacy and bounds. Garmin covers buffers, impact, positive, transient low-g, retention and direction.

## 32. Garmin builds

Fenix 7, Fenix 7S and unit-test builds: `PASS` with Connect IQ SDK 9.2. Seven of seven Garmin unit tests passed.

## 33. Run No Evil

`RUN_NO_EVIL = PASS`: the existing `monkeydo ... -t` runner produced a logical 7/7 pass result.

## 34. npm audit

`NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem npm audit --audit-level=high`: `PASS`, zero vulnerabilities.

## 35. Privacy

No GPS, HR, serial, secrets or `.env` content used. Physical logs remain ignored/uncommitted.

## 36. Security

No backend, network, Supabase or global-certificate change. Signing key remains outside the repo.

## 37. Independent review

Signal, timing, Garmin, embedded, experimental-design, QA, privacy and architecture review support the bounded implementation and NO_GO conclusion.

## 38. Risks

Brisk walking overlaps short controlled hops in timing/direction. Wrist placement and kitesurf motion may add overlap.

## 39. Unknowns

Historical J3 HIGH cause, portability, gyro batch origin, N6, positive holdout and real kitesurf behavior.

## 40. Sensor-profile decision

`JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM`.

## 41. Gyro-role decision

`GYRO_ROLE = QUALITY_ONLY`.

## 42. M6 gate

`M6_WOO_VALIDATION_GATE = NO_GO`; blocker `FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING`.

## 43. Product-readiness flags

```text
JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```

## 44. Git status

Expected uncommitted M5.2 worktree, zero tracked raw captures, no commit/push.

## 45. Recommended next milestone

Do not open M6. Address `FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING`, then collect fresh positive/negative holdout.

## Required final flags

```text
M5_2_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
GYRO_ROLE = QUALITY_ONLY
M6_WOO_VALIDATION_GATE = NO_GO

JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```
