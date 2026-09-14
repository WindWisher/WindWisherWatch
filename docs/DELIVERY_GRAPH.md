# Application delivery graph

Audit: 2026-09-11, checkout HEAD `08eb008`, existing dirty worktree preserved.
Objective: finish the application described in PRODUCT.md, not only its jump detector.
This is a sequencing proposal, not a reduction of final product scope or a release approval.

## Latest verified delivery — 2026-09-13

PRIVATE_GARMIN_CANONICAL_ROUND_TRIP = VERIFIED_TWO_SESSIONS.
All six diagnostic export pages were recovered and checksummed. Both distinct
completed journals pass transfer framing/integrity and Canonical Session v1
validation: 64 + 52 = 116 source frames, matching the operator-reported on-device
audit count. Two private canonical files were written and independently reread
through the canonical parser. The original watch journals and logs were not cleared.
This closes the two-session diagnostic export loop, not production sync, sensor
accuracy, long-session capacity or release readiness. M6 remains NO_GO.

Next software delivery dependency: bounded sync packaging and retry/ack semantics
against the existing sync contract; authenticated mobile transport and backend
integration remain separate gates. No more page emissions or new recordings are
required for the completed export loop. The watch still has the temporary export
variant under the isolated Journey identity, not a restored recording build.

## Evidence-based state

### Mobile private inbox follow-up — 2026-09-14

The authorized local import slice is implemented in the sibling WindWisher Flutter
repository. Sessions import now opens a separate Android private canonical inbox;
it does not use the existing public-save adapter. Original bytes and identities
are preserved, with schema/CRC validation, exact-byte deduplication, conflict
rejection, bounded staging and read-back verification. See that repository's
`docs/PRIVATE_CANONICAL_INBOX.md` for implementation limits and commands.

Status: IMPLEMENTED_DART_TESTED_PENDING_ANDROID_VALIDATION. Native compilation,
picker and on-phone persistence are NOT_RUN, not inferred from Dart checks.
No backend, publishing, actual-device import, environment-file reads, commit or
push were performed. Next loop: credential-free Android validation build followed
by one grouped import/retry/rejection/reopen trial. No new watch recordings or
page emissions are required. This supersedes the read-only mobile-audit next
action below; authenticated production sync and M6 remain NO_GO.

Wire compatibility follow-up: [ADR-016](ADR/ADR-016-canonical-sync-identity-and-content.md)
records the proposed identity/content boundary. Local binding guards preserve opaque
canonical IDs and require explicitly supplied UUID mappings; no real cloud identity
was fabricated. The existing v1 schema is unchanged and lacks a canonical-stream
content type. DIRECT_CANONICAL_UPLOAD = NO_GO pending receiver agreement, mapping
persistence and a negotiated versioned profile. Next integration action is a
read-only audit of the existing WindWisher mobile/receiver contract before choosing
those cross-project details. No additional hardware trial is required.

Persistent sync follow-up: [host outbox](session-engine/PERSISTENT_SYNC_OUTBOX.md)
now persists the canonical plan, reservations, retry failures and ACKs. Synthetic
filesystem interruption tests cover reopen, uncertain sends, retry exhaustion,
chunk/final ACK commit boundaries, corruption and competing event publication.
No original session is deleted or transmitted. Next node is wire identity/content
compatibility, then mobile transport; persistence is not production sync completion.

Sync follow-up (2026-09-13): `sync-plan.mjs` implements bounded immutable local
chunks and a one-in-flight retry/ACK model; see
[local sync plan](session-engine/LOCAL_SYNC_PLAN.md). Both real canonical exports
were planned read-only in memory, with no network delivery. SyncPackage UUID
identity and canonical-stream manifest mapping remain unresolved; this model is
not a wire-compatible or authenticated SyncPort. Next software node is durable
outbox/ACK recovery. No additional physical trial is requested. The operator's
separate SurfR recording had no simultaneous WOO reference and is not paired
WindWisher validation evidence.

