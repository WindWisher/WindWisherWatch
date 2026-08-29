# ADR-006: Reuse the WindWisher backend boundary

- Status: Accepted
- Context: WindWisher already owns identity, sessions, history, community, and expected Supabase infrastructure.
- Decision: Synchronize through a vendor-neutral port into the WindWisher backend; do not create a separate backend.
- Alternatives considered: Wearable-specific backend; direct Supabase coupling in domain; phone-only storage.
- Consequences: One product data plane while preserving transport/infrastructure replaceability.
- Risks: Existing session semantics may conflict; backend availability/auth constraints.
- Follow-up: Reconcile contracts and migrations in M7/M8; prove RLS and rollback before production.
