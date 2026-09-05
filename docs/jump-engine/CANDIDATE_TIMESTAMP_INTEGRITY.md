# M5.4B-T Candidate Finalization Timestamp Integrity Report

## 1. Status

Root cause confirmed; correction implemented and verified by host and Garmin synthetic tests. After explicit user authorization, a new temporary signing key enabled sequential device builds and Garmin tests. No watch installation was performed. Integrity is VERIFIED within the normalized-input contract and tested finalization paths.

## 2. Git baseline

HEAD: `2d2172ff7823c2564977d756103af5a454b3f3f2`, main tracking origin/main. Initial diff check passed.

## 3. Worktree state

Existing accumulated changes preserved. Baseline tracked diff: 21 files, 816 insertions, 105 deletions, plus untracked research artifacts. No staging or publication performed.

## 4. Files inspected

JrDetector.mc, JrMotionSource.mc, JrClock.mc, JrController.mc, JrWriter.mc, JumpResearchTests.mc, host engine.mjs and timestamp-normalizer.mjs, build/test scripts, M5.4B findings and parity documentation. No AGENTS.md found within the repository by file discovery.

## 5. Reported anomaly

Existing BT4 BAK/TXT were reanalysed with inspect-garmin.mjs. Protocol BT4, SUMMARY_ONLY, 200 observations, zero exported samples. Candidate 6: end 7864, takeoff 7984, landing 8152. This is summary inspection, not raw sample replay.

## 6. Timestamp domains

| Timestamp             | Source and unit                                                          | Domain / normalization / rollover                                                                            | Assigned and consumed                                                                     |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Raw accel/gyro        | sensor arrays, milliseconds as consumed                                  | SDK-provided; no explicit sensor rollover unwrapping                                                         | JrMotionSource.onSensorData:59–85; accel drives normalization, gyro is transport metadata |
| Callback              | JrClock.now(), System.getTimer milliseconds                              | timer domain; elapsed helper assumes modulus 4294967296                                                      | onSensorData start/end, statistics and fallback                                           |
| Normalized sample     | raw if increasing, otherwise callback then previous + interval           | no initial offset; repairs nonincreasing values and flags degradation; may exceed callback time after repair | JrMotionSource:62–85; detector.observe                                                    |
| Candidate start       | current normalized sample                                                | same sample domain                                                                                           | JrDetector.observe candidate creation                                                     |
| State-start / impulse | current normalized impulse sample                                        | refreshed only during TAKEOFF                                                                                | JrDetector:103,151; takeoff timeout; previously misused by finish                         |
| Takeoff               | normalized low-g transition sample                                       | assigned once until reset                                                                                    | JrDetector:160; flight duration and trace                                                 |
| Landing               | normalized landing-trigger sample                                        | assigned once until reset                                                                                    | JrDetector:180; stabilization, snapshot and trace                                         |
| Candidate end         | current sample on normal paths; latest observed sample on corrected stop | sample domain, no timer conversion                                                                           | JrDetector.finishCandidate and finish:311–316                                             |
| Capture stop/duration | elapsed(startedAt, now)                                                  | timer elapsed, modulo helper                                                                                 | JrController:162–168; summary duration, never candidate end                               |
| Serialization         | no new event clock                                                       | retained string contains already assigned event times                                                        | JrDetector:241–296; JrWriter:16–23                                                        |

No cast or signed/unsigned conversion explains the short BT4 anomaly. General sensor rollover correctness is not verified: repairs flag nonincreasing data instead of explicitly unwrapping it. This correction preserves that existing normalization behavior.

## 7. Sensor callback flow

Source iterates delivered samples synchronously, normalizes each, observes detector, then records statistics. Added an inactive-source guard so callbacks after stop cannot update detector state. This is defensive lifecycle handling, not a claim that the SDK delivered a late callback in BT4.

## 8. Normalization flow

Raw increasing timestamps pass through; missing/nonincreasing raw values use callback time; nonincreasing normalized values advance by the profile interval. No capture-stop timestamp is passed into detector.finish(). Batching can create normalized values ahead of fallback callback time, but is not necessary to explain this defect.

## 9. Candidate creation