| Capability                             | Current evidence                                                                                                                       | Remaining delivery gate                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Offline session lifecycle and recovery | Garmin SessionEngine and Object Store adapter exist; historical M2/M3 hardware smokes; 38 host session/export tests pass in this audit | Product controls, repeated-session journey, storage saturation, hardware soak                                         |
| Time, GPS speed/distance, HR           | CoreMetricProjector and SessionDevView implemented                                                                                     | Product readability, missing-data states, representative hardware accuracy/battery                                    |
| Canonical dataset                      | Two real Garmin journals exported privately, converted, saved and read-back validated (116 source frames)                              | Production transport, representative long-session capacity, authenticated sync                                        |
| Session UX                             | `WW SESSION DEV` harness, SELECT start/stop/finalize                                                                                   | Product navigation, durable completion summary and next-session flow                                                  |
| Sync                                   | SYNC_PROTOCOL.md defines semantics; M4 report explicitly says not implemented                                                          | Bounded packaging, retry/ack tests, authenticated transport                                                           |
| WindWisher integration                 | Existing-backend boundary documented                                                                                                   | Coordinated ingestion/auth/storage and real private end-to-end verification; not audited in the other repository here |
| Jump metrics                           | Isolated experiments; recovered NV4 still missed                                                                                       | Discrimination, independent evidence and M6 gate; height/airtime unvalidated                                          |
| Forecast                               | Product/specification scope                                                                                                            | Offline snapshot consumption, age/source/expiry presentation                                                          |
| Release                                | Foundation checks and historical research evidence                                                                                     | Product device matrix, resource budgets, security, privacy and release acceptance                                     |

Evidence anchors: PRODUCT.md, ROADMAP.md, platforms/garmin/README.md,
session-engine/M4_COMPLETION_REPORT.md, specs/sync/SYNC_PROTOCOL.md,
platforms/garmin/session-engine/source/{SessionEngine,SessionDevController,SessionDevView,GarminSessionStore}.mc.
Milestone DONE is scoped to that milestone; M4 DONE does not imply on-watch export or sync exists.

## Dependency graph and proposed execution order

```text
Durable Session Engine + reliable core metrics
  |-- Ride/completion/recovery UX --> local usable vertical slice
  |-- bounded device export --> canonical package --> sync adapter
  |                                              --> WindWisher integration
  |-- isolated jump research --> M6 validation --> qualified Jump view
Cached forecast contract --> offline Forecast view
All required product branches --> hardware/security hardening --> release
```

The local vertical slice is an intermediate deliverable, not the finished application.
Propose starting Ride UX before M6; this revises execution order, not PRODUCT.md's
final Jump/Ride/Forecast scope. No fabricated jump values or automatic M6 GO.
Existing backend/no-env restrictions remain: this graph authorizes no backend
mutation, credential access, deployment, commit or push.

## First implementation loop: completion and repeat-session journey

Observed source gap: SessionDevController.onSelect handles IDLE, RECORDING and
RECOVERED only; other states return false. SessionEngine.prepare accepts IDLE only.
Therefore the current source has no SELECT path from COMPLETED to a new session
in the same controller. This is a source finding, not a newly observed device crash.

1. Specify and test the completion -> explicitly requested next-session journey.
2. Preserve the completed journal and its identity; initialize a fresh live context
   only after an explicit action. Never clear unsynchronized sessions implicitly.
3. Add state-specific action text and a stable completion summary. Do not conflate
   Back, cancellation, recovery and completion; no jump capability integration.
4. Verify normal stop, recovered finalization, second session, failed persistence
   and repeated button presses. Re-run host regressions and source guards.
5. If Garmin code changes, inspect build scripts before execution (no .env), build
   fenix7 then fenix7s and the relevant test target. Native execution remains
   NOT_VERIFIED unless it produces a logical result.
6. Installation and a bounded hardware smoke occur only after software checks and
   preservation of existing device data. No new physical jump trials are required.

Exit: repeat-session behavior and durable-data preservation are tested; hardware
status is stated separately. A failed check leads to a targeted fix, not an expanded
sensor study. This loop is planned, not implemented in this audit.

## Subsequent loops

### Loop 1 implementation update — 2026-09-11

Garmin source now offers COMPLETED -> fresh IDLE context -> explicit START, reusing
the store without deleting prior journals. Action text follows lifecycle state;
duplicate SELECT events within 750 ms are ignored. Completion elapsed time freezes
at stop (or the recovered checkpoint duration), and a failed recovered state write
now enters FAILED rather than leaving a misleading COMPLETED state.

