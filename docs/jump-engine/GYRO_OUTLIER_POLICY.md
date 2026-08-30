# Gyroscope outlier policy

M1.1-B observed implausible values around 14,071–32,764 degrees/second, sometimes near integer limits. Startup/listener, batch-boundary, unit conversion, saturation, sentinel and firmware explanations remain hypotheses; none is established.

Every provided vector remains in the bounded research observation and is classified:

- `PLAUSIBLE`;
- `SUSPICIOUS`;
- `INVALID_OUTLIER_CANDIDATE`;
- `UNAVAILABLE`.

Values are not silently clamped or converted into plausible motion. Invalid candidates add `GYRO_OUTLIER`, reduce confidence and do not independently trigger or reject a jump. The engine therefore continues using acceleration when gyro is missing or unreliable.
