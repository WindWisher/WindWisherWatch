# Security

## Assets and trust boundaries

Sensitive assets include GPS tracks, timestamps, heart rate, session metadata, stable device identifiers, auth tokens, and unpublished jump history. Trust boundaries exist between sensors/platform APIs, local storage, phone/network transport, WindWisher backend, and consumers.

## Required controls

- Keep secrets and service-role keys out of source, schemas, fixtures, logs, and client bundles. Public client configuration is not authorization.
- Store device/user credentials with platform-provided secure storage and use short-lived, least-privilege tokens when designed.
- Use standard authenticated TLS and vetted platform/backend cryptography; never design custom encryption.
- Verify schema, supported major versions, declared lengths, manifest, and checksum before accepting a package. Enforce bounded decompression and parsing.
- Bind idempotency to authenticated device/session context. Identical retries return the recorded result; key reuse with different content fails.
- Reject replay outside defined protocol/retention rules and record non-sensitive audit events.
- Treat local files as untrusted after crash, transfer, or tampering. Validate framed journal checksums and quarantine corrupt tails.
- Redact GPS, HR, tokens, payloads, and user identifiers from logs. Bound diagnostic retention.
- Pin dependencies through the lockfile, review updates, and run automated checks in CI.

## Threats

Threats include stolen watch access, token theft, malicious or corrupt packages, replay, duplicate sessions, pathologically large input, decompression bombs, falsified metrics, location leakage, log leakage, dependency compromise, and unauthorized visibility changes. Confidence metadata is not an anti-tamper signature; future authenticity requirements need a separate ADR and threat model.

## Supabase boundary

The expected backend may use Supabase, but contracts contain no privileged credentials or SDK types. Row-level authorization and server-side validation must be proven during WindWisher integration. Service-role keys must never reach a wearable.

## Incident readiness

Production milestones must define revocation, forced logout, vulnerable-version handling, corrupt-data quarantine, user notification, audit retention, dependency response, and responsible disclosure before release.
