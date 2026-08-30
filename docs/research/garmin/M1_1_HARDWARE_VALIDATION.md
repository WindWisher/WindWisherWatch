# M1.1-B Garmin Hardware Characterization — Completion Report

## 1. Status

`COMPLETE`

`M2_SESSION_ENGINE_GATE = GO`

`M4_JUMP_ENGINE_RESEARCH_GATE = MORE_SENSOR_RESEARCH_REQUIRED`

Recorded on 2026-08-30. Completion means the reference Garmin provides signals, timing, runtime, persistence and stability sufficient to begin Session Engine Foundation. It does not validate a Jump Engine or certify production autonomy/accuracy.

## 2. Executive summary

The developer lab now characterizes separate sensor maximums, requested/observed rates, fixed-memory timing distributions, callback batches, GPS TTFF, memory, battery, storage and relaunch recovery. Physical runs covered IMU MEDIUM/HIGH/MAX, repeated COMBINED MEDIUM, half-hour COMBINED LOW/MEDIUM and a comparable baseline.

Preliminary M2 profile: `COMBINED MEDIUM` (25 Hz accel + gyro, continuous GPS, HR and pressure). HIGH/MAX remain lab profiles. Recurrent implausible gyro values require raw quality flags and later Jump Engine research; they do not block Session Engine lifecycle, GPS or persistence.

## 3. Git status/baseline

M0 baseline is `6fdac154b0cb0d802109fbcb978d4f1ca0474341`. M1/M1.1/M1.1-B changes remain uncommitted. No reset, clean, commit or push was performed.

## 4. Toolchain

- Connect IQ SDK 9.2.0.
- OpenJDK 21.0.8.
- `fenix7`: build successful.
- `fenix7s`: build successful.
- Run No Evil: 6/6 passed, 0 failed, 0 errors. Garmin runner returned exit code 1 after printing `PASSED`; both facts are retained.

## 5. Hardware reference

fēnix 7 Sapphire Solar, firmware 26.09, CIQ API 5.2.0. Serial intentionally omitted.

## 6. Changes made

- Separate global/accelerometer/gyroscope max-rate discovery.
- Fixed-memory timing histograms with 2.5x gap threshold and approximate median/P95/P99 upper bounds.
- Independent IMU callback timing and maximum batch size.
- GPS TTFF without retaining coordinates.
- HR/pressure callback timing without retaining values.
- Full-run runtime/battery summary resilient to log rotation.
- Bounded gyro maximum context with preceding/following values.
- Repeated storage and relaunch recovery experiments.
- Brief completion feedback and one-hour lab safety timeout.

No Session Engine, Jump Engine, analytics, sync, backend or product UI was implemented.

## 7. Max sample rate discovery

| Constraint                         |                             Reported | Evidence          |
| ---------------------------------- | -----------------------------------: | ----------------- |
| System/global                      |                                50 Hz | HARDWARE_VERIFIED |
| Accelerometer                      |                               100 Hz | HARDWARE_VERIFIED |
| Gyroscope                          |                               100 Hz | HARDWARE_VERIFIED |
| Stable combined IMU maximum tested | 100 + 100 Hz, bounded stationary run | HARDWARE_VERIFIED |

The per-sensor maximum is not treated as a recommendation for continuous combined capture.

## 8. IMU profiles

| Profile           |   Duration | Requested | Samples/sensor | Whole-run observed |   Interval range |             Gaps | Result    |
| ----------------- | ---------: | --------: | -------------: | -----------------: | ---------------: | ---------------: | --------- |
| LOW historical    |    96.56 s |     10 Hz |            950 |            9.84 Hz | partial evidence | unknown full run | COMPLETED |
| MEDIUM stationary |   216.51 s |     25 Hz |          5,375 |           24.83 Hz |         40–48 ms |                0 | COMPLETED |
| HIGH stationary   | 1,031.06 s |     50 Hz |         51,500 |           49.95 Hz |         16–24 ms |                0 | COMPLETED |
| MAX stationary    |   276.62 s |    100 Hz |         27,500 |           99.42 Hz |          8–16 ms |                0 | COMPLETED |

Histogram percentiles are bucket upper bounds. MEDIUM P95/P99 were at most 50 ms; HIGH at most 25 ms; MAX at most 20 ms.

## 9. Combined profiles

| Profile/run    |   Duration |   IMU samples |   GPS |    HR | Pressure |               Callback gaps | Result          |
| -------------- | ---------: | ------------: | ----: | ----: | -------: | --------------------------: | --------------- |
| MEDIUM first   |   336.04 s |  8,500/sensor |   323 |     0 |      336 | no persistent listener loss | COMPLETED       |
| MEDIUM control |   375.22 s |  9,350/sensor |   370 |   375 |      375 |                           0 | COMPLETED       |
| LOW soak       | 1,911.05 s | 19,110/sensor | 1,907 | 1,911 |    1,911 |                           0 | COMPLETED       |
| MEDIUM soak    | 1,914.48 s | 47,825/sensor | 1,905 | 1,911 |    1,915 |                           0 | clean CANCELLED |

