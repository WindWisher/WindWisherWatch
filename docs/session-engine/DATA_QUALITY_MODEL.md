# Data quality model

Quality codes are bounded enums, not arbitrary log strings:

- timestamp duplicate, out-of-order or implausible;
- source unavailable or poor GPS fix;
- sample gap;
- persistence retry/failure;
- low memory/storage;
- recovery applied;
- partial tail discarded;
- bounded-buffer overflow.

Severity is `INFO`, `WARNING` or `ERROR`. Runtime state keeps counters plus a bounded recent-event list (16 by default). Relevant events are journal frames; repeated events do not create an unbounded in-memory history.

Critical storage/resource errors move the engine to `FAILED`. Motion samples are counted and can emit quality, but raw motion values are not persisted. Developer logs include transitions/integrity only and exclude coordinates, HR values and secrets.
