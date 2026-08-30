# ADR-004: Isolate the Jump Engine

- Status: Accepted
- Context: Jump inference is strategic, experimental, and dependent on variable sensor profiles.
- Decision: Keep acquisition adapters, engine pipeline, persistence, and native UI behind explicit boundaries. The Jump Engine is a passive Session Engine capability, never its lifecycle or persistence authority, and remains experimental until controlled hardware and external empirical validation support promotion.
- Alternatives considered: Detection inside screens; platform-specific algorithms without shared semantics; backend-only inference.
- Consequences: Replayable testing and algorithm evolution without UI coupling.
- Risks: Premature interfaces or hidden platform assumptions.
- Follow-up: M5 derives a host-only executable research interface from M1 telemetry. Version every algorithm/threshold set; do not emit product `JumpEvent` or canonical jump data before external validation.