GROUND impulse allocates an ID and initializes feature fields. Current sample establishes candidateStarted and stateStarted. A new scalar latestObservedTimestamp records each delivered normalized observation, including ground samples; every active candidate necessarily has an observation.

## 10. Takeoff timestamp

Assigned on filtered low-g transition in TAKEOFF; not later changed before reset.

## 11. Landing timestamp

Assigned by the first landing impulse in FLIGHT; not later changed before reset.

## 12. End timestamp

Former stop path called finishCandidate(REJECTED, stateStarted). This field is the last takeoff impulse, so it can precede both transitions. Corrected stop uses latestObservedTimestamp.

## 13. Capture stop timestamp

Controller computes capture duration before source.stop; source unregisters and invokes detector.finish without a time parameter. Capture duration is not the cause.

## 14. Batch behavior

All already observed samples contribute to latestObservedTimestamp. A batch's callback clock does not define candidate end. No evidence of unfinished buffered detector processing was found; the raw transport buffer is exported later, not replayed into the detector.

## 15. Serialization behavior

finishCandidate builds a complete JSON string before resetState. Retained strings are immutable values. JrWriter later concatenates those strings without recalculating end. No end fallback or live object reuse explains the anomaly.

## 16. Candidate-object reset/reuse

resetState clears takeoff/landing/start/active ID. Creation resets decision fields. stateStarted is deliberately an impulse-window field, not a general last-event clock. The defect was semantic misuse, not stale serialized-object mutation.

## 17. Host behavior

engine.mjs endSession: uses normalizer.previousNormalized; normal finish paths use the current normalized observation. Host candidate and nested decision snapshots are frozen.

## 18. Garmin behavior

| Finalization path                                                       | End source after correction             | Further samples                         |
| ----------------------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| Normal stable landing / unstable landing / envelope rejection           | current normalized observation          | new candidates may follow               |
| Short flight after stabilization                                        | current normalized observation          | new candidates may follow               |
| Takeoff timeout / maximum candidate duration / flight timeout           | current normalized observation          | new candidates may follow               |
| Stop during takeoff, flight or landing                                  | latest observed normalized sample       | source inactive; callback guard returns |
| Manual stop / marked tail / duration limit / buffer mode limit / cancel | same source.stop → detector.finish path | source inactive                         |
| Repeated finish in GROUND                                               | no candidate emitted                    | no trace mutation                       |
| Export buffer drain                                                     | no detector finalization                | serialized snapshots only               |

## 19. Host/Garmin parity

End semantics match after correction and the corresponding host/Garmin schedules pass: HOST_GARMIN_FINALIZATION_PARITY = MATCHED for latest-sample finalization. Host startMilliseconds denotes impulse, while Garmin additionally exposes candidateStarted; this does not claim identical schemas or universal normalization parity.

## 20. Root cause

ROOT_CAUSE = CONFIRMED. Wrong end source in Garmin stop flush. The exact 7864 ms impulse cannot be raw-replayed from SUMMARY_ONLY, but the code path directly accounts for the ordering. Capture timer mixing, serialization mutation and rollover are not needed to produce it.

## 21. Evidence

JrDetector.mc:93–94 latest observation; 103/151 stateStarted assignments; 160 takeoff; 180 landing; 241 finishCandidate; 300 reset; 311–316 corrected finish. JrMotionSource.mc:44–48 stop and 51 onwards callback. JrController.mc:162–180 stop/export. JrWriter.mc:16–23 serialization. tools/jump-engine/engine.mjs:560 onwards endSession.

## 22. Synthetic reproduction

New shared host/Garmin synthetic schedule: baseline, impulse at 400, low-g samples, landing at 680, then tail. Stop endpoints 400/480/640/680/840/1680 cover incomplete impulse, flight, landing and completion. The old Garmin stop would serialize 400 at later endpoints; the corrected version must emit the latest sample. Host uses a constant callback clock of zero to show sample time, not callback time, controls end. These are synthetic values, not personal raw data.

## 23. Correction

One latest-observation scalar and a callback lifecycle guard. No timestamp sorting/clamping; no threshold, feature or classifier changes. No deployment to the watch.

## 24. Temporal invariants

For monotonically normalized input: candidate start ≤ takeoff ≤ landing ≤ end when present. Incomplete end equals the last observed sample. Source normalization is the monotonic input contract; direct out-of-order calls to JrDetector are not newly supported.

