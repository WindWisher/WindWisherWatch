# Prior WindWisher WOO research and Watch validation boundary

## Purpose and provenance

Consolidated on 2026-09-08 after the operator requested review of the sibling WindWisher project before continuing DIAG_01. This is a documentation-only context transfer, not a detector change or a new validation result.

Source checkout: `/Users/raulmartinez/Documents/Proyectos/Antigravity/WindWisher`. Relevant sources inspected in the preceding review:

- `SESSION_TRACKER.md`, sections dated 2026-04-23 covering WOO reverse engineering and Big Air refinement.
- `tmp/woo_apk_analysis/WOO_REVERSE_ENGINEERING.md` and `analyze_woo_capture.py`.
- Aggregate summaries in `session_board_mount_02_parsed.json` and `last_capture_session3_parsed.json`, under that same local analysis directory.
- `docs/research/jump_algorithm_validation.md`.
- `tools/jump_lab/README.md`, `evaluate.py`, `test_evaluate.py` and `extract_surfr_fit.py`.
- `.tmp/jump_lab/self-check.json`.

These paths identify evidence in a separate checkout; they are not runtime dependencies. The research directory and normalized captures are Git-ignored there. Only technical aggregate findings are reproduced here, not APK contents, vendor code, capture payloads, personal identifiers or secrets. Historical aggregate errors below were inspected, not recomputed from raw BLE in this documentation task.

## Existing work and its limits

| Existing evidence                                      | What it supports                                                                       | What it does not establish                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Android JADX analysis and BLE capture/decoding scripts | Prior investigation of WOO transport and resolved jump fields                          | Recovery of the actual firmware detector                         |
| `Air` values and `QhData` analysis                     | Empirical reconstruction of vendor-reported height/airtime from vendor representations | Independent jump detection from Garmin IMU samples               |
| Provisional `RawDataStatic` interpretation             | A hypothesis for record layout, clock, orientation and acceleration fields             | Verified physical units or portability to wrist sensors          |
| Two sessions with 39 reported jumps                    | Small-sample empirical fit/comparison evidence                                         | Independent holdout performance or physical measurement accuracy |
| SurfR Garmin FIT importer and Jump Lab evaluator       | Reusable offline comparison tooling                                                    | Validated WindWisher runtime or M6 readiness                     |

The Android investigation indicates that the app maps already-resolved values from the WOO ecosystem. It does not locate a complete core jump algorithm in Android or conclusively assign all computation between firmware and backend.

## Historical Big Air aggregate results

| Session role                                            | Reported jumps | Height MAE against WOO | Airtime MAE against WOO |
| ------------------------------------------------------- | -------------: | ---------------------: | ----------------------: |
| Primary, operator-confirmed Big Air with board mounting |             15 |              0.03685 m |               0.02853 s |
| Comparative session                                     |             24 |              0.02919 m |               0.04664 s |

These are stored results of the experimental `big_air_production_model`. Despite its historical name, it is not evidence of production readiness. Parameters and heuristics were explored using these sessions; do not relabel the comparative session as an untouched holdout. Neither low error against WOO outputs nor a model using WOO-derived representations establishes accuracy against independent physical ground truth.

`QhData` morphology is the primary input to that model. The provisional raw-static interpretation describes 1500 records of 44 bytes and approximately 335.66 Hz, with hypothesized quaternion and acceleration fields. These remain vendor-specific research hypotheses, not sampling or calibration requirements for Garmin. The documented raw-static airtime comparison subset contains only three useful jumps in the primary session.

## Reuse conditions for Jump Lab

The SurfR FIT importer and normalized event format can inform future offline comparison. Do not modify Canonical Session v1 to accommodate this research format. The recorded 112/112 self-check compares SurfR with SurfR; it verifies a self-comparison path, not Watch versus a reference device.

The preceding read-only review ran the evaluator's existing unit test successfully and reproduced a temporal-matching limitation: greedy nearest-pair selection can reduce the number of valid matches. With reference times `[0, 1.5]`, candidate times `[1, 2.5]` and tolerance `1.1` seconds, the evaluator returns one match, one false positive and one false negative even though two one-to-one matches are feasible. Before using this evaluator for a gate decision, define the matching objective, correct/test ambiguous assignments and validate finite timestamps, clock alignment and missing-value handling. This task does not implement those changes.

Future comparison must separate detection misses/extra events from errors on matched jumps, preserve uncertainty in event alignment and split tuning from unseen sessions. Vendor output is an external comparator, not automatic physical ground truth. No new comparison or device/network capture is authorized by this context note.

## Consequence for the pending Garmin diagnostic

DIAG_01 still addresses an unanswered question: did an earlier walking step trigger LANDING before the actual controlled hop, or was the captured flight evidence insufficient under the current detector? The old WOO captures do not contain a synchronized replay of that Garmin trial and cannot settle this distinction.

Keep the current detector, physical thresholds, MEDIUM profile, gyro quality-only role and session boundaries unchanged. Do not transplant WOO-derived formulas, implement height or infer validated airtime. Preserve all previous misses and repetitions.

Next action is operator confirmation of `BT4 DIAG01 / MEDIUM`, `CONTROLLED_FULL_WINDOW` and app version `0.5.1-m5.4bd` on the watch. Only then provide the single short diagnostic protocol already described in [BT4 diagnostic capture](BT4_DIAGNOSTIC_CAPTURE.md). Analyze completeness, marker alignment and state sequence before asking for further trials. Do not repeat merely to obtain a confirmation; an incomplete capture is a technical failure, while a complete but ambiguous capture remains inconclusive.

## Status semantics

`WOO_VALIDATION = NOT_RUN` means validation of the current WindWisher Watch detector against WOO has not been run. It does **not** mean that the broader WindWisher project has never investigated WOO.

```text
PRIOR_WINDWISHER_WOO_RESEARCH = DOCUMENTED
WATCH_VS_WOO_VALIDATION = NOT_RUN
BT4_DIAGNOSTIC_CAPTURE = NOT_RUN
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
