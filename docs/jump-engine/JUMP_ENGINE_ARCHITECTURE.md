# Experimental Jump Engine architecture

## Status and boundary

```text
JUMP_ENGINE_STATUS = EXPERIMENTAL
FULL_SESSION_RAW_IMU = FORBIDDEN_BY_DEFAULT
```

The M5 host engine is a deterministic passive capability. It accepts copied motion observations with monotonic clock context and emits bounded research candidates. It does not own Session Engine lifecycle, persistence, recovery, GPS, HR, canonical export, UI or synchronization. No Garmin API appears in the host implementation.

```text
accelerometer required
gyro optional/enhancing
pressure optional/contextual
GPS optional/contextual
        ↓
timestamp normalization
        ↓
small feature set + quality classification
        ↓
bounded candidate state machine
        ↓
ExperimentalJumpCandidate
```

Processing performs fixed work per observation. A three-second ring stores recent context. An active event window has a computed fixed capacity, and only the latest eight candidates are retained. These bounds do not grow with session duration. Copying the bounded pre-event ring when a trigger occurs has a fixed profile-dependent upper bound.

Research windows are sensitive telemetry. They are neither canonical session records nor product `JumpEvent`s and must not be committed when captured from a person. The safe replay inspector omits raw vectors and private contextual payloads.

The future integration point is a dev-only adapter that copies observations to this capability without blocking the sensor callback. M5 does not add that adapter because controlled device evidence and scheduling behavior must be designed together.
