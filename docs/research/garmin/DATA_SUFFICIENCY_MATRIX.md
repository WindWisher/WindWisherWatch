# Garmin data sufficiency matrix

## Live, recorded and post-session ownership

| Future metric/capability       | Required primary input                                 | Garmin available | Hardware evidence             | Watch live                 | Watch record                | WindWisher post-session  |
| ------------------------------ | ------------------------------------------------------ | ---------------- | ----------------------------- | -------------------------- | --------------------------- | ------------------------ |
| Elapsed time                   | Monotonic clock                                        | Yes              | HARDWARE_VERIFIED             | Yes                        | Anchors                     | Optional display/history |
| Current speed                  | GPS speed/fix quality                                  | Yes              | HARDWARE_VERIFIED             | Yes                        | Raw position/speed/quality  | Re-evaluate/visualize    |
| Maximum speed                  | GPS speed timeline                                     | Yes              | HARDWARE_VERIFIED_INPUT_ONLY  | Essential projection later | Primary samples             | Validate/enrich          |
| Distance                       | Ordered GPS track                                      | Yes              | HARDWARE_VERIFIED_INPUT_ONLY  | Essential projection later | Track points                | Recompute/enrich         |
| Heart rate                     | HR callback                                            | Yes              | HARDWARE_VERIFIED             | Yes                        | Values with consent/privacy | Trends/history           |
| Speed timeline / average / P95 | GPS timeline                                           | Yes              | HARDWARE_VERIFIED_INPUT_ONLY  | No                         | Primary samples             | Yes                      |
| Active/stopped                 | Time + speed timeline                                  | Yes              | HARDWARE_VERIFIED_INPUT_ONLY  | No                         | Primary samples             | Yes                      |
| Heading/tack/area analysis     | GPS position/heading                                   | Yes              | HARDWARE_VERIFIED_INPUT_ONLY  | No                         | Primary samples             | Yes                      |
| GPS quality                    | Fix quality + timing                                   | Yes              | HARDWARE_VERIFIED             | Essential quality state    | Yes                         | Diagnostics              |
| Jump height/airtime/distance   | Synchronized IMU/pressure/GPS plus validated algorithm | Inputs available | MORE_SENSOR_RESEARCH_REQUIRED | Future Jump Engine only    | Selected windows/provenance | Validate/enrich          |

## Jump input matrix

| Input               | Available                | Rate evidence                     | Quality evidence                            | Future candidate                     |
| ------------------- | ------------------------ | --------------------------------- | ------------------------------------------- | ------------------------------------ |
| Accelerometer       | Yes                      | 10/25/50/100 Hz observed          | Stable timing; accuracy unverified          | Yes                                  |
| Gyroscope           | Yes                      | 10/25/50/100 Hz observed          | Implausible extrema/saturation candidates   | Yes, after research                  |
| Pressure            | Yes                      | ~1 Hz                             | Stable callbacks; vertical accuracy unknown | Supporting input                     |
| GPS                 | Yes                      | ~1 Hz                             | Stable timing; accuracy not evaluated       | Supporting input                     |
| Ground speed        | Present in GPS callbacks | ~1 Hz                             | Value accuracy not evaluated                | Supporting input                     |
| Timestamp alignment | Partial                  | Sensor + callback clocks captured | Rare invalid sensor batches                 | Requires quality-aware normalization |

## Retention recommendation

- Session canonical data: time, GPS/track, HR/pressure as justified, device/runtime quality and provenance.
- Jump-window data: selected synchronized high-frequency windows only after M4 evidence.
- Debug/research telemetry: lab-only, bounded and temporary.

Do not store full-session high-frequency IMU indefinitely without demonstrated product utility. No metric or jump algorithm is implemented by this document.
