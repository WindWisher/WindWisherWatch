# M5.4B-D Full-Window Diagnostic Capture Report

## Current status — 2026-09-08

### 2026-09-09 — fixture provenance and vector feasibility audited

The [AT2 provenance audit](AT2_FIXTURE_PROVENANCE_AUDIT.md) distinguishes historical operator-labeled failures from the constructed regression waveform. Its pulses, single-axis geometry, constant gyro, synthetic clocks and late peak are not a verified sample-by-sample AT2 replay. Lowering a threshold has demonstrated a synthetic regression, not certain recurrence of the historical physical false positive. This corrects any stronger shorthand in earlier entries without weakening the fixture or its expected rejection.

Raw-vector descriptive checks are feasible on the complete DIAG_01/WV captures, but the tiny sample set and constant collinear geometry shared by synthetic positives and negatives preclude a validated new axis discriminator. A synthetic-versus-real shortcut must not be promoted. The model documentation's stale mandatory direction gate was corrected to match the existing phase-scoped implementation; no code or threshold change. No new physical trials are prescribed; M6 remains NO_GO. New independent timing/reference collection requires a separately defined method and budget.

### 2026-09-09 — WV3 collected; three-trial block closed

WV3 maps to `jr-1788921642-1229129045`. BAK 6738 bytes and TXT 70 bytes are preserved in `/tmp/ww-wv3.RPp2Wq/` with strict replay and preflight output. The negative1 reference, checksum/count/sequence and zero-origin clock checks pass for 150 samples, normalized 0–6104 ms, wall duration 6680 ms. Host/Garmin states match 150/150 and outcomes agree: zero confirmed, seven rejected; no FLIGHT entries. Six 25-sample callbacks report mean/max processing 105/139 ms, maximum interval 1101 ms, zero timestamp anomalies and 65 gyro outliers. Percentiles remain unresolved above 8 ms. No deviation reported by the operator. Neither log was cleared after collection; no further trial is prepared.

| Preregistered tuning trial       | Samples | Confirmed | Rejected candidates | Candidates entering FLIGHT | State mismatches |
| -------------------------------- | ------: | --------: | ------------------: | -------------------------: | ---------------: |
| WV1 relaxed natural arms         |     150 |         0 |                   6 |                          1 |                0 |
| WV2 reduced natural swing        |     150 |         0 |                   7 |                          1 |                0 |
| WV3 slightly wider natural swing |     150 |         0 |                   7 |                          0 |                0 |
| Block total                      |     450 |         0 |                  20 |                          2 |                0 |

All three attempts are complete and retained. The separate WALK NEG01 baseline is not part of the three-trial budget. Two flight-anchored negative sequences were captured, but neither meets the deep/sustained low-g conditions of the missed DIAG_01 candidate: WV1 minimum 627.03 mg / sustained 0 ms / duration 204 ms; WV2 633.95 mg / 40 ms / 244 ms; DIAG_01 candidate 2 is 367.96 mg / 124 ms / 246 ms. These observations explain the current negative rejections; they do not reconstruct the historical AT2/N5 hard-negative failures or validate a new classifier. Three zero-FP trials do not establish a population false-positive rate; 20 rejected candidates are not 20 independent trials. All captures are tuning, not holdout.

Final offline cross-check, using constructor overrides only and the already investigated 2350 mg counterfactual: the complete DIAG_01 changes from zero to one confirmation; WALK NEG01 and WV1–WV3 remain at zero. This apparent success on the small hardware set is insufficient: the preserved synthetic walking counterexample still changes from zero to one under both profiles, as the earlier regression demonstrates. Selecting that threshold by ignoring the counterexample would overfit. No default or hardware threshold was changed.

Block conclusion: COMPLETE_AS_PREREGISTERED, with INSUFFICIENT_HARD_NEGATIVE_EVIDENCE for policy promotion. Stop physical collection at the agreed budget. No escalation of arm motion, fourth variation, additional build or hidden retuning. The complete transport/replay diagnostic objective is achieved; robust discrimination is not. M6 remains NO_GO for FALSE_NEGATIVE_STABILITY, with unresolved hard-negative feature discrimination. Height/airtime remain unvalidated and Woo NOT_RUN.

Next decision, rather than another automatic collection loop: retain this experimental detector and archive this research result, or explicitly scope a new discriminative-feature/reference study. Such a study needs predeclared new information (for example independent event alignment and complete adversarial sequences), acceptance criteria and a fresh bounded collection budget. Repeating this three-trial block or sweeping the same scalar thresholds cannot fill that missing evidence by itself. No commit/push was performed.

### 2026-09-09 — WV2 collected; final variation WV3 prepared

WV2 maps to `jr-1788921381-1228868086`. BAK 6767 bytes and TXT 70 bytes are preserved with replay/preflight output in `/tmp/ww-wv2.YoY3tF/`. Strict negative1 parsing verifies 150 samples, contiguous sequence and normalized coverage 0–6104 ms, wall duration 6661 ms, reference and completion contract. Host/Garmin states match 150/150 and outcome counts agree: zero confirmed and seven rejected. No operator deviation was reported. This remains one tuning negative trial.

Candidate 5 starts at 4300 ms, enters FLIGHT at 4588 ms, landing at 4832 ms, and is rejected at 5856 ms. Frozen takeoff 1711.986572 mg, flight minimum 633.947815 mg, duration 244 ms, sustained low-g 40 ms, stable landing. Duration alone meets the 240-ms guard, but sustained/deep low-g and takeoff envelope do not. No airborne event is inferred from the state label. Fixed 120/240/360-ms preflight areas are 0.00014/0.22982/0.77089 m/s; last impulse is 66.34 ms with 0.09251 m/s excess above 14 m/s². No threshold is selected from these observations.

Six callbacks of 25 samples report mean/max 101.5/131 ms, maximum interval 1040 ms; timestamp anomaly counters zero, gyro outliers 19. Percentiles remain unresolved in the >8-ms bucket. No code, build, detector or profile change during this block.

Progress: 2/3 attempts collected. After backup, only the watch TXT was reset to zero bytes for WV3; BAK and other logs were not manually changed. WV3 is the final preregistered variation: same comfortable brisk pace with slightly wider natural arm swing, no exaggerated movement, running or jumping. Display remains WALK NEG01 / MEDIUM; reconnect after this one capture. M6 stays NO_GO; no extra trials are added if the hard-negative pattern is absent.

### 2026-09-09 — WV1 collected; WV2 preflight ready

WV1 maps to manifest experiment `jr-1788921094-1228581013`, negative1 / M54BD_WALK_NEG_01. BAK 6766 bytes and TXT 70 bytes are preserved locally in `/tmp/ww-wv1.cpux7n/`, alongside strict replay and preflight analysis. All 150 samples pass parsing, reference, checksum, sequence and clock checks; normalized coverage 0–6104 ms, wall duration 6698 ms. Host/Garmin states match 150/150 and outcome counts agree: zero confirmed, six rejected. This is one tuning negative trial, not six trials. No reported operator deviation.

