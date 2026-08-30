# ADR-013: Session Engine runtime boundaries

- Status: Accepted
- Date: 2026-08-30

## Decision

The Session Engine is the wearable application core. Its lifecycle uses monotonic time, its persistence is a framed/checksum-protected bounded journal, and its adapters isolate platform APIs. Buffers and frame payloads have explicit limits. Raw full-session IMU is excluded from canonical persistence by default; motion is counted and quality-observed until a future capability proves a narrower retention need.

The watch owns primary acquisition, durability and essential live state. WindWisher owns advanced post-session analytics. The future Jump Engine remains an isolated Session Engine capability and is not implemented by M2.

## Context

ADR-003 selected offline-first framed recording and ADR-004 isolated the future Jump Engine. M1.1-B established stable callback, memory, battery and small-storage primitives, while also finding rare IMU timestamp and gyroscope anomalies. M2 requires executable boundaries and resource policies.

## Consequences

- Elapsed time never uses wall clock.
- A session is not `COMPLETED` until its final frame is read back and validates.
- Invalid tail data does not erase the valid prefix.
- Index metadata is a locator; validated journal content is authoritative.
- Automatic recording resume after relaunch is deferred; recovery produces `RECOVERED` and requires explicit finalization.
- Motion quality can be persisted, but raw motion samples are not canonical session frames.
