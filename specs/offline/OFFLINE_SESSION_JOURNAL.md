# Offline session journal

Baseline design: a bounded append-only framed journal per active session. The header carries format/schema version and device/session identity. Each frame carries type, monotonic sequence, timestamp, payload length, and checksum. Periodic checkpoints summarize acknowledged durable sequence. A final checksum-covered completion record makes the journal complete.

Writes are append, flush, and platform-durable according to a measured policy. Recovery validates header and frames, truncates or quarantines only the invalid tail, resumes sequence without reuse, and records recovery quality flags. Atomic snapshot files are an alternative for tiny metadata, but rewriting a full high-rate session increases corruption and energy risk; hence the journal baseline.

Limits for frame size, buffered bytes, free-space reserve, checkpoint cadence, and retention are deferred to Sensor Lab evidence. Compaction/export may use JSON chunks or binary encoding without changing contract semantics.
