# Persistent local sync outbox

Status: IMPLEMENTED_HOST_ADAPTER / SYNTHETIC_FILESYSTEM_TESTED.
REMOTE_DELIVERY = NOT_RUN. MOBILE_INTEGRATION = NOT_IMPLEMENTED.

Validation: session-engine suite 58/58 PASS (six new persistent-outbox tests),
repository ESLint PASS, `git diff --check` PASS. No Garmin build was needed:
firmware did not change. No full `npm run check` or live transport test was run
in this loop.

`sync-outbox.mjs` wraps the local scheduling model without changing Canonical
Session v1, wire contracts, Garmin firmware or the backend. It saves a private copy
of a validated canonical stream and reconstructs exactly the same plan on reopen.
No originals are changed. Each method persists its result before returning success.

## Commit and recovery

Plan and events use exclusive files (0600) in a new private directory (0700).
Publication writes a temporary file, syncs its content, hard-links it exclusively
to its committed name and syncs the directory. Existing event names are never
overwritten. Only the implementation's temporary link is removed after success;
the committed file remains. Interrupted temporary files are preserved and ignored,
with a maximum of eight before refusing further reopen. No automatic cleanup of
user data is implemented.

A persisted reservation consumes an attempt before bytes are returned to a sender.
On reopen, an uncertain in-flight reservation becomes a persisted failure with
backoff, not an ACK. Late verified ACKs can still settle it. Retry counters survive
reconstruction; restarting does not bypass five attempts. The caller must use a
nondecreasing clock across restarts (for example, a guarded epoch-millisecond
clock); clock rollback fails closed. No autonomous timers or network calls exist.

ACKs, including the final session ACK, are journaled. Duplicate ACKs are no-ops.
An operation with an uncertain filesystem result requires reopening the object.
Replaying a committed final ACK restores ACKNOWLEDGED; chunk ACKs alone restore
AWAITING_FINAL_ACK. No ACK grants deletion authority; no deletion API exists.

## Bounds and trust

One plan per directory, at most 2 MiB canonical source, 64 chunks, 1024 events,
4096 bytes per event. Recovery checks a SHA-256 chain, contiguous event indices,
the canonical stream and reconstructed plan identity. It rejects malformed data,
gaps, unsafe permissions and symlink files. This detects accidental corruption,
not malicious rewriting or removal of an entire valid event suffix. There is no
cryptographic authentication or anti-rollback anchor.

Use a trusted local parent directory and a single owner/instance per outbox.
Conflicting event publications from stale writers fail rather than overwrite,
but this is not a multi-process locking service. The POSIX hard-link/fsync adapter
is host-specific, not yet an Android/iOS/Garmin storage adapter. Tests inject errors
before and after publication; they are not physical power-cut testing or a promise
against every filesystem/hardware failure. No tests use personal captures.

All ACK input must come from the future authenticated adapter. Field consistency
does not prove remote durable receipt. Receiver deduplication, TLS, identity/content
mapping to SyncPackage v1 and actual WindWisher ingestion remain pending.

Next delivery node: resolve the existing wire contract's UUID and canonical-content
mapping, then implement an authenticated mobile adapter without weakening these
retention and retry rules. No additional recording trials are needed for this work.
