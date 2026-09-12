# Bounded operator-count study — no video

Current collection status: **NOT_STARTED**. The original NV/WV/WALK files are unavailable and the operator confirmed there are no backups. See the [minimal regression recovery protocol](MINIMAL_REGRESSION_RECOVERY.md) for the proposed bounded replacement controls and mandatory storage/preflight gates. Results below are historical, not instructions to repeat the old battery or claims that its raw files remain available.

Latest scope: prioritize representative kitesurf motion rather than more dry-land hops. The [robustness stress audit and marine research plan](KITESURF_ROBUSTNESS_PLAN.md) records three synthetic negative confirmations under the 2600 mg hypothesis with additive perturbations, not real-world false positives. No lower threshold is promoted and no on-water collection is yet prepared.

## Operator correction — technical capture contained hops

2026-09-10: in direct response to the question about the technical export-verification trial, the operator clarified “fue con saltos”. This applies to experiment `jr-1788978341-1285826506` in `/tmp/ww-export1-validation.DzkdhH/`. Actual activity included hops despite the on-device M54BD_NV_ARM_01 / NONE planned reference. Preserve original raw records unchanged and record this protocol deviation separately. Exact count and timing are unknown; do not infer them from candidates or add this trial to the three single-hop outcomes.

The capture remains valid evidence that export completed, but is NOT a negative control. Its 0→1 confirmation under the offline 2600 mg counterfactual is NOT evidence of a false positive. The earlier argument that accepting this technical candidate defeats positive-versus-negative separation is withdrawn. Current 2600 mg observations remain post-hoc tuning evidence, not validated discrimination; independent negative coverage remains incomplete. No threshold change, new physical trial or M6 opening follows from this correction.

## Offline comparison — takeoff gate explains outcomes, threshold-only change rejected

2026-09-10: replayed preserved NV2/NV3/NV4 and existing WALK/WV1/WV2/WV3/technical-control captures, without modifying detector defaults, hardware or reference labels. The table uses frozen Garmin candidate features; phase durations are detector timestamps, NOT independently validated airborne intervals. NV4 candidate 0 never enters flight and is not substituted for the flight-bearing candidate below.

| Capture / candidate             | Takeoff peak mg | Flight minimum mg | Flight phase ms | Sustained low-g ms | Landing stable | Current outcome |
| ------------------------------- | --------------: | ----------------: | --------------: | -----------------: | -------------- | --------------- |
| NV2 / 0                         |         2716.26 |            135.20 |             368 |                328 | yes            | rejected        |
| NV3 / 0                         |         3093.38 |             92.69 |             368 |                328 | yes            | confirmed       |
| NV4 / 1                         |         2644.26 |            212.61 |             288 |                246 | yes            | rejected        |
| Technical capture with hops / 1 |         2704.99 |            258.63 |             328 |                248 | yes            | rejected        |
| WV1 / 1                         |         1752.84 |            627.03 |             204 |                  0 | yes            | rejected        |
| WV2 / 5                         |         1711.99 |            633.95 |             244 |                 40 | yes            | rejected        |

Current guards require takeoff ≥3000 mg, flight minimum ≤408 mg on Garmin (4 m/s² on host), flight duration ≥240 ms and sustained low-g ≥120 ms. NV2/NV4 fail the takeoff gate despite the other listed checks passing; NV3 exceeds it by only 93.38 mg. This explains candidate decisions, not independently matched physical-hop identities. Later post-event peaks exceed 3000 mg in all three NV trials, but cannot be moved into the frozen takeoff feature without reintroducing phase contamination. NV4's initial landing impulse also exceeds 3000 mg; landing evidence is not takeoff evidence.

Source trace: `engine.mjs` sets ARM_MOTION_PATTERN when the joint takeoff/low-g envelope fails, then rejects that flag at finalization. Here that label describes a rule outcome, not observed arm-only motion or a gyro-based class identification. Do not use it as ground truth. Host replay is ACCEL_ONLY; differences in gyro handling mean matched states/outcomes are not complete feature parity.

