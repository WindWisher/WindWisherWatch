# ADR-009: Provenance for sensor-derived metrics

- Status: Accepted
- Context: A numeric jump result can overstate certainty and cannot be reproduced without method and input quality.
- Decision: Persist algorithm version, confidence, quality flags, event timestamps, and source summary alongside derived jump estimates.
- Alternatives considered: Store only display numbers; retain raw data only; confidence-free versioning.
- Consequences: Traceable/reprocessable metrics with larger payloads and UX responsibility for uncertainty.
- Risks: Uncalibrated confidence may itself mislead; metadata could be incomplete.
- Follow-up: Define calibration and suppression policies with empirical datasets in M3-M5.