Candidate 1 enters FLIGHT at 2664 ms and POSSIBLE_LANDING at 2868 ms, then is rejected at 3892 ms. Frozen takeoff is 1752.842285 mg; flight minimum 627.027466 mg, flight duration 204 ms, sustained low-g 0 ms, landing stable. Thus this physical walking trial provides a flight-anchored negative, but not a negative meeting the deep/sustained flight guards. The state name does not imply the operator became airborne. The existing rejection is explained without changing thresholds.

Identical offline windows at flight entry yield excess areas 0 / 0.04217 / 0.52105 m/s at 120/240/360 ms. Last connected impulse duration is 172.95 ms, excess above 14 m/s² is 0.19404 m/s. These are descriptors of one negative, not a newly selected separation rule. Six callbacks report mean/max processing 104.166664/153 ms, maximum interval 1101 ms; gyro outliers 59, timestamp anomaly counters zero. Percentiles remain unresolved above 8 ms.

Block progress: 1/3 attempts collected. No retuning between WV1 and WV2. The watch TXT now shows 0 bytes (MTP verified at 04:34); its prior 70 bytes remain backed up with BAK, which was not manually cleared. WV2 uses the preregistered same comfortable brisk pace with slightly bent elbows and naturally reduced arm swing, never rigid restraint. The on-watch label remains WALK NEG01 / MEDIUM. WV3 remains pending; no new build or commit. M6 remains NO_GO.

### 2026-09-09 — bounded negative variation block preregistered

Operator approved a maximum of three additional tuning walking trials, collected separately with the unchanged negative1 binary, MEDIUM, NONE / NEGATIVE_TRIAL reference and six-second delivered-time contract. Trial aliases below are operator-protocol annotations, not new on-watch protocol IDs; the display remains WALK NEG01. On collection associate each alias with its actual manifest experiment ID and preserved files. Do not invent IDs in advance.

- WV1: brisk comfortable walking with relaxed natural arm swing.
- WV2: same comfortable pace with slightly bent elbows and naturally reduced arm swing; no rigid restraint.
- WV3: same comfortable pace with a slightly wider but still comfortable natural arm swing; no forceful wrist flicks or exaggerated motion.

All trials use a clear level path, no running, jumping or induced impacts. Start from rest, press START once, wait through the countdown, then walk until automatic completion. Do not watch candidate counts or alter motion to trigger the detector. Collect each trial before the next and clean the TXT only after preserving the preceding capture. Record accidental hops, stops and protocol deviations independently. The earlier WALK NEG01 remains a separate baseline, not replaced by this block. All three remain TUNING; no detector changes between them and no holdout claim. At most three attempts, including incomplete/failed attempts; do not silently replenish failures. Stop earlier for discomfort or transport failure requiring engineering review.

Question: does safe natural walking variation produce a complete jump-like negative sequence suitable for temporal feature comparison? Zero FLIGHT entries is a valid outcome, not grounds for escalation. If the pattern is absent after the budget, close this block as insufficient hard-negative evidence and do not request more vigorous movements. If present, use the recorded full sequence without relabeling from detector output. M6 remains NO_GO regardless of this block alone.

WV1 preflight: the existing 70-byte TXT and 6668-byte BAK are backed up in `/tmp/ww-negative-capture.oAoA44/`. The watch TXT was reset to zero bytes at 04:28; BAK and other logs were not manually changed. WV1 is pending operator execution; WV2/WV3 are not yet prepared. No new code/build/commit/push.

### Joint-sequence audit — monotonic guard repair excluded for the current counterexample

The existing classifier already combines takeoff evidence, low-g duration/minimum, flight duration and stable landing. Reviewing those phases together does not create a new feature by itself. `joint-evidence.mjs` is an offline audit helper, not imported by the classifier or Garmin. Its dominance check applies only to the current directions of the four scalar guards and stable-landing requirement. Tests use synthetic values, not raw personal capture data.

| Decision-time evidence | DIAG_01 candidate 2 (hardware MEDIUM) | Walking counterexample (synthetic MEDIUM / HIGH) |
| ---------------------- | ------------------------------------: | -----------------------------------------------: |
| Takeoff peak m/s²      |                               23.0899 |                                          24 / 24 |
| Flight minimum m/s²    |                                3.6085 |                                        2.7 / 2.7 |
| Flight duration ms     |                                   246 |                                        280 / 280 |
| Sustained low-g ms     |                                   124 |                                        240 / 260 |
| Landing stable         |                                  true |                                      true / true |

The synthetic negative dominates this hardware candidate in every existing monotonic guard dimension. Therefore any conjunction of adjusted lower bounds on takeoff/flight/sustained-low-g and an upper bound on flight minimum that admits this candidate also admits that negative. This conclusion covers these guards, not all possible classifiers, vector features or temporal representations. It does not label a synthetic trace as real hardware, nor establish that the same operator movement produced both.

Sensitivity audit: the hardware candidate has only +6 ms flight-duration and +4 ms sustained-low-g margins, compared with the roughly 40–42 ms native sample spacing in this capture. This is a near-boundary observation, not a measured timestamp error or license to interpolate a new ground-truth airtime. The takeoff margin is -6.33005 m/s² and the low-g margin +0.39154 m/s². Changing one guard cannot establish robust behavior across sample phases. No new clock perturbation or physical HIGH result is claimed.

The real WALK NEG01 never entered FLIGHT, so it supplies a valid easy negative but not the missing hard-negative temporal sequence. Historical M5.2 N5 and M5.4 AT2 reports establish that jump-like negative failures occurred; their reported aggregates do not provide a validated complete matched raw sequence for this feature review. The reviewed material therefore cannot justify a new temporal discriminator or a M6 GO decision. Do not retune from the old holdout or infer that all walking is now solved by one negative trial.

Graph closure for the autonomous offline work:

```text
Complete positive-protocol trace -> rejection reproduced -> weak takeoff identified
Complete negative-protocol trace -> no flight, zero false confirmations
Synthetic hard negative -> all existing joint guards dominate missed candidate
Area/duration studies -> overlap or window-sensitive ordering
                         |
                         v
NO_POLICY_PROMOTION; M6 NO_GO
Missing edge: independently labeled full hard-negative jump-like sequence
```

Next evidence acquisition must target that missing edge, not a confirmation count or a desired detector result. A bounded tuning protocol can use predeclared natural brisk-walking arm-swing variations with no running, hopping or induced impacts; trial labels come from the operator and every outcome is retained. Captures without flight remain valid negatives but cannot close the hard-negative comparison. Stop at the predeclared trial budget if the pattern is absent, report insufficient evidence and do not ask for progressively exaggerated motions. The installed negative1 app can collect the raw data with unchanged detector and a clean-log preflight between trials; no new acquisition or installation was performed in this audit. Exact movement variation and trial budget need to be communicated before the operator acts. Independent holdout and repeated controlled positives would still be required after any future policy change.

Validation: `npm run check` passes with 103 main tests and the repeated 38-test session suite. No Garmin source changed in this audit; previous builds are not relabeled as newly run. No commit/push, raw capture publication, backend, Woo or height work.

### 2026-09-09 — WALK NEG01 complete, impulse-only separation unsupported

