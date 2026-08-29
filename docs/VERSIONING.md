# Versioning and compatibility

## Independent version axes

- `schemaVersion` uses semantic versioning for each persisted contract. Major means incompatible shape/meaning; minor adds documented backward-compatible capability; patch clarifies or tightens without rejecting previously valid intended data.
- `syncProtocolVersion` uses semantic versioning for negotiation, sequencing, acknowledgement, retry, limits, and conflict behavior. It changes independently of payload schemas.
- `algorithmVersion` is an immutable lowercase identifier for implementation plus material configuration, for example `jump-engine-height-v1`. Any change capable of changing output receives a new identifier; algorithm results are not silently rewritten.
- Platform `appVersion` follows each native release lifecycle and records the producer implementation. It does not imply contract or algorithm compatibility.
- Local journal `formatVersion` will version framing/encoding independently in M2.

## Reader and migration policy

Producers emit one declared version. Readers reject unsupported major versions before mutation, validate all content, and migrate through explicit deterministic steps. Minor compatibility is never inferred solely from SemVer: the supported matrix and fixtures are authoritative. Original packages remain immutable for diagnosis until retention policy permits deletion.

A breaking contract change requires a new versioned path and `$id`, ADR, migration specification, old/new fixtures, compatibility tests, protocol impact assessment, and coordinated backend/platform rollout. Generated native models are derived artifacts and never the source of truth.
