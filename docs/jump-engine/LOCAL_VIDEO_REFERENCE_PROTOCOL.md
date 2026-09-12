# Local video reference — preparation, not validation

Video synchronization work is paused by operator decision. The separately scoped [no-video operator-count round](NO_VIDEO_TRIAL_PROTOCOL.md) supersedes further video collection; SYNC01 remains inconclusive and is not relabeled as jump validation.

## SYNC01 physical feasibility result — INCONCLUSIVE

2026-09-09: operator reported completion and supplied `antebrazo.mp4` locally. Logs were retrieved without deletion into `/tmp/ww-sync01-capture.RxD051/`. Strict parsing of BAK then TXT succeeded: M54BD_SYNC_01, SYNCHRONIZATION_ONLY, COMPLETED, 200 contiguous samples, normalized coverage 0–8152 ms, wall duration 8637 ms. Existing parser clock, coverage, identity and transport checks passed. This verifies acquisition, not synchronization or jump detection.

The local MP4 container is complete (24301700 bytes). AVFoundation decoded previews using its default frame tolerance after zero-tolerance extraction failed. Reported duration is 20.6725 seconds. Twenty preview frames have actual PTS approximately 0.042 through 19.039 seconds; these are coarse previews, not exact transition boundary annotations or proof of constant frame rate. They show the palm-down pose through approximately 9 seconds, rotation to palm-up around 10–11 seconds, then return around 16–17 seconds. Do not use requested frame times in place of actual PTS.

Raw acceleration, inspected without candidate decisions, contains the initial orientation change and the subsequent held pose, but no return to the initial pose before capture ends. Representative z acceleration is approximately -1000 mg initially and +800 mg near the end. Thus two corresponding transitions with surrounding stable context are not available in both streams. No offset interval was supplied, no anchor-consistency result was manufactured, and no event timing or drift claim is made. The likely practical issue is cue scheduling versus the short capture window; an exact video-to-sensor offset has not been established.

The one-attempt budget is CLOSED. Outcome: TRANSPORT_VERIFIED, TWO_ANCHOR_COVERAGE_NOT_ESTABLISHED, SYNCHRONIZATION_INCONCLUSIVE. No automatic repetition, threshold change, confusion-matrix addition, raw publication or log reset. Before any future attempt, redesign the cue schedule/capture coverage together and preregister a new budget; do not merely ask for the same movement again. M6 remains NO_GO. The handoff and planned protocol below are historical preparation records, superseded by this result.

## Current handoff — SYNC01 transfer verified, launch pending

After operator MTP reconnection on 2026-09-09, `WWJumpResearch.prg` was copied successfully into the fenix 7 `GARMIN/Apps` directory. A readback to `/tmp/ww-sync1-build.UC2yQl/readback/WWJumpResearch.prg` matched the source SHA-256 `8cd759c5ee36aa5eb4a19f5b764b7191903e7ed1ddb54dab234ec777b767536a` (144332 bytes). Transfer integrity is VERIFIED; actual watch launch and visible SYNC01 identity remain pending. No logs were deleted and no physical pilot was started. This supersedes the failed-transfer handoff below, retained as history.

2026-09-09: research source now selects `M54BD_SYNC_01`, app `0.5.1-m5.4bd-sync1`, MEDIUM, CONTROLLED_FULL_WINDOW. Visible labels are `SYNC01` and `SYNC ONLY - NO JUMP`. Required observation is eight seconds on both elapsed and delivered-sample clocks; the existing 225-sample, 12-second safety and 9500-byte export bounds remain unchanged. START during capture does not truncate it; BACK cancels. Core detector and physical thresholds are unchanged.

The experimental operator-reference model explicitly accepts `SYNCHRONIZATION_ONLY`. It is not a negative trial: no NEGATIVE_TRIAL or POST_EVENT_MARK is emitted. The host parser requires this identity, TUNING, a start reference, full coverage and valid sample clocks. Jump-reference alignment/windows reject synchronization-only evidence instead of adding it to a confusion matrix. Existing positive and negative capture identities remain supported. This does not change Canonical Session.

