# ADR-012: Forecast snapshot is prediction, not measured wind

- Status: Accepted
- Context: A cached forecast is useful offline, but the watch cannot rigorously infer ambient wind/gust from current sensors in M0/MVP.
- Decision: Label forecast data with source and validity metadata and prohibit presenting it as live measured wind or gust.
- Alternatives considered: Omit forecast; estimate live wind; display values without provenance.
- Consequences: Useful context without false measurement claims; snapshots can become stale.
- Risks: UI ambiguity and expired data.
- Follow-up: M6 designs prominent source/staleness states; live estimator remains out of scope absent a new evidence-backed ADR.