Three native tests were added for completed journal preservation/reset, recovered
completion time and failed finalization. Existing 38 host tests and session source
guards PASS; these do not execute Monkey C. First fenix7 compile attempt is BLOCKED:
the compiler requires a signing key and GARMIN_DEVELOPER_KEY is not configured.
fenix7s/test builds are NOT_RUN pending that prerequisite; native test execution and
hardware are NOT_VERIFIED. No environment file or private-key contents were read,
no installation performed. Loop 1 is IMPLEMENTED_PENDING_NATIVE_VALIDATION, not closed.

- Storage/export: quantify persistent growth and define capacity/retention without
  silently deleting unsynced sessions; establish device-to-canonical integrity.
- Sync/integration: complete local protocol tests before requesting authority for
  cross-repository backend work. A host mock is not end-to-end verification.
- Product UX/forecast: implement quality-aware views using validated capabilities.
- Jump research: preserve known failures and negative controls. Resume only with a
  bounded hypothesis and explicit evidence budget, not as the only active workstream.
- Release: consolidate full journey, device/resource/security/privacy evidence.

Each loop records input evidence, dependency, one deliverable, checks and exit/blocker.
No completion percentage or delivery date is defensible from this audit alone.

## Audit validation

### Isolated hardware smoke handoff — 2026-09-12

The existing journey-smoke binary (122972 bytes) was copied through Android File
Transfer specifically to `Apps - fenix 7`, not the concurrently visible phone.
The resulting listing shows `WWSessionJourney.prg`, 120.1 KiB. No replacement
dialog was accepted and no existing app/log was deleted. Separate manifest identity
is `946bfa2ea3824a36a9f4fcbd1486c113`, launcher name `WW Session Journey`.
Transfer listing is VERIFIED; binary import/launch and physical behavior are pending.

One bounded stationary smoke: open the isolated app, START, wait approximately
20 seconds, STOP; confirm COMPLETED and elapsed stays unchanged after 10 seconds.
SELECT once should show IDLE; wait at least one second and SELECT to start another
20-second session, then STOP. Stop the test on FAILED/IQ crash or unexpected state;
do not repeat automatically. This checks the visible repeated-session journey,
not GPS accuracy, battery, persistent old-journal integrity or product readiness.
The physical archive-integrity check remains separate from operator UI observations.

Operator result: both sessions ended in COMPLETED. This confirms that the isolated
application launched and the two-session visible journey completed on hardware.
The operator did not separately confirm the 10-second frozen counter observation;
do not infer it. Both persisted journals have not yet been read back independently.
Status: HARDWARE_TWO_SESSION_UI_SMOKE_PASS_OPERATOR_REPORTED;
PERSISTED_TWO_SESSION_INTEGRITY = NOT_VERIFIED. No repeat trial is requested.

Read-only transfer follow-up: Android File Transfer exposes the isolated app's
WWSessionJourney.DAT (15752 bytes), IDX (472 bytes) and IMT (74 bytes). All three
were copied, without deletion, to `research/garmin/results/session-journey-check-20260912/`
and the approved Desktop/videos/session-journey-check-20260912 directory.
Both local copies match byte-for-byte and have owner-only file permissions; the
repository destination is ignored. These are binary Object Store artifacts, not
the host journal format. Existing host tooling does not decode them; their presence
and matching copies do not verify either completed session's journal integrity.
Next technical gate: a supported read-only store inspection/export path, validated
against synthetic storage before using these private snapshots. Do not infer absence
of sessions from a failed text search or request another physical recording.

Read-only audit implementation: `journey-audit.jungle` selects only the frame codec,
constants, bounded reader, dedicated audit entrypoint and its tests. It does not
instantiate the recording controller, recover sessions, register sensors, write
Object Store data or print payloads. It retains the isolated Journey app ID to read
that app's data; deployment must use the same development key and preserve the
existing backups. The normal app identity is not a target. Not installed yet.

