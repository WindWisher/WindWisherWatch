# Garmin hardware test protocols

Every run records model without serial, firmware, CIQ API, app version, profile, requested/reported rates, duration, aggregate timing, battery/memory, warnings and result. Raw GPS/HR captures are temporary, analyzed into non-personal aggregates and deleted.

Before each experiment define question, hypothesis, required evidence and stop condition. Do not repeat evidence already sufficient.

- `T0 stationary`: rate, jitter, gaps, duplicates and memory.
- `T1 wrist rotation`: raw response and outlier context only; no calibration claim.
- `T5 GPS outdoor`: TTFF and callback timing; record warm-like/unknown context without retaining coordinates.
- `T6 combined`: GPS + IMU + HR + pressure coexistence, batches, memory and battery.
- `T7 storage`: repeated small write/read/verify/delete operations.
- `T8 recovery`: marker write, app close/relaunch, intact read and cleanup.
- `T9 battery`: comparable baseline/combined runs of at least 30 minutes with no manual backlight interaction.

Gap policy: `interval > 2.5 * expected interval`. Histograms are fixed-memory and relative to expected cadence; median/P95/P99 are deterministic bucket upper bounds. Callback timing is evaluated independently from per-sample timestamps.

Stop for low memory, heat, instability, registration errors or unsafe conditions. Never force power loss during a write; `POWER_LOSS_ATOMICITY` may remain `UNKNOWN` until a safe M2 method exists.
