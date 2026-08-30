# Session Engine architecture

The Session Engine is the offline-first wearable core:

```text
Garmin Position/Sensor/System APIs
              ↓
small platform adapters
              ↓
Session Engine ──→ immutable live-state snapshots
      ↓
SessionStore port
      ↓
bounded framed journal + compact index
```

The deterministic reference implementation lives in `tools/session-engine/`. The Garmin integration is a separate developer app under `platforms/garmin/session-engine/`; it does not reuse or mutate the M1 Sensor Lab UI.

Responsibilities are lifecycle, monotonic elapsed time, normalized input ingestion, essential speed/HR state, counters, quality, durable append/checkpoint/finalization and conservative recovery. Distance and richer projections are deferred to M3. Raw IMU is not canonical persistence.

The store contract is intentionally small: create, append, update index/state, read/validate, discover recoverable sessions and delete. The in-memory store provides deterministic fault injection; `GarminSessionStore` maps frames to bounded Object Store chunks.

Watch/WindWisher boundary:

- Watch: acquisition, durability, live essentials and data quality.
- WindWisher: enrichment, average/P95/VMG/tack/area analysis, scoring, history and advanced presentation.
