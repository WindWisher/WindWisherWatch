# M5.1 Garmin Jump Research Capture & Hardware Characterization — Completion Report

## 1. Status

`M5_1_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE`

## 2. Executive summary

The bounded Garmin research app, compact post-capture transport, safe host parser/replay and all 14 J0–J6 MEDIUM/HIGH physical runs are complete on the reference fēnix 7. MEDIUM is the preliminary continued-research profile. M6 remains `NO_GO` because J5 MEDIUM produced a confirmed false positive, J3 HIGH missed its operator-noted event and experimental airtimes are not validated.

## 3. Git baseline

M5.1 began from clean `main` at `b174b06fde537ae809e7fc367fa31a634b1a4b3f`, matching `origin/main` at baseline time.

## 4. Repository changes

Added an isolated Garmin jump-research app, fixed capture/detector/statistics/export, compact physical transport, host parser/replay/inspector, tests, guards, ignored raw-results route and research documentation. No product session, canonical, backend, sync or Woo implementation was added.

## 5. Research capture architecture

Garmin Sensor → minimal callback adapter → fixed buffer/statistics/experimental observer → sensor unregister → timer-drained compact telemetry → bounded latest-capture parser → existing host Jump Engine replay.

## 6. Callback design

Preallocated numeric arrays, timestamp normalization, fixed statistics and bounded detector updates. No logging, serialization, storage, sorting or networking occurs in the sensor callback.

## 7. Callback cost

Across 12-second runs, MEDIUM callback means were approximately 47–49 ms for 25-sample batches; HIGH means were approximately 93–96 ms for 50-sample batches. Maxima were 54–55 ms and 106–110 ms respectively. The original open-ended histogram serialized `9` as an overflow marker; evidence interprets p95/p99 conservatively as `>8 ms`, not exact 9 ms. Code now exports null upper bounds plus an 8 ms lower bound for that open bucket; this representation correction was build-tested but not physically rerun.

## 8. Capture modes

`SUMMARY_ONLY`, `CANDIDATE_WINDOWS` and `CONTROLLED_FULL_WINDOW` are implemented. Characterization used the 12-second controlled mode.

## 9. Ring buffer

Fixed 64-record raw transport buffer. Filling it never stops acquisition; later raw samples are rejected deterministically and counted while full-run statistics/detection continue.

## 10. Candidate windows

Circular candidate mode remains implemented and bounded. The physical campaign used controlled-prefix capture, so candidate-window physical usefulness remains `NOT_RUN`.

## 11. Memory bounds

Raw transport cap is 64 records, estimated 5,632 bytes. Typical capture-end used memory was 23,328–23,504 bytes. End free memory was equal to or slightly above start in every recorded run; one campaign does not prove long-term absence of growth.

## 12. Export architecture

Export begins only after sensor unregister and drains at most 12 records per 100 ms tick. Compact motion records plus JSON manifest/summary fit the retained `.BAK` + `.TXT` device logs. The parser selects the latest manifest block after a bounded stale rotation prefix and rejects truncation, count, sequence and unsafe-bound errors.

## 13. Research data privacy

Raw physical captures remain only under ignored `research/garmin/jump-engine/results/`. Safe replay output omits raw vectors, GPS, HR, serials and credentials.

## 14. Garmin adapter

`HARDWARE_VERIFIED` on the reference fēnix 7 for MEDIUM/HIGH controlled acquisition. Millig is explicitly converted to m/s² only in host replay; raw Garmin values retain provenance.

## 15. MEDIUM observed behavior

25 Hz requested; 275 samples over about 12.02 s in each run, 11 callbacks of 25, no timestamp-quality failures. One J5 fast-arm false confirmation occurred. J3 confirmed 1/1 and J4 confirmed 3/3 coarse operator events.

## 16. HIGH observed behavior

50 Hz requested; 550 samples over about 12.02 s in each run, 11 callbacks of 50, no timestamp-quality failures. J5 rejected all 25 candidates, but J3 missed its one coarse operator event; J4 confirmed 3/3.

## 17. MEDIUM vs HIGH

HIGH doubled throughput and roughly doubled callback cost without a demonstrated classification advantage. Human trials were not mechanically identical, so differences are characterization rather than causal sample-rate proof.

## 18. Timestamp quality

All 14 valid runs reported zero duplicates, out-of-order timestamps, gaps and fallback/interpolated timestamps.

## 19. Callback batching

MEDIUM consistently delivered 25 samples/callback and HIGH 50. Maximum observed inter-callback intervals were approximately 1.00–1.04 seconds.

## 20. Accelerometer findings

Stationary controls remained negative; walking and arm/impact motions frequently entered the candidate path. Repeated hops were detectable at aggregate level under both profiles. Fast arm motion can complete the current acceleration-only pattern falsely.

## 21. Gyroscope findings

Stationary runs were clean. Wrist, walking and fast-arm motion produced prevalent implausible values, including bounded-prefix maxima above 18,000 degrees/s. Gyro is retained only as quality/context evidence and does not independently trigger boundaries.

## 22. Gyro outlier analysis

Artifact prevalence was motion-class dependent and reached 235/275 samples in J5 MEDIUM and 472/550 in J5 HIGH. Exact firmware cause and full-run batch position remain `UNKNOWN` because raw transport is a bounded prefix.

## 23. ACCEL_ONLY vs ACCEL_PLUS_GYRO

Every bounded hardware replay had the same confirmation/rejection classification with and without gyro. Gyro sometimes added a quality flag but demonstrated no boundary advantage.

## 24. Pressure findings

