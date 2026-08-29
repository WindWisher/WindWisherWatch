# ADR-003: Offline-first durable recording

- Status: Accepted
- Context: Water sessions commonly lack phone and Internet connectivity; data loss is unacceptable.
- Decision: Record to a versioned, integrity-checked local journal and synchronize after local completion.
- Alternatives considered: Live backend writes; phone-tethered recording; periodic whole-file overwrite.
- Consequences: Sessions continue offline and recover from crashes, requiring storage/recovery engineering.
- Risks: Storage exhaustion, partial writes, retention leakage, platform durability differences.
- Follow-up: M1 measures limits; M2 proves crash/power recovery and battery cost.
