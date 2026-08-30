# Clock and timestamp model

| Clock                | Domain                  | Verified use                                                                    | Remaining limitation                                                |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `System.getTimer()`  | Monotonic milliseconds  | Lifecycle, callback receipt, TTFF, runtime and rollover-safe elapsed arithmetic | Platform rollover boundary not forced on hardware                   |
| IMU `timestamp[]`    | Per-sample milliseconds | 10/25/50/100 Hz arrays and complete streaming distributions                     | Rare invalid/backward batches observed; never normalize silently    |
| `Position.Info.when` | Optional GPS epoch      | Presence verified                                                               | Exact relation to monotonic callback clock remains platform-defined |
| `Time.now()`         | Epoch seconds           | Experiment anchors                                                              | Too coarse for sample alignment                                     |

The M1.1-B aggregator uses fixed-memory relative histograms. A gap is `interval > 2.5 * expectedInterval`; it retains raw min/max, gap count, duplicates, out-of-order count and deterministic upper-bound approximations for median/P95/P99. IMU callback cadence and maximum batch size are measured independently of sensor timestamps.

Stable evidence includes:

- MEDIUM: 40–48 ms sample intervals, no gaps in stationary and control runs.
- HIGH: 16–24 ms sample intervals over 17.18 minutes, no gaps.
- MAX: 8–16 ms sample intervals in the bounded run, no gaps.
- COMBINED MEDIUM control: 374 one-second callbacks, batches of 25, no callback or sample gaps.
- COMBINED MEDIUM soak: 1,913 callbacks, batches of 25, no gaps.
- GPS/HR/pressure: approximately one-second callbacks with no gaps in the long combined runs.

One combined MEDIUM run contained impossible positive sensor-timestamp jumps; one LOW soak contained a single ten-sample backward batch. Callback cadence remained continuous, and the control/soak runs did not reproduce persistent degradation. Raw IMU timestamps therefore require quality flags and callback/batch provenance. M2 can use the monotonic callback clock for session lifecycle and preserve raw per-sample time for later quality-aware normalization.

Official references: [System.getTimer](https://developer.garmin.com/connect-iq/api-docs/Toybox/System.html), [AccelerometerData](https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/AccelerometerData.html), and [Position.Info](https://developer.garmin.com/connect-iq/api-docs/Toybox/Position/Info.html).
