# ADR-011: Battery is an architecture constraint

- Status: Accepted
- Context: GPS, IMU, HR, display, persistence, computation, and radio compete for limited session energy.
- Decision: Treat sampling profiles and features as measured energy budgets from M1 onward; no feature ships without representative-device evidence.
- Alternatives considered: Optimize after functionality; fixed maximum sampling; infer consumption from documentation.
- Consequences: Evidence-driven trade-offs and potentially device-specific profiles.
- Risks: Expensive test matrix and measurement variance.
- Follow-up: Define repeatable battery protocol, thermal/context controls, and session-duration targets in M1.
