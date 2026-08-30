# M1.1-B independent review

Review date: 2026-08-30.

- Garmin engineer: SDK 9.2.0 builds for fēnix 7 and 7S; separate per-sensor max-rate discovery and bounded listeners compile.
- Embedded engineer: fixed-memory timing histograms, bounded one-second batches, explicit teardown and free-memory guard are present.
- Timing engineer: callback and sensor clocks remain distinct; rare timestamp anomalies are retained as quality evidence rather than silently corrected.
- Sensor scientist: implausible gyro extrema near integer limits are not accepted as physical motion or calibration evidence.
- Battery engineer: half-hour rates are valid only for relative single-device comparison; no autonomy claim is made.
- Session Engine architect: COMBINED MEDIUM, monotonic lifecycle time, memory and persistence primitives are sufficient to start M2.
- Jump Engine researcher: sampling exists, but gyro outliers and motion fidelity require additional research before M4 algorithms.
- Privacy reviewer: no coordinates, HR values, credentials, key material or serial are retained in evidence.
- QA: builds, host checks and Run No Evil pass; physical evidence covers normal stop, cancellation and relaunch recovery.

Residual risk belongs to M2 implementation and M4 research: production journal recovery under partial writes, broader device coverage, full autonomy, GNSS accuracy and jump-sensor quality.
