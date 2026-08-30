# Memory profile

`System.getSystemStats()` reports application memory. The lab samples every ten seconds and stores full-run minimum-free/peak-used values in the completion summary so log rotation cannot remove them.

| Profile                 |  Duration |                   Peak used |                Minimum free |     Total | Evidence                               |
| ----------------------- | --------: | --------------------------: | --------------------------: | --------: | -------------------------------------- |
| Baseline physical       | 33.21 min |                    25,656 B |                   756,352 B | 782,008 B | HARDWARE_VERIFIED                      |
| IMU MEDIUM stationary   |  3.61 min |                    26,984 B |                   755,024 B | 782,008 B | HARDWARE_VERIFIED                      |
| IMU HIGH stationary     | 17.18 min | 28,200 B retained-tail peak | 753,808 B retained-tail min | 782,008 B | HARDWARE_VERIFIED_PARTIAL_RUNTIME_TAIL |
| IMU MAX stationary      |  4.61 min |                    30,576 B |                   751,432 B | 782,008 B | HARDWARE_VERIFIED                      |
| COMBINED MEDIUM control |  6.25 min |                    30,856 B |                   751,152 B | 782,008 B | HARDWARE_VERIFIED                      |
| COMBINED LOW soak       | 31.85 min |                    30,280 B |                   751,728 B | 782,008 B | HARDWARE_VERIFIED                      |
| COMBINED MEDIUM soak    | 31.91 min |                    30,856 B |                   751,152 B | 782,008 B | HARDWARE_VERIFIED                      |

No monotonic growth was observed in the half-hour combined windows. This is evidence of stable memory within the observed window, not proof that no leak can exist. All runs retained far more than the lab's 24 KiB free-memory guard.

M2 implication: use small fixed buffers and periodic durable chunks. Do not retain a session's full raw IMU stream in RAM.