Operator reported WALK NEG01 completed with LOGS visible. Read-only collection preserved BAK 6668 bytes and TXT 70 bytes in `/tmp/ww-negative-capture.oAoA44/`. Strict parsing accepts the negative1 identity, TUNING/NONE negative reference, checksums, all 150 sequential samples and zero-origin clock 0–6104 ms. Duration is 6658 ms, exceeding the fixed 6000-ms wall and delivered-sample requirement. Observed/exported counts agree, dropped and unprocessed delivered counts are zero. No raw capture is versioned.

Unchanged ACCEL_ONLY host replay matches all 150 Garmin states and zero confirmed/six rejected candidates. No candidate enters FLIGHT; `preflight-study.mjs` correctly returns no flight-anchored windows. Report one completed negative trial with zero confirmed false positives, not six independent trials or a statistically established false-positive rate. Parity remains PARTIAL, not complete feature/gyro equivalence.

Follow-up descriptive scan uses the same interpolation and levels, but windows end at every recorded sample instead of flight entry. This distinction is essential: no artificial flight anchor or marker was invented. Maximum negative-window areas for 120/240/360 ms are 1.3615/2.1054/2.5729 m/s. These exceed DIAG_01 candidate 2's flight-anchored 0.0205/0.9482/1.9928 values, but are not matched-anchor comparisons or a test of a combined flight-conditioned classifier.

The 13 complete connected impulses above 14 m/s² span 53.71–352.40 ms; their durations include 216.48, 263.83 and 306.69 ms around DIAG_01 candidate 2's 230.41 ms. Maximum impulse excess above 14 is 1.1178 m/s versus that candidate's 0.9922 m/s. Walking therefore can produce both long and substantial impulses in real hardware. An impulse-duration or accumulated-area lower bound alone is not supported as the missing discriminator. The earlier apparent separation from synthetic walking was not sufficient. This does not exclude a future joint temporal model, but supplies no authority to tune one to this pair.

Performance: six callbacks of 25 samples, mean/max processing 98.5/112 ms, maximum inter-callback interval 1099 ms; all percentile observations are in the >8-ms overflow bucket, so numeric p95/p99 remain unavailable. Timestamp anomaly counters are zero; gyro outliers 104. Export-time free memory 717528 bytes is a point measurement, not peak heap.

Graph/loop exit: transport and reference prerequisites are satisfied for this negative trial. The duration/area-only hypothesis is not promoted; discrimination remains blocked. No detector change, threshold sweep, build, installation, log reset, further operator repetition or holdout was performed during collection. Next offline work must evaluate joint flight/impulse temporal structure against the preserved controls, not request another identical walking trial by inertia. M6 stays NO_GO for FALSE_NEGATIVE_STABILITY; height/airtime remain unvalidated and Woo remains NOT_RUN.

```text
WALK_NEG01_CAPTURE = VERIFIED_COMPLETE
WALK_NEG01_CONFIRMED_FALSE_POSITIVES = 0
WALK_NEG01_HOST_GARMIN_STATE_MATCH = 150_OF_150
FLIGHT_ANCHORED_NEGATIVE_COMPARISON = NOT_AVAILABLE_NO_FLIGHT_TRANSITION
IMPULSE_ONLY_DISCRIMINATOR = NOT_SUPPORTED
M6_WOO_VALIDATION_GATE = NO_GO
```

### 2026-09-09 — negative diagnostic prepared and copied

Operator approved one brisk-walking-only comparison. Build `0.5.1-m5.4bd-negative1` defaults to `M54BD_WALK_NEG_01`, visible `WALK NEG01 / MEDIUM`. The detector and its thresholds are unchanged. The diagnostic reference is TUNING / NONE with PREDECLARED_PROTOCOL NEGATIVE_TRIAL, never CONTROLLED_HOP. Acquisition automatically finishes only after both elapsed and delivered normalized time reach 6000 ms, with unchanged 225-sample/12000-ms caps and strict quality/completeness checks. No post-event button is needed. START during running does not truncate this diagnostic. A cap without complete coverage remains INCOMPLETE.

Host parsing accepts this exact new identity and negative reference while preserving earlier positive captures and their marker-tail checks. Tests reject hop labels, missing negative references and insufficient duration. `npm run check` passes (101 main tests plus repeated 38); sequential fenix7/fenix7s builds pass; Garmin 17/17 logical tests pass, runner exit 1. New physical acquisition remains NOT_RUN.

The fenix7 binary was copied as `Apps/WWJumpResearch.prg` (MTP listing 140.8 KiB). Watch import/launch is pending operator confirmation. The prior TXT (2240 bytes) and BAK remain backed up in `/tmp/ww-clean-capture.dIqvuU/`. Only the watch TXT was replaced with zero bytes, verified by the MTP listing at 00:04; the BAK and other logs were not manually modified. No commit/push.

Protocol: disconnect, verify WALK NEG01 and negative1 version, press START once, wait out the three-second countdown, walk briskly but comfortably on a clear level path without jumping/running or exaggerated wrist movements, and continue until automatic completion (roughly 6–8 seconds after countdown, bounded by 12 seconds). Do not press a marker or restart. Reconnect and expose LOGS even on INCOMPLETE/FAILED; report any accidental hop or interruption independently of detector output. This is one tuning negative trial, not holdout or an M6 gate decision.

### Fixed-window and last-impulse cycle — promotion blocked by comparative evidence

The graph's phase-measurement node now has a reproducible offline runner: `node tools/jump-engine/preflight-study.mjs /tmp/ww-clean-capture.dIqvuU/WWJumpResearch.BAK /tmp/ww-clean-capture.dIqvuU/WWJumpResearch.TXT`. It uses the unchanged engine, 40 retained observations, fixed 120/240/360 ms windows ending at flight entry, interpolated boundaries and the last connected interval above the existing 14 m/s² impulse threshold. Fixed windows may include observations before candidate start, unlike the earlier phase-only measurement; none extend beyond flight entry. The analysis writes no hardware capture into the repository. Detailed local output is `/tmp/ww-preflight-study.jsonl`.

| Evidence                             | Area 120 ms | Area 240 ms | Area 360 ms | Last impulse duration ms | Last impulse excess above 14, m/s |
| ------------------------------------ | ----------: | ----------: | ----------: | -----------------------: | --------------------------------: |
| DIAG_01 candidate 2, MEDIUM hardware |      0.0205 |      0.9482 |      1.9928 |                   230.41 |                            0.9922 |
| DIAG_01 candidate 3, MEDIUM hardware |           0 |      0.3493 |      1.4187 |                   189.83 |                            0.7181 |
| Walking negative, MEDIUM synthetic   |      0.1892 |      1.0408 |      1.0408 |                    86.96 |                            0.6348 |
| Walking negative, HIGH synthetic     |      0.3784 |      1.0881 |      1.0881 |                    83.48 |                            0.7174 |
| Moving-hop control, MEDIUM synthetic |      0.3339 |      1.6655 |      1.6655 |                    96.85 |                            1.2316 |
| Moving-hop control, HIGH synthetic   |      0.6108 |      1.7205 |      1.7205 |                    88.42 |                            1.3358 |

