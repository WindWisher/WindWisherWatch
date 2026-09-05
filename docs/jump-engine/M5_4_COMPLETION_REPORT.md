# M5.4 Operator Reference Markers & Independent Holdout Validation — Completion Report

## 1. Status

`M5_4_STATUS = COMPLETE`; the experiment answered its question, while M6 remains `NO_GO`.

## 2. Executive Summary

Independent post-event references and a frozen holdout showed zero confirmed events in five negative trials and detected 4/6 controlled hops. HP3 and critical HP4 passed, but HP1 and the first HP2 hop exposed a repeatable false-negative timing defect.

## 3. Git baseline

`main` at `2d2172ff7823c2564977d756103af5a454b3f3f2`.

## 4. Repository changes

Bounded operator-reference capture/alignment, locomotion evidence, one frozen envelope hypothesis, sanitized regressions, source guards, tests, and research documentation.

## 5. Operator-reference architecture

Reference evidence is independent of detector output and remains research-only.

## 6. Marker mechanism decision

The START button records a typed post-event marker after an operator-observed event.

## 7. Marker timing domain

Wall time is normalized to sensor time using sequence and measured callback lag.

## 8. Reference uncertainty

The frozen window is 2500 ms before and 100 ms after the marker, with measured callback lag included.

## 9. Trial model

Each trial records protocol, split, expected class, typed markers, and timing quality.

## 10. Negative-trial representation

Any confirmation in an operator-declared negative trial is a false positive.

## 11. Positive-trial representation

A confirmed candidate must overlap an independent marker window; HP2 additionally uses the operator-declared event count.

## 12. Capture integration

Compact summaries contain markers, candidate traces, quality, and bounded aggregates; no full-session raw IMU is retained.

## 13. Alignment architecture

Host inspection preserves on-device decisions and deterministically aligns references.

## 14. Matching policy

Normalized sensor-time overlap is required; detector output never supplies labels.

## 15. Ambiguity policy

Multiple compatible candidates are ambiguous and are never nearest-matched.

## 16. Within-trial analysis

Candidate counts, phases, physical envelope, locomotion context, reasons, and quality were compared inside each trial.

## 17. AT1 results

Walking: 3 valid trials, 0 false positives.

## 18. AT2 results

Brisk walking: 3 valid trials, 2 false positives before the frozen hypothesis.

## 19. AT3 results

Alignment diagnostics were used to establish marker and candidate-window behavior; no unsupported aggregate conclusion is claimed.

## 20. AT4 results

Walking-hop-walking: 2/3 marked events matched before freeze.

## 21. AT5 results

Brisk-walking-hop-brisk-walking: 0/3 marked events matched before freeze.

## 22. AT6 results

Arm motion only: 3 valid trials, 0 false positives.

## 23. Feature comparison

Peak plus deep low-g separated observed AT2 false positives from marked hops better than wrist-vector direction.

## 24. Discrimination hypothesis

Require peak at least 3000 mg and flight minimum at most 408 mg in addition to existing phase, duration, and stable-landing evidence.

## 25. Detector changes

One pre-holdout envelope gate was added; direction became supporting evidence. No change occurred after freeze.

## 26. Algorithm version

`experimental-0.4-impulse-lowg-envelope`.

## 27. Synthetic regressions

AT2-like rejection, AT5-like acceptance, existing negatives, J3/J4/J5, sample-rate, gyro, determinism, and bounds pass.

## 28. Frozen configuration

MEDIUM; peak >= 3000 mg; minimum <= 408 mg; flight >= 240 ms; sustained low-g >= 120 ms; stable landing required; gyro quality-only.

## 29. Holdout design

HN1–HN5 and HP1–HP4 were fresh, append-only evidence collected after freeze.

## 30. HN1 results

Normal walking: true negative; 0 confirmed, 40 rejected.

## 31. HN2 results

Brisk walking: true negative; 0 confirmed, 41 rejected.

## 32. HN3 results

Different brisk-walking arm swing: true negative; 0 confirmed, 28 rejected.

## 33. HN4 results

Fast arm movement: true negative; 0 confirmed, 26 rejected.

## 34. HN5 results

Impact without hop: true negative; 0 confirmed, 19 rejected.

