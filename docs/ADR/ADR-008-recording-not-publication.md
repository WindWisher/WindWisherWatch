# ADR-008: Separate session recording from publication

- Status: Accepted
- Context: Tracks, time, routines, HR, and spots are sensitive, while social sharing is optional.
- Decision: Sessions default private; recording/sync never implies publication. Visibility is independently changed by explicit authenticated action.
- Alternatives considered: Public-by-default; sync-time sharing flag; no visibility concept.
- Consequences: Safer defaults and clearer consent, requiring a later publication workflow.
- Risks: Backend/UI accidentally broaden access or expose derived caches.
- Follow-up: Threat-test authorization and deletion propagation in M8.