The reader checks at most eight indexed completed sessions and 64 chunks per
session, one frame per 100-ms tick and one chunk retained at a time. It checks
chunk lengths, all frame checksums, contiguous sequence, initial/final framing and
index tail agreement. Empty, incomplete, malformed or oversized stores are not
VALID. The index is retrieved as one Object Store value before its size check;
an allocation/read failure is not a successful scan. Unindexed orphan chunks,
metric accuracy and payload-level domain semantics are outside this audit.

Audit fenix7/fenix7s and unit-test builds PASS. Run No Evil: 5/5 logical PASS,
launcher exit 1 recorded separately. Session host regression and read-only source
guard: 39/39 PASS; lint and diff checks PASS. Hardware audit remains NOT_RUN and
PERSISTED_TWO_SESSION_INTEGRITY remains NOT_VERIFIED until the device scan runs.
Next: deploy the audit variant to the isolated Journey app only, then observe
`VALID`, `VALID 2/2` and the frame count (or report the exact failure). No recording
or new movement is needed. An unexpected count must be investigated, not reset.

Audit transfer follow-up: the fenix7 audit build (99308 bytes) was copied to
`Apps - fenix 7` as WWSessionJourney.prg; listing shows 97.0 KiB. The artifact
uses the same isolated Journey identity and development signer, not the normal
Session Dev identity. The original recording binary remains locally available;
private DAT/IDX/IMT snapshots are preserved. No data files were deleted or reset.
Device import and audit execution are pending operator observation of SESSION AUDIT.

Operator audit result: `VALID 2/2`, `FRAMES 116`. The on-device read-only audit
therefore reports that both indexed completed journals passed its full frame
checksum, sequence and framing checks. Status: PERSISTED_TWO_SESSION_INTEGRITY =
VERIFIED_BY_DEVICE_AUDIT_OPERATOR_REPORTED. This is not an independent host decode,
authentication or sensor-accuracy check; orphan/unindexed data remains outside scope.
The completion -> next-session preservation gate is satisfied for this two-session
smoke. Next delivery dependency is read-only device export and canonical round-trip.

Export loop started: [Garmin transfer foundation](session-engine/GARMIN_TRANSFER_FOUNDATION.md)
implements a bounded host envelope/validator that preserves Garmin text frames
and their Adler-32 checksums. It does not pretend they are the host CRC32/JSON
journal. Synthetic round-trip and failure tests are included; actual device
transport remains NOT_IMPLEMENTED. No GPS/HR
payload is sent to logs or network, and no new physical recording is requested.
The grouped export loop now adds a transport-neutral read-only Garmin producer
and a host bridge to the unchanged Canonical Session v1. Synthetic tests cover
normal/recovered sessions, retry, malformed semantics and source preservation.
Operator protocol constraint: WindWisher and SurfR cannot record simultaneously
on the same watch. Any future same-session comparison requires an independent
reference device (WOO or SurfR on a separate compatible device). Alternating
recordings are not matched-event evidence and do not open the M6 gate.
The pending export check uses existing WindWisher journals, not a new recording.
The operator explicitly authorized temporary local plaintext GPS/HR/time export
on 2026-09-13. Keep it off Git and external services. The separate journey-export
build requires a successful two-session audit and a START press before emitting
a selected private diagnostic page. Garmin's documented ~5 KB log rotation rules
out a single unbounded dump: each page retains at most 4000 ASCII data bytes and
includes its own checksum. Collect each emitted page before moving on.
PAGE EMITTED is not host verification. The host importer
requires two distinct complete canonical-valid transfers and writes new private
files without overwriting the source. The paged binary is copied to Apps as
WWSessionJourney.prg (104.6 KiB), with a new 1-byte dedicated TXT in LOGS.
Host suite 49/49 PASS; native suite 8/8 logical PASS (launcher exit 1); both
fenix7/fenix7s export builds PASS. Actual execution/import remain pending.
Next: operator emits page 1 only, then reconnects for collection before page 2.