Validation: `npm run check` PASS, 110 main tests and repeated 38-test session suite. Sequential fenix7 and fenix7s builds and unit-test compilation succeeded. Run No Evil reported 18 passed, zero failed/errors, but runner exit was 1; logical results and process status are distinct. No new hardware performance or synchronization result exists.

Artifacts are outside Git in `/tmp/ww-sync1-build.UC2yQl/`; the deployment filename is `WWJumpResearch.prg`. Android File Transfer showed a fenix 7 and the Android phone. The attempted copy into the Garmin Apps folder returned “No se ha podido copiar el archivo”. Installation is NOT_VERIFIED; do not assume either successful replacement or unchanged on-device binary after the failed write. Re-establish the Garmin MTP connection and transfer/check the exact build before any trial. No log deletion was performed. Existing WV3 BAK/TXT remain archived locally outside Git.

### Preregistered feasibility budget — one attempt, not yet started

After successful installation and transport preflight only: one stationary, no-hop, synchronization-only attempt. A fixed camera may frame the forearm and hand closely; readable watch text and feet are not required for this synchronization pilot. Keep the elbow comfortably supported, without striking the watch or furniture. Start video before the watch countdown. During the eight-second capture, leave approximately one second still, gently turn the palm upward over roughly one second, hold for roughly two seconds, gently return over roughly one second, then remain still until automatic completion. Approximate operator timings schedule the actions only; they are not synchronization timestamps. Record past completion, keep the original local, and do not start another capture before retrieval.

Preflight must preserve existing logs and establish available export retention; old visible filenames alone are not proof of a live connection. After retrieval, require strict identity, complete contiguous samples and clean relevant clocks. Independently annotate the two entire physical transition intervals in video PTS and raw acceleration, blinded to detector candidates. If either transition is not identifiable, lacks still-state context or falls outside coverage, record INCONCLUSIVE and stop. Do not repeat automatically. Interval consistency can reject a constant-offset model; agreement alone does not calibrate it. No jump association or airtime validation is authorized by a successful feasibility pilot. Actual transition annotation and paired-clock uncertainty remain pending.

The following sections retain the earlier audit/pilot history; references there to an unchanged installed WALK NEG01 describe the pre-transfer baseline, not verification following the failed transfer.

2026-09-09: operator agreed to a future local recording of feet and watch, without face. This is not permission to upload video, use a cloud vision service, record bystanders or change Canonical Session. Existing WV budget remains closed. Detector and installed WALK NEG01 remain unchanged.

## Synchronization audit

The current view redraws COUNTDOWN/RUNNING after controller events. GO_SIGNAL is recorded at controller zero while sensor normalization starts at the first sensor sample. The visible display transition is not a calibrated sensor-zero timestamp. Latest delivered sample at a button mark can also be stale by a callback batch. Do not equate video frame time, button press, rendered GO and native sensor zero, or use a detected peak to align the reference circularly.

A video can independently establish that feet left/recontacted the ground while remaining unaligned to the sensor. Preserve that distinction. Use actual frame presentation timestamps and boundary intervals (last contact / first clear airborne frame; last clear airborne / first contact frame), not frame number divided by advertised fps. Occluded or ambiguous boundaries remain unknown. These reference intervals are not a product airtime validation.

`video-reference.mjs` only propagates supplied intervals. With no sensor-minus-video offset bound it returns VIDEO_ONLY_UNALIGNED. An explicit offset interval is not automatically calibrated: provenance and measured uncertainty must be established separately, with drift considered over the recording. Never supply an arbitrary bound simply to obtain a match.

## First pilot: framing only, no jump and no sensor trial

One short 5–10 second original video, camera fixed on a stable support, clear level area, framing both feet and the watch screen. Operator stays still and naturally shows the screen; no awkward posture to make it readable. No START, no hop and no change of wrist placement. If simultaneous readability is impossible, report that rather than changing movement. This pilot tests visibility only and supplies no synchronization or discrimination evidence. Do not repeat automatically.

Keep the original file locally outside the repository. Do not attach it to chat or upload it. Use a non-cloud-synced local folder; do not alter global phone/cloud settings automatically. Avoid face, other people, notifications and identifying surroundings. No audio is needed; do not assume existing audio or metadata has been removed. User can delete the pilot after review; no deletion is performed automatically.