Not captured in this narrow IMU app; remains optional context outside fine event timing.

## 25. J0 results

MEDIUM/HIGH `VERIFIED`: stationary, zero candidates/confirmations and clean timing.

## 26. J1 results

MEDIUM/HIGH `VERIFIED`: normal wrist motion, 2 and 6 rejected on-device candidates respectively, zero confirmations.

## 27. J2 results

MEDIUM/HIGH `VERIFIED`: walking, 11 and 14 rejected candidates respectively, zero confirmations.

## 28. J3 results

MEDIUM `VERIFIED_EXPERIMENTAL`: one confirmation for one coarse operator event. HIGH `VERIFIED_MISSED_EVENT`: zero confirmations and two rejections for one coarse operator event. Human executions were not mechanically equivalent.

## 29. J4 results

MEDIUM/HIGH `VERIFIED_EXPERIMENTAL`: both produced three confirmations for three coarse operator-noted hops. HIGH also produced two rejected candidates.

## 30. J5 results

MEDIUM `VERIFIED_FALSE_POSITIVE`: one confirmation and 19 rejections with feet grounded. HIGH: zero confirmations and 25 rejections. The MEDIUM result remains a gate blocker.

## 31. J6 results

MEDIUM/HIGH `VERIFIED`: grounded impacts produced 2 and 3 rejected candidates respectively, zero confirmations.

## 32. False-positive analysis

J0/J1/J2/J6 stayed confirmation-negative. J5 MEDIUM produced one controlled false confirmation with experimental 488 ms airtime. One failure is sufficient to keep the scientific gate closed; no rate claim is inferred.

## 33. Controlled-positive analysis

J4 aggregate event counts matched 3/3 under both profiles. J3 was inconsistent across profiles. Reported 672–776 ms airtimes are implausible or unsupported by precise ground truth and remain `UNVALIDATED`.

## 34. Algorithm changes

No threshold or state-machine tuning was performed from these runs. Changes were limited to transport bounds, continued aggregation after raw-buffer saturation, rotation parsing and telemetry percentile representation.

## 35. Algorithm version

Host profiles remain `experimental-0.1-*`; on-device observer remains `experimental-0.1-hardware-observer`. Any future hypothesis-driven detector change must increment its version and preserve this baseline.

## 36. Sensor profile recommendation

`JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM`

MEDIUM is for continued bounded research only. It is not a production recommendation.

## 37. Battery observations

`NOT_RUN_NOT_REQUIRED`; no autonomy claim. HIGH's doubled throughput is a cost signal, not a battery measurement.

## 38. Hardware memory

Capture-end used memory stayed around 23.3–23.5 KB with stable free-memory snapshots. No soak/long-session memory claim is made.

## 39. Watchdog/listener stability

All 14 valid physical runs reached `COMPLETED`; no watchdog, listener starvation or sensor teardown failure was observed in this bounded campaign.

## 40. Host replay of hardware captures

`HOST_VERIFIED` for every bounded raw prefix. Prefix replay is explicitly not full-run equivalence, especially at HIGH where 64 samples cover less elapsed time.

## 41. Synthetic regression fixtures derived from findings

None promoted from raw hardware automatically. Existing arm-motion and gyro synthetic controls do not encode this single person's raw motion. A future sanitized fixture requires an explicit derivation decision.

## 42. Tests

`npm run check` passes: formatting, lint, 59/59 tests, 10 compiled schemas, valid/invalid contract fixtures, Garmin Lab fixtures, Session Engine validation and all four source-guard suites. Directed parser tests cover verbose/compact records, stale rotated prefixes, truncation, count mismatch, sequence gaps and unsafe bounds.

## 43. Garmin builds

SDK 9.2.0 final sequential `fenix7`, `fenix7s` and unit-test binary builds pass after closure edits.

## 44. Run No Evil

Unit-test binary build passed. Logical runner result remains `NOT_PRODUCED`: the runner produced no output and was stopped; no false exit-code pass is claimed.

## 45. Simulator

`NOT_RUN_NO_RELIABLE_LOGICAL_RESULT`; simulator execution would validate lifecycle only, not sensor science.

## 46. Privacy/security review

No `.env` was read; no network, Supabase, backend, GPS/HR, serial logging, canonical modification or product UI was introduced. Raw results remain ignored. `git diff --check` passes. `npm audit` was attempted but is `UNAVAILABLE`, not passed, because the local npm registry connection failed certificate verification.

## 47. Independent review

Callback, buffer, timing, sensor science, sports plausibility, QA, privacy, Session Engine boundary and Woo-gate concerns are represented in guards and evidence. Separate external human review remains `NOT_RUN`.

## 48. Risks

One controlled false positive; one controlled event miss; unvalidated airtime; gyro artifacts; short raw-prefix replay; one device/operator; human motions not mechanically repeatable; no battery or long soak.

## 49. Unknowns

Kitesurf transferability, real jump precision/recall, valid airtime/height, gyro root cause, other devices/firmware, battery cost, long-run stability and an effective false-positive fix.

## 50. M6 gate

`M6_WOO_VALIDATION_GATE = NO_GO`

## 51. Product readiness

```text
JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
```

## 52. Git status

M5.1 changes remain uncommitted; no commit/push is performed without explicit authorization.

## 53. Recommended next milestone

Remain in Jump Engine research. Form a versioned hypothesis for J5 fast-arm discrimination and invalid airtime, preserve the current baseline, add a non-personal regression representation if scientifically defensible, and repeat targeted J3/J4/J5 controls before reconsidering M6.