Areas integrate scalar magnitude excess above gravity, with units m/s but no vertical-velocity interpretation. Hypothesis result: ordering reverses between 240 and 360 ms for candidate 2 versus synthetic walking. Choosing 360 ms merely because it separates this pair would be tuning on the answer. At 240 ms the synthetic moving-hop profile difference shrinks relative to the candidate-wide comparison, but sampling dependence remains; at 120 ms it is substantial. No sample-rate robustness claim follows from time units alone.

The last hardware impulse is longer than those in these synthetic controls, but the unlabeled candidate 3 also has a long impulse. A duration cutoff chosen between them would lack independent ground reference. HP1-like synthetic control duration is 86.53/83.27 ms (MEDIUM/HIGH), overlapping the walking negative; HP2-like is 89.48/84.74 ms. Neither duration nor area alone establishes a general separating rule. Existing flight guards remain necessary and unchanged.

Cycle exit: NO_POLICY_PROMOTION. Added tests cover fixed-window interpolation, exclusion of later peaks, incomplete coverage, separate impulses and threshold crossings. No Garmin, default threshold, canonical export, backend, Woo or product change. The next blocking edge is a complete, independently labeled negative hardware trace under the same capture and timestamp contract. Historical summaries cannot provide these unrecorded integrals; synthetic cases cannot replace that comparison. Before requesting physical collection, agree one brisk-walking-only diagnostic protocol with an explicit non-jump reference (do not silently reuse a CONTROLLED_HOP manifest). Preserve tuning/holdout separation. Further blind parameter sweeps or repetitions are not justified.

```text
FIXED_WINDOW_HYPOTHESIS = WINDOW_SENSITIVE_NOT_PROMOTED
LAST_IMPULSE_HYPOTHESIS = INSUFFICIENT_COMPARATIVE_HARDWARE_EVIDENCE
NEXT_REQUIRED_EVIDENCE = LABELED_NEGATIVE_FULL_WINDOW_CAPTURE
DETECTOR_CHANGE = NONE
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```

### Graph/loop cycle — time-integrated takeoff evidence, not promoted

Dependency graph for this cycle:

```text
Complete diagnostic capture + existing synthetic controls
  -> unchanged engine's candidate-start / flight-entry boundaries
  -> elapsed-time takeoff measurements
  -> negative separation AND phase/profile stability AND independent labels
  -> policy consideration (BLOCKED: comparative hardware evidence insufficient)
```

Hypothesis: takeoff duration and accumulated acceleration can distinguish weak-takeoff hops from walking. Stop rule: do not select a classifier threshold if apparent separation relies on one physical trace versus synthetic controls, unstable phase boundaries, or unsupported physical-event labels.

The new offline-only `takeoff-evidence.mjs` measures candidate start through the sample entering FLIGHT. It integrates `max(|accel|-9.80665, 0)` in seconds using piecewise-linear magnitude interpolation, including exact threshold crossings. It also measures interpolated time above the existing 14 m/s² impulse level. These are scalar wrist-signal descriptors, NOT vertical velocity, mechanical impulse, height or validated airtime. No landing/post-event samples enter the measurement. Duplicate/reversed clocks, nonfinite values and gaps above 120 ms are rejected. The host helper uses constant extra space; no Garmin callback or detector code is changed. A time-based analytic control at 25/50 Hz verifies the integration, not sample-rate invariance of the detector's phase boundaries.

| Evidence / phase                        | Profile          | Phase duration ms | Excess area m/s | Time above 14 m/s² ms |
| --------------------------------------- | ---------------- | ----------------: | --------------: | --------------------: |
| Complete DIAG_01 candidate 2            | MEDIUM hardware  |               696 |          3.5264 |                375.76 |
| Complete DIAG_01 candidate 3            | MEDIUM hardware  |               738 |          3.1753 |                283.39 |
| Walking false-positive envelope control | MEDIUM synthetic |               160 |          0.7569 |                 58.78 |
| Walking false-positive envelope control | HIGH synthetic   |               160 |          0.9462 |                 69.39 |
| HP1-like late-peak control              | MEDIUM synthetic |               160 |          0.7526 |                 58.35 |
| HP1-like late-peak control              | HIGH synthetic   |               160 |          0.9440 |                 69.17 |
| HP2-like late-peak control              | MEDIUM synthetic |               160 |          0.8644 |                 59.83 |
| HP2-like late-peak control              | HIGH synthetic   |               160 |          1.0800 |                 69.92 |
| Brisk-walking / hop phase control       | MEDIUM synthetic |               480 |          1.9494 |                125.03 |
| Brisk-walking / hop phase control       | HIGH synthetic   |               160 |          1.4986 |                 72.20 |
| J5 structural hypothesis control        | MEDIUM synthetic |               160 |          0.4116 |                 50.00 |
| J5 structural hypothesis control        | HIGH synthetic   |               140 |          0.5336 |                 65.00 |

Interpretation: candidate 2 differs from this synthetic walking example, but the same hardware capture's later candidate has a similarly large integral despite failing the existing flight guards. It has no independent positive/negative event label and must not be silently labeled walking. HP1/HP2 controls overlap the walking control on these measures. The same synthetic moving-hop scenario has different candidate phase lengths at the two profiles; elapsed-time integration alone does not eliminate sampling/smoothing/segmentation dependence. Comparing a long hardware phase with a short synthetic phase risks measuring accumulated steps rather than a discriminating takeoff structure. Historical SUMMARY_ONLY captures cannot reconstruct the missing phase integral.

Decision: hypothesis remains INSUFFICIENT_EVIDENCE; no threshold, classifier, binary, holdout or M6 status change. This cycle stops before policy promotion. The next offline cycle should compare fixed-duration pre-flight windows and separate the last impulse from preceding locomotion, then quantify profile sensitivity using equivalent signals. Only after that review should missing matched negative hardware evidence justify any new operator protocol. No additional physical trial is requested now.

### Offline counterfactual — threshold-only repair rejected

The existing engine was replayed without source/config-default changes, using constructor overrides only: 3000 mg baseline versus 2350 mg takeoff peak, with all other guards unchanged. On the complete local DIAG_01, confirmations change from zero to one. Across the existing synthetic catalog under both MEDIUM and HIGH, the `brisk-walking-false-positive-envelope-v1` negative also changes from zero to one. The two HP1/HP2-like late-peak controls change from zero to one as well; those controls represent decision immutability hypotheses, not independently labeled new hardware positives. All other catalog confirmation counts are unchanged in this comparison. This is a sensitivity experiment, not parameter selection, new holdout, or a physical HIGH replay.

A dedicated regression test preserves the walking counterexample at both profiles. Lowering takeoff amplitude alone is therefore rejected as a repair. The phase-scoped snapshot correctly prevents later peaks from being reused as takeoff evidence; removing that boundary is not justified either. Historical AT2 peak aggregates (2335–2386 mg) overlap this diagnostic candidate's 2354.51 mg, but historical global peaks and current phase-specific peaks are not interchangeable. The synthetic counterexample is stronger evidence of a current-policy regression than that aggregate comparison alone.

Next bounded research question: can time-integrated takeoff evidence and pre-flight temporal structure separate weak-takeoff hops from the walking counterexample without using post-event peaks or requiring gyro? These are untested hypotheses, not a chosen discriminator. Matched phase-scoped negative evidence is needed before promoting a policy; existing summary-only hardware cannot reconstruct an unrecorded integral. No additional operator trial is prescribed at this point. Detector defaults and installed Garmin binary remain unchanged; M6 stays NO_GO.