A single post-hoc diagnostic counterfactual used constructor overrides only: 2600 mg instead of 3000 mg, both mg and m/s² configuration fields kept consistent. This was not a threshold sweep or a selected production setting. Results at 3000→2600: NV2 0→1, NV3 1→1, NV4 0→1, technical capture 0→1, WV1 0→0, WV2 0→0. Retrospective operator clarification establishes that the technical capture contained hops. The numerical replay results stand, but that new confirmation cannot be counted as a false positive or proof of arm-motion confusion. Exact event count and correspondence remain unknown.

Holding all other rules fixed, any takeoff-only threshold low enough to accept the observed NV4 candidate also accepts the technical candidate at 2704.99 mg. This mathematical observation still holds, but both captures now contain operator-reported hops, so it does NOT exclude a takeoff-only repair on positive-versus-negative grounds. Whether any such change generalizes remains unresolved and requires existing hard-negative regressions and independent evidence; no new threshold is selected from this small set.

Decision: no detector/default/profile changes. Research blockers remain FALSE_NEGATIVE_STABILITY plus FALSE_POSITIVE_DISCRIMINATION risk and incomplete independent negative/reference evidence. No further physical collection. Existing hard-negative synthetic controls remain intact; their provenance limitations still apply. Next substantive algorithm study requires a new feature hypothesis rather than requesting stronger hops or silently lowering the gate. The agreed physical round stays closed and M6 stays NO_GO.

## Round CLOSED — NV4 collected; positive counts remain inconsistent

2026-09-10: operator reported NV4 with one hop during RUNNING and COMPLETED. Raw BAK/TXT and error log preserved in `/tmp/ww-nv4.hIkm7G/`. Strict parser verifies novideo2 / M54BD_NV_HOP_01, experiment `jr-1789032626-1340110481`, 200 samples covering 0–8152 ms and 8636 ms wall duration. Host/Garmin states match all 200 samples, outcome counts agree: zero confirmations, two rejected candidates. CIQ_LOG.YML remains byte-identical to NV3; no new recorded crash. Outcome is NO_DETECTION_FOR_REPORTED_HOPS; rejected candidates are not independently identified as the physical hop.

| Trial | Operator-reported hops during RUNNING | Confirmations | Rejected candidates | Count-only result                   |
| ----- | ------------------------------------: | ------------: | ------------------: | ----------------------------------- |
| NV2   |                                     1 |             0 |                   1 | No detection for reported hop       |
| NV3   |                                     1 |             1 |                   0 | Count compatible, not event matched |
| NV4   |                                     1 |             0 |                   2 | No detection for reported hop       |

All three positive captures pass transport/timing integrity checks and preserve 600 samples total. One of three trials has a compatible positive count; two have no confirmation. Do not call this validated 33% recall or claim one independently matched true positive: no-video references do not establish event-level pairing. The tiny, single-operator tuning block is insufficient for population performance claims.

The planned round is CLOSED: invalid NV1 plus NV2–NV4 used the four-attempt budget; the one separately authorized technical verification is also closed and remains separate. No NV5, replacement negative or automatic repeat. No logs reset, thresholds changed, new build installed or raw data versioned during this closure. The exporter correction worked in these three positive captures, not proof of universal watchdog safety. Original NV1 cannot be counted as a negative success and the negative block remains incomplete.

Decision: preliminary positive detection is not reproducible enough to advance. M6_WOO_VALIDATION_GATE = NO_GO; blockers are FALSE_NEGATIVE_STABILITY and INCOMPLETE_NEGATIVE_CONTROL_EVIDENCE. JUMP_ENGINE_STATUS = EXPERIMENTAL; JUMP_DETECTION_PRODUCT_READY = NO; JUMP_HEIGHT_VALIDATED = NO; JUMP_AIRTIME_VALIDATED = NO; WOO_VALIDATION = NOT_RUN. Next useful work is offline comparison of the retained NV2/NV4 rejection evidence against NV3 and existing hard-negative controls, without assuming temporal alignment or tuning one threshold to pass these three captures. Any future physical collection needs a fresh question and explicit budget.

