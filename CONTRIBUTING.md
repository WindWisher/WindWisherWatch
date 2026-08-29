# Contributing

WindWisherWatch uses contracts-first development. Describe semantic changes before adding platform behavior, and update schemas, fixtures, tests, glossary, and migration notes together.

## Rules

1. Use explicit SI units in persisted field names (`Meters`, `Mps`, `Milliseconds`) and UTC RFC 3339 timestamps.
2. Keep contracts free of Garmin, watchOS, Wear OS, Flutter, Supabase, and vendor SDK types.
3. Keep the Jump Engine independent of UI and platform adapters.
4. Add an ADR for consequential architecture choices; include alternatives, consequences, risks, and follow-up.
5. Preserve backward compatibility within a major schema version. Document and test every breaking change and migration.
6. Add valid and invalid fixtures for contract changes. Run `npm run check` before review.
7. Never commit secrets, credentials, production telemetry, precise personal locations, or real health data. Use synthetic fixtures.
8. Treat derived metrics as estimates: include algorithm version, confidence, and quality evidence.
9. Do not introduce real sensor acquisition or platform runtimes before their milestone.

Licensing is pending an owner decision. Contributions must not add third-party content with incompatible or unclear provenance.
