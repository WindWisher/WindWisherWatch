# Kitesurf robustness — research scope and first stress audit

## Recovery prerequisite before further detector tuning

Update 2026-09-11: UI transfer recovered the complete historical NV4 capture from the watch, identified by exact experiment ID in `NO_VIDEO_TRIAL_PROTOCOL.md`. Two persistent same-volume copies have matching SHA-256. Fresh baseline/sustained/persistent/periodic replay yields zero confirmations and two rejections in every variant across 200 samples. NV4's operator-reported one-hop reference is historical and independent of detector output; no event matching or improvement is established. The remaining NV/WV/WALK archive inputs are still missing. See [recovery preflight evidence](MINIMAL_REGRESSION_RECOVERY.md). The missing-input statements below describe the earlier checks, before this partial recovery.

Repeated read-only checks confirm the complete NV2/NV3/NV4 and WALK/WV original captures are unavailable at their recorded `/tmp` paths. Repository searches included ignored files, alternative capture/result/backup names, and exact NV experiment identifiers in eligible log/JSON formats while excluding environment and credential files. Git history contains no tracked WWJumpResearch BAK/TXT originals. The active `tools/jump-engine/WWJumpResearch.TXT` is zero bytes. Available J-series archives contain only prefixes, as audited below.

No acceptable correction has been established: the timing-only variants introduce adversarial confirmations, the universal peak-persistence veto loses NV3, and periodic subtraction loses synthetic positives under changing backgrounds. Further tuning without the complete physical regression inputs would repeat the demonstrated synthetic overfitting risk. Existing aggregate results and the short-impulse synthetic contrast cannot reconstruct those originals or independently verify a new algorithm's physical compatibility.

The operator subsequently confirmed that no original backups exist. The [minimal regression recovery protocol](MINIMAL_REGRESSION_RECOVERY.md) now proposes three new, separately identified controls and persistent hash-verified preservation. Preparation is not authorization to record: independent backup selection, neutral capture labeling and installed-binary preflight remain pending. Do not search unrelated personal locations, invent missing motion, label partial replays complete, or start new physical trials automatically. Original constraints remain intact; this preparation performs no commit/push, Garmin change, backend work or M6 promotion. The requested correction is **NOT SOLVED**, not complete because the research checks pass.

Final consistency check at this recovery boundary: `npm run check` PASS (142 main tests plus repeated 38), and `git diff --check` PASS. These include explicit tests of rejected hypotheses, not a passing detector validation gate. A restored private archive can live under `research/garmin/jump-engine/results/` rather than `/tmp`; Git ignore coverage was verified for a BAK file there. Keep each original trial separate and preserve its protocol/operator reference instead of merging or overwriting captures.

## Periodic-background frozen holdout — FAILED under changing motion

`node tools/jump-engine/periodic-background-holdout.mjs` fixes, before reading results, periods 280/480/800 ms, widths 60/140 ms, phases 35/125 ms and amplitude 8 m/s². It tests steady background, cessation at 900 ms, and a half-cycle shift from 900 ms. These are new hypothetical perturbations, not the previous consumed holdout or calibrated marine motion. Original sample clocks and raw inputs are preserved; source/corpus SHA-256 hashes are emitted with the report.

Across 1584 pairs / 3168 replays, baseline had 180 count mismatches against original fixture expectations and the periodic-background hypothesis had 124. Despite this aggregate reduction, the count non-regression gate **FAILS with 33 regressions**, including lost positives under ceased/shifted backgrounds and new expected-zero confirmations. No checked buffer/count violations occurred. These correlated synthetic cases are not physical error rates.

The focused causal counterexample is `clean-synthetic-jump`, MEDIUM, period 280, width 60, phase 125, stop mode. Background pulses end at 900 ms. At 1000 ms the original takeoff is 32 m/s² with no added pulse, but the stale model predicts one and subtracts 8, yielding 24 m/s². Baseline confirms one candidate; the hypothesis confirms none. A regression test asserts the unchanged raw input, incorrect derived value, and changed outcome. Past periodicity is insufficient evidence that a later impulse contains the same additive background.

Decision: **PERIODIC_BACKGROUND_STATUS = REJECTED_FOR_PROMOTION**. Do not shorten its expiry or increase its fit tolerance merely until this challenge passes. A stronger requirement is to avoid unverified subtraction of real candidate evidence under nonstationarity. Long-session/performance promotion checks for this variant are deferred because it failed the earlier correctness gate; existing matrix bounds are not a substitute for them. The normal detector, Garmin binary and raw files remain unchanged. M6 stays NO_GO and the resolution goal remains active, not solved.