## NV3 collected — count compatible; NV4 final attempt prepared

2026-09-10: operator reported one hop during RUNNING and COMPLETED. Raw BAK/TXT and error log preserved in `/tmp/ww-nv3.IRS9JM/`. Strict parser verifies novideo2 / M54BD_NV_HOP_01, experiment `jr-1788994941-1302426398`, 200 samples covering 0–8152 ms, wall duration 8636 ms. No new recorded crash: CIQ_LOG.YML matches NV2 byte-for-byte. Host/Garmin states agree for all 200 samples, with one confirmed and zero rejected candidates. Outcome: COUNT_COMPATIBLE_NOT_EVENT_MATCHED (one reported, one confirmed). This is not independent temporal association or airtime validation.

Positive sequence so far: NV2 1 reported/0 confirmed; NV3 1 reported/1 confirmed. The two-consecutive-no-detection stop condition is not met. NV4 is the final planned positive and final attempt of the bounded round, using the unchanged binary, profile and comfortable single-hop instructions. No extra attempts will be added based on its outcome. Failed NV1 and the separate technical verification remain distinct.

After preserving NV3, only the watch TXT was reset to zero bytes, verified in the MTP listing on resumption. BAK and other logs remain untouched; prior TXT is recoverable in the NV3 archive. NV4 is prepared but not executed. No code/build/threshold changes or new validation claims. M6 remains NO_GO.

## NV2 collected — first positive without detection; NV3 prepared

2026-09-10: operator explicitly reported one hop during RUNNING and COMPLETED. BAK/TXT and error log preserved in `/tmp/ww-nv2.oKYx6q/`. Strict parser validates novideo2 / M54BD_NV_HOP_01, experiment `jr-1788994463-1301948383`, 200 samples, normalized coverage 0–8152 ms and wall duration 8637 ms. No new recorded crash: CIQ_LOG.YML is identical to the previous technical verification log. Host/Garmin state comparison matches all 200 samples and outcome counts agree: zero confirmations, one rejected candidate. Partial replay agreement is not exact physical event alignment.

Operator-count outcome: NO_DETECTION_FOR_REPORTED_HOPS (one declared, zero confirmed), eventMatching NOT_ESTABLISHED. Do not identify the rejected candidate as the physical hop without an independent temporal reference. This is the first consecutive complete positive without detection; no threshold/code/profile changes. NV1 remains an invalid attempt and technical verification remains separate. NV3 is the next planned positive; if it also has zero detections, stop and omit NV4 under the existing rule.

After preserving NV2, only WWJumpResearch.TXT was reset to zero bytes, verified in MTP; BAK and other logs remain untouched. Previous TXT is recoverable in the NV2 archive. NV3 uses the same installed NV HOP binary and the same single comfortable hop-in-place protocol, without increasing effort to obtain a detection. No automatic retry on deviation or capture failure. M6 remains NO_GO.

## Positive preparation resumed — NV2 ready for operator launch check

2026-09-10 handoff: operator requested continuation after technical verification. Prepare NV2, the first of at most three originally planned single-hop attempts, without converting failed NV1 into a successful negative or adding replacement trials. This is preliminary positive-count research with an incomplete negative block, not passage of the original negative-control gate or independent holdout. Stop on invalid capture/reference, discomfort, or two consecutive complete positive trials without detections. Retrieve each attempt before proceeding.

Build `0.5.1-m5.4bd-novideo2`, protocol `M54BD_NV_HOP_01`, labels `NV HOP / MEDIUM` and `ONE HOP - 8s`. The incremental exporter, detector, thresholds and 225-sample/12-second/9500-byte limits remain unchanged. Observation requires eight seconds on wall and delivered-sample clocks. START during capture neither adds a post-event marker nor changes the deadline. Actual operator count is collected offline; the planned reference is OPERATOR_COUNT_ONLY, not a timestamped controlled-hop reference. Host timed-reference evaluation rejects this type; diagnostic replay explicitly reports COUNT_ONLY_NO_TEMPORAL_ALIGNMENT. Strict capture parsing still enforces identity, coverage and reference separation from negatives/SYNC01.

