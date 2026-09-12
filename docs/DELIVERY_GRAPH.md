# Application delivery graph

Audit: 2026-09-11, checkout HEAD `08eb008`, existing dirty worktree preserved.
Objective: finish the application described in PRODUCT.md, not only its jump detector.
This is a sequencing proposal, not a reduction of final product scope or a release approval.

## Evidence-based state

| Capability                             | Current evidence                                                                                                                       | Remaining delivery gate                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Offline session lifecycle and recovery | Garmin SessionEngine and Object Store adapter exist; historical M2/M3 hardware smokes; 38 host session/export tests pass in this audit | Product controls, repeated-session journey, storage saturation, hardware soak                                         |
| Time, GPS speed/distance, HR           | CoreMetricProjector and SessionDevView implemented                                                                                     | Product readability, missing-data states, representative hardware accuracy/battery                                    |
| Canonical dataset                      | Host exporter/parser and integrity tests implemented                                                                                   | Read-only extraction/export from Garmin; physical round-trip; not production transport                                |
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