Page 1 collection: operator reported emission and LOGS visibility. Read-only MTP
copy is preserved at `/Users/raulmartinez/Desktop/videos/ww-session-page1-Vz8DmK/WWSessionJourney.TXT`
(directory 0700, file 0600). Source remains on the watch. Header reports page 1/6;
3862 file bytes, 3820 page payload bytes, page Adler-32 matches. SHA-256:
`cefba4e67f6a25db2a2f52d3fdb52f39e3f5549438a51ef7c02120de59519fc8`.
This verifies one page only, not complete source or canonical export. Pages 2–6
remain pending. Next action: reopen Journey, select PAGE 2/6 with DOWN, wait for
PAGE READY, press START once, then exit/reconnect after PAGE EMITTED. Preserve
both TXT and any BAK when collecting later pages; do not reset source logs.

Page 2 collection: both original log parts copied read-only into
`/Users/raulmartinez/Desktop/videos/ww-session-page2-ju5icB/` (0700 directory,
0600 files). BAK: 7709 bytes, SHA-256
`6d807594e7a5216a2019f3bc855e339cc19e47b7d60ca7630f8e9a0ab057d1ae`.
TXT: 3989 bytes, SHA-256
`154aae64d0516d60f3921972e8135c9340b29c680b56d2e4e51c899307082d7f`.
Page 2/6 contains 3934 payload bytes and passes its Adler-32 check. Assembling
BAK then TXT yields verified pages 1 and 2 with no conflicting retries; 41 frame
records individually validate. This is partial transport evidence, not a complete
canonical export. Source logs remain unchanged. Next: select PAGE 3/6 after
reopening (DOWN twice from page 1), emit once, exit and reconnect for collection.

Operator subsequently reported proceeding through page 6. A fresh read-only copy
of TXT and BAK is preserved in
`/Users/raulmartinez/Desktop/videos/ww-session-pages3-6-sk7D9W/` (0700/0600).
Both files match the page-2 collection byte-for-byte (same SHA-256 values above).
Combined contents have valid pages 1, 1 (identical retry), and 2; no pages 3–6.
Android File Transfer was restarted to refresh the device view. Do not infer that
rotation lost pages 3–6, or that the operator did not emit them: the cause is not
established. Confirm whether START and PAGE EMITTED occurred for each selected
page before requesting repeats. Full export remains incomplete; journals unchanged.

Page 3 repeat: operator explicitly reported PAGE 3/6, PAGE EMITTED and reconnect.
Both log parts were copied read-only to
`/Users/raulmartinez/Desktop/videos/ww-session-page3-9SoZv4/` (0700/0600).
BAK: 7936 bytes, SHA-256
`b73979de8cbd7f5f1f1c8d461d0ac317f08a7e3b35cfcdc78c10b150a7483029`.
TXT: 14 bytes, SHA-256
`e372b78f467f4cb7ddd7457edd4d05baee6c0711df1887083b22f5d964667f44`.
BAK followed by TXT reconstructs complete pages 2/6 and 3/6 with valid checksums;
page 3 contains 3921 payload bytes and 21 individually valid frame records.
Archived pages 1–3 have no conflicting retries. They do not yet contain a complete
transfer completion record, so canonical session validation remains pending (not
a mapping failure). Source journals/logs unchanged. Next: PAGE 4/6 only, then
exit/reconnect and retrieve both log parts before any subsequent page emission.

Page 4 collection: operator reported PAGE 4/6, PAGE EMITTED and reconnect.
Read-only copies are preserved at
`/Users/raulmartinez/Desktop/videos/ww-session-page4-kNr3U8/` (0700/0600).
BAK is unchanged from the page-3 capture (7936 bytes, same SHA-256 above).
TXT: 3878 bytes, SHA-256
`198defe71f2d4144f6d44c44041e982ad9420925683d550d35fc7085beb33eaa`.
Page 4/6: 3823 payload bytes, matching page Adler-32, 18 valid frame records.
Combining archived pages 1–4 has no conflicting retries. The first complete
session passes source-transfer validation (64 frames) and canonical conversion
and schema/integrity validation (60 canonical records). Conversion was read-only
in host memory; no canonical output file or whole-export completion is claimed.
Second session and pages 5–6 remain pending. Next: emit PAGE 5/6 only, then
exit/reconnect for collection. Watch journals and logs remain unmodified.

