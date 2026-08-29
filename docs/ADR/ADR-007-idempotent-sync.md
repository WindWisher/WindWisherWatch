# ADR-007: Idempotent, sequenced synchronization

- Status: Accepted
- Context: Transfers will retry, disconnect, duplicate, and arrive out of order.
- Decision: Use immutable checksummed packages with device/session identity, sequence, manifest, and idempotency key; acknowledge packages and final completeness separately.
- Alternatives considered: One mutable upload; at-most-once delivery; session ID alone as idempotency.
- Consequences: Safe retry and partial resume at added protocol/state complexity.
- Risks: Key collision/reuse, inconsistent totals, replay, unbounded packages.
- Follow-up: Specify authenticated key scope, limits, conflict behavior, and replay window in M7.
