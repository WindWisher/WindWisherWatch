# Garmin jump research capture

## Status

`IMPLEMENTED`, host parser `HOST_VERIFIED`, Garmin builds `BUILD_VERIFIED`, controlled physical behavior `HARDWARE_CHARACTERIZED` on the reference fēnix 7.

`platforms/garmin/jump-research/` is a separate developer app. It requests only the Sensor permission and never participates in Session Engine lifecycle, canonical export, GPS, HR, sync, backend or product UI.

## Capture-first architecture

The sensor callback pairs accelerometer and gyro batch entries, preserves raw timestamps/vectors, derives a marked normalized timestamp, updates fixed statistics and the small experimental detector, then copies numeric values into preallocated parallel arrays. It performs no logging, JSON/string construction, storage I/O, sorting or full-window computation.

After sensor unregister, a 100 ms timer exports at most 12 records per tick with the `WWJUMP|` prefix. Manifest and aggregate records are JSON; motion uses a schema-versioned compact pipe record so the bounded export fits Garmin's physical app-log retention ceiling. Export interruption cannot affect a future sensor callback because acquisition is already stopped. A truncated export fails closed in the host parser.

## Modes and hard bounds

| Mode                     | Raw behavior                                                                    | Time bound |
| ------------------------ | ------------------------------------------------------------------------------- | ---------: |
| `SUMMARY_ONLY`           | No raw samples; statistics and detector aggregate only                          |       30 s |
| `CANDIDATE_WINDOWS`      | Circular recent window; freezes after one confirmed candidate plus bounded tail |       30 s |
| `CONTROLLED_FULL_WINDOW` | Captures a bounded raw prefix plus full-run aggregate statistics                |       12 s |

Global limits are 64 raw samples/export records, eight candidate metadata slots, estimated 88 bytes/sample and 5,632 raw bytes. The 64-record transport ceiling was established after the first physical J0 attempt proved that verbose per-record JSON exceeded Garmin's retained `.BAK` plus `.TXT` capacity. Filling that transport buffer never stops acquisition: aggregate timing, callback and detector statistics continue until the explicit duration bound, while every rejected raw record is counted. Exact Monkey C heap cost is `UNKNOWN` until measured because object/number representation adds overhead.

Circular overwrite of ordinary pre-event history is expected and counted. A non-circular full buffer rejects later samples deterministically and counts them; the summary exposes that count, so the bounded raw prefix is never represented as a complete raw run. Candidate data is never silently resized. Full-session raw IMU remains forbidden.

## Developer controls

- `UP`: MEDIUM/HIGH.
- `DOWN`: capture mode.
- `MENU`: J0–J6 protocol label.
- `START/SELECT`: start or stop.
- `BACK`: cancel an active capture.

The default mode is `CONTROLLED_FULL_WINDOW`. The display contains only research state, protocol/profile, sample count and confirmed-candidate count—no height or product metric.

## Temporary data

Physical output belongs under ignored `research/garmin/jump-engine/results/`. Strip `WWJUMP|` if desired, then run:

```sh
npm run inspect:garmin-jump-capture -- research/garmin/jump-engine/results/capture.ndjson
```

For a physical log rotated by Garmin, pass the older `.BAK` first and active `.TXT` second. The inspector discards a bounded stale prefix and fails closed if the latest manifest block is incomplete:

```sh
npm run inspect:garmin-jump-capture -- capture.BAK capture.TXT
```

The safe result contains aggregates/candidates, not raw vectors, coordinates, HR or serials. Raw logs must not be committed.
