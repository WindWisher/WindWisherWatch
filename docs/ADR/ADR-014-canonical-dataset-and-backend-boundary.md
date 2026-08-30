# ADR-014: Canonical dataset and shared backend boundary

- Status: Accepted
- Date: 2026-08-30

## Decision

Completed watch sessions cross platform boundaries as versioned canonical NDJSON, independent of the durable device journal and of any database schema. Export is read-only, incremental and outside stop/recovery. The eventual destination is the existing WindWisher backend and Supabase project through a future adapter; the watch has no direct Supabase dependency and no separate database is planned.

## Consequences

Wearable code remains offline-first and backend-agnostic. WindWisher can evolve storage while preserving canonical semantics and provenance. Text serialization costs more bytes than a binary format, and CRC32 is corruption detection rather than authentication. Backend schemas, auth and synchronization remain deliberately deferred.

## Rejected alternatives

- Exporting the internal journal would couple consumers to crash-recovery implementation details.
- One monolithic JSON document would require session-sized materialization.
- Direct watch-to-Supabase coupling would mix recording with networking/auth concerns.
- A new watch database would duplicate ownership and operational infrastructure without evidence.
