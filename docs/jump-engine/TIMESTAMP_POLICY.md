# Jump research timestamp policy

Flight timing uses the SessionClock monotonic domain, never wall clock. Each normalized observation preserves:

- raw sample timestamp;
- callback monotonic timestamp;
- normalized timestamp;
- `RAW_SAMPLE`, `CALLBACK_FALLBACK` or `CALLBACK_INTERPOLATED` provenance;
- typed quality flags.

A finite strictly increasing raw timestamp is preferred. Duplicate, backward or invalid raw time falls back to callback time; if that is not ahead, one expected sample interval is interpolated. Both paths add `TIMESTAMP_DEGRADED`. Gaps beyond three expected intervals add `SAMPLE_GAP`. No fallback is represented as a measured sensor timestamp, and degraded timing lowers confidence.

Sequence duplicates/out-of-order observations are ignored and counted, preventing replay duplication. An open candidate at end of input is rejected rather than assigned an invented landing.
