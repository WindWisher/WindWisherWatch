# Canonical developer export

M4 supplies a host reference exporter, incremental validator/parser and safe inspector. It operates only after completion through a read-only store descriptor. It does not run in `stop()`, checkpoint, recovery, sensor callbacks or rendering paths.

## Why NDJSON

NDJSON was chosen over one large JSON document because it supports bounded parsing, sequential writes, interruption without source mutation and line-level diagnostics. A binary format would be smaller but less inspectable and would add tooling/versioning cost before a measured need exists. The tradeoff is textual overhead; the four-hour synthetic soak records the actual size in `M4_FINDINGS.md`.

## Commands

Validate all M4 host behavior:

```sh
npm run validate:session-engine
npm run guard:session-engine
```

Inspect a developer export without printing location or health samples:

```sh
npm run inspect:canonical -- path/to/session.ndjson
```

The inspector reports only session id, completion state, duration, section counts, schema version and checksum status. Exports are private developer artifacts and must not be committed.

## Resource model

`MemorySessionStore.exportDescriptor()` copies only bounded metadata, the start frame and final frame, then exposes a chunk iterator. `CanonicalSessionExporter.lines()` parses one bounded journal chunk and emits one record at a time. `writeTo()` honors writable-stream backpressure. The parser bounds every line to 16 KiB and does not retain observations unless a caller deliberately does so.

Retry starts a fresh deterministic read. Cancellation or destination failure does not alter source bytes, completion metadata or session identity. No resumable partial-file protocol is claimed in v1.

## Platform status

The host reference path is `VERIFIED`. A Garmin on-device file picker/export UI is `NOT_IMPLEMENTED` and hardware export is `NOT_RUN`; no Garmin runtime code changed in M4. This avoids introducing long post-session work without measured device evidence.
