# Garmin journal transfer foundation

Current status: CONNECT_IQ_PHONE_TRANSPORT_IMPLEMENTED_AND_SIMULATOR_TESTED /
PHYSICAL_ROUND_TRIP_NOT_VERIFIED.
On 2026-09-13 all six pages were assembled, both canonical sessions were written
privately on the Mac and reread through the validator: 116 source frames in total.
Earlier NOT_RUN statements below describe the preceding preparation stages and
are superseded for this specific two-session diagnostic round-trip only.
This is a private intermediate transfer envelope, not Canonical Session v1 and
not a decoder for proprietary DAT/IDX/IMT files. No watch data is changed.

The inspected Garmin SeFrame uses ASCII scalar payload strings and Adler-32 over
`WWJF|1|sequence|frameType|payload`; the host journal uses typed JSON and CRC32.
Passing the former directly to the M4 exporter would lose or invent semantics.
`tools/session-engine/garmin-transfer.mjs` preserves the Garmin frames without
mapping them prematurely. It accepts only the current printable ASCII payload
profile; future encodings require explicit support, not guessed checksums.

Transfer version 1 has one manifest (opaque sessionId), ordered frame envelopes
and one completion record. The completion contains frameCount and a rolling
Adler-32, seeded with `WWSE_TRANSFER|1|sessionId\n`, followed by each canonical
frame plus newline. This detects accidental session-label changes, truncation,
corruption and ordering mistakes, but is NOT authentication. No transport/auth
security claim follows from checksum agreement.

The parser returns data only after verifying the entire envelope: a start at
sequence zero, contiguous sequences, valid per-frame checksums, a single terminal
final frame, matching count and stream checksum. Unknown fields, versions/types,
extra trailing records and missing completion fail closed. The encoder checks
individual frames; the parser remains the full-envelope acceptance gate.

Initial bounds: 1024 frames, 512 payload characters and 4096 bytes per input line.
The host retains up to that explicit frame bound; this is not a streaming
unlimited-session implementation or a production four-hour capacity claim.
Caller must supply bounded lines; no filesystem loader/network command is added.
GPS/HR/time may occur in original payloads, so all output is private telemetry.
Only synthetic values occur in versioned tests. The codec itself logs nothing.

Verification covers deterministic round-trip, input immutability, Adler-32 known
vector/incremental composition, changed bytes, duplicate/reordered/missing frames,
cross-session relabeling, malformed framing, unknown encodings and the exact
capacity limit. This checks the proposed host protocol, not an actual device export.

The transport-neutral `SeTransferProducer` reads the audited storage port,
retaining one chunk and one pending line. Repeated reads return the same pending
line until acknowledged. EXHAUSTED means local iteration ended, not remote receipt.
The caller must supply a stable completed journal.

The session app now exposes a bounded Connect IQ phone protocol through
`Communications.registerForPhoneAppMessages` and `Communications.transmit`. The
phone explicitly requests an inventory and then downloads one completed journal
line by line. Every line remains pending until its exact acknowledgement; duplicate
requests and acknowledgements replay the same response, out-of-order acknowledgements
fail closed, and abort never deletes the source journal. Inventory includes at most
32 validated completed sessions and only the metadata required to let the user decide
whether to download. The app does not make web requests or upload to a backend.

The transmitted payload remains `garmin-frame-envelope-v1`, not Canonical Session
v1. The mobile receiver must assemble and fully validate this envelope, then run the
existing explicit Garmin-to-canonical mapping before offering upload. Directly
treating transport lines as a user session remains forbidden.

`garmin-canonical.mjs` maps the current scalar payloads through the existing M4
exporter and validates Canonical Session v1 before returning output. It preserves
source frames, GPS quality and platform HR provenance; no device model is inferred.
Unexplained recovery quality counts remain UNCLASSIFIED_SOURCE_QUALITY. Invalid
coordinates, HR, counts, duplicate fields and nonmonotonic sample times fail closed.
This conservative bridge does not certify every checkpoint/runtime field. It uses
the existing exporter version and reports its own mapping version separately.
Synthetic tests cover normal/recovered sessions, nullable speed, source preservation,
determinism, malformed semantics and truncated-transfer retry. Real device-to-host
canonical round-trip remains NOT_RUN; this is not an installed export feature.