### Clean-start DIAG_01 collected — complete transport, weak-takeoff rejection reproduced

The operator reported COMPLETED and connected the watch. Both log parts were copied without modifying the watch into `/tmp/ww-clean-capture.dIqvuU/`: BAK 5186 bytes and TXT 2240 bytes. The real manifest identifies `0.5.1-m5.4bd-window1` and `M54BD_BT4_DIAG_01`. Strict parsing and `diagnose-bt4.mjs` now succeed. All 175 samples, sequences 0–174, are present with valid block checksums and normalized timestamps 0–7128 ms. Observed/exported counts both equal 175, with zero reported dropped or unprocessed delivered samples. No missing data or identity was synthesized. Raw logs and the detailed replay remain outside Git.

MARKED wall time is 4162 ms; capture duration is 7728 ms. Wall tail is 3566 ms and conservative delivered-sample tail is 2966 ms, both above 2000 ms. The complete export supports clean-start retention for this attempt only, not a universal firmware guarantee or proof of the previous loss's exact cause.

ACCEL_ONLY host replay has zero state mismatches across 175 samples and agrees with Garmin on zero confirmed/five rejected candidates. The diagnostic tool deliberately reports PARTIAL parity and INCONCLUSIVE overall: matching state/counts does not prove exact feature/gyro parity or independently align a physical hop. The operator-reference uncertainty window remains broad (532–4262 ms), with measured callback lag 1130 ms.

Candidate 2 starts at 2416 ms, has takeoff/flight transition at 3112 ms, landing transition at 3358 ms and rejection at 4382 ms. Its frozen Garmin takeoff peak is 2354.514648 mg, below the unchanged 3000 mg envelope requirement. Flight minimum is 367.960693 mg, duration 246 ms and sustained low-g 124 ms: these meet the existing respective limits (408 mg, 240 ms and 120 ms). Landing is stable. Thus the envelope rejection is attributable to insufficient takeoff peak for this recorded candidate; the later 4246.699219 mg peak remains post-event evidence and must not repair the decision. Host replay reproduces that feature-level explanation. Candidate 3 has only 82 ms flight, no sustained low-g and a 557.790833 mg minimum; it does not supply a second strong flight sequence. No earlier candidate or clock divergence is needed to explain candidate 2's rejection. Exact physical-event alignment and general discrimination remain unresolved.

Seven callbacks of 25 samples report mean/max processing 95.428574/125 ms and maximum callback interval 1058 ms. All percentile observations exceed the histogram's 8 ms final finite bucket; no numeric p95/p99 estimate is available. Timestamp duplicate/out-of-order/gap/fallback counts are zero; gyro outliers are 92. Export-time free memory is 718168 bytes, not a peak-memory measurement. Gyro-free host state agreement does not validate gyro values.

No further physical repetition, threshold change or new build was performed. Next work is offline review of phase-scoped takeoff evidence against existing positive and adversarial patterns, preserving this tuning miss. Any alternative must have bounded, time-based semantics and negative regression evidence before a new freeze/holdout. Do not lower one constant solely to accept this trace. M6 remains NO_GO for FALSE_NEGATIVE_STABILITY.

```text
CLEAN_START_PHYSICAL_TRANSPORT = VERIFIED_THIS_CAPTURE
BT4_DIAGNOSTIC_CAPTURE = COLLECTED_COMPLETE
HOST_GARMIN_STATE_MATCH = 175_OF_175
HOST_GARMIN_DIAGNOSTIC_PARITY = PARTIAL
DIAGNOSTIC_RESULT = INCONCLUSIVE_WITH_REPRODUCED_WEAK_TAKEOFF_REJECTION
NEXT_ACTION = OFFLINE_PHASE_SCOPED_DISCRIMINATION_REVIEW
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```

All readiness statements below are historical.

### Clean-log preflight prepared — physical retention still pending

The installed Connect IQ 9.2.0 SDK's `doc/docs/Core_Topics/Debugging.html`, section “A Note About Log Files”, documents rotation above 5 KB: TXT becomes BAK and replaces the previous BAK. Therefore a sub-10KB export does not imply guaranteed retention when TXT starts nonempty. `tools/jump-engine/log-retention.test.mjs` models this mechanism at both 5000 and 5120 bytes: a synthetic 9140-byte export loses its prefix from a 4900-byte starting TXT, but survives from zero. Two model tests pass. This is not firmware emulation, and the previous trial's initial TXT size is unknown; the exact cause of that physical prefix loss remains unproven.

At 23:16 local time the watch's `LOGS/WWJumpResearch.TXT` was replaced with a zero-byte file through Android File Transfer. The watch listing then showed 0 bytes. Its previous 70-byte TXT and 5456-byte BAK remain backed up in `/tmp/ww-window-capture.NeQtFZ/`; these are temporary local backups, not durable archival storage. The watch BAK and other applications' logs were not manually changed. No detector, binary, thresholds or strict parser guards changed in this preparation.

`npm run check` passes with the added retention-model tests. No new Garmin build is required for these host-test/documentation-only changes. A single clean-start DIAG_01 replacement is now justified to test the transport hypothesis and obtain the missing candidate context. Use the window1 protocol below; do not start a second capture before collecting both log files. On retrieval require the real manifest, sequence zero, all blocks/checksums/counts and delivered tail before any full replay claim. If transport fails again, preserve the attempt and stop physical repetitions for transport investigation. Clean-start preparation is not physical transport validation, and does not open M6.

```text
LOG_RETENTION_MODEL = PASS_SYNTHETIC_ONLY
WATCH_TXT_PREFLIGHT = ZERO_BYTES_VERIFIED_MTP_LISTING
WINDOW_PHYSICAL_TRANSPORT = INCOMPLETE_PREFIX_LOST_PREVIOUS_ATTEMPT
CLEAN_START_PHYSICAL_TRANSPORT = NOT_RUN
NEXT_TRIAL_READINESS = READY_ONE_CLEAN_START_DIAGNOSTIC
M6_WOO_VALIDATION_GATE = NO_GO
```

The following sections preserve the previous collection and preparation history.

### Replacement collected — acquisition tail sufficient, log prefix lost

The operator reported MARKED and COMPLETED for the window1 replacement. At collection the watch provided BAK 5456 bytes and TXT 70 bytes, preserved in `/tmp/ww-window-capture.NeQtFZ/`. BAK starts with `E|25`; the manifest and block `E|0` are absent. TXT contains the completion for 150 records. The strict parser correctly rejects `Garmin research capture manifest is missing`. No header or samples were fabricated, no strict guard was bypassed and no full host replay is claimed. E encoding is consistent with window1, but the missing manifest prevents strict export identity verification.

