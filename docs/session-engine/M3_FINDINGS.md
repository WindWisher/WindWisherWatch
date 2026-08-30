# M3 findings

## Current status

`COMPLETE`

Core time, current/max speed, incremental Haversine distance, latest HR, GPS/HR freshness, health state and compact recovery state are implemented for host and Garmin. Host vectors cover movement, stationary position, spikes, duplicates, invalid values, stale data, deterministic restore, eight virtual hours and bounded stop. The complete repository suite passes 36/36, including 31 Session Engine tests. Garmin Run No Evil passes 10/10 logically, and sequential `fenix7` plus `fenix7s` builds pass. Normal simulator start/finalize reaches `COMPLETED` with `VALID` integrity. Hardware remains pending.

Connect IQ SDK 9.2.0 produced internal compiler errors when the two target builds ran concurrently; the same `fenix7` and `fenix7s` builds pass sequentially. Garmin builds must therefore remain sequential in this environment. Informative type analysis (`-l 2`) is now explicit in the M3 build/test scripts and is not a runtime relaxation.

Average HR was deferred: it is inexpensive but no approved live screen requires it. Heading, average speed, active time and all advanced/sport analytics remain post-session WindWisher ownership. No Jump Engine, sync, backend, FIT product path, forecast or product UI was added.

Exact device GPS accuracy remains the platform fix-quality enum in this harness; no meter accuracy is fabricated. The 80 m/s implied-speed ceiling is only a corruption bound. Personal coordinates, routes and HR are excluded from fixtures and documents.

Power-loss atomicity remains `UNKNOWN`. M3 must repeat short physical movement/finalization and checkpoint recovery because its checkpoint payload changed.

The corrected M3 developer build was installed on representative physical hardware. During a safe short movement smoke, current speed changed, maximum speed remained available, distance increased, GPS reached `VALID`, HR was available, and normal stop reached `COMPLETED` without watchdog/crash. Only these categorical observations are recorded; personal metric values, coordinates and route are not retained. Physical metric acquisition/finalization is `VERIFIED`; M3 checkpoint recovery remains `NOT_RUN`.

The first short physical recovery reached `RECOVERED`, preserved maximum speed and distance, and finalized to `COMPLETED`. A second run beyond the checkpoint interval crashed on relaunch. `CIQ_LOG.YML` identified `Watchdog Tripped Error - Code Executed Too Long` in `SeChecksum.calculate`, called by `GarminSessionStore.latestCheckpoint`. The recovery search had checksummed every frame while walking backward. The fix records a direct checkpoint chunk/frame pointer, validates only that frame, limits pre-pointer compatibility search to 16 chunks, and skips completed historical sessions during discovery. This fix is `IMPLEMENTED_NOT_YET_HARDWARE_RETESTED`.

After installing the fix, the pre-pointer session that had triggered the crash reopened as `RECOVERED`, retained maximum speed and distance, and explicitly finalized to `COMPLETED` without another crash. The bounded compatibility path is therefore `VERIFIED`. A new session was then allowed to pass its checkpoint, interrupted, reopened through the direct pointer as `RECOVERED`, and finalized to `COMPLETED`. Direct-pointer physical recovery is `VERIFIED`; the watchdog did not recur.
