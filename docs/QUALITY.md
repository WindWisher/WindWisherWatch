# Quality strategy

Quality claims are evidence-specific. Passing contract tests proves schema consistency; simulator tests do not prove device behavior; synthetic telemetry does not prove jump accuracy; one device does not prove platform portability.

## Gates

- **Contracts:** compile all schemas, resolve references, accept positive fixtures, reject negative fixtures, enforce closed objects, explicit units, versions, and runtime/backend separation.
- **Domain:** glossary and specifications agree; breaking semantic changes have ADR, migration plan, and compatibility tests.
- **Platform:** static analysis, unit/integration tests, and hardware evidence per named device, firmware, permissions, and sampling profile.
- **Reliability:** crash, partial-write, storage exhaustion, clock discontinuity, sensor dropout, retry, duplicate, reorder, corruption, and recovery tests.
- **Algorithms:** frozen datasets/splits, versioned configuration, detection and error KPIs, uncertainty, cohort/device stratification, and failure analysis. Woo remains a reference, not truth.
- **Resources:** measured CPU, memory, storage growth, thermal behavior, and battery drain for realistic session durations.
- **Security/privacy:** threat review, dependency audit, auth/RLS checks, payload limits, log redaction, retention/deletion, and private-default tests.
- **UX:** glanceability, missing/low-quality states, wet/button use, sunlight, accessibility, and accidental-input behavior on representative hardware.

CI is necessary but not a production-readiness claim. Every milestone report distinguishes `IMPLEMENTED`, `VERIFIED`, `DESIGNED`, and `NOT_RUN`, records exact commands/environment, and carries unresolved risks forward. A failed or unavailable gate cannot be replaced by narrative confidence.
