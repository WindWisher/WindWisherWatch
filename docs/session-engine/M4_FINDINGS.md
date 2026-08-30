# M4 findings

## Status

`COMPLETE` for the canonical dataset and host developer-export foundation.

Canonical Session Dataset v1 is implemented as schema-validated NDJSON with deterministic record ordering, per-record CRC32, whole-stream CRC32, explicit completion and private-data classification. The exporter reads only completed valid journals, preserves session identity and M3 operational metrics, and never mutates durable source bytes. Export, parser and inspector are incremental and bounded by journal chunk/record size rather than session duration.

Host tests verify normal and recovered sessions, deterministic retry after interruption, no-heart-rate/no-pressure-capable sections, degraded quality representation, bad checksum, truncation, duplicate sequence, unsupported version, unknown section and safe inspection. A four-hour synthetic session produced 4,326 canonical records and 1,407,743 bytes with 2,881 track points and 1,441 heart-rate points. The resulting `SYNTHETIC ENGINEERING ESTIMATES` are 1,081.5 records/hour, 351,935.75 canonical bytes/hour, 260,831.25 track bytes/hour and 90,685 heart-rate bytes/hour. These are not hardware storage, throughput or battery claims.

The existing WindWisher backend and Supabase project remain the planned destination. No networking, Supabase dependency, database migration, authentication, synchronization, Jump Engine, product UI or advanced analytics was added. Pressure is optional raw input in pascals; IMU and inferred altitude/jump metrics are absent.

No Garmin source changed, so Garmin builds and physical export smoke were not necessary for this host-only foundation. On-device Garmin export is `NOT_IMPLEMENTED`; hardware export behavior, device I/O throughput and battery impact are `NOT_RUN`. Those labels must not be promoted from the virtual soak.
