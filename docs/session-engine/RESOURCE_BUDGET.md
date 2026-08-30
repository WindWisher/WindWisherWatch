# Session Engine resource budget

| Resource                     | Initial bound/policy                              |
| ---------------------------- | ------------------------------------------------- |
| Host frame payload           | 4,096 bytes maximum                               |
| Host chunk                   | 8,192 bytes maximum                               |
| Garmin payload               | 512 characters maximum                            |
| Garmin Object Store chunk    | 16 frames maximum                                 |
| Transient host record buffer | 32 records default, priority-aware                |
| Recent quality events        | 16 default                                        |
| Checkpoint cadence           | 60 seconds production default; configurable tests |
| Garmin low-memory guard      | 24,576 free bytes                                 |

Ordering is write chunk → read/checksum verification → index update. Critical lifecycle and finalization outrank GPS, HR/quality and diagnostics. The synchronous Garmin adapter does not accumulate a long queue; a future asynchronous adapter must preserve the same explicit bound and report overflow.

On low memory the engine flushes what is already bounded, emits quality and fails safely rather than pretending to record. On storage failure finalization cannot become `COMPLETED`.

M1.1-B observed approximately 751 KiB minimum free in half-hour combined runs. M2 adds persistence and therefore requires its own simulator/hardware observations before production claims.