Checks during preparation passed: npm run check (114 main tests and repeated 38), sequential fenix7/fenix7s builds and unit-test compilation; Garmin reported 18 logical passes. These simulator checks do not verify a physical positive result. Binary transferred to fenix 7 Apps and read back identically: 146028 bytes, SHA-256 5030d4c96b71d87ef4f451c627e64392782a25bb8963f697b92f1f6bd287fdd6. Artifacts/readback in `/tmp/ww-nvhop-build.NVdMwz/`. Prior TXT readback matched the preserved technical capture (2926 bytes) before reset. On resumption MTP lists TXT zero bytes; BAK remains untouched and prior TXT is recoverable in both archives. Watch launch/label confirmation and actual NV2 execution are pending.

NV2 instructions: clear level area, comfortable small hop in place only if safe. Verify the new label, start once, wait for countdown to end, remain still about one second, perform one small hop, then remain still through automatic export/completion. No second START or manual event mark, no video, no deliberate arm maneuver to affect detection. If the movement was late, more than one hop occurred, or anything differed, record that and do not repeat automatically. Operator must report actual count and whether the hop occurred during RUNNING, not infer it from candidate output. Counts matching still do not prove temporal event correspondence. M6 remains NO_GO.

## Technical export verification — passed for one physical capture

2026-09-09: authorized one-attempt technical check completed. BAK/TXT and CIQ_LOG.YML preserved in `/tmp/ww-export1-validation.DzkdhH/`, without clearing watch logs. Strict parsing verifies build `0.5.1-m5.4bd-novideo1-export1`, protocol M54BD_NV_ARM_01, experiment `jr-1788978341-1285826506`, COMPLETED, 200 samples covering normalized 0–8152 ms and 8683 ms wall duration. Identity, checksum/sequence/count, zero-origin timing, full coverage and drop checks pass. CIQ_LOG.YML is byte-identical to the archived NV1 crash log: no new recorded crash.

ACCEL_ONLY replay agrees with all 200 Garmin states and zero confirmed/five rejected outcomes. Parity remains PARTIAL, not proof of full feature equality. Eight callbacks of 25 samples report mean/max processing 90.75/113 ms, maximum intercallback interval 1100 ms, no duplicate/out-of-order/gap/fallback timestamps and 140 gyro outliers. Histogram percentile bounds remain unresolved above 8 ms; these callback costs do not measure individual export-stage duration. Gyro remains quality-only in packed export.

Result: EXPORT_FIX_VERIFIED_FOR_THIS_CAPTURE. This does not establish universal watchdog safety, positive-hop detection, precise timing or product readiness. The explicit technical one-attempt budget is CLOSED, not silently relabeled as replacement NV1 or new holdout. Operator reported COMPLETED; protocol expects no hops, but no new event-count validation claim is inferred from the planned reference alone. Failed NV1 remains invalid. No further physical trial was prepared, logs reset or new build installed during collection. Next decision is resuming the separately labeled positive preparation; do not hop under NV1 ARM. M6 remains NO_GO.

## One technical verification attempt authorized — launch pending

Operator explicitly approved installing the exporter correction and one eight-second no-hop technical attempt. This is a separate one-attempt transport verification budget, not an automatic replacement of failed NV1 or resumption of NV2–NV4. Use comfortable arm movement with feet still, never forceful motion. Require the visible app version suffix `novideo1-export1` before START. Capture remains eight seconds; EXPORTING now takes additional timer turns. Do not press START again or repeat on failure.

Corrected binary copied to fenix 7 GARMIN/Apps/WWJumpResearch.prg and read back byte-identically: 145964 bytes, SHA-256 d351bb8d482e8af5db1cf179b56492d51d0be3b37db47f8a9c14bd6645d25527. Readback retained in `/tmp/ww-nv-exportfix/readback/`. MTP TXT is already zero bytes; no log deletion/reset performed in this installation. Watch-side launch remains unverified. Success requires a new strict-parser-valid export under the corrected identity and no corresponding new crash, not merely a displayed COMPLETED. On failure preserve evidence and stop. No physical verification result yet.

