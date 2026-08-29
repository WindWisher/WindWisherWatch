# ADR-004: Isolate the Jump Engine

- Status: Accepted
- Context: Jump inference is strategic, experimental, and dependent on variable sensor profiles.
- Decision: Keep acquisition adapters, engine pipeline, persistence, and native UI behind explicit boundaries.
- Alternatives considered: Detection inside screens; platform-specific algorithms without shared semantics; backend-only inference.
- Consequences: Replayable testing and algorithm evolution without UI coupling.
- Risks: Premature interfaces or hidden platform assumptions.
- Follow-up: Derive executable interfaces only after M1 telemetry; version all algorithms.
