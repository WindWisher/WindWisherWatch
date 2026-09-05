# M5.3 Locomotion Context & False-Positive Suppression — Completion Report

## 1. Status

`HARDWARE_RESEARCH_INCONCLUSIVE`; M6 is `NO_GO`.

## 2. Executive Summary

A bounded observer was characterized, but periodicity overlaps real hops and no safe suppression rule emerged.

## 3. Git baseline

`main` at `2d2172ff7823c2564977d756103af5a454b3f3f2`.

## 4. Repository changes

Host/Garmin observer, aggregate evidence, bounded diagnostics, fixtures, tests and docs.

## 5. M5.2 baseline

MEDIUM, gyro `QUALITY_ONLY`, brisk-walking discrimination unresolved.

## 6. Brisk-walking root analysis

Walking-only trials rejected; intermittent extra confirmations clustered around TP3 transitions.

## 7. Hypotheses tested

Cadence, impact intervals, pre/post continuity and timestamp quality.

## 8. Locomotion context architecture

Experimental evidence below the Jump Engine decision; Session Engine boundary preserved.

## 9. Context window

Three seconds, fixed eight-impact history.

## 10. Impact tracking

Magnitude threshold, hysteresis and 180 ms debounce.

## 11. Periodicity model

Count, interval mean/CV and typed `NONE/POSSIBLE/PERIODIC/AMBIGUOUS` state.

## 12. Candidate context

Compact pre/post aggregates only.

## 13. Delayed confirmation

None added; TP3 diagnostic capture selection may wait for a second confirmation.

## 14. New reason codes

None; observer evidence was insufficient for decisions.

## 15. Feature distributions

Negative intervals around 460–1004 ms overlapped a true TP3 at about 615 ms/CV 0.149.

## 16. Impulse shape

Valid diagnostics peaked about 3583–4391 mg; thresholds were not retuned.

## 17. Low-g shape

Valid minima about 114–163 mg and 328–368 ms sustained low-g; unvalidated.

## 18. Landing recovery

Existing one-second stabilization retained; post cadence usually under-observed.

## 19. Tuning dataset

TN2/TN3, TP1 and TP3 physical trials; raw data local and unversioned.

## 20. Frozen configuration

Not reached because no supported suppression configuration exists.

## 21. Holdout dataset

Not opened; doing so would leak tuning decisions.

## 22. HN0 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 23. HN1 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 24. HN2 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 25. HN3 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 26. HN4 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 27. HN5 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 28. HP1 results

Holdout not run; tuning TP1 detected 4/4 observed hops.

## 29. HP2 results

`NOT_RUN_M5_3_HOLDOUT_NOT_OPENED`.

## 30. HP3 walking→hop→walking results

Three extras in the first two trials; three later one-hop trials were clean.

## 31. Holdout confusion table

Not produced because configuration never froze.

## 32. False-positive analysis

Intermittent transition-class failure remains unresolved.

## 33. False-negative analysis

No M5.3 TP1/TP3 operator-count miss; evidence is tuning-only.

## 34. Existing regression suite

J5, J3 HIGH, J4, accel-only, gyro artifacts, determinism and bounds retained.

## 35. MEDIUM status

Primary research profile remains MEDIUM.

## 36. HIGH status

Comparative only; no new benefit demonstrated.

## 37. Gyro status

`QUALITY_ONLY`; never required for classification.

## 38. Airtime status

`UNVALIDATED`.

## 39. Height status

`NOT_IMPLEMENTED` and `NOT_VALIDATED`.

## 40. Processing cost

Four-hour host replay processed 360,000 samples at 5.878 µs/sample and remained bounded. This is host evidence, not Garmin timing.

## 41. Memory bounds

Eight impacts, eight traces and fixed rolling/active buffers.

## 42. Garmin callback cost

Observed means about 46–98 ms, maximum 127 ms; optimization remains necessary.

## 43. Long-session regression

Four-hour synthetic test rerun because core context logic changed.

## 44. Tests

Periodic walking, walking→jump→walking, degraded timing, bounds and M5.2 regressions.

## 45. Garmin builds

Fenix 7 and Fenix 7S sequential builds passed. The unit-test build passed.

## 46. Run No Evil

Logical result: 8/8 passed, 0 failed, 0 errors. `monkeydo` returned process exit code 1 after printing `PASSED`; both facts are retained.

## 47. npm audit

`npm audit --audit-level=high` completed successfully with 0 vulnerabilities.

## 48. Privacy

No personal raw capture, GPS, HR, serial, secret or `.env` content committed.

## 49. Security

No backend, network, Supabase or certificate mutation.

## 50. Independent review

Signal, protocol and embedded reviews reject a periodicity veto and premature holdout.

## 51. Risks

Intermittent false positives, ground-reference ambiguity, short post-context and callback cost.

## 52. Unknowns

Exact physical timing of extras and a safe transition discriminator.

## 53. Brisk-walking blocker

`FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING = UNRESOLVED`.

## 54. M6 gate

`M6_WOO_VALIDATION_GATE = NO_GO`.

## 55. Product readiness

Detector, height and airtime remain non-product and unvalidated.

## 56. Git status

M5.3 remains uncommitted and unpushed pending authorization.

## 57. Recommended next milestone

Add bounded operator ground-reference alignment, then frozen transition tuning and independent holdout; do not open Woo.

```text
M5_3_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE
FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING = UNRESOLVED
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
GYRO_ROLE = QUALITY_ONLY
M6_WOO_VALIDATION_GATE = NO_GO

JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```
