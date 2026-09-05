# Pre-Woo validation

M5.4B-T pre-freeze review: `MORE_DIAGNOSTIC_EVIDENCE_REQUIRED`. Timestamp stop-flush correction is verified with host tests and 14 passing Garmin tests after user-authorized temporary signing. Both device builds pass; Run No Evil process exit remains 1 despite logical PASS. Existing tuning retains 3 positive detections and 2 misses, plus one negative trial without confirmations. No holdout starts. See [integrity report](CANDIDATE_TIMESTAMP_INTEGRITY.md).

## M5.4B status

The phase-scoped correction `experimental-0.5-phase-scoped-envelope` is implemented and verified synthetically and on the Garmin build/test path. Physical M5.4B tuning is in progress: the corrected BT1 trial matched one controlled hop with one confirmed candidate, no miss, and no extra detection, while keeping a larger post-event peak outside the immutable decision snapshot. A completely new frozen holdout is still `NOT_RUN`. The historical M5.4 matrix below remains unchanged and must not be treated as validation of the new algorithm.

```text
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```

## M5.4 gate

M5.4 established independent operator references, froze `experimental-0.4-impulse-lowg-envelope`, and completed fresh HN1–HN5 and HP1–HP4 holdout trials. `M6_WOO_VALIDATION_GATE = NO_GO`; Woo comparison must not start.

## Dataset separation

AT1–AT6 were tuning/alignment trials. HN1–HN5 and HP1–HP4 were collected only after the algorithm, thresholds, MEDIUM profile, and matching policy were frozen. No holdout observation changed the detector. Raw captures remain local and uncommitted.

## Frozen holdout confusion matrix

| Operator class                         | Trials/events | Positive detected | Positive missed | Negative detected | Negative rejected |
| -------------------------------------- | ------------: | ----------------: | --------------: | ----------------: | ----------------: |
| HN1 normal walking                     |             1 |                 0 |               0 |                 0 |                 1 |
| HN2 brisk walking                      |             1 |                 0 |               0 |                 0 |                 1 |
| HN3 brisk walking, different arm swing |             1 |                 0 |               0 |                 0 |                 1 |
| HN4 fast arm movement                  |             1 |                 0 |               0 |                 0 |                 1 |
| HN5 impact without hop                 |             1 |                 0 |               0 |                 0 |                 1 |
| HP1 isolated controlled hop            |             1 |                 0 |               1 |                 0 |                 0 |
| HP2 repeated controlled hops           |             3 |                 2 |               1 |                 0 |                 0 |
| HP3 walking, hop, walking              |             1 |                 1 |               0 |                 0 |                 0 |
| HP4 brisk walking, hop, brisk walking  |             1 |                 1 |               0 |                 0 |                 0 |
| **Total**                              |        **11** |             **4** |           **2** |             **0** |             **5** |

HP2 uses an independently declared count of three controlled hops. The single-marker UI precisely aligned only the final hop; the earlier confirmed candidate is an expected event under that declared protocol, not a false positive.

## Preliminary metrics

- controlled-hop detection rate: 4/6 operator-declared events;
- negative trials with a confirmed false detection: 0/5;
- confirmed false detections: 0 across the five negative trials;
- HP3 and the critical HP4 moving-hop trials: 2/2 matched, with no extra confirmations;
- negative holdout candidates: 154 rejected and none confirmed;
- timestamp duplicates, out-of-order samples, gaps, and fallback interpolation: 0 in every holdout trial.

These are single-operator controlled-motion research results, not kitesurf precision or recall.

## Conclusion

The frozen physical envelope separated every observed holdout negative from the moving-hop cases HP3 and HP4. IMU-only deterministic discrimination therefore shows useful signal, but controlled-hop detection is not yet stable enough for Woo validation: HP1 and the first HP2 hop were missed despite their final traces satisfying the intended strong-impulse, deep-low-g, duration, and stable-landing envelope.

Both misses support an implementation-timing hypothesis: peak acceleration can continue updating during landing stabilization after the envelope decision has already been made. This hypothesis was not corrected after freeze and requires a new predeclared validation cycle.

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
