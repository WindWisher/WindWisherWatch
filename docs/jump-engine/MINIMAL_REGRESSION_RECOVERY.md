# Minimal regression evidence recovery — preparation only

Status: **PROTOCOL_PREPARED / PHYSICAL_COLLECTION_NOT_READY / NOT_STARTED**.
The operator confirmed there is no backup of the missing originals. These will be new trials, not reconstructed NV/WV results and not a fresh detector-validation holdout. No video, Woo, kitesurf, detector tuning, deployment or log reset is authorized by preparing this protocol. M6 remains NO_GO.

## Bounded questions and proposed trials

| Trial | Operator reference                                                    | Specific question                                                                       |
| ----- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| R0    | Eight seconds stationary; zero hops                                   | Is full-window export intact, and does a stationary negative produce a confirmation?    |
| R1    | Eight seconds of comfortable arm swings, feet on the floor; zero hops | Does a non-jump arm-motion negative produce a confirmation?                             |
| R2    | One comfortable small hop in place during RUNNING, otherwise still    | Can baseline and future offline models preserve the same complete positive-count trial? |

Clear, level space and comfortable motion only. No increasing jump height, violent swings, impacts, walking jumps, water or maneuvers to obtain a detection. Stop for discomfort or uncertainty. These are short instrument/regression controls, not estimates of kitesurf precision, recall, height or airtime. One trial per class cannot establish reproducibility.

Proposed budget: three attempts total, including invalid recordings. No automatic retries or fourth trial. R0 also serves as the transport check: if it crashes, lacks COMPLETED or fails full coverage, stop and diagnose; do not proceed to R1/R2. Preserve a detector miss or false confirmation without tuning between trials. A deviation or uncertain operator count is INCONCLUSIVE, never a relabelled pass. Review the three-trial block as one frozen baseline before proposing any further collection.

Operator effort estimate: roughly 10–15 minutes for the complete block including disconnection, reconnection and transfers, after technical preflight is ready. Actual motion is 24 seconds total. This is an estimate, not a timing guarantee; access/build/transfer failures pause the block rather than adding attempts.

## Preflight gate — must be closed before asking the operator to record

1. Verify which binary is actually installed, its hash, sensor profile and full-window limits. Source currently declares novideo2 / NV_HOP; source state is not installation evidence.
2. Resolve its ONE HOP / NV_HOP labeling before using it for R0/R1. Require a neutral count-only capture protocol and matching parser support, or an explicitly reviewed reference mapping. Do not silently record a negative under positive instructions. No firmware edit or install is performed in this preparation step.
3. Freeze the baseline detector configuration and use MEDIUM. No rejected experimental hypothesis is deployed. Any later capture-only change requires focused tests/build verification before installation.
4. Primary destination: `research/garmin/jump-engine/results/recovery/`, already covered by Git ignore rules. On 2026-09-11 the operator selected `/Users/raulmartinez/Desktop/videos` for the second copy; the directory exists. Keep captures in a dedicated `windwisher-watch-recovery/` subdirectory with unique per-attempt directories, without modifying existing videos. This selects a destination, not a verified backup: no captures have been copied or hash-checked there yet. Do not auto-enable cloud sync or assume that a second folder provides independent disk-failure protection.
5. Verify file-transfer access, capacity, original-log preservation, recording start/end cues, and the operator's approval to execute this bounded block. Until then: **do not record**.

## Archive before analysis, never clear automatically

For each attempt, retain BAK and TXT byte-for-byte in a new uniquely named directory. Never merge trials or reuse names to overwrite previous attempts. An empty TXT is also preserved alongside BAK. Retain failed/incomplete attempts separately rather than only keeping successful detections.

`tools/jump-engine/archive-recovery.mjs` provides a local archive primitive. It snapshots both source files, writes exclusively with private file permissions, checks SHA-256 readback and writes a manifest with the operator-declared hop count, byte counts, digests and coverage status. Parsing occurs after preservation: invalid logs remain archived. It does not print raw samples, scan devices, infer labels, modify source logs or authorize clearing them. Temporary destinations (including symlinks into temporary storage) are rejected. The destination's parent must already exist so its real location can be checked.

This is a single local archive, **not an independent backup**. Its manifest explicitly records `independentBackupVerified: false` and `sourceClearingAuthorized: false`. Before any later log reset, verify a second copy against the same hashes at the approved backup location and recheck the primary manifest. No cleanup/reset automation is included. If preservation, verification or backup fails, keep the original logs and stop further recording to avoid overwriting evidence.

Coverage requires COMPLETED, equal observed/exported counts, zero drops, sequence zero and contiguous sequences, normalized time zero and a valid timeline. Coverage eligibility is not motion quality, operator-label validity or jump accuracy. Preserve recorded metadata unchanged; store any operator correction/deviation separately. Operator counts remain independent of detector outputs and do not identify exact takeoff/landing times.

## Current handoff

2026-09-11 transport preflight: macOS Accessibility exposed the Android File Transfer `fenix 7` window despite the USB enumeration not listing Garmin. UI drag-to-Finder copied the two existing logs without clearing them. Copies are preserved in `research/garmin/jump-engine/results/recovery/preflight-20260911/` and the approved Desktop destination `videos/reloj-preflight-20260911/`; SHA-256 matches between local copies (BAK 5182 bytes, TXT 2408 bytes). This is same-volume redundancy, not independent disk protection or a device-side hash verification. Both original filenames remain visible in the watch UI after copying.

The latest parsed capture reports novideo2, MEDIUM, schema 1.3.0 and complete 200/200 sample coverage with no coverage issues. This establishes the recorded capture's version, not the hash/version of the currently installed binary. Subsequent exact experiment-ID matching against `NO_VIDEO_TRIAL_PROTOCOL.md` identifies it as the historical NV4 trial, for which the operator reported one hop during RUNNING. This reference comes from the existing operator report, not detector output. No new R0/R1/R2 trial occurred. Only NV4 is recovered; the rest of the missing archive collection is not thereby restored. Do not reset source logs or infer detector accuracy from coverage.

Fresh ACCEL_ONLY offline replay of recovered NV4 processes all 200 samples in the baseline, sustained segmentation, persistent impulse and periodic-background variants. Each produces zero confirmed and two rejected candidates. This reproduces the historical reported-hop miss, with no improvement from those variants; candidate-to-physical-event timing remains unverified. The flight-bearing candidate's takeoff peak is approximately 25.93 m/s², below the existing 3000 mg gate. No threshold is changed and no rejected hypothesis is promoted. NV4 now supplies one real missed-positive regression input, not a positive-detection preservation control or a negative control.

Prepared: bounded protocol, persistent-destination policy, operator-selected second-copy location and exclusive/hash-verified archive primitive with synthetic tests. Pending: second-copy creation and verification when capture inputs exist, neutral capture labeling and installed-binary verification, preflight/build checks if needed, explicit recording start approval. No physical trial has begun; the detector-resolution objective remains incomplete.
