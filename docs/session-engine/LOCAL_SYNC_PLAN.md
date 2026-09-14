# Local sync scheduling foundation

Status: IMPLEMENTED_HOST_MODEL / LOCAL_TESTED / REMOTE_DELIVERY_NOT_RUN.

`tools/session-engine/sync-plan.mjs` validates a complete Canonical Session v1
before making a deterministic immutable plan. It retains at most 2 MiB of source
bytes, split into 32 KiB chunks (maximum 64), with SHA-256 checksums and stable
idempotency keys bound to device reference, source session identity and exact bytes.
Base64 is encoding, not encryption. All payloads are private telemetry.

This is deliberately **not** a SyncPackage v1 wire implementation. The existing
contract requires UUID session/device IDs, whereas canonical journals permit opaque
session IDs. Its manifest types do not explicitly describe a complete canonical
stream (including pressure, quality and completion records). Do not relabel that
stream as diagnostics or invent an identity mapping to satisfy schema validation.
Before network delivery, settle those two compatibility decisions and validate the
resulting envelope against the contract. No contract/schema was changed here.

The local queue permits one in-flight chunk. The adapter must report timeout or
failure; the model does not schedule timers or send traffic. Retry waits increase
from 1 second, with at most five attempts per chunk per queue instance. A monotonic
clock is required. Verified late ACKs and replayed out-of-order ACKs are supported;
device/plan/key/checksum mismatches are rejected. Final ACK additionally requires
all chunks and matching whole-source checksum/count. No delete API exists.

ACK fields are checked for consistency, **not authenticity**. This model assumes
ACKs come from a future trusted adapter. Do not pass arbitrary network responses
directly to it. It provides no TLS, account authorization, server persistence or
receiver deduplication. A final ACK must eventually mean durable verified receipt,
not merely HTTP success. Restart currently means reconstructing the plan and
replaying adapter-verified ACKs. The base model is in memory; the new
[persistent outbox](PERSISTENT_SYNC_OUTBOX.md) journals reservations, failures and
ACKs and preserves the retry budget across reopen. It is host-filesystem tested,
not yet integrated with a phone or remote service.

Tests cover byte reconstruction, immutable packages, deterministic identity,
oversize/truncated rejection, retry backoff/exhaustion and wrong/duplicate/reordered
ACKs. On 2026-09-13 both real private canonical files were also validated and planned
read-only: 15469 and 12481 bytes, one chunk each. Simulated local chunk ACKs led to
AWAITING_FINAL_ACK, not remote completion. No personal data was printed or uploaded.

Next bounded implementation: resolve wire identity/content mapping before an
authenticated adapter. Garmin
firmware, source journals, original exports, backend and environment files are out
of scope for this loop. Independent SurfR-only recording is not paired WOO evidence
and does not change the M6 NO_GO gate.
