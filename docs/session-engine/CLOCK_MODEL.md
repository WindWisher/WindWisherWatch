# Session Engine clock model

Lifecycle elapsed time uses a monotonic clock only. The wall clock is an anchor for interchange, never the elapsed source.

The clock port provides monotonic milliseconds and epoch seconds. Rollover-safe subtraction handles the Garmin timer boundary. Recovery restores elapsed time from the latest valid checkpoint; downtime is not counted as recording time. Automatic resume and multi-segment continuity are deferred.

Every source sample retains timestamp provenance:

- source raw timestamp when present;
- callback monotonic timestamp;
- session-relative timestamp;
- explicit callback fallback classification when source time is missing.

Duplicate, backward, implausible-jump and gap observations become structured quality events. Raw source time is not silently replaced or normalized.
