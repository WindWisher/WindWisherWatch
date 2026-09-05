# M5.4B Phase-Scoped Features and Decision Snapshot — Findings

## M5.4B-T follow-up

The terminal timestamp cause is confirmed: Garmin stop flush used the last takeoff impulse (`_stateStarted`). It now uses the latest observed normalized sample. Host checks pass (88 tests). After user authorization for temporary signing, fenix7/fenix7s builds and all 14 Garmin tests pass. Run No Evil logical PASS is recorded separately from process exit 1. No new watch binary was installed. See [timestamp integrity report](CANDIDATE_TIMESTAMP_INTEGRITY.md). Integrity is VERIFIED for tested normalized-input paths; pre-freeze decision remains MORE_DIAGNOSTIC_EVIDENCE_REQUIRED. Historic misses are unchanged.

## Status

Implementation and synthetic/Garmin verification are complete. Physical tuning is in progress; the new frozen holdout is not yet run, so M5.4B remains in progress and M6 remains `NO_GO`.

## Implemented correction

- Replaced the classifier's global peak with `takeoffPeakAccel`, frozen on flight entry.
- Preserved `flightMinimumAccel` as a flight-only feature.
- Added landing-trigger-only `landingPeakAccel` as supporting evidence.
- Isolated later acceleration in `postEventDiagnostics`.
- Added an immutable decision snapshot matching the envelope reason.
- Canonicalized the takeoff threshold to exactly 3000 mg on host and Garmin.
- Versioned the detector as `experimental-0.5-phase-scoped-envelope`.

Landing peak is not used in the envelope. The implemented envelope is:

```text
takeoffPeakAccel >= 3000 mg
AND flightMinimumAccel <= 408 mg (Garmin native threshold)
```

Existing duration, sustained-low-g, and stable-landing requirements remain separate mandatory confirmation evidence.

## Sanitized regressions

- HP1-like late peak: rejected; late peak does not modify takeoff evidence.
- HP2-like late peak: rejected for the same reason.
- AT2-like late brisk-walking peak: rejected.
- J5 and impact-only structures: rejected.
- HP3-like and HP4-like transitions: confirmed.
- J4: three separated confirmations preserved.
- ACCEL_ONLY, gyro artifact, sample-rate, determinism, and bounds behavior preserved.

These regressions verify semantics, not improved hardware recall. Historical HP1/HP2 remain M5.4 evidence and are not a new holdout.

## Verification so far

- focused host tests: PASS;
- Fenix 7 build: PASS;
- Fenix 7S build: PASS;
- Garmin Run No Evil: logical 12/12 PASS, process exit code 1;
- new hardware tuning: NOT_RUN;
- new holdout: NOT_RUN.

## New protocol identifiers

Tuning:

- `BT1`: isolated controlled hop;
- `BT2`: brisk walking negative;
- `BT3`: walking, hop, walking;
- `BT4`: brisk walking, hop, brisk walking.

Reserved for the post-freeze holdout:

- `BN1`–`BN5`: new negatives;
- `BP1`–`BP4`: new positives.

## BT1 diagnostic before parity correction

The first physical BT1 tuning trial was missed and split into two rejected candidates. The first reached landing with a 2917.19 mg takeoff peak, 358.74 mg flight minimum, 328 ms flight, and only 88 ms sustained low-g; Garmin finalized it immediately because of the short-low-g condition. A subsequent 4897.75 mg peak then opened another candidate. This demonstrated that the M5.4A short-flight finalization divergence affected candidate grouping and post-event diagnostics. During tuning, before freeze, Garmin was aligned with the host to retain short-flight candidates through the bounded stabilization window and reject them at normal finalization. This diagnostic trial is not evidence for the corrected configuration and BT1 must be repeated.

## BT1 after parity correction

The repeated physical BT1 tuning trial produced one confirmed candidate aligned with the independent operator marker: one match, zero misses, and zero extra detections. At decision time the candidate had a 3281.70 mg takeoff peak, 219.15 mg flight minimum, 3934.00 mg landing peak, 368 ms flight duration, 328 ms sustained low-g, and stable landing. A later 4221.78 mg peak was retained only as `postEventDiagnostics.peakAccelMillig`; it did not alter the immutable decision snapshot. This is direct hardware evidence that the corrected Garmin path preserves the intended phase boundary in this trial. It is one tuning observation, not holdout evidence or a product-readiness claim.

## BT2 after parity correction

The physical BT2 brisk-walking tuning trial was a true negative: 725 samples over approximately 29 seconds produced 28 rejected candidates and zero confirmations. The predeclared negative reference therefore had zero false positives. Timestamp quality was valid, with zero duplicates, out-of-order samples, gaps, or fallback/interpolated timestamps. Candidate retention and locomotion history remained at their configured bounds. This is tuning evidence only.

## BT3 after parity correction

The physical BT3 walking-hop-walking tuning trial missed the independently marked hop: zero confirmed candidates and five rejected candidates. The relevant rejected candidate had a coherent 288 ms flight, 248 ms sustained low-g, a 205.02 mg flight minimum, stable landing, and 0.99945 takeoff-to-landing direction cosine. Its frozen takeoff peak was 2954.28 mg, 45.72 mg (1.52%) below the canonical 3000 mg threshold, so the decision-time envelope correctly evaluated false under the current configuration. A later 3616.54 mg peak remained isolated in post-event diagnostics and did not retroactively alter the decision. This is a tuning false negative and evidence that the takeoff threshold lies close to the observed moving-hop boundary; it does not by itself justify a threshold change.

