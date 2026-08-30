# Canonical Session Dataset v1

## Status

`IMPLEMENTED` and host-verified in M4. The canonical dataset is the portable, private representation of one completed WindWisherWatch session. It is distinct from the device journal, the live state and any future backend schema.

## Envelope and ordering

The serialization is UTF-8 NDJSON: one closed JSON record per line, in ascending `recordSequence`, ending with a newline. Every record uses `canonicalSchemaVersion: "1.0.0"` and a CRC32 over its canonical JSON core. The order is:

1. one `manifest`;
2. zero or more `track`, `heart_rate` and `pressure` observations in journal order;
3. one compact `quality` record;
4. one `operational_summary`;
5. one `completion` record.

The schema is [canonical-session-record.schema.json](../../contracts/session/v1/canonical-session-record.schema.json). Session identifiers are opaque stable strings. Observation time is the non-negative millisecond offset from session start; the manifest alone carries UTC start/end anchors. Units are explicit: degrees, metres, metres per second, BPM and pascals.

## Sections and provenance

Track points preserve GPS quality, usability, source, journal sequence and timestamp provenance. Heart rate preserves source and quality. Pressure is optional and uses pascals; it is included because the M1.1 hardware work established an operational sensor path, but no altitude or jump inference is made. Raw IMU is excluded from v1 because its volume and calibration semantics need a separate versioned evidence decision.

The operational summary is explicitly `WATCH_OPERATIONAL_PROJECTION`. It preserves the M3 duration, distance and maximum-speed projection; it is not WindWisher analytics and does not invent average speed, active time, VMG, maneuvers or jumps.

## Completion rules

Only a durable source journal whose tail is `VALID` and completed can be exported. A recovered session retains its session identity and records `RECOVERED_THEN_COMPLETED`. Incomplete or corrupt source sessions are rejected. Unknown sections and unsupported versions fail closed.

## Evolution

Compatible additions require optional fields only. Semantic or required-field changes require a new schema version and migration documentation. Consumers must reject versions they do not support; they must never guess at a downgrade.
