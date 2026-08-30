# M5 findings

## Current status

```text
M5_STATUS = IMPLEMENTATION_COMPLETE_HARDWARE_RESEARCH_PENDING
JUMP_ENGINE_STATUS = EXPERIMENTAL
JUMP_DETECTION_PRODUCT_READY = NO
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
WOO_VALIDATION = NOT_RUN
M6_WOO_VALIDATION_GATE = NO_GO
JUMP_RESEARCH_SENSOR_PROFILE = INSUFFICIENT_EVIDENCE
```

The host-first detector implements a bounded, deterministic and quality-aware research pipeline. Both MEDIUM and HIGH classify the synthetic catalog as declared, preserve clean synthetic timing within one MEDIUM interval and reject stationary, walking-like, arm-swing, short-flight and excessive-duration patterns. Timestamp anomalies, sample gaps and gyro outliers remain explicit and lower confidence. These results validate software behavior only.

A four-hour MEDIUM simulation processed 360,000 observations in 2.09–2.23 seconds across the final local runs (about 5.79–6.19 microseconds/sample). The rolling buffer remained 75 samples and candidate retention remained eight. This is host engineering evidence, not Garmin callback, battery or sports-performance evidence. The full repository suite passes 55/55.

M1.1-B established that the reference fēnix 7 can deliver stable MEDIUM/HIGH stationary sampling, but it did not capture the dense controlled J0–J6 motion windows needed to calibrate this detector. Existing sparse Sensor Lab logs cannot establish takeoff/flight/landing segmentation. Consequently M5 cannot recommend MEDIUM or HIGH, validate airtime or open M6 responsibly.

No Garmin code changed. A dev-only bounded capture/adapter and controlled J0–J6 evidence are the next M5 phase; Garmin builds, Run No Evil and new physical tests are therefore `NOT_RUN`. No real capture, raw personal telemetry, `.env`, networking, backend, sync, canonical jump event, height or product UI was added.
