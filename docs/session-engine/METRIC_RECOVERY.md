# Metric recovery

The 60-second M2 checkpoint now includes the compact projector state: distance, maximum/latest valid speed, previous accepted position/time, latest HR/time and bounded counters. It does not include a track-sized collection. The Garmin index stores the checkpoint chunk/frame pointer so normal recovery reads and validates that frame directly.

Recovery restores the newest valid checkpoint and, where supported by the runtime, replays only its bounded tail. It does not recompute the full track. Restoring the same checkpoint is idempotent and cannot add distance twice.

Journals created before the direct pointer use a compatibility search capped at 16 chunks. It inspects frame types and calculates a checksum only for a checkpoint candidate. Completed historical sessions are skipped during discovery, avoiding cumulative startup work.

Finalization remains bounded after the M2 watchdog incident: no whole-journal scan, track replay or metric recomputation is permitted in `stop()`. Host tests make whole-journal validation fail if called during stop; source guards reject loops or frame materialization in Garmin stop.