The retained summary reports duration 6657 ms, marker elapsed 3455 ms, 150 observed/exported samples and final normalized timestamp 6103 ms. Wall tail is 3202 ms and the conservative sample-tail difference is 2648 ms: this attempt no longer has the earlier short-tail problem. All 125 retained samples (sequences 25–149, normalized 1024–6103 ms) decode with checksums and contiguous sequence. This is only partial transport integrity: the missing first 25 samples remain missing. The 9500-byte preflight limit and synthetic tests did not guarantee retention of the physical log prefix; the actual rotation/retention behavior must be resolved before another capture is requested.

Useful partial evidence, not a completed diagnostic: the summary has zero confirmations and four rejections. Candidate 1 is entirely within the retained interval, starts at 2089 ms, enters FLIGHT at 2949 ms, enters POSSIBLE_LANDING at 3277 ms and ends rejected at 4301 ms. Its frozen takeoff peak is 2423.236572 mg (below 3000), flight minimum 146.381561 mg (below 408), flight duration 328 ms (above 240) and sustained low-g 287 ms (above 120); landing is stable. Its reason mask includes missing impulse/low-g envelope and the arm-pattern rejection flag. The frozen envelope fails on takeoff strength, not on those flight conditions. A later 3632.967285 mg peak remains correctly isolated as post-event evidence.

The retained state sequence shows no earlier LANDING transition within candidate 1 before its low-g phase. This supports a weak-takeoff rejection explanation for that candidate rather than insufficient flight evidence; it does not conclusively identify the candidate with physical ground truth or explain the original BT4 miss. The operator marker is an uncertain reference, missing prefix/context prevents full replay/parity, and summary flags are not independent movement labels. Do not lower the takeoff threshold merely to accept this case or classify the whole research milestone as complete.

No further operator trial is requested. Next work is read-only resolution of physical log rotation and an export/retrieval design that preserves the entire record, followed by offline candidate analysis with explicit evidence limits. Both prior attempts remain in the record; M6 stays NO_GO.

```text
WINDOW_PHYSICAL_ACQUISITION_TAIL = SUFFICIENT_REPORTED_AND_RETAINED_TIMES
WINDOW_PHYSICAL_TRANSPORT = INCOMPLETE_PREFIX_LOST
BT4_DIAGNOSTIC_CAPTURE = COLLECTED_TRANSPORT_INCOMPLETE
DIAGNOSTIC_RESULT = INCONCLUSIVE_WITH_WEAK_TAKEOFF_CANDIDATE_EVIDENCE
HOST_GARMIN_DIAGNOSTIC_PARITY = NOT_VERIFIED
NEXT_TRIAL_READINESS = NOT_READY_TRANSPORT_RETENTION
```

The preparation/readiness statements below predate this replacement capture.

### Extended diagnostic window — build copied, physical verification pending

Under the operator's request to complete the preparation end-to-end, `0.5.1-m5.4bd-window1` resolves the constrained window budget without changing the detector. It retains up to 225 samples (about nine seconds at requested 25 Hz) with a 12000 ms controller safety cap to allow batch delivery. Acquisition still ends earlier when the marked two-second tail has actually been delivered. The hard sample limit, strict clock/quality checks and INCOMPLETE result remain enforced. This is not twelve seconds of guaranteed raw samples.

The diagnostic-only `LE19_DELTA_ACCEL_STATE_V1` encoding uses three UInt32 block clock bases followed by three UInt16 clock deltas, three unchanged Float32 accelerometer axes and one packed quality/state byte per sample. Up to 25 records form one checksummed `E` block; raw timestamp nulls have an explicit sentinel. Clocks are reconstructed modulo UInt32 with validation. Unrepresentable deltas/values fail export explicitly instead of rounding or truncation. The old `D` format remains readable only under its matching manifest. No full-session storage, vendor code or canonical-schema change.

Bounds: 225 buffer entries, at most eight retained candidate traces, at most 18 prepared lines and 9500 prefixed bytes. A full 225-sample export with eight candidate traces, nonzero callback statistics and 225 gyro quality flags measured 9140 bytes in the Garmin test. This is a tested stress case, not a claim that every pathological payload fits: preflight byte/line checks remain authoritative. Buffer capacity grows by 50%; the old 88-byte/sample estimate gives 19800 bytes before the state array and VM overhead. Actual new physical peak heap/callback costs are pending capture, not inferred from simulator heap.

Validation: `npm run check` PASS (93 main tests, repeated session suite 38), sequential fenix7/fenix7s BUILD SUCCESSFUL, test build successful and 17/17 Garmin logical PASS (runner exit 1). Actual Garmin-emitted E blocks were decoded by the strict host parser: all 225 xyz Float32 values and varying unsigned callback clocks matched exactly. Host tests cover clock wrap, null raw clock, malformed/checksum-invalid data, illegal flags, nonfinite values, codec/manifest mismatches, bounds and a six-second marker with a complete delivered tail. The original failed capture remains rejected and preserved.

The fenix7 binary (143916 bytes) was copied into watch Apps at 18:20 on 2026-09-08; MTP showed the expected filename and 140.5 KiB size. Device import, launch, physical capture integrity and new heap measurements still need operator confirmation. No commit or push.

#### One technically justified replacement capture

The earlier attempt failed acquisition completeness, not a detection target. Preserve it and permit exactly one replacement after confirming `BT4 DIAG01 / MEDIUM`, `CONTROLLED_FULL_WINDOW`, version `0.5.1-m5.4bd-window1`:

1. Start and wait for the three-second countdown.
2. Briefly stand still, take a comfortable brisk approach of about two to three seconds and perform one small controlled moving hop in a clear area.
3. Mark promptly after safe landing, aiming within six seconds of acquisition; do not rush to meet the time limit. Continue a few steps.
4. Wait for automatic delivered-tail completion and export without pressing START again. COMPLETED is expected only if the contract is satisfied; report INCOMPLETE/FAILED rather than repeating.
5. Reconnect and expose LOGS. Inspect both log parts and validate identity, checksums, counts, clock quality and delivered tail before diagnostic replay or event interpretation.

No further trial is prescribed unless that replacement's evidence justifies it. Even a complete capture may remain scientifically inconclusive. M6 stays NO_GO; height and airtime stay unvalidated.

```text
WINDOW_PREPARATION = VERIFIED_HOST_AND_GARMIN_SYNTHETIC
WINDOW_BUILD_INSTALLATION = COPIED_TO_WATCH_APPS_LAUNCH_PENDING
NEXT_TRIAL_READINESS = READY_PENDING_WATCH_VERSION_CONFIRMATION
WINDOW_PHYSICAL_VALIDATION = NOT_RUN
```

The following sections preserve the earlier six-second preparation and failure history; their readiness statements are superseded by this section.

### Tail contract correction — implemented, not installed

Research app `0.5.1-m5.4bd-tail1` now publishes COMPLETED only when both controller elapsed time and the last delivered normalized sample reach the marker's elapsed-time deadline plus 2000 ms. The sample check is conservative: require a zero-origin native timeline, no timestamp degradation/gaps, contiguous retained samples and no discarded delivered samples. A stale sample timestamp at MARKED is not used as the tail origin. The bounded sample-quality check runs after sensor stop, not in the callback.

If a duration/sample cap is reached without that evidence, the app exports the retained data with result INCOMPLETE and displays INCOMPLETE. Cancellation remains CANCELLED. A second SELECT after MARKED no longer cuts a diagnostic tail short. Legacy capture modes and the jump detector are unchanged. Host parsing applies the same conservative sample-tail requirement and still rejects the original DIAG_01; the historical attempt is not relabeled or repaired.

