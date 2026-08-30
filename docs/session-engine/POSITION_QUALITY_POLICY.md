# Position quality policy

An accepted position requires usable Garmin fix quality, finite in-range coordinates and a forward normalized session timestamp. Host inputs may additionally supply accuracy meters; values above 100 m are rejected. Garmin `QUALITY_USABLE` and `QUALITY_GOOD` are accepted; poorer states are not silently promoted.

Ground speed is independently valid from 0 through 80 m/s. Missing speed leaves speed unavailable/unchanged; a negative or larger value is rejected for speed metrics without inventing zero. The 80 m/s ceiling is a conservative corruption guard, not a sport-performance claim.

Each segment uses Haversine distance. Duplicate/backward timestamps, invalid fixes, duplicate samples and segments implying more than 80 m/s do not add distance. Relevant counters and compact quality events distinguish `GPS_POOR_FIX`, `GPS_DUPLICATE`, `GPS_BACKWARD_TIMESTAMP`, `GPS_INVALID_SPEED` and `GPS_SPIKE`. No Kalman filter or sport-specific smoothing is introduced.

Position frames preserve normalized time, coordinates, Garmin quality, usability and GPS ground-speed provenance. Tests use synthetic equatorial coordinates only.
