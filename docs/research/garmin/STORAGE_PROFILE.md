# Storage profile

Official `Application.Storage` is persistent per-app storage; values are bounded and failures must be handled. It is suitable for small metadata/checkpoint primitives, not automatically for full high-rate session telemetry.

On the reference hardware, eleven approximately 256-byte write/read/verify/delete operations completed with zero failures:

|   N |     Mean | Median | Minimum | Maximum | Failures | Evidence          |
| --: | -------: | -----: | ------: | ------: | -------: | ----------------- |
|  11 | 31.55 ms |  30 ms |   27 ms |   42 ms |        0 | HARDWARE_VERIFIED |

A separate developer-only recovery protocol wrote a marker, verified it, closed and relaunched the application, recovered the marker intact, and verified cleanup. This establishes the basic persistent primitive needed to design M2 recovery.

It does not establish a production journal format, large-payload throughput, partial-write behavior, or atomicity under sudden power loss. `POWER_LOSS_ATOMICITY = UNKNOWN`; no unsafe interruption was attempted.

M2 recommendation: small bounded buffers plus framed periodic durable chunks/checkpoints. Validate checksums, partial-tail recovery and capacity in M2 rather than storing raw IMU indefinitely.

Source: [Garmin Application.Storage](https://developer.garmin.com/connect-iq/api-docs/Toybox/Application/Storage.html).