## BT4 after parity correction

BT4 exported a completed MEDIUM SUMMARY_ONLY trial with 225 observed samples, six rejected candidates and zero confirmations. The operator-declared hop was missed. Candidate 3, temporally compatible with the marker window, had takeoff peak 2702.94 mg, flight minimum 623.68 mg, landing peak 1685.37 mg, 128 ms flight and only 40 ms sustained low-g. Landing was stable; the later 6637.98 mg peak remained in post-event diagnostics. Unlike BT3, lowering only the takeoff threshold would not satisfy the recorded flight evidence. SUMMARY_ONLY contains no exported samples, so it cannot establish whether phase segmentation missed the actual physical flight or support host sample replay. Candidate identity relative to the physical hop remains an inference.

Timestamp anomaly counters were zero. Callback processing mean/max were 65.33/82 ms; the histogram overflow bucket permits no numeric p95 estimate. There were 149 gyro outliers. Retained traces numbered six and locomotion history used its eight-entry capacity; this short trial does not prove long-session memory stability.

### Operator timing correction for subsequent tuning

Earlier BT3/BT4 instructions incorrectly suggested waiting 2–3 seconds after landing before marking, despite a 2500 ms look-back window. BT3 candidate 3 ends at 5368 ms (5408 ms with sample tolerance), before its reference window begins at 5652 ms. Its association with the physical hop is therefore inferred, not independently aligned; zero detections still establishes a trial-level miss under the operator-declared event count. BT4 candidate 3 overlaps its reference window beginning at 4628 ms, but is rejected. Preserve both original results and matching policy. For the next BT4 repetition, mark promptly after safe landing while continuing to walk, then allow the automatic two-second capture tail to finish. Keep the existing detector configuration to assess repeatability before considering threshold changes. M6 remains NO_GO.

## BT4 repetition with prompt operator marking

The next BT4 MEDIUM SUMMARY_ONLY repetition observed 200 samples, one confirmed candidate and six rejected candidates. Candidate 5 matched the independent marker under the unchanged matching policy: one match, zero misses and zero extra confirmations. Its takeoff peak was 3471.97 mg, flight minimum 328.61 mg, landing peak 1577.28 mg, flight duration 288 ms, sustained low-g 248 ms, and landing was stable. Post-event peak was 3337.64 mg. Direction cosine was -0.2329; this successful envelope decision must not be described as evidence of directional coherence. The reference window was 3604–7135 ms and the tolerance-expanded candidate interval was 6184–6552 ms.

Both BT4 trials remain in the tuning record: one miss and one matched detection. This repetition cannot establish that the operator instruction correction caused the detection change because the measured motion features also changed. Timestamp sample anomaly counters were zero; callback mean/max were 68.875/85 ms, with p95 unresolved in the overflow bucket. Gyro outliers numbered 98. No sample replay is available from SUMMARY_ONLY.

An additional diagnostic issue remains: rejected candidate 6 reports endMilliseconds 7864 despite takeoff 7984 and landing 8152. This does not change candidate 5's observed match, but requires review of end-of-capture timestamp semantics before claiming robust timing or freezing. M6 remains NO_GO. Next tuning observation is a BT3 repetition with prompt post-landing marking and unchanged detector configuration; preserve its earlier miss.

## BT3 repetition with prompt operator marking

The repeated BT3 MEDIUM SUMMARY_ONLY trial observed 250 samples and produced one confirmed candidate and nine rejections. Candidate 8 matched the operator reference: one match, zero misses and zero extra detections. Its decision snapshot recorded takeoff peak 3705.44 mg, flight minimum 299.66 mg, landing peak 2963.56 mg, 368 ms experimental flight duration and 208 ms sustained low-g, with stable landing. The post-event peak remained separate at 3016.14 mg. The reference window was 5652–8848 ms and the tolerance-expanded candidate interval was 8112–8560 ms. Direction cosine was 0.64757. Sample timestamp anomaly counters were zero; callback processing mean/max were 72.10/114 ms, with p95 unresolved. Gyro outliers numbered 118, and eight candidate traces were retained. No host sample replay is possible from this summary capture.

The current post-correction tuning record contains BT1 one matched hop, BT2 one negative trial without confirmations, BT3 one miss plus one matched hop, and BT4 one miss plus one matched hop. These are three detections among five operator-declared positive trials, with the documented timing limitation in the first BT3 reference. Repetitions do not replace failures, and different motion features prevent attributing improved detection solely to earlier marking. Freeze and new holdout remain pending, including review of the BT4 terminal-candidate timestamp inconsistency. No further physical repetition is prescribed until that review and the tuning decision are complete.

```text
M5_4B_STATUS = IN_PROGRESS_HARDWARE_TUNING
ROOT_CAUSE_CORRECTION = IMPLEMENTED
PHASE_SCOPED_FEATURES = VERIFIED_SYNTHETIC_AND_GARMIN
DECISION_SNAPSHOT = VERIFIED_SYNTHETIC_AND_GARMIN
HOST_GARMIN_DETECTOR_PARITY = MATCHED
M6_WOO_VALIDATION_GATE = NO_GO
M6_BLOCKER = FALSE_NEGATIVE_STABILITY
```
