# ADR-016: Canonical sync identity and content compatibility

- Status: Proposed; local compatibility guards implemented, receiver agreement pending.
- Context: Canonical Session v1 preserves opaque Garmin session IDs. SyncPackage v1
  requires UUID session/device IDs and has no canonical-stream manifest content type.
  A successful local canonical export is not proof of wire compatibility.
- Proposed decision: preserve original canonical bytes and identity. A trusted
  integration adapter supplies an explicit mapping from local device/source session
  to registered device/session UUIDs. Persist that mapping before network use; changes
  require a new idempotency namespace. UUID syntax alone is not account authorization.
- Content decision pending: agree a separately versioned canonical-stream profile
  with the existing receiver, including original identity, whole-stream checksum,
  chunk sequence/total/size and completion semantics. Require explicit supported
  version negotiation; older receivers must not accept it accidentally.
- Alternatives rejected locally: relabeling the stream as diagnostics or summary;
  coercing/truncating source IDs into UUIDs; editing Canonical Session v1; silently
  widening the accepted enum in the existing frozen v1 contract.
- Not decided: receiver-assigned versus client-allocated registered UUIDs, account
  binding, profile version number, server storage model and mobile API. These require
  inspection/coordination with the existing WindWisher integration, not invented
  backend ownership or a separate database.
- Implementation: `sync-compatibility.mjs` validates a supplied mapping and retains
  the original immutable plan. Its binding digest is local metadata, not a wire key
  or authentication credential. It is not yet persisted in the existing outbox;
  transport remains blocked until mapping persistence and negotiated profile exist.
- Boundary: no cloud calls, credentials, firmware changes or new physical trials.
  No real mapping was invented for the two private hardware exports.
- Acceptance gate: receiver agrees identity ownership and a versioned content
  profile; conformance tests validate both sides, including old-version rejection,
  identity conflict, full-stream integrity and final durable ACK. Then integrate
  trusted bindings and the persistent outbox with the mobile transport.
