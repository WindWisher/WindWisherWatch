# Garmin sensor capabilities

## Reference hardware profile

The fēnix 7 Sapphire Solar on firmware 26.09 / CIQ 5.2.0 is the `REFERENCE_HARDWARE_PROFILE` for M2. This is an engineering reference, not commercial certification.

| Input         | Availability              | Observed rate/timing                                                     | Evidence          | Limitation                                                                                |
| ------------- | ------------------------- | ------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| Accelerometer | Available                 | LOW ~10 Hz; MEDIUM ~25 Hz; HIGH ~50 Hz; MAX bounded ~100 Hz              | HARDWARE_VERIFIED | Rare invalid timestamp batches; no accuracy claim                                         |
| Gyroscope     | Available                 | Same stable rates as accelerometer                                       | HARDWARE_VERIFIED | Recurrent implausible near-int16 extrema; quality handling required before jump inference |
| GPS           | Available                 | ~1 Hz; no gaps in half-hour runs; TTFF 3.9, 4.9, 8.7 and 12.9 s observed | HARDWARE_VERIFIED | Warm/cold GNSS state not controlled; accuracy unverified                                  |
| Heart rate    | Available when watch worn | ~1 Hz; no gaps in combined control/soaks                                 | HARDWARE_VERIFIED | Personal values excluded; source/accuracy unverified                                      |
| Pressure      | Available                 | ~1 Hz; no gaps in combined runs                                          | HARDWARE_VERIFIED | Calibration/vertical accuracy unverified                                                  |
| Magnetometer  | Not requested             | NOT_RUN                                                                  | UNKNOWN           | Not required for M2                                                                       |

Official APIs document per-sensor max-rate discovery, synchronized high-frequency batches, millig accelerometer units, degrees/second gyroscope units, millisecond timestamp arrays and continuous position callbacks.

## Preliminary profile recommendation

`COMBINED MEDIUM` is recommended for M2 prototyping:

- stable for more than 31 minutes;
- 25-sample bounded IMU batches approximately once per second;
- GPS, HR and pressure remained active;
- no callback gaps or memory growth observed;
- battery rate was not materially different from COMBINED LOW in the single comparative runs.

HIGH/MAX remain research/debug profiles. MAX availability is useful evidence but is not required by the Session Engine. The future Jump Engine must separately resolve gyro invalid/saturation behavior and required sampling fidelity.

Sources: [Garmin Sensor API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html), [sensor overview](https://developer.garmin.com/connect-iq/core-topics/sensors/), and [Position API](https://developer.garmin.com/connect-iq/api-docs/Toybox/Position.html).
