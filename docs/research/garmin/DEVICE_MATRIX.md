# Garmin device evidence matrix

Evidence levels: `DOCUMENTED`, `SIMULATOR_VERIFIED`, `HARDWARE_VERIFIED`, `INFERRED`, `UNKNOWN`.

| Model                    | Firmware / CIQ  | GPS                                             | IMU                                                  | HR / pressure                 | Memory / battery                                   | Evidence                            |
| ------------------------ | --------------- | ----------------------------------------------- | ---------------------------------------------------- | ----------------------------- | -------------------------------------------------- | ----------------------------------- |
| fēnix 7 simulator        | 23.16 / 5.2.0   | NOT_RUN                                         | No callbacks in one synthetic HIGH run               | NOT_RUN                       | Bounded lifecycle only                             | SIMULATOR_VERIFIED                  |
| fēnix 7 compile profile  | N/A / min 3.3.0 | Build only                                      | Build only                                           | Build only                    | UNKNOWN                                            | BUILD_VERIFIED                      |
| fēnix 7S compile profile | N/A / min 3.3.0 | Build only                                      | Build only                                           | Build only                    | UNKNOWN                                            | BUILD_VERIFIED                      |
| fēnix 7 Sapphire Solar   | 26.09 / 5.2.0   | ~1 Hz, TTFF 3.9–12.9 s in observed outdoor runs | 10/25/50 Hz and bounded 100 Hz concurrent accel+gyro | ~1 Hz, combined soak verified | 751,152 B minimum free; half-hour battery profiles | HARDWARE_VERIFIED_REFERENCE_PROFILE |

Reference hardware reported 50 Hz as the global system maximum and 100 Hz individually for accelerometer and gyroscope. Both sensors accepted 100 Hz concurrently in a bounded stationary run, but `COMBINED MEDIUM` is the preliminary continuous production recommendation. Values are not copied to untested family variants.

No serial identifier is recorded.