The six-second, 150-sample, eight-candidate and 9500-byte limits are unchanged. This correction prevents a false completion claim but does not solve the tight physical protocol window. No new trial or installation is requested until the bounded duration/sample budget can accommodate a safe approach, hop, marker and delivered tail; simply asking the operator to hurry or repeatedly retry is not an acceptable remedy. Exact mapping from sample clock to operator wall time remains conservative, not physically calibrated.

Validation: `npm run check` PASS (91 main tests; repeated session suite 38), fenix7 then fenix7s BUILD SUCCESSFUL, unit-test build successful, Garmin 17/17 logical PASS with runner exit 1. Tests cover the observed 4187/6001/5079 ms failure, stale delivered samples despite wall-time completion, missing marker/sample clock, exact deadline, cancellation and degraded clock rejection. The simulator's actual packed export decodes through the strict host parser with 150 samples; bounded synthetic export measured 8611 bytes. No new physical memory/performance measurement. The installed watch version remains the original diagnostic version; the tail correction is built locally only.

```text
DIAGNOSTIC_TAIL_CONTRACT = VERIFIED_HOST_AND_GARMIN_SYNTHETIC
TAIL_CORRECTION_HARDWARE = NOT_RUN
NEXT_TRIAL_READINESS = NOT_READY_WINDOW_BUDGET_REVIEW
```

### DIAG_01 collected — protocol tail incomplete

The operator confirmed the diagnostic identity, completed the trial and reported MARKED and COMPLETED. Both `WWJumpResearch.BAK` (5170 bytes) and `.TXT` (2141 bytes) were copied read-only from the watch into `/tmp/ww-diag01-capture.dq4V6Q/`. The latest manifest identifies the expected app, protocol and schema. An older completion record before that manifest is not part of this trial.

The latest export contains 125 samples, matching observed/exported/completion counts, with zero reported dropped or unprocessed delivered samples. All packed blocks decode with valid checksums; sequence 0–124 is contiguous and normalized timestamps increase strictly from 0 to 5079 ms. This verifies transport of the exported records, not completeness of the prescribed physical window.

The marker was recorded at 4187 ms of controller elapsed time. Capture stopped at 6001 ms, leaving only 1814 ms after the marker rather than the required 2000 ms (186 ms short). `diagnose-bt4.mjs` correctly rejects the trial with `Diagnostic post-marker tail incomplete`; no validated host diagnostic replay was produced and no guard was bypassed. The controller terminates on the six-second cap independently of its marker-tail deadline and labels that export COMPLETED. Thus COMPLETED indicates export completion, not satisfaction of the diagnostic protocol.

The exported summary reports zero confirmed and four rejected candidates. Those are observations from a protocol-incomplete trial, not new validated discrimination metrics. Callback processing mean/max were 89/104 ms across five batches of 25 samples; the percentile overflow bucket supports no numeric upper estimate. Sensor and controller time origins are not assumed interchangeable: at the marker the latest exported normalized timestamp was 3031 ms. Do not infer exact hop alignment or sample-tail coverage from wall time alone.

The physical question remains unresolved. Preserve this attempt; do not request an immediate repetition or tune thresholds. Next review should address the diagnostic duration/tail contract and explicit incomplete status, including delivered-sample coverage under batching, before deciding whether a technically justified replacement capture is necessary. No detector changes or further trial were performed.

```text
BT4_DIAGNOSTIC_CAPTURE = COLLECTED_PROTOCOL_INCOMPLETE
EXPORTED_RECORD_TRANSPORT = VERIFIED_CHECKSUMS_AND_COUNTS
POST_MARKER_TAIL = INCOMPLETE
DIAGNOSTIC_RESULT = INCONCLUSIVE
HOST_GARMIN_DIAGNOSTIC_PARITY = NOT_VERIFIED
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```

### Preparation history (before this physical attempt)

The operator-requested review of prior WindWisher WOO research is consolidated in [prior research context](WOO_PRIOR_RESEARCH_CONTEXT.md). That research does not resolve the early-landing versus insufficient-flight question for this Garmin trial. Documentation consolidation is complete; the next step remains watch-side identity confirmation before a single DIAG_01, not new tuning, holdout or Woo validation.

The authorized compact diagnostic export is implemented. The audit below is historical and its NOT_READY flags describe the initial preparation, not the current source implementation. No physical DIAG_01 has been run. The diagnostic binary was copied into the connected fenix7 Apps directory on 2026-09-08 at 13:09; MTP displayed the expected filename and 138.7 KiB size (local binary 142012 bytes). Watch-side import, launch and displayed version still require operator confirmation.

The diagnostic-only protocol `M54BD_BT4_DIAG_01`, app `0.5.1-m5.4bd`, uses MEDIUM at 25 Hz, a 150-sample noncircular buffer and a 6000 ms maximum. Algorithm `experimental-0.5-phase-scoped-envelope` and classification thresholds are unchanged. Other capture modes retain their existing limits.

Lossless LE26_ACCEL_STATE_V1 records retain raw accelerometer, normalized and callback timestamps, Float32 xyz, quality and state codes. Gyro remains QUALITY_ONLY. Up to ten records are encoded per checksummed base64 block after acquisition stops. The entire export is prepared before emission and fails explicitly if it exceeds 18 lines or 9500 bytes; no silent truncation is permitted. Candidate retention remains bounded at eight. The synthetic maximum-candidate transport case measured 8605 bytes. This is tested serialization evidence, not proof of physical log retention or physical heap usage.

The host parser rejects malformed/checksum-invalid blocks, identity mismatches, incomplete counts, noncontiguous sequences, timestamp errors, unprocessed delivered samples and missing two-second marker tails. The diagnostic analyzer reconstructs sample/state timelines and exposes divergences; matching counts alone do not prove full parity. Hypotheses about early landing versus insufficient flight remain unresolved until a complete physical capture is examined.

Previous execution recorded 91 passing host tests, successful sequential fenix7/fenix7s/test builds and 15 logical Garmin test passes (runner exit 1). Actual simulator-emitted synthetic records were decoded end-to-end with exact values. Audit previously reported zero vulnerabilities. On resumption, temporary build artifacts, simulator logs and the authorized temporary signing key are no longer present; these prior results are not new build verification. Recompilation requires renewed authorization for a temporary key. No existing credential or env file is to be read as a substitute.

After renewed explicit user authorization, a new temporary key was generated outside the repository and converted to PKCS8 DER for Garmin. Fresh sequential fenix7 and fenix7s builds and the unit-test build succeeded. After starting the simulator, Run No Evil reported 15 passed, zero failed/errors; process exit remained 1. Initial runner attempts could not connect to the simulator and are not passes. No existing keys or env files were used. The earlier missing-temporary-artifacts installation blocker is resolved.

One physical trial is pending watch-side identity confirmation: verify the diagnostic identity on the watch, allow the three-second countdown, take a short brisk approach, make one comfortable controlled hop, mark promptly after safe landing before roughly four seconds of acquisition, and allow the automatic two-second tail and export to finish. Do not press START again to force completion or repeat merely because detection fails. Validate all exported records before drawing a conclusion.

