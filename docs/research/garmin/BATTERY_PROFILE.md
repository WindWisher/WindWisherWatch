# Battery profile

Evidence levels are explicit. These are single-device observational runs on the reference fēnix 7; they support relative profile selection but are not autonomy or commercial battery claims.

| Run             |  Duration | Battery delta | Observed points/hour | Relative to baseline | Evidence          |
| --------------- | --------: | ------------: | -------------------: | -------------------: | ----------------- |
| BASELINE        | 33.21 min |       -0.3802 |                 0.69 |                1.00x | HARDWARE_VERIFIED |
| COMBINED LOW    | 31.85 min |       -1.1273 |                 2.12 |                3.09x | HARDWARE_VERIFIED |
| COMBINED MEDIUM | 31.91 min |       -1.1666 |                 2.19 |                3.19x | HARDWARE_VERIFIED |

COMBINED MEDIUM was only about 3% above COMBINED LOW in these runs. With N=1 per condition and uncontrolled temperature, that is too small to establish a material energy difference. Both combined profiles cost substantially more than baseline because they enable GPS, IMU, HR and pressure together.

The device exposes fractional battery readings, so `INSUFFICIENT_RESOLUTION_FOR_RATE_ESTIMATE` does not apply. The estimates remain context-bound: display behavior was the default lab view, no manual backlight activation was reported, exact temperature was not recorded, and sensor/GNSS conditions can vary.

Conclusion: no obviously inviable battery behavior was observed over the controlled half-hour windows. `COMBINED MEDIUM` is acceptable for M2 prototyping, subject to production soak and autonomy validation later.
