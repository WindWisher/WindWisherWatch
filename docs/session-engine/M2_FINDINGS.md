# M2 findings

## Current status

`COMPLETE`

The deterministic Session Engine, framed journal, chunking, checksum validation, checkpoints, stale-index-tolerant recovery, bounded buffers, quality model and Garmin developer harness are implemented. Host tests, Garmin unit tests, physical start/finalize and physical interrupted-session recovery are verified.

The first 5–10 minute physical finalize attempt is `FAILED_FIXED_PENDING_RETEST`. The device emitted a Connect IQ orange-triangle crash and `CIQ_LOG.YML` identified `Watchdog Tripped Error - Code Executed Too Long` in `SeChecksum.calculate`, called by the whole-journal scan in `GarminSessionStore.validate` during `SessionEngine.stop`. The journal Object Store file was 2,313,784 bytes and the final frame had already been appended before the scan.

The fix makes completion validation bounded to the final chunk (at most 16 frames), removes the controller's duplicate validation pass, and restores recovery state from the newest valid checkpoint instead of materializing every frame in RAM. Every appended frame is still read back and checksum-verified before the durable index advances. Host tests pass 19/19 and Garmin tests pass 6/6 after this change.

The corrected build was installed on physical hardware and a 60–90 second session reached `COMPLETED` without the Connect IQ crash. Physical start/finalize is therefore `VERIFIED`. A second physical session was allowed to pass its first checkpoint, exited with BACK/LAP instead of normal stop, reopened as `RECOVERED`, and explicitly finalized to `COMPLETED`. Physical interrupted-session recovery and recovered finalization are therefore `VERIFIED`; the equivalent simulator path is also verified.

M2 deliberately excludes distance and max-speed projections, raw full-session IMU, Jump Engine, sync, backend, analytics and product UI. Current speed and HR are essential live input state; richer metrics belong to M3.

`POWER_LOSS_ATOMICITY = UNKNOWN`. Host fault injection proves partial-tail recovery semantics without unsafe device corruption.
