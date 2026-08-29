# ADR-002: Share contracts, not a mandatory runtime

- Status: Accepted
- Context: Cross-platform consistency is required, but binary/runtime portability would constrain wearable APIs.
- Decision: Share schemas, semantics, fixtures, protocols, datasets, and ADRs; do not require a common runtime or UI.
- Alternatives considered: Portable core library; code generation as source of truth; duplicated undocumented models.
- Consequences: Language-neutral interoperability with some native mapping effort.
- Risks: Generated/manual models can diverge from schemas.
- Follow-up: Add platform conformance suites when runtimes exist; generated code remains derived.