## 25. Regression tests

Host regression passed across six stop points with ordering and repeated-finalization checks. Garmin tests passed for the corresponding schedule, retained serialization immutability across reuse, and short-flight stop during stabilization. Existing normal confirmation and bounds tests also passed.

## 26. Phase-scoped feature regressions

Full host suite passed, including existing synthetic catalog, immutable snapshot, post-event isolation and canonical threshold tests. All 14 Garmin tests passed, including existing regressions.

## 27. Four-hour/bounds regression

Host four-virtual-hour test passed as part of npm run check. No new physical memory or long-session claim.

## 28. npm run check

PASS: 88/88 main tests, formatting, lint and repository guards passed. Log: /tmp/ww-timing-check.log.

## 29. npm audit

PASS: specified NODE_EXTRA_CA_CERTS command returned zero vulnerabilities.

## 30. git diff --check

PASS after implementation; rerun after final documentation.

## 31. Garmin builds

Initial unsigned attempts were rejected. After user authorization for temporary signing, fenix7 and then fenix7s builds both returned BUILD SUCCESSFUL, exit 0. Artifacts are in /tmp/ww-timing-validation.RYx7C7; none installed on hardware.

## 32. Garmin unit tests

Unit-test compilation after both device builds passed, exit 0. Fourteen tests executed successfully in the simulator using the newly authorized temporary key; existing user keys were not inspected.

## 33. Run No Evil logical result

RUN_NO_EVIL_LOGICAL_RESULT = PASS (14 passed, 0 failed, 0 errors). Log: /tmp/ww-timing-validation.RYx7C7/tests-run.log.

## 34. Run No Evil exit code

RUN_NO_EVIL_PROCESS_EXIT_CODE = 1. The runner reports logical PASSED but exits 1; this discrepancy is preserved, not reported as a clean process exit.

## 35. Security/privacy

No env, existing credentials or existing developer keys were read or used. A fresh temporary signing key was generated and used only after explicit user approval. Captures remained in /tmp. No backend, canonical or product changes.

## 36. Tuning evidence review

Preserved three detected positives and two misses, plus one negative trial without confirmations. First BT3 association remains inferred outside the marker window. First BT4 has insufficient flight evidence; lowering takeoff alone would not fix it. Successful repetitions do not demonstrate stability.

## 37. Remaining blockers

Terminal timestamp correction cannot repair historical classification misses: it changes rejected trace end and diagnostic context, not the envelope. SUMMARY_ONLY cannot resolve whether the first BT4 segmented the actual physical flight correctly. Run No Evil process-exit discrepancy remains documented independently of its passing assertions.

## 38. Pre-freeze decision

PRE_FREEZE_DECISION = MORE_DIAGNOSTIC_EVIDENCE_REQUIRED

QUESTION = Did the failed BT4 segment a step as landing before the actual hop flight?

WHY = Summary-only phase aggregates cannot recover sample ordering around the 6638 mg post-event peak; the successful repeat has materially different features.

MINIMUM_CAPTURE = After Garmin verification, a bounded existing full-window MEDIUM BT4 diagnostic with prompt independent marker, covering the approach, one hop and tail. No capture requested in this unit. A successful trial alone may not resolve the failure mechanism.

RESULT_NEEDED = Sample sequence showing whether landing segmentation or genuinely weak measured flight evidence caused a missed moving hop; assess with unchanged thresholds. No generic repeated-hop request or holdout now.

## 39. M6 status

M6_WOO_VALIDATION_GATE = NO_GO

M6_BLOCKER = FALSE_NEGATIVE_STABILITY

## 40. Git status

Changes remain local and unstaged alongside prior work. No commit/push/reset/restore.

## 41. Recommended next action

Timing correction is verified synthetically on host and Garmin. Next proposed research action is the bounded diagnostic described above to resolve the moving-hop segmentation question, after installing the corrected build. No generic repetition, holdout, threshold adjustment or Woo validation is initiated by this report.

```text
M5_4B_STATUS = IN_PROGRESS_HARDWARE_TUNING
CANDIDATE_FINALIZATION_TIMESTAMP_INTEGRITY = VERIFIED
HOST_GARMIN_FINALIZATION_PARITY = MATCHED
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