Two focused tests cover waveform boundaries and the stale-subtraction regression; syntax/lint checks pass. The new holdout is now consumed diagnostic data and must not be relabelled fresh validation after further tuning. Archived NV/WV/WALK compatibility remains unverified because originals are missing; do not add more guards solely from synthetic fixtures without restoring that regression evidence.

## J-series coverage audit — available archives cannot replace full replay

Inspected the preserved J0–J6 × MEDIUM/HIGH archives with the existing strict parser, using the final J0 12-second versions. All 14 parse as schema 1.0.0, but each exports only the first 64 samples. MEDIUM summaries report 275 observed samples; HIGH reports 550. Sequence 0–63 is contiguous, but it is only the prefix (approximately 2.58 s MEDIUM / 1.29 s HIGH), not the whole trial. The earlier compact J0 archive similarly has 64 exported of 75 observed; another early J0 attempt has no parseable manifest.

All 14 final archives are **INELIGIBLE_FULL_SESSION_REPLAY**. The `CONTROLLED_FULL_WINDOW` label cannot override observed/exported counts and dropped samples. Historical on-device summaries (including J4's 3 detections) remain historical evidence; they cannot be used to claim a new algorithm replays all those events from the 64-sample prefix. No partial replay was counted as a new detector validation.

`capture-replay-eligibility.mjs` now checks explicit completion, observed/exported/drop counts, sequence/time origins and chronological continuity before the archived-comparison helper runs. Its result `ELIGIBLE_COVERAGE_ONLY` deliberately does not imply valid labels, good sensors or jump accuracy. Tests demonstrate the 64/75, 64/275 and 64/550 failures despite the full-window label, plus missing metadata and broken sequence/time cases. Four focused coverage/archived-helper tests PASS.

The missing NV/WV/WALK originals remain necessary for the new algorithm's archived physical regression gate. Do not infer their raw motion from J-series prefixes or synthesize a replacement labelled hardware. Offline synthetic robustness work can continue while the operator checks for an original private backup; no new physical recording is requested.

## Causal periodic-background hypothesis — new tuning candidate only

`node tools/jump-engine/periodic-background-experiment.mjs` tests an explicit additive-background hypothesis over sustained segmentation, not the rejected universal peak-duration requirement. It learns three completed, modest impulse plateaus and estimates their interval, width and vector excess over the following quiet observation. The next sample is corrected only from a model already available before that sample; raw inputs remain unchanged. Prediction expires after two periods from the last completed pulse. Invalid clocks/gaps clear the model. High-impulse/low-g contamination invalidates a learning pulse; pulse learning duration and history are bounded.

This is a **hypothetical additive model**, not a physical model of kite/chop/wrist motion. Provisional fit tolerances are one profile interval for phase/width consistency and 1 m/s² for vector-excess consistency, with period bounded by the existing 1000-ms guard. Those assumptions can be wrong for real movement; subtraction is not clipping, raw gyro is not corrected, and the normal capture/detector/export paths do not use this subclass. No inference of airborne state or physical force is justified by the fit.

Fixed tuning result: 1496 pairs / 2992 replays, zero clean-catalog mismatches, zero checked bound violations, 63 changed counts, no expected-zero count increases and no expected-positive count decreases relative to baseline. It recovers the target MEDIUM pulse case and preserves the synthesized short-impulse/soft-landing contrast that the 40-ms veto rejects. Status **TUNING_GATE_PASS / NOT_PROMOTED**. A new frozen holdout and four-hour/performance checks for this algorithm remain pending. The previous holdout is consumed diagnostic data, not fresh validation for this model.

Attempting the archived replay for this new variant returned ENOENT: the prior `/tmp/ww-nv2.oKYx6q/`, `/tmp/ww-nv3.IRS9JM/` and other raw archive paths were no longer available in the current environment. A search explicitly including ignored repository files found older J0–J6 BAK/TXT archives under `research/garmin/jump-engine/results/`, but these are not the missing NV/WV/WALK captures and must not substitute for them. Earlier replay findings remain historical evidence; **NV/WV/WALK replay of the periodic-background variant is NOT_RUN_MISSING_ORIGINAL_CAPTURES**. Do not fabricate the old waveforms from aggregate numbers, relabel the synthetic contrast as hardware, or request new physical trials automatically. Restoring original private archives is a prerequisite for that gate; the older J-series remains available for separate checks.

Focused validation of this stage: archived-comparison and periodic-background tests PASS (four tests), including causal model construction, raw-input immutability, gap reset, bounded pulse accumulation, tuning non-regression and the synthetic short-impulse contrast. The preceding general check passed 136 main tests plus repeated 38 before the periodic model was added; it is not presented as a full check of the new model.

## Archived physical replay — universal persistence veto rejected

Local ACCEL_ONLY replay of the eight preserved parsed MEDIUM diagnostic captures compares the unchanged engine, sustained segmentation, and frozen 40-ms persistence hypothesis. `tools/jump-engine/archived-regression.mjs` accepts a locally parsed capture, limits input to 225 samples and emits aggregate candidate evidence only; it performs no file discovery, network access, GPS/HR processing or raw export. Existing BAK/TXT archives were read locally and left unchanged.

| Archived trial                                 | Baseline confirmations | Sustained segmentation | 40-ms persistence |
| ---------------------------------------------- | ---------------------: | ---------------------: | ----------------: |
| NV2                                            |                      0 |                      0 |                 0 |
| NV3                                            |                      1 |                      1 |                 0 |
| NV4                                            |                      0 |                      0 |                 0 |
| WALK / WV1 / WV2 / WV3                         |                 each 0 |                 each 0 |            each 0 |
| Technical export trial, operator reported hops |                      0 |                      0 |                 0 |

NV3 has a single observed sample above 3000 mg, hence zero observed span. Its original phase peak is approximately 30.34 m/s² and initial landing peak 28.73 m/s². The new persistence veto rejects the existing confirmation with `INSUFFICIENT_OBSERVED_IMPULSE_SPAN`. The operator reported one hop, but no independent temporal pairing exists: this is a replay count regression on a positive-count trial, not newly validated physical event matching. The technical trial contained hops and MUST NOT be relabeled as a negative control.

This is stronger evidence against the universal 40-ms requirement than synthetic tuning success. Raising the duration further cannot preserve this candidate. Requiring the same 3000 mg magnitude at landing would also reject NV3; a second scalar threshold is not a demonstrated solution. The sustained-segmentation-only variant retains all eight baseline counts, but its known adversarial synthetic failures still prohibit promotion.

The new test deliberately synthesizes a short high impulse followed by low-g and a softer landing using round values; it contains no copied hardware samples, timestamps or personal measurements. Expected comparison is baseline 1 / sustained 1 / persistence 0. Privacy and input-bound tests verify the helper does not emit unrelated fields or silently replay unsupported profiles.

Next gate order is now explicit: establish compatibility with these archived controls and the short-impulse contrast **before** spending another synthetic holdout. Investigate phase/context evidence without a universal peak-duration or stronger-landing requirement. The original timing defect is not yet corrected by a promotion-ready model; the goal remains ACTIVE, Garmin unchanged, and M6 NO_GO.

## Impulse persistence — tuning passed, reserved holdout FAILED

`node tools/jump-engine/impulse-duration-audit.mjs` observes the same 1496 tuning pairs without changing decisions. It emits compact measurements for 2461 retained candidates with a flight phase across both engines; these candidates are correlated, not independent hardware events. Phase start is reconstructed from takeoff time minus candidate-to-flight elapsed time, never from the public last-impulse timestamp. Samples at/after flight entry and later landing/post-event peaks are excluded.

The measured feature is the maximum continuous **observed span** above the existing 3000 mg threshold. An isolated sample has span zero, not an invented one-sample duration. No interpolation or sample-rate scaling is used; flagged/degraded samples and dips break a run. In the sustained-segmentation tuning output, confirmed positive fixture structures have spans 40–60 ms, while the constructed brisk-walking negative confirmations have spans 0–20 ms. HP1/HP2-like threshold-dependent controls also have short spans; their labels do not constitute independent negative ground truth.

Freeze `experimental-persistent-impulse-offline-v1`: sustained segmentation as above plus at least 40 ms of observed peak support and coverage of phase start. **40 ms was selected from tuning evidence**, not from a sports standard or a calibrated impulse model. It may overfit the fixture family. Reproduce with `node tools/jump-engine/persistent-impulse-experiment.mjs`. The bounded phase window is scanned only before a proposed confirmation; rejection occurs before the existing immutable finalization and counter updates. A typed experimental reason `INSUFFICIENT_OBSERVED_IMPULSE_SPAN` explains the veto. There is no post-hoc mutation of frozen candidates and no change to the normal engine or Garmin configuration.

Tuning result: 1496 pairs / 2992 replays, zero clean-catalog mismatches, zero checked bound violations, 65 changed counts, no increased counts in expected-zero controls and no reduced counts in expected-positive controls relative to baseline. This is a count non-regression gate, not proof that every perturbed waveform has its original label, every positive is detected, events are paired correctly or physical robustness is established.

The frozen reserved evaluation was then run with `node tools/jump-engine/persistence-holdout.mjs`: all 22 scenarios, two profiles, periods 320/640 ms, amplitudes 4/8 m/s², reserved phases 10/30/60/100/200/300 ms and widths 60/100 ms. Output includes source SHA-256 hashes. Across 2112 pairs / 4224 replays, baseline had 159 counts differing from original fixture expectations and the experiment had 64. These numbers are stress comparisons, not physical error rates. There were zero checked bound violations but **six count regressions**: constructed brisk-walking negative and HP1/HP2-like controls each changed 0→1 in MEDIUM at period 320, amplitude 8, width 100, phases 10 and 300. The HP controls remain provenance-dependent, not independent physical negatives. No expected-positive count decreased relative to baseline.

The broader pulse now supports the adversarial peak for an observed 40 ms, the same support as MEDIUM positive controls. Thus a rule that neatly separated tuning cases fails unseen perturbations. Do not raise its duration until these examples disappear: that would discard the 40-ms positive support and introduce the same sampling-rate dependence again. The two constructed-negative holdout failures are preserved as explicit regression evidence. These reserved cases are now consumed evaluation data and must not be called fresh holdout for a later algorithm.

Status: **TUNING_GATE_PASS / RESERVED_HOLDOUT_FAIL / NOT_PROMOTED**. The 40-ms version remains frozen and rejected despite an aggregate reduction in mismatched counts. Next investigation must assess feature overlap/identifiability and phase context rather than another peak-duration constant. Long-session and callback-cost checks for this new finalization scan remain pending because it failed the earlier discrimination gate; prior variants' resource results do not substitute for those checks. M6 remains NO_GO and the overall resolution goal is not complete.

Validation before the reserved regression test: `npm run check` PASS (133 main tests plus repeated 38); the reserved runner passed syntax and lint checks separately. The full reserved run completed successfully with a logical discrimination gate FAIL, not a tooling failure. Normal engine, Garmin and raw hardware captures were not modified by this study.

## Sustained segmentation — timing improvement, discrimination still open

Reproduce `node tools/jump-engine/sustained-segmentation-experiment.mjs`. This isolated subclass requires continuous observations in the existing 7–13 m/s² band before terminating a pre-flight candidate. The interval is 160 ms, reusing the existing stabilization duration provisionally; its use for pre-flight segmentation is a new research hypothesis, not a validated biomechanical rule. A low/high excursion, degraded timestamp/gap flag, or new candidate resets the interval. No sample counter, additional history array, threshold search or lifetime extension is introduced. The absolute timeout remains as a safety guard and is not claimed universally independent of all waveforms.

Same fixed 1496 pairs / 2992 engine replays: zero clean-catalog mismatches, zero checked buffer/sample-count violations, 69 changed counts. None of those changed counts is lower than baseline. The phase-zero MEDIUM single-hop and separated-hop misses are recovered. However, the constructed brisk-walking negative gains confirmations in three perturbations per profile; the HP1/HP2-like threshold-dependent controls also change. Thus improved count retention does not mean correct event matching or a passing robustness gate. This variant is **NOT PROMOTED**.

The result separates two issues: stable temporal segmentation avoids the positive losses of instantaneous segmentation in this finite matrix; retaining earlier impulse evidence exposes the weakness of confirming from a single high takeoff peak. The next evidence task is to compare time-supported impulse features against adversarial cases, without turning a newly observed discriminator into a passing constant by trial and error. Previously inspected phases are tuning data; genuinely uninspected phases/waveforms must remain separate for a later frozen holdout check. A synthetic holdout still cannot establish kitesurf validity.

Focused tests check exact 159/160-ms boundaries under both profiles, resets after excursions, timestamp-quality resets, candidate isolation, the preserved negative regression and four virtual hours of repeated segmentation. The extra state consists of two scalar fields, alongside the existing bounded buffers. Clock normalization and array bounds are checked separately; these are not measured Garmin callback performance or RSS guarantees. Normal engine configuration, Garmin, hardware collection and M6 status remain unchanged.

The focused four-hour MEDIUM run completed 360000 samples and 45000 segment closures without confirmations or checked buffer-bound violations. `npm run check` PASS (129 main tests plus repeated 38), syntax/format checks and `git diff --check` PASS. Reserve, before inspecting outputs, perturbation phases 10/30/60/100/200/300 ms and widths 60/100 ms at the existing 320/640-ms periods and 4/8 m/s² amplitudes for a later frozen synthetic holdout. Those waveforms have not been evaluated in this step. A failure must remain reported; reusing it for tuning consumes that holdout and requires a distinct new evaluation set, not a renamed pass.

## Active resolution goal — segmentation, not another threshold search

The operator explicitly requested an ongoing goal to resolve this issue. Acceptance requires the timeout/sampling-grid problem to be corrected offline without hiding positive/negative regressions, double-processing samples or exceeding bounded resources. Garmin promotion is gated separately; M6 remains NO_GO and no automatic new physical collection is planned. Current status: **ACTIVE, NOT SOLVED**.

Second isolated hypothesis: end a pre-flight candidate when raw acceleration enters the existing 7–13 m/s² grounded band. This is a waveform segmentation proposal, NOT proof that a rider is on the ground. Reproduce with `node tools/jump-engine/ground-segmentation-experiment.mjs`. No physical thresholds, production engine, Garmin binary or canonical schema were changed.

The same 1496 paired cases / 2992 replays produce zero clean-catalog mismatches and zero checked buffer/sample-count violations, but 205 perturbed cases change counts, including numerous positive losses and new confirmations of the constructed negative envelope. Therefore single-sample grounded segmentation is also **NOT PROMOTED**. The regression test deliberately demonstrates why checking only unperturbed fixtures is insufficient. Inputs, parameters and results are synthetic, correlated and not marine accuracy statistics.

Research graph now: expiry collision established → unconditional retry rejected → instantaneous grounded segmentation rejected → investigate time-supported phase boundaries and impulse persistence → frozen comparison including withheld perturbation phases → resource verification → separate hardware readiness decision. Do not mark the goal solved merely because a focused fixture passes. Rejecting these alternatives narrows the problem but is not a completed correction.

Validation after adding the isolated segmentation experiment: `npm run check` PASS (126 main tests plus repeated 38), JavaScript syntax checks PASS and `git diff --check` PASS. Existing unrelated/uncommitted Garmin changes were preserved; no new detector or configuration edits were made by this experiment.

## Bounded reseed counterfactual — NOT PROMOTED

Run `node tools/jump-engine/timeout-reseed-experiment.mjs`. A separate offline subclass finalizes an expired pre-flight candidate and, only when the current observation is an impulse, evaluates GROUND once with that same observation. It returns the old finalized candidate and retains a new active candidate. It never calls `process` twice, normalizes the clock twice, inserts a duplicate buffer sample or recursively retries. The normal engine and Garmin implementation are unchanged. The distinct algorithm identity is `experimental-timeout-reseed-offline-v1`.

Fixed comparison: all 22 catalog scenarios × MEDIUM/HIGH × 34 variants = 1496 paired cases / 2992 engine replays. Variants are unmodified control; additive amplitudes 0.5/1/2 m/s² with seeds 1/7/19; and 80-ms pulses at periods 320/640 ms, amplitudes 4/8 m/s², phases 0/20/40/80/160/240 ms. Pulse rule: `(rawSyntheticTime + phase) % period < 80`. Both engines receive identical ACCEL_ONLY inputs and unchanged 3000 mg thresholds. This comparison uses actual default smoothing (MEDIUM three samples, HIGH five); the earlier causal audit deliberately used one/three samples for both profiles.

Results: no unmodified-catalog count mismatches; no checked buffer/sample-count bound violations; 25 changed counts across perturbed cases. Multiple catalog scenarios inherit the same waveform: these are not independent experiments. The target MEDIUM single-hop miss improves 0→1 and the separated-hop case improves 2→3 under phase-zero 320/+8 pulses, but broader controls reject promotion:

| Case                                         | Profile / perturbation        | Baseline → reseed |
| -------------------------------------------- | ----------------------------- | ----------------- |
| Constructed brisk-walking negative envelope  | HIGH / 320 ms, +8, phase 0    | 0→1               |
| Brisk-walking / hop / brisk-walking positive | MEDIUM / 640 ms, +8, phase 40 | 1→0               |
| HP1-like and HP2-like late-peak fixtures     | HIGH / 320 ms, +8, phase 0    | each 0→1          |

The HP fixtures' zero expectation is threshold/provenance dependent and is NOT independent negative ground truth. All transformed results are synthetic sensitivity evidence, not observed marine false-positive/negative rates. Nevertheless, improving one target while changing a constructed negative and losing another positive does not justify adoption. The simple unconditional impulse-reseed hypothesis is **NOT PROMOTED**; do not deploy it or lower thresholds to conceal these regressions.

Tests explicitly preserve this failed-hypothesis evidence, check one returned rejection plus one new candidate without duplicate smoothing/buffer work, and exercise four virtual hours of repeated expiry at MEDIUM. Bounded arrays and constant-size counters do not establish physical callback latency or measured RSS stability. No Garmin rebuild/hardware performance claim applies to this isolated subclass.

Snapshot inspection explains both regression mechanisms. In the constructed HIGH negative, reseeding at 1020 ms includes the pulse-augmented 32 m/s² takeoff sample, instead of the baseline's 24 m/s² peak. Flight/landing times remain 1160/1440 ms, sustained low-g 140 ms and landing peak 24 m/s². The same envelope consequently crosses its 29.41995 m/s² threshold; this is not late post-event peak leakage. In the MEDIUM positive, reseeding at 1560 ms starts a candidate that expires at 2600 ms on an already low-g 2.5 m/s² sample. The baseline instead reaches FLIGHT at 2640 ms. Unconditional reseeding has moved the timeout collision rather than removed the structural problem. Public candidate `startMilliseconds` tracks the last impulse, so it must not be substituted for internal `candidateStartTime` when diagnosing expiry.

Validation: `npm run check` PASS (125 main tests plus repeated 38); `git diff --check` PASS. The focused four-hour synthetic repeated-expiry run processed 360000 samples and 13846 reseeds without checked buffer-bound violations. Passing these tests verifies the recorded failed hypothesis, not promotion readiness.

Next offline question is how to define candidate segmentation independently of stale absolute-timeout alignment, while retaining evidence against periodic-motion envelopes. A local timeout retry alone is insufficient. Avoid extending candidate lifetime, changing peak thresholds, or combining multiple algorithm changes without separate evidence. No new physical trials, raw uploads or Woo work. M6 remains NO_GO.

## Timeout boundary diagnosis — current engine unchanged

Run `node tools/jump-engine/timeout-audit.mjs` from the root. Eight fixed synthetic replays compare the two affected positive structures, MEDIUM/HIGH, and smoothing windows of one/three samples, at the unchanged 3000 mg setting with ACCEL_ONLY and 320 ms / +8 m/s² pulses. The audit records transitions and a compact 960–1120 ms boundary window; each input is processed exactly once. It does not accept hardware data or implement a detector fix.

Both structures lose their first constructed hop in MEDIUM with either smoothing window. Counts remain 0 versus 1 for the single-hop structure and 2 versus 3 for the separated-hop structure. Removing smoothing therefore does not eliminate this particular profile difference.

The pulse at time zero starts a candidate. Repeated impulses keep it active until the absolute candidate timeout (`elapsed > 1000 ms`). The synthetic takeoff spans [1000,1080) ms:

|    Time | MEDIUM                                                   | HIGH                                       |
| ------: | -------------------------------------------------------- | ------------------------------------------ |
| 1000 ms | old candidate still active                               | old candidate still active                 |
| 1020 ms | no sample                                                | old candidate rejected; returns GROUND     |
| 1040 ms | old candidate rejected; 32 m/s² impulse not reconsidered | 32 m/s² impulse starts new candidate       |
| 1080 ms | low-g sample in GROUND cannot start candidate            | new candidate can evaluate flight evidence |

With HIGH, smoothing changes entry into FLIGHT from 1080 to 1120 ms, but not confirmation. The timeout already uses milliseconds: the issue is sampling-grid alignment combined with consuming the expiry observation, not simply a timer expressed in sample counts. The offline engine's `advance` returns immediately after rejection; the corresponding Garmin timeout branch also finishes and returns. This code correspondence is not a new hardware reproduction or proof of the historical J3 HIGH miss's cause. NV2/NV4 threshold evidence remains separate.

Next bounded hypothesis: after an expired pre-flight candidate is finalized, evaluate whether the same observation may seed a new candidate, at most once. Do not call `process` twice, recursively retry, extend the timeout to fit this fixture, or silently change thresholds. Before adopting it, compare negative controls, phase-shifted impacts, candidate duplication/retention, timestamps and long-session bounds. No such fix is deployed by this audit. A future corrected implementation must deliberately update the characterization test rather than retaining the miss as desired behavior.

Validation for this diagnostic: `node --check` and `npm run check` PASS; `git diff --check` PASS. No detector code or Garmin binary changed, so no new Garmin build or hardware validation is claimed. M6 remains NO_GO; these hypothetical perturbations establish an offline robustness issue, not marine accuracy. No additional physical trial is requested.

## Structured perturbations — reproducible hypothetical matrix

Run `node tools/jump-engine/structured-stress.mjs` from the root. This fixed ACCEL_ONLY study performs 140 replays: five scenarios (no-motion, walking-like, brisk-walking-false-positive-envelope-v1, clean-synthetic-jump, j4-three-separated-controlled-hop-structure), two profiles, two thresholds and seven transformations. No personal capture inputs or automatic threshold search are accepted. Inputs remain unchanged; gyro is omitted from replay explicitly rather than manufacturing angular-rate measurements for transformed acceleration.

Transformations: identity; constant Z-axis rotation of π/3; time-varying Z rotation with angle (π/2) sin(2πt/800 ms); additive x-axis pulses of 4 or 8 m/s², width 80 ms, period 320 or 640 ms, phase zero. Pulses use half-open intervals and native synthetic milliseconds, not sample counters. These parameters are hypothetical, not calibrated bar/sea forces. Time-varying vector rotation alone omits the kinematics of a real moving wrist; rotations are algebraic sensitivity controls, not a physical wrist simulator. Transformations may change the meaning of a waveform, so deviation from its original expected count is a stress signal, not a validated physical miss/false-positive rate.

| Transformation          | Replays | Changed counts versus base fixture                                          |
| ----------------------- | ------: | --------------------------------------------------------------------------- |
| Identity                |      20 | none                                                                        |
| Fixed rotation          |      20 | none                                                                        |
| Varying rotation        |      20 | none                                                                        |
| 320 ms / +4 m/s² pulses |      20 | constructed negative confirms at 2600 mg in both profiles                   |
| 320 ms / +8 m/s² pulses |      20 | MEDIUM clean positive 1→0 and separated-hop control 3→2, at both thresholds |
| 640 ms / +4 m/s² pulses |      20 | none                                                                        |
| 640 ms / +8 m/s² pulses |      20 | none                                                                        |

The stronger pulse cases therefore expose a profile-dependent count difference even at the current 3000 mg setting. HIGH does not show those same misses in this matrix; this is not grounds to promote HIGH. The cause could involve discrete sampling, smoothing, phase/landing guards or their interaction. The generator uses the same elapsed-time pulse rule, but different rates sample it differently. Next offline diagnostic should compare decision snapshots at the affected transitions before changing filtering or sample rate. Neither threshold adjustment nor stronger dry-land hops resolves the demonstrated robustness questions.

Tests cover fixed-rotation count invariance, magnitude preservation before filtering, immutable source data, unchanged clocks, pulse boundaries in milliseconds independent of sequence number, malformed inputs and complete matrix size. `npm run check` PASS: 121 main tests plus repeated 38. Hardware and detector configuration remain unchanged; no new physical trial. Results saved during this run to `/tmp/ww-structured-stress.json` are synthetic only. Marine-data and M6 gates remain closed.

## Reproducible local tooling

The fixed audit is now executable from the repository root:

```sh
node tools/jump-engine/noise-stress.mjs
```

It reads only the synthetic catalog, accepts no capture paths or threshold-search arguments, and emits aggregate case/count results rather than raw session data. Seeds, thresholds, amplitudes, profiles and scenario selection are fixed to the study below. Generated values are cloned; original acceleration, gyro artifacts and timestamps are preserved in the input. Bounds and invalid values are checked. A zero-amplitude control preserves exact values. These are offline tooling checks, not embedded resource guarantees or calibrated physical noise.

Regression tests reproduce the three counterfactual mismatches without silently adjusting fixtures to pass. This is an audit of current behavior; a future justified algorithm change must explicitly review the recorded expectation, not preserve false detections as a product requirement. `npm run check` passes with 118 main tests and repeated 38 session tests. No Garmin code, binary, thresholds, raw captures or cloud services changed in this tooling step.

Next missing model is structured motion/context, not more independent random noise: distinguish additive sensor error, periodic impacts and wrist/bar-related orientation changes. Parameters must be labeled hypothetical until measured; changing vector direction over time is not equivalent to rotating a coordinate system once. No claim that a synthetic trajectory represents kiteboarding, and no automatic request for an on-water trial. The physical collection gate below remains closed.

2026-09-10: operator explicitly prioritizes jumps while kitesurfing in substantial motion/noise, not small dry-land hops. Dry-land tests remain transport and controlled-motion evidence only. No new physical collection, video, Woo, threshold deployment or product claim is authorized by this plan. M6 stays NO_GO. The prior technical capture included hops and is NOT a negative control.

## Offline checks completed

Compared 3000 mg baseline with the already proposed 2600 mg constructor override, keeping both threshold configuration fields consistent. The full existing catalog has 22 scenarios × two profiles. Baseline matches all 44 expected counts; the override differs in `hp2-like-late-post-event-peak-v1` under both profiles (0→1). This is a threshold-dependent regression expectation, not independent proof of a physical false positive. Do not silently rewrite that expectation or label HP2 a real negative.

Then ran a fixed synthetic stress matrix on ten scenarios: no-motion, walking-like, periodic-brisk-walking-context, arm-swing, holdout-double-impact-no-flight, brisk-walking-false-positive-envelope-v1, clean-synthetic-jump, noisy-synthetic-jump, walking-jump-walking-context, j4-three-separated-controlled-hop-structure. Both profiles, thresholds 3000/2600 mg, amplitudes 0/0.5/1/2 m/s² per axis, seeds 1/7/19: 480 replay executions total, not independent hardware trials. Zero-amplitude runs duplicate the clean controls across seeds.

Reproduction rule: use existing generateScenario; initialize UInt32 LCG state to seed for each run; for every sample and x/y/z in that order update state = (1664525 × state + 1013904223) modulo 2^32 and add amplitude × (2 × state/2^32 − 1) to that axis. Preserve original gyro, sequence and timestamps. Process the complete generated sequence with ExperimentalJumpEngine and endSession, comparing total confirmations with the existing scenario count. This is bounded additive pseudorandom perturbation, NOT measured marine noise, wrist rotation, bar loading, wave impact, clock jitter, aliasing or correlated motion.

| Per-axis perturbation bound (m/s²) | Baseline count mismatches / 60 | 2600 mg count mismatches / 60 |
| ---------------------------------- | -----------------------------: | ----------------------------: |
| 0                                  |                              0 |                             0 |
| 0.5                                |                              0 |                             0 |
| 1                                  |                              0 |                             0 |
| 2                                  |                              0 |                             3 |

The three changed cases are the constructed negative `brisk-walking-false-positive-envelope-v1`: MEDIUM seeds 1 and 7; HIGH seed 19. Each produces one confirmation instead of zero only at the lower threshold. Its aggregate-inspired synthetic provenance remains as documented in AT2_FIXTURE_PROVENANCE_AUDIT.md; these are synthetic false detections, NOT three observed false positives in water. Baseline passing this limited matrix does not establish robustness in kitesurfing.

Decision: no promotion of 2600 mg based on dry-land count improvements. It is a research hypothesis with demonstrated sensitivity in this stress model. Do not increase smoothing or require gyro simply to hide these examples; event boundaries, artifact handling and resources would need separate review.

## Required next research graph

Representative motion classes → independently labeled negatives and positive counts → phase/context feature hypotheses → frozen replay and resource checks → new independent holdout. A missing predecessor blocks downstream validation claims.

The marine study must distinguish nuisance sensor error from genuine non-jump movement; filtering cannot be presumed to remove real wave/bar/body motion without also damaging jump evidence. Classes to investigate, not already modeled or validated: ordinary riding without jumps, chop/board impacts, changes of direction, bar-hand/wrist movement, body repositioning, and takeoff/flight/landing with ongoing wrist activity. Do not infer rider airborne state from watch acceleration alone.

Priority is a reliable negative reference during representative riding, plus repeatable positives—not multiplying small indoor hops or demanding stronger jumps. No quantitative wave/noise amplitudes or sport-specific flight thresholds are adopted without evidence. No-video operator counts support only coarse trial outcomes; they do not calibrate airtime or pair every candidate to a physical jump. Long unlabeled sessions cannot become ground truth.

Before any on-water request, separately define and approve a safe capture method and finite budget. Existing eight-second manual lab capture is NOT declared suitable for water use. The user must not operate/read the watch during a maneuver to satisfy a test. Preserve bounded capture/export, timestamps, quality flags and failure reporting; automatic acquisition and any marine-specific instrumentation require implementation and verification first. Keep personal GPS/HR, raw media and device identifiers out of committed artifacts.

Timing design must continue to distinguish sampling rate from callback delivery and use supplied sensor timestamps; Garmin documents these separately in [Sensor API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html). Available APIs do not demonstrate our hardware timing accuracy or noise robustness.

Current outcome: SYNTHETIC_STRESS_RISK_IDENTIFIED; REPRESENTATIVE_KITESURF_DATA = NOT_VERIFIED; M6_WOO_VALIDATION_GATE = NO_GO. Detector remains EXPERIMENTAL, product readiness NO, height/airtime unvalidated, Woo NOT_RUN. No thresholds, hardware binaries, raw captures or backend were changed in this audit.
