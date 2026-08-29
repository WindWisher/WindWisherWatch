# Sync protocol

The domain depends on a `SyncPort`, never a vendor SDK. A producer creates bounded, immutable packages with session/device identity, protocol and schema versions, sequence/total, manifest, payload checksum, idempotency key, compression, encryption-in-transit metadata, and source platform.

Retrying the same authenticated `(deviceId, idempotencyKey)` and checksum is safe and returns the recorded acknowledgement. The same key with different bytes is a conflict. Packages may arrive again but must not create duplicate sessions/events. Sequence acknowledgement enables restart after interruption; final session acknowledgement occurs only when required manifest content is complete and integrity checks pass.

Unsupported major protocol/schema versions, checksum mismatch, unsafe size, malformed manifest, unauthorized device/session, or inconsistent totals are rejected without partial canonical mutation. Transport ordering is not trusted. Standard authenticated TLS protects transit; application encryption, if later required, needs a separate threat model and ADR.