Page 5 collection: operator reported PAGE 5/6, PAGE EMITTED and reconnect.
Read-only copies preserved in
`/Users/raulmartinez/Desktop/videos/ww-session-page5-dNoeYR/` (0700/0600).
BAK: 7834 bytes, SHA-256
`0b43b24b9c5f582b5e9f5edb902b7e17502b4131aed18afb68b918b04b796e36`.
TXT: 14 bytes, SHA-256
`e372b78f467f4cb7ddd7457edd4d05baee6c0711df1887083b22f5d964667f44`.
BAK followed by TXT reconstructs pages 4/6 and 5/6 with matching page checksums.
Page 5 has 3930 payload bytes and 21 individually valid frame records. Archived
pages 1–5 verify without conflicting retries; only page 6 remains missing.
Next: emit PAGE 6/6 once, exit/reconnect, collect TXT and BAK, then validate both
complete sessions and write the authorized private canonical outputs. No complete
two-session export is claimed yet; original watch files remain unchanged.

Page 6 and export closure: operator reported PAGE 6/6, PAGE EMITTED and reconnect.
Read-only copies preserved in
`/Users/raulmartinez/Desktop/videos/ww-session-page6-37Wnqn/` (0700/0600).
BAK is unchanged from page 5 (7834 bytes, same SHA-256 above). TXT: 3225 bytes,
SHA-256 `ac9db7f9bc0bb9e36dcd2d153e515132ba712059c8f0086c789da803e703fadc`.
Page 6/6 has 3170 payload bytes with matching Adler-32. Archived pages 1–6 assemble
without conflicting retries; both complete source envelopes and canonical streams
validate. The private concatenated source bundle is preserved in
`/Users/raulmartinez/Desktop/videos/ww-session-bundle-EFD3wX/`.

Final output: `/Users/raulmartinez/Desktop/videos/private-session-export-AJAxlX/`.
Directory mode 0700, output files 0600; source.txt and a final VERIFIED marker are
included. Both canonical files were reread from disk and validated:

- session-1.jsonl: 64 source frames, 60 canonical records, 15469 bytes,
  SHA-256 `83b1e333dddbd353d0b2467a263d0ed8e91988a84a43f54cb7017c4b26c8ab2c`.
- session-2.jsonl: 52 source frames, 48 canonical records, 12481 bytes,
  SHA-256 `65dba7fb4ea1a254e665501e1e9a3dd2836875aa529ae410a3e12bf52ae7f789`.

Total source frames 116 matches the prior on-device audit. No raw GPS/HR/time is
versioned or printed in this report. No external upload, original-file deletion,
firmware replacement, commit or push occurred during this collection. The temporary
export variant remains on the watch. This is a completed private diagnostic transfer,
not authenticated production sync or a sensor-accuracy validation.

Next dependency: private device-to-host transport, then one grouped physical
round-trip of the two existing sessions. No new recordings are needed for this
gate. Implementation is not physical export verification or release readiness.

### Signing and native validation follow-up — 2026-09-11

With explicit operator approval, a new development-only RSA key was generated
outside Git under `~/Library/Application Support/Garmin/ConnectIQ/ww-session-dev-20260911/`.
Use `developer_key_pkcs8.der` via GARMIN_DEVELOPER_KEY; the initial DER encoding
was rejected and converted to PKCS#8. Both files have owner-only permissions.
No pre-existing publishing identity was replaced and no environment file was read.

Sequential fenix7 and fenix7s builds PASS; fenix7 unit-test build PASS.
After resolving simulator startup, Run No Evil reports
`PASSED (passed=13, failed=0, errors=0)`, including all three new journey tests.
The monkeydo process nevertheless exits 1: logical test PASS and launcher exit
anomaly are recorded separately, not represented as a clean process exit.
Hardware installation/smoke remains NOT_RUN. Current loop status:
IMPLEMENTED_NATIVE_TESTED_PENDING_HARDWARE. This supersedes the missing-key blocker
above; it does not close release, storage-capacity, controller debounce or device UX gates.

`npm run validate:session-engine`: 38/38 PASS in this audit.
No full npm check, npm audit, Garmin build, device smoke or backend check was run.
No source implementation, firmware installation or existing data deletion occurred.
M6 remains NO_GO; the application is not release-ready.