## Export watchdog mitigation — implemented, hardware verification pending

Build `0.5.1-m5.4bd-novideo1-export1` replaces synchronous full preparation with one bounded block (at most 25 samples) or summary component per timer turn. Statistics, operator reference, compact candidate traces, summary assembly and completion are separate stages. No output is emitted until all stages pass the existing line/9500-byte budget. Exceptions or invalid budgets fail closed. All lines remain retained within existing bounds; callback acquisition and detector thresholds are unchanged. This addresses excessive uninterrupted preparation; it does not prove that every individual stage is below the physical watchdog limit.

The Garmin regression verifies prepare produces only the manifest, readiness remains false until 14 steps for a 225-sample stress source, each step adds at most one line, completion is idempotent, and the byte budget still rejects overflow. Nine simulator-emitted motion blocks decode on the host to all 225 exact xyz Float32 vectors and normalized timestamps, with contiguous sequence and valid checksums. This is synthetic serialization evidence, not a new physical capture or fully matched detector replay.

Validation: npm run check PASS (113 main tests plus repeated 38); sequential fenix7/fenix7s and unit-test builds successful; 18 Garmin logical PASS with runner exit 1. Artifacts are local in `/tmp/ww-nv-exportfix/`. No corrected build has been installed and no logs cleared in this fix. Hardware watchdog mitigation remains NOT_VERIFIED. The failed NV1 stays attempt 1/4; no replacement is automatically authorized. Next proposed step requires a separately approved one-attempt technical verification budget before physical collection resumes.

## Latest result — NV1 export watchdog; collection paused

2026-09-09: operator reported NV1 completed without hops but displayed the IQ/orange-triangle error. Retrieved CIQ_LOG.YML, WWJumpResearch.BAK and WWJumpResearch.TXT into `/tmp/ww-nv1-crash.0AGKcL/`, without clearing watch files. The new error at 18:05:45Z is `Watchdog Tripped Error - Code Executed Too Long`, in WWJumpResearch. Stack: JrStats.percentileBucket line 52 → JrStats.toJson line 71 → JrPackedExport.prepare line 62 → JrController.beginExport line 197 → onTick line 142.

TXT is zero bytes; BAK is 5246 bytes with the previous SYNC01 modification time, not evidence of NV1 results. No new complete NV1 capture exists. No false-positive count, negative success or callback performance result can be inferred. Attempt 1/4 is consumed; NV2–NV4 are not started. The round is paused under its transport-failure stop rule, with no automatic replacement attempt.

Code inspection shows prepare encodes every retained motion block and constructs the summary synchronously before the controller drains any line. The percentile routine itself is bounded to six buckets; the stack identifies where the watchdog fired, not proof of an infinite percentile loop. The supported diagnosis is excessive uninterrupted work during export preparation. Per-stage timings and the exact contribution of packing versus summary construction are not available from this failed trial.

Next engineering action to evaluate: incremental bounded preparation across timer turns, retaining encoding/checksum/count/byte-budget and completion safeguards. Do not disable the watchdog, weaken clock validation, reduce detector thresholds or call the failed trial a negative pass. A corrected exporter needs focused regression tests and Garmin verification before a separately authorized replacement physical attempt. No fix or new installation is claimed by this diagnostic entry. Earlier readiness statements below describe the pre-trial state.

## Scope and decision

Operator accepted a no-video preliminary discrimination round, originally capped at six attempts. Review of the existing WV1–WV3 walking controls shows no reason to repeat that block. The new budget is **four attempts maximum**: NV1 comfortable arm movement with feet stationary and no hop, followed by NV2–NV4 each with one comfortable small hop in place, only if safe. Stationary and walking controls are not recollected; prior results remain historical, not new holdout. SYNC01 is excluded, not relabeled as a negative trial.

