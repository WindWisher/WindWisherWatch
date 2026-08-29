# ADR-001: Native wearable implementations

- Status: Accepted
- Context: Garmin, watchOS, and Wear OS expose different languages, lifecycle, sensors, storage, battery, input, and distribution constraints.
- Decision: Build each wearable natively: Monkey C, Swift/SwiftUI, and Kotlin/Compose respectively.
- Alternatives considered: Flutter/shared UI; web runtime; Garmin-only architecture.
- Consequences: Best platform fit and independent release cadence, at the cost of repeated adapter/UI work.
- Risks: Semantic drift and uneven feature parity.
- Follow-up: Enforce contracts/test vectors and define parity by capability, not pixel identity.
