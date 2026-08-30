# Session lifecycle

Pause and automatic resume are deferred because no M2 requirement justifies their complexity.

| State                   | Allowed event                   | Next state  | Durable side effect                                                          |
| ----------------------- | ------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `IDLE`                  | `prepare`                       | `PREPARING` | Create stable session identity and compact index entry                       |
| `PREPARING`             | `start`                         | `RECORDING` | Append `SESSION_START`, then update index                                    |
| `RECORDING`             | ingest/tick                     | `RECORDING` | Append bounded primary/quality/runtime frames and periodic checkpoints       |
| `RECORDING`             | `stop`                          | `STOPPING`  | Drain buffer and append stop                                                 |
| `STOPPING`              | finalize succeeds               | `COMPLETED` | Checkpoint, final frame, read-back integrity verification, then index update |
| `STOPPING`              | persistence fails               | `FAILED`    | Surface persistence error; never claim completion                            |
| `IDLE`                  | `recover`                       | `RECOVERED` | Validate journal, replay valid prefix, record recovery quality               |
| `RECOVERED`             | explicit finalize               | `COMPLETED` | New checkpoint/final frame with same session ID                              |
| Any write-capable state | critical resource/storage error | `FAILED`    | Stop presenting an apparently healthy recording                              |

Invalid transitions throw/fail closed. Samples after completion are rejected. Repeated `stop` after completion is idempotent and does not append another final frame.

Session IDs use a compact Garmin-safe `ww-<epoch>-<monotonic>` form and are never regenerated during recovery.
