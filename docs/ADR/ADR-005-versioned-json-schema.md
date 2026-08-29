# ADR-005: JSON Schema Draft 2020-12 contracts

- Status: Accepted
- Context: Contracts must be portable, machine-verifiable, closed, and usable across three native languages and backend tooling.
- Decision: Use JSON Schema Draft 2020-12 with stable `$id`, semantic `schemaVersion`, explicit units, and `additionalProperties: false`.
- Alternatives considered: Protobuf as immediate wire format; OpenAPI-only models; prose; language-specific classes.
- Consequences: Accessible validation and review; JSON size is not an on-device storage mandate.
- Risks: Schema/runtime differences and reference/version migration complexity.
- Follow-up: Conformance tests per platform; evaluate compact encodings without changing semantics.
