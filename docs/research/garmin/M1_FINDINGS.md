# M1 findings

## Status

`M1_1_B_HARDWARE_CHARACTERIZATION = COMPLETE`

`M2_SESSION_ENGINE_GATE = GO`

`M4_JUMP_ENGINE_RESEARCH_GATE = MORE_SENSOR_RESEARCH_REQUIRED`

The reference Garmin sustained GPS, HR, pressure and bounded IMU callbacks in half-hour combined runs. MEDIUM (25 Hz IMU) is the preliminary M2 profile. HIGH (50 Hz) was stable for 17 minutes and MAX (100 Hz per sensor) worked in a bounded stationary run, but neither is required for Session Engine Foundation.

GPS TTFF was 3.9–12.9 seconds in warm-like/unknown outdoor contexts. GPS/HR/pressure callback timing was approximately 1 Hz without gaps in the long runs. Memory remained stable within observed windows, small storage probes were repeatable, and a marker survived app relaunch.

The future Session Engine should use monotonic callback time for lifecycle, preserve raw sensor timestamps with quality flags, use bounded buffers and periodic durable chunks, and minimize full-session raw IMU retention. WindWisher remains responsible for advanced post-session analytics.

Implausible gyro extrema near integer limits and rare invalid timestamp batches remain unresolved sensor-quality evidence. They require M4 Jump Engine research and must not be interpreted as real motion or silently clamped.

No Session Engine, Jump Engine, product UI, sync, backend or sport analytics were implemented in M1.