Detector `experimental-0.5-phase-scoped-envelope`, 3000 mg takeoff threshold and MEDIUM remain frozen throughout this round. No tuning between attempts, forced movement, attempts to trigger the counter, video, timing validation, height, Woo, backend or Canonical Session change. Dataset is TUNING/exploratory, not independent holdout. New evidence sought: a contemporary arm-only control and repeatability of operator-reported single-hop count outcomes under unchanged logic.

Dependency graph: verified capture identity/transport → operator actual count and coverage/deviation report → preliminary count outcome → stop/continue decision. Candidate output never supplies ground labels. Count equality does not establish event correspondence: a missed hop and an unrelated detection can cancel in the count.

## Sequence and budget

1. NV1: one eight-second arm-only capture. Stand comfortably with feet still, move the watch arm naturally at a comfortable speed; no forceful flicks, impacts or jumps. No escalation to reproduce a false positive. Actual absence of hops and protocol deviations must be confirmed after the trial.
2. If NV1 is complete with zero confirmations and no deviation, prepare a separately labeled positive capture before NV2. Never hop under NV1 ARM.
3. NV2–NV4: up to three separately collected single-hop trials, same comfortable motion in place on clear level ground. Exact execution cue and coverage contract must be verified before deployment; these positive trials are NOT READY in the current negative-only build.
4. Retrieve and preserve BAK/TXT after every attempt; no second capture before retrieval. Trials with invalid transport, uncertain action coverage or deviations still consume the budget and stop collection for investigation. A false detection in NV1 stops the round for analysis. Two consecutive complete reported-positive trials without detections stop before the third. Stop for discomfort or unsafe conditions. No automatic replacements or extra attempts.

A new round or detector change requires a fresh explicit decision and budget. This study cannot by itself open M6. M6 remains NO_GO; airtime/height unvalidated and product readiness NO.

## NV1 implementation

Build `0.5.1-m5.4bd-novideo1`, protocol `M54BD_NV_ARM_01`, display `NV1 ARM / MEDIUM` and `NO JUMP - 8s`. NONE / NEGATIVE_TRIAL / PREDECLARED_PROTOCOL remains the on-device planned reference; it is not a substitute for the operator's actual report. Eight seconds of both wall and delivered sample coverage, at most 225 samples, 12-second safety cap and 9500-byte export bound. START cannot truncate the window; BACK cancels. Transport/clock failures remain rejected by the host. Historical SYNC/negative/positive diagnostic versions remain accepted under their own identities, never interchangeable.

The offline `assessOperatorCount` helper requires an explicit actual operator count, verified capture, operator-confirmed coverage and an explicit no-deviation report. Unknown references return INCONCLUSIVE_REFERENCE_OR_CAPTURE. Negative detections are reported as false detections for that trial; equal positive counts return COUNT_COMPATIBLE_NOT_EVENT_MATCHED, never matched true positives. Unequal positive counts remain mismatches without invented event pairing. No kitesurf precision/recall is computed.

## Status

NV1 prepared: npm run check PASS (113 main tests, repeated 38-test session suite); sequential fenix7/fenix7s and unit-test builds successful. Run No Evil reports 18 logical passes, zero failures/errors, with process exit 1 (not a clean process PASS). Detector source and thresholds were not changed in this preparation; no new hardware performance claim.

Build copied to fenix 7 GARMIN/Apps/WWJumpResearch.prg and read back byte-identically (144188 bytes, SHA-256 a9799acc623522635d0f39459016217a28ad725422849a5dbb479924c8ad7b43). Artifacts/readback: `/tmp/ww-novideo1-build.BxdCer/`. Watch-side launch/label confirmation remains pending. Current TXT readback matched the archived SYNC01 TXT exactly (2254 bytes) before replacing only WWJumpResearch.TXT with an empty file. MTP lists zero bytes; BAK and other logs were not cleared. Prior contents remain recoverable in the local SYNC01 archive and new readback folder. First-trial transport preflight is ready, not proof of a successful future capture.

NV2–NV4 acquisition preparation is pending NV1. No physical attempt in this round has started. No raw media/captures are versioned and no commit/push is authorized.
