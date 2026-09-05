# Phase-scoped jump features

Algorithm `experimental-0.5-phase-scoped-envelope` replaces the ambiguous global acceleration peak with bounded features whose ownership ends at an explicit state transition.

| Feature              | Scope                                                   | Classification role        |
| -------------------- | ------------------------------------------------------- | -------------------------- |
| `takeoffPeakAccel`   | candidate start through the sample that enters flight   | required envelope evidence |
| `flightMinimumAccel` | flight entry through the landing-trigger sample         | required envelope evidence |
| `landingPeakAccel`   | raw landing-trigger sample only                         | supporting evidence        |
| `postEventPeakAccel` | samples after the landing decision through finalization | diagnostics only           |

The canonical takeoff threshold is exactly `3000 mg`. Host conversion uses `1 mg = 9.80665 / 1000 m/s²` without intermediate rounding, producing `29.41995 m/s²`. Garmin compares the native magnitude directly with `3000 mg`.

Landing peak is not part of the envelope. M5.4 did not establish that late landing or walking peaks distinguish a jump, and using the full post-event maximum would risk reviving AT2-like false positives.

All updates remain O(1), candidate retention remains at most eight, and no full-session IMU is retained.