The control and soaks establish stable coexistence. COMBINED HIGH is intentionally `NOT_RUN`; it is not an M2 gate.

## 10. Timing and gaps

COMBINED MEDIUM produced 25-sample batches approximately once per second; LOW produced batches of 10. Long-run GPS, HR and pressure callbacks were approximately 1 Hz with zero gaps using the documented 2.5x threshold.

Rare IMU timestamp anomalies occurred without callback loss: one run contained impossible positive jumps, and the LOW soak contained one backward ten-sample batch. The MEDIUM control and soak had zero duplicates/out-of-order samples. Raw timestamps must carry quality/provenance; session lifecycle should use the monotonic callback clock.

## 11. Gyroscope outlier investigation

Observed implausible maxima included ~16,296, ~14,071 and values near 32,764 degrees/second. They occurred in multi-sample startup/interaction contexts and near integer limits. Official units are degrees/second; these values are rejected as physical-motion evidence.

Classification: `INVALID_SENTINEL_SATURATION_OR_FIRMWARE_BEHAVIOR_CANDIDATE`. Cause is not conclusively isolated. No clamp/filter was added; raw provenance and quality observations remain separate. This blocks jump-science claims, not M2.

## 12. GPS TTFF and callback timing

Usable TTFF observations were 12.9 s, 4.9 s, 3.9 s and 8.7 s outdoors. Context is warm-like/unknown; no true cold-start claim is made. Long-run GPS intervals averaged about 1,000 ms with no gaps. Coordinates/routes were deleted after aggregation.

## 13. Health timing

When worn correctly, HR and pressure remained at approximately 1 Hz through both half-hour combined runs with zero gaps. No personal HR values are retained. Accuracy/source quality remain outside this gate.

## 14. Memory and battery

Half-hour COMBINED LOW and MEDIUM retained at least 751,152 B free of 782,008 B total; no monotonic growth was observed.

| Run             |  Duration |   Delta | Observed points/hour |
| --------------- | --------: | ------: | -------------------: |
| BASELINE        | 33.21 min | -0.3802 |                 0.69 |
| COMBINED LOW    | 31.85 min | -1.1273 |                 2.12 |
| COMBINED MEDIUM | 31.91 min | -1.1666 |                 2.19 |

Rates are single-device relative evidence, not autonomy claims. MEDIUM was only ~3% above LOW, too small to establish a material difference with N=1.

## 15. Storage and restart recovery

Eleven small write/read/verify/delete probes: mean 31.55 ms, median 30 ms, range 27–42 ms, zero failures. A marker survived application close/relaunch, was recovered intact and cleaned. `POWER_LOSS_ATOMICITY = UNKNOWN`; no unsafe interruption was attempted.

## 16. Buffer and data-minimization implications

M2 should use a small bounded transient buffer plus periodic framed durable chunks/checkpoints. Session canonical data should prioritize time, GPS/track, HR/pressure and quality. Full-session high-frequency raw IMU should not be retained without demonstrated product value; future jump-window raw and debug telemetry are separate retention classes.

## 17. M2 gates

| Gate                  | Decision | Evidence                                                                           |
| --------------------- | -------- | ---------------------------------------------------------------------------------- |
| A BUILD               | PASS     | fēnix 7/7S builds; Run No Evil 6/6                                                 |
| B SENSOR AVAILABILITY | PASS     | GPS, accel, gyro, HR and pressure on hardware                                      |
| C TIMING              | PASS     | monotonic lifecycle clock, stable callback cadence, anomaly policy                 |
| D STABILITY           | PASS     | half-hour COMBINED LOW/MEDIUM without callback gaps                                |
| E MEMORY              | PASS     | >751 KiB minimum free; no observed monotonic growth                                |
| F STORAGE PRIMITIVES  | PASS     | repeated verified probes and relaunch marker recovery                              |
| G BATTERY             | PASS     | comparative half-hour evidence; no obviously inviable profile                      |
| H DATA SUFFICIENCY    | PASS     | primary inputs sufficient for Session Engine and post-session WindWisher analytics |

## 18. Decisions

`M2_SESSION_ENGINE_GATE = GO`

`M4_JUMP_ENGINE_RESEARCH_GATE = MORE_SENSOR_RESEARCH_REQUIRED`

## 19. Risks and remaining unknowns

- Production journal partial-write/power-loss recovery belongs to M2.
- Gyro sentinel/saturation behavior and motion fidelity belong to M4 research.
- GNSS accuracy, true cold start and broader device coverage remain future evidence.
- Battery values require production-context replication and longer soak.

## 20. Recommended next milestone

`M2 — Session Engine Foundation`
