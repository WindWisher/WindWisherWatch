# Pre-Woo validation

2026-09-10 latest: the bounded [no-video operator-count round](NO_VIDEO_TRIAL_PROTOCOL.md) is CLOSED. NV2/NV3/NV4 each had one operator-reported hop during RUNNING and produced 0/1/0 confirmations respectively. All three complete captures pass strict transport checks and agree with host replay states/outcome counts; no new recorded crash. One compatible count is not an independently matched positive or validated recall. NV1 remains invalid after the export watchdog and the separate technical verification is not relabeled as a replacement negative. M6 remains NO_GO for FALSE_NEGATIVE_STABILITY and INCOMPLETE_NEGATIVE_CONTROL_EVIDENCE. No further physical trials are requested. The next step is offline rejection/confirmation comparison, not automatic retuning or repetition. Earlier status statements below are historical.

Provenance correction: the AT2-like fixture is an aggregate-inspired constructed waveform, not an exact physical replay. Its 2350 mg counterfactual failure is a synthetic regression, not proven recurrence of the historical hardware false positive. Preserve its test contract; do not infer a valid classifier from synthetic-versus-real axis differences. See [fixture provenance and vector audit](AT2_FIXTURE_PROVENANCE_AUDIT.md). No detector change or new physical collection; M6 remains NO_GO.

The preregistered WV1–WV3 tuning block is closed: 3/3 complete trials, 450 samples, zero confirmed false positives, 20 rejected candidates and zero host/Garmin state mismatches. Two negative candidates entered FLIGHT but failed deep/sustained low-g guards; none reproduced a complete hard-negative envelope comparable to the missed DIAG_01. No classifier change is justified by this block alone. The 2350 mg counterfactual still fails the preserved synthetic walking regression despite accepting the small hardware set. Stop collection at the agreed budget; M6 remains NO_GO for FALSE_NEGATIVE_STABILITY with insufficient hard-negative discrimination evidence. See [block closure](BT4_DIAGNOSTIC_CAPTURE.md). Earlier readiness statements are historical.

Latest WALK NEG01 tuning negative is complete: 150 samples, zero state mismatches, zero confirmed/six rejected candidates and no FLIGHT transition. Real walking impulses overlap/exceed the diagnostic candidate's duration and accumulated-area descriptors, so impulse-only separation is not supported. No artificial flight anchor, classifier change or new holdout. See [negative hardware comparison](BT4_DIAGNOSTIC_CAPTURE.md). M6 remains NO_GO; subsequent readiness statements are historical.

Latest clean-start DIAG_01 is complete: strict parsing verifies all 175 samples and the delivered marker tail. ACCEL_ONLY replay matches every Garmin state and zero confirmed/five rejected counts. The flight-bearing candidate is rejected by its 2354.51 mg takeoff peak below the unchanged 3000 mg envelope requirement despite meeting flight-duration/low-g guards. This reproduces the candidate-level rejection, not exact independent hop alignment or general discrimination validity. Parity remains PARTIAL; M6 remains NO_GO for FALSE_NEGATIVE_STABILITY. No new physical trial is requested; next work is offline phase-scoped discrimination review. See [complete capture evidence](BT4_DIAGNOSTIC_CAPTURE.md). Subsequent readiness statements are historical.

Latest transport preparation: Garmin's documented 5 KB TXT-to-BAK rotation is modeled by two passing regression tests; a nonempty starting TXT can lose an export prefix despite a sub-10KB payload. The previous starting size is unknown, so this is not a proven reconstruction of that failure. The watch TXT was backed up and reset, with 0 bytes verified in the MTP listing. One clean-start DIAG_01 capture is ready to test retention; physical success and full replay remain unverified. Do not repeat again before retrieving both log parts. See [current preflight](BT4_DIAGNOSTIC_CAPTURE.md). M6 remains NO_GO; older readiness statements below are historical.

Latest replacement result: acquisition tail is sufficient, but physical logs lost the manifest and first 25 of 150 exported samples. Strict parsing rejects it; no complete replay or parity claim. The retained candidate has sufficient recorded low-g/flight duration but a 2423.24 mg takeoff peak below the unchanged 3000 mg envelope threshold. This is partial evidence, not conclusive ground-reference alignment or permission to tune. No additional physical trial before resolving log-prefix retention. See [replacement evidence](BT4_DIAGNOSTIC_CAPTURE.md). M6 remains NO_GO; following preparation statuses are historical.

Latest window preparation: `0.5.1-m5.4bd-window1` has 225 bounded samples, a 12-second controller safety cap, lossless delta-clock export and the strict delivered-tail contract. Host checks (93 tests), both device builds and 17 Garmin logical tests pass; full stress export is 9140/9500 bytes. The build is copied to watch Apps, pending version confirmation and one technically justified replacement for the incomplete DIAG_01. Physical validity and discrimination remain unverified; M6 remains NO_GO. See [current protocol and bounds](BT4_DIAGNOSTIC_CAPTURE.md). Subsequent readiness statements below are historical.

Tail completion correction `0.5.1-m5.4bd-tail1` is implemented and tested locally, not installed: COMPLETED requires both wall-time and delivered-sample coverage; otherwise export is INCOMPLETE. A second SELECT cannot truncate the diagnostic tail. Bounds and detector thresholds are unchanged. A further physical trial is not ready pending review of the constrained window budget. See [current diagnostic status](BT4_DIAGNOSTIC_CAPTURE.md).

Latest DIAG_01 was collected but is protocol-incomplete: MARKED at 4187 ms, capture end at 6001 ms, only 1814 ms of the required 2000 ms tail. All 125 exported samples pass block checksums/counts, but the strict diagnostic parser rejects the missing tail. Preserve the attempt and review the duration/tail contract before requesting another trial. Its zero confirmations/four rejections do not establish a new validated discrimination result. See [diagnostic evidence](BT4_DIAGNOSTIC_CAPTURE.md). Older NOT_RUN statements below describe preparation history, not the latest attempt.

Prior WOO BLE/JADX research and the sibling WindWisher Jump Lab are documented in [prior research context](WOO_PRIOR_RESEARCH_CONTEXT.md). `WOO_VALIDATION = NOT_RUN` refers to the current Watch detector comparison, not the absence of historical WOO research. The 39-jump empirical model and SurfR self-comparison do not open M6 or replace DIAG_01. Review the documented evaluator matching limitation before future gate use.

M5.4B-D compact diagnostic export is implemented with synthetic serialization/decoding checks. Fresh Garmin builds and 15 logical tests pass; the diagnostic binary is copied to watch Apps, pending watch-side launch/version confirmation. Physical diagnostic remains NOT_RUN and physical capture transport integrity remains unverified. See [capture audit and current status](BT4_DIAGNOSTIC_CAPTURE.md). No freeze or holdout is initiated; classification thresholds remain unchanged.

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
