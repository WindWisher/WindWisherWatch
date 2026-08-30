# Experimental signal model

Accelerometer magnitude `sqrt(x² + y² + z²)` is required and orientation-invariant, but wrist motion means it is not laboratory free fall. A three/five-sample moving average supplies light smoothing for MEDIUM/HIGH; raw magnitude remains available for impulses.

The host input unit is metres per second squared. A future Garmin adapter must explicitly convert the Sensor Lab's reported millig values and preserve the original unit/provenance; the engine must never guess units.

The deliberately small feature set is:

- raw and smoothed acceleration magnitude;
- peak acceleration and minimum flight-region acceleration;
- raw gyro vector, gyro magnitude and quality class;
- timestamp provenance and quality flags;
- optional pressure and speed context.

Gyro is never required. Pressure at about 1 Hz and GPS at about 1 Hz cannot determine fine takeoff/landing timing; they are contextual only. No height, horizontal distance, vertical speed, sensor fusion or derived sport score exists.

Thresholds are centralized in `tools/jump-engine/config.mjs` and tied to `experimental-0.1-medium` or `experimental-0.1-high`. They make synthetic tests deterministic; they are not scientifically calibrated thresholds or product accuracy claims.