Next, review original timing metadata and a minimal set of local frames using local-only tools. Feasibility gates: feet contact is visible, screen transitions can be read without changing the intended movement, timestamps are available and monotonic, and media processing stays local. If not feasible, stop for a different reference method rather than request more physical trials.

## Positive collection gate — NOT READY

Do not record a hop under WALK NEG01. Before any positive trial: configure a correctly labeled positive protocol, verify bounded raw transport and UI timing instrumentation, define the synchronization uncertainty method, pass host/Garmin tests and installation check, then preregister a separate collection budget and ground-reference annotation process blinded to candidate output. This document does not authorize or claim those actions completed. M6 remains NO_GO, detector experimental; height/airtime unvalidated and Woo NOT_RUN.

## Framing pilot review — 2026-09-09

The replacement Android file decoded locally using AVFoundation. Duration is 15.5 seconds, dimensions 1280 × 720, nominal frame rate 30 fps. Container boxes fit the file. This establishes readability of the replacement, not camera-original provenance or constant frame timing. Earlier truncated copies are superseded.

Three preview frames at reported presentation times 3, 9 and 12 seconds were inspected locally; this is not a complete frame-by-frame event annotation. Both feet and floor contact are visible. The watch is visible but screen text is too small to read. Surrounding objects constrain movement space; this framing does not establish a suitable clear area for hopping. No jump, sensor alignment or timing accuracy is inferred from these previews.

Outcome: feet framing feasible; readable watch-transition reference not demonstrated; sensor/video synchronization remains unverified. No repeat framing pilot or new physical trial is requested. Next dependency is a separately specified synchronization cue with justified uncertainty that does not require reading tiny watch text or changing the movement. Original media remains outside Git; no upload or deletion performed. Installed WALK NEG01 and the detector remain unchanged. Positive collection remains NOT READY and M6 remains NO_GO.

## Synchronization decision and bounded next loop

Source audit: `JrMotionSource.onSensorData` timestamps callback entry separately from native sample timestamps. Missing or nonmonotonic native timestamps use degraded fallback/repair. `JrController` records GO at zero and a post-event button reference against the last delivered sample. Neither callback arrival nor that sample brackets the physical button action with a demonstrated two-sided error bound. A larger screen flash alone would solve visibility, not this clock correspondence problem.

Dependency graph: observable independent cue → independently bounded video and sensor cue intervals → clock-model consistency → event association. A failure at any node blocks later claims. Candidate peaks, confirmation times and assumed human reaction delays are not allowed synchronization anchors.

Proposed next experiment, NOT IMPLEMENTED or authorized as a new physical trial: a stationary synchronization-only pilot with two separately identifiable, gentle wrist-orientation changes before and after a quiet interval, visible on video and in raw acceleration. No jump, impacts or forceful motion. The entire transition intervals, not an arbitrarily selected peak, would bound correspondence. Annotation must be independent of detector output. Before collecting, specify cue identity, ambiguity rules, export coverage and a separate attempt budget; verify the acquisition labels and boundaries. Broad, obscured or unmatched transitions remain insufficient evidence. This proposal is not a claim that wrist motion already gives a precise timestamp.

The host helper `checkConstantOffsetAnchors` accepts two to eight ordered interval pairs and intersects their possible sensor-minus-video offsets. Empty intersection returns CONSTANT_OFFSET_INCONSISTENT, never an averaged offset. Nonempty intersection means only CONSTANT_OFFSET_COMPATIBLE_NOT_CALIBRATED: correct pairing, physical correspondence, within-trial clock drift and uncertainty coverage still require evidence. Do not infer zero drift from two agreeing anchors or feed the result automatically into event matching. Synthetic tests verify arithmetic only.

Stop conditions: no identifiable independent cue, timestamp repair in relevant intervals, incomplete capture, inconsistent anchors or uncertainty too broad to uniquely associate the event. Do not widen bounds after looking at candidates to make an association pass. No further hop collection is requested by this preparation step. Current blocker: INDEPENDENT_SENSOR_VIDEO_TIME_REFERENCE_NOT_ESTABLISHED.