Next bounded loop: implement the matching mobile request/acknowledgement client and
route its fully validated envelope through the existing canonical converter.
Do not emit GPS/HR frames into ordinary diagnostic logs: retention and disclosure
must be resolved first. Then validate physical round-trip and map Garmin payload
fields to the existing canonical exporter with explicit quality/provenance.
Missing fields must not be fabricated. No Canonical Session schema change,
backend work, sensor acquisition, detector change or automatic recording is included.

## Connect IQ phone transport verification — 2026-09-16

- Main session app builds for fenix7 and fenix7s: PASS.
- Native simulator: 12/12 logical PASS, including four protocol tests for verified
  inventory metadata, retry-stable download lines, completion retry and rejection of
  invalid/out-of-order requests.
- Full repository check: PASS (180/180 aggregate tests and 61/61 session-engine
  tests); formatting, lint, contracts and all source guards PASS.
- Phone-to-watch discovery, physical transfer, Android envelope assembly, canonical
  conversion and ingestion: NOT_RUN. No firmware was installed and no watch journal
  was modified or deleted during this implementation loop.

## Grouped verification — 2026-09-13

- `npm run check`: PASS; `git diff --check`: PASS.
- Session-engine host suite: 46/46 PASS.
- Sequential fenix7 and fenix7s audit builds: PASS; unit-test build: PASS.
- Native simulator: 7/7 logical PASS, including producer retry, read bounds,
  corruption and the host-computed rolling checksum vector 4267821037.
- `monkeydo` still exits 1 despite logical PASS; this is not a clean launcher exit.
- No firmware installed, no private session read/exported and no device data changed
  in this grouped implementation loop. Physical transfer remains NOT_RUN.

## Authorized temporary MTP export follow-up

The operator subsequently approved local plaintext export. `journey-export.jungle`
is a separate temporary entrypoint, retaining the isolated Journey app ID and
signer. It audits exactly two completed journals before enabling START. It emits
one selected bounded page into the dedicated WWSessionJourney.TXT log;
no journal writes, recovery, recording or network permissions are included.
PAGE EMITTED only means emission calls completed, not durable delivery.
The installed SDK documents rotation at approximately 5 KB, replacing the prior
BAK. Therefore each page contains at most 4000 ASCII data bytes plus a small
header/footer, and must be retrieved before the next page is emitted. DOWN selects
the next page after reopening (default page 1). Page preparation replays the stable
two journals in sorted session-ID order and retains only the selected page.

`private-export-import.mjs <copied-log> <private-output-parent>` requires exactly
two distinct complete transfers and canonical validation before creating output.
The input read is bounded to 10 MiB, symlinks are refused, output directories use
0700 and exclusive files use 0600. Repeated imports create separate directories.
Only counts and the output directory appear on stdout. A VERIFIED marker is written
last; directories without that marker are not complete imports. No automatic
deletion occurs. Raw envelopes containing extra, duplicate or partial runs fail
closed. For paged captures, complete checksummed pages are assembled by number;
identical overlapping pages are accepted, conflicting retries are rejected, and
every page is mandatory. Rotated fragments outside complete pages are not evidence.
Preserve the original TXT and BAK captures, including fragments, rather than editing
them to obtain a passing result.

Follow-up checks: 49/49 host session tests PASS, source guards PASS, sequential
fenix7/fenix7s export builds PASS. The fenix7 export binary was copied as
WWSessionJourney.prg (104.6 KiB in MTP listing, 107100 local bytes). Pagination
native regression passes: 8/8 logical simulator PASS, with the same launcher exit-1
anomaly. The initial unpaged artifact was superseded before operator execution.
WWSessionJourney.TXT was newly created in LOGS (1 byte); no existing log was reset.
Device execution and actual host
import remain pending operator action. This temporary diagnostic route is not
production sync, authenticated transport or a replacement for the mobile adapter.

Next operator action: open WW Session Journey, wait for PAGE READY / PAGE 1/N,
press START once, wait for PAGE EMITTED, exit and reconnect. Do not advance to
page 2 before page 1 has been retrieved. Report N to establish the exact bounded
collection count. These are read-only exports, not new sensor trials.