```text
DIAGNOSTIC_IMPLEMENTATION = IMPLEMENTED
SERIALIZATION_BOUNDS = VERIFIED_SYNTHETIC
PHYSICAL_TRANSPORT_INTEGRITY = NOT_RUN
DIAGNOSTIC_INSTALLATION = COPIED_TO_WATCH_APPS_LAUNCH_PENDING
BT4_DIAGNOSTIC_CAPTURE = NOT_RUN
DIAGNOSTIC_RESULT = NOT_RUN
HOST_GARMIN_DIAGNOSTIC_PARITY = NOT_RUN
PRE_FREEZE_DECISION = MORE_DIAGNOSTIC_EVIDENCE_REQUIRED
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```

No new holdout, Woo validation, threshold tuning, raw capture in Git, commit or push. Historical positive and negative results remain unchanged.

## Historical preparation status (superseded above)

Baseline HEAD `08eb008f69c9464b016841ccc64dfbb2f606ff1e`; main synchronized with origin/main, clean initial worktree and diff check. This is a preparation audit, not a completed diagnostic. No physical trial, signing, installation or detector change performed.

Question: does the failed moving-hop pattern enter LANDING on an earlier step, or does the measured flight lack the existing envelope evidence? Historical tuning remains 3 detections and 2 misses; the initial BT3 candidate association remains inferred.

## Capture audit

| Property             | Current implementation and implication                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode                 | CONTROLLED_FULL_WINDOW is a bounded prefix, not necessarily a complete run                                                                        |
| Duration             | JrConstants: 12000 ms maximum                                                                                                                     |
| Requested rate       | JrController.requestedRate: MEDIUM requests 25 Hz, capped to device maximum                                                                       |
| Sample capacity      | 64 samples = 2.56 seconds nominal at 25 Hz; first-to-last span approximately 2.52 seconds                                                         |
| Export capacity      | 64 records; must increase along with buffer for any longer window                                                                                 |
| Memory estimate      | Existing estimate 88 bytes/sample × 64 = 5632 bytes; exact VM heap overhead is unknown                                                            |
| Buffer layout        | JrCaptureBuffer: 12 preallocated parallel arrays, transient 12-field record during export                                                         |
| Overflow             | Noncircular append rejects later samples and increments dropped; detector continues                                                               |
| Pre/post retention   | First 64 samples only; no guaranteed post-hop coverage once full                                                                                  |
| Sensor fields        | Accel xyz, gyro xyz, raw accel/gyro timestamps, normalized timestamp, callback timer, sequence, quality mask                                      |
| Magnitude            | Derivable offline from xyz; no additional raw field needed                                                                                        |
| Batch identity       | Shared callback timestamp plus contiguous sequence, no explicit batch counter                                                                     |
| Operator reference   | Marker elapsed time, last normalized sample, nearest sequence and uncertainty                                                                     |
| Candidate events     | Start/takeoff/landing/end, stable-landing boolean, reasons and immutable snapshot retained up to 8 traces                                         |
| State reconstruction | Host engine can be stepped through raw samples; exact per-sample Garmin states/stabilization time are not exported                                |
| Export               | JrController drains at most 12 records per timer tick after source stop; JrWriter uses compact text motion lines and JSON metadata                |
| Transport limit      | Existing capture documentation records roughly 10 KiB retained app-log budget; this is historical characterization, not a universal SDK guarantee |
| Build identity       | Manifest currently emits algorithm/schema/protocol/profile/mode, but APP_VERSION is not emitted; new diagnostic needs explicit app/build identity |

The requested baseline, approach, hop, landing and two-second marker tail cannot reasonably fit a 2.56-second prefix. A 12-second MEDIUM window nominally needs 300 samples, plus allowance for batch-boundary overshoot. For example 325 slots would be an estimated 28600 bytes under the existing 88-byte assumption, excluding VM overhead. That estimate alone does not verify memory or transport capacity.

Increasing only MAX_CAPTURE_SAMPLES and MAX_EXPORT_RECORDS cannot establish complete capture: the existing verbose summary can itself retain several kilobytes, while longer text motion export can exceed the characterized log budget and rotate away the manifest or early samples. No claim of exact transport capacity is made without a serialized-size bound and verification.

## Required preparation before DIAG_01

1. Resolve transport capacity with a bounded export design. Proposed minimal extension: lossless packed accelerometer/timing records, bounded state observations and compact diagnostic metadata, decoded by the existing host parser. Keep acquisition/listener, full-window buffer model and post-stop export lifecycle. Gyro export is optional under the request; retain quality aggregates if raw gyro makes the byte budget impossible. Do not drop required accel/timing fields or round them silently.
2. Demonstrate worst-case serialized bytes, record completeness, memory bounds and parser round-trip before setting capacity VERIFIED. A larger buffer alone is insufficient.
3. Add distinct M54BD_BT4_DIAG_01 protocol with CONTROLLED_HOP reference and explicit app identity, while preserving algorithm version and all thresholds.
4. Prepare analysis that reconstructs sample/state transitions, validates timestamps against the exported normalization, and compares Garmin outcomes without treating marker uncertainty as exact physical takeoff/landing truth.
5. Build/test sequentially using only an already-authorized temporary key if available; do not generate a replacement without authorization. Install only once readiness is demonstrated.

This proposal changes export encoding beyond a limit-only adjustment. The user should resolve that scope before implementation. No new physical trial is requested while readiness fails.

## Evidence and outcome fields

Installation, physical integrity, protocol identity on hardware, raw replay, marker alignment, pre-hop/flight/landing/post-hop sample evidence, hypothesis A/B and diagnostic parity are all NOT_RUN. Callback percentiles cannot be invented from overflow bins. Gyro remains QUALITY_ONLY. Neither the timestamp correction nor historical successful repetitions settles the diagnostic question.

Validation for this documentation-only preparation: baseline and final git diff checks. No new code, builds or physical tests; prior M5.4B-T checks remain historical evidence (88 host tests, 14 Garmin tests, logical PASS with runner exit 1).

No env files, existing credentials or keys read. No raw captures copied into the repository. No git staging, commit or push. Only this audit and linked status notes added.

```text
CAPTURE_CAPACITY = NOT_VERIFIED
CAPTURE_BOUNDS = PARTIAL_EXISTING_BUFFER_ONLY
CORRECTED_BUILD = NOT_READY_FOR_DIAG_01
PROTOCOL = NOT_READY
ANALYSIS_PIPELINE = NOT_READY

M5_4B_STATUS = IN_PROGRESS_HARDWARE_TUNING
CANDIDATE_FINALIZATION_TIMESTAMP_INTEGRITY = VERIFIED
HOST_GARMIN_FINALIZATION_PARITY = MATCHED
BT4_DIAGNOSTIC_CAPTURE = NOT_RUN
DIAGNOSTIC_RESULT = NOT_RUN
HOST_GARMIN_DIAGNOSTIC_PARITY = NOT_RUN
PRE_FREEZE_DECISION = MORE_DIAGNOSTIC_EVIDENCE_REQUIRED
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
