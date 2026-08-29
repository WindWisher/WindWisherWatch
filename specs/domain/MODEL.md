# Common domain model

## Classification

Every persisted value is classified as:

- **Observed:** timestamped sensor/platform evidence, such as GPS position, ground speed, or heart rate.
- **Derived:** calculated value, such as distance aggregate or jump height. Derivations require immutable algorithm version, confidence where meaningful, and quality flags.
- **Metadata:** identity, versions, capability profile, provenance, state, and synchronization information.

Identifiers are opaque UUIDs generated locally. Instants are UTC RFC 3339 strings; durations are integer milliseconds; distances/heights are meters; speeds are meters per second; headings are degrees in `[0,360)`; heart rate is beats per minute. Ordering uses timestamps plus monotonic sequence where available because wall clocks can jump.

## Session aggregate

`Session` is the consistency boundary for one recording. It references a device, sport, optional user/spot, times, lifecycle, private-by-default visibility, observed/derived summaries, quality summary, algorithm metadata, and independent sync status.

Valid recording transitions:

```text
prepared -> recording
recording -> paused | stopping
paused -> recording | stopping
stopping -> completed
prepared | recording | paused | stopping -> recovered | corrupted
recovered -> stopping | corrupted
completed -> corrupted (only when later integrity verification fails)
```

Terminal `corrupted` data is quarantined rather than deleted. `completed` means locally finalized, not synchronized. Sync transitions are `not_ready -> pending -> syncing -> synced`; `syncing -> pending | failed`; `failed -> pending`; and a corrected/recovered completed session can move from `not_ready` to `pending`. Sync state never drives recording state.

## JumpEvent

Observed data: event timestamps, optional positions, and observed takeoff/landing ground speeds. Derived data: height, airtime, and horizontal distance estimates. Metadata: IDs, sequence, schema/algorithm versions, confidence, quality flags, capability/strategy provenance, and optional sensor-source summary. Missing estimates are omitted, not encoded as zero.

## Compact streams

`TrackPoint` and `HeartRateSample` define semantic items, not physical persistence. Implementations may store bounded JSON chunks, binary/framed files, compact columnar/protobuf-like encodings, or backend rows. A point-per-Postgres-row design is not assumed. Encoding choices must preserve units, order, version, integrity, and migration ability.

## Quality

Quality flags are conservative, composable machine-readable enums. Absence of a flag is not proof of high quality. Summary coverage reports sample counts and degraded intervals. Confidence must never conceal missing evidence and should be empirically calibrated before product claims.