## 35. HP1 results

Isolated hop: missed; 0 confirmed and 1 rejected despite a strong final physical envelope.

## 36. HP2 results

Three repeated hops: 2 confirmed and 1 missed. The final marked hop matched.

## 37. HP3 results

Walking-hop-walking: matched; 1 confirmed, 10 locomotion candidates rejected, no extra confirmation.

## 38. HP4 results

Brisk-walking-hop-brisk-walking: matched; 1 confirmed, 4 locomotion candidates rejected, no extra confirmation.

## 39. Holdout confusion table

Six positive events yielded 4 detected and 2 missed; five negative trials yielded 5 rejected and 0 detected.

## 40. False positives

0 confirmed false detections across 5 negative holdout trials.

## 41. False negatives

2/6 controlled events were missed: HP1 and the first HP2 hop.

## 42. Temporal alignment

All holdout timestamps were valid with zero duplicate, out-of-order, gap, or fallback samples.

## 43. IMU-only discrimination conclusion

`PROMISING_BUT_NOT_STABLE`: negatives and moving hops separated, but evaluation timing causes repeatable misses.

## 44. Sensor-profile conclusion

`JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM`.

## 45. Gyro conclusion

`GYRO_ROLE = QUALITY_ONLY`; numerous outliers reinforce that it must not gate detection.

## 46. Airtime status

Calculated experimentally as landing minus takeoff and remains unvalidated.

## 47. Height status

Not implemented and not validated.

## 48. Memory

Rolling buffers, active windows, eight candidate traces, and eight locomotion impacts remain bounded.

## 49. Processing

The four-hour host regression processed 360,000 samples at 6.500 µs/sample. Hardware callback summaries remain bounded but require later optimization analysis.

## 50. Hardware stability

All holdout captures completed on Fenix 7 with valid timestamps and bounded state.

## 51. Tests

`npm run check` passed; 82/82 tests passed.

## 52. Garmin builds

Pre-freeze sequential Fenix 7 and Fenix 7S builds passed; Garmin unit tests passed 10/10. Only documentation changed during closure.

## 53. Run No Evil logical result

`NOT_VERIFIED`; the Garmin unit-test result is not relabeled as Run No Evil evidence.

## 54. Run No Evil exit code

`NOT_VERIFIED`; no closure-time logical result and exit code pair was produced, so no PASS is fabricated.

## 55. npm audit

`NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem npm audit --audit-level=high` passed with 0 vulnerabilities.

## 56. Privacy

Raw captures stayed under `/tmp`; no GPS, HR, serial, secrets, or `.env` data was committed.

## 57. Security

No backend, network integration, Supabase, or global certificate configuration changed.

## 58. Independent review

Signal review accepts the envelope as useful but timing-defective; experimental review accepts holdout separation; embedded review confirms bounds; QA blocks M6 on repeated false negatives; privacy and architecture boundaries are preserved.

## 59. Risks

Landing-stabilization timing, single-marker HP2 precision, callback cost, single-operator evidence, and lack of kitesurf ground truth.

## 60. Unknowns

Whether deciding the envelope after stabilization fixes misses without reviving brisk-walking false positives.

## 61. Brisk-walking blocker

The prior false-positive pattern was not reproduced: HN2/HN3/HP4 had no extra confirmation. This does not erase tuning failures or establish production generality.

## 62. M6 gate

`M6_WOO_VALIDATION_GATE = NO_GO`; blocker: `FALSE_NEGATIVE_STABILITY`.

## 63. Product readiness

Jump detection remains experimental; detection, height, and airtime are not product-ready or validated.

## 64. Git status

M5.3/M5.4 work remains uncommitted and unpushed pending explicit authorization.

## 65. Recommended next milestone

Run a new predeclared validation cycle that corrects envelope evaluation timing, adds a sanitized regression for the HP1/HP2 pattern, and repeats fresh negatives and positives. Do not open Woo yet.

```text
M5_4_STATUS = COMPLETE
IMU_ONLY_DETERMINISTIC_DISCRIMINATION = PROMISING_BUT_NOT_STABLE
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
GYRO_ROLE = QUALITY_ONLY
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY

JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```
