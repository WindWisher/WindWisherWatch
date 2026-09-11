# SurfR Garmin reference session - 2026-09-11

## Purpose

This note transfers verified, de-identified observations from a consented SurfR
session recorded on the reference Garmin fenix 7. It is an interoperability and
black-box comparison reference, not ground truth and not a detector change.

The sanitized aggregate is stored in
`fixtures/jump-engine/surfr-reference-session.json`. Raw FIT data, exact GPS,
absolute timestamps and application storage remain outside this repository.

## Evidence boundary

The activity FIT was preserved on the watch before the completed session became
visible in SurfR mobile and Garmin Connect. The transfer route was not captured,
so this evidence does not establish that SurfR imports the session from Garmin
Connect. After both services showed the session, the activity and SurfR
application storage files retained the same SHA-256 hashes. The SurfR mobile
detail screen showed rounded versions of values already encoded in the FIT. No
post-import recalculation or watch-file rewrite was observed.

This verifies the inspected session only. It does not prove that all SurfR
versions or devices behave identically, and it does not reveal SurfR's watch
algorithm.

## Observed session summary

| Field                 |    FIT value |           SurfR mobile display |
| --------------------- | -----------: | -----------------------------: |
| Duration              |   9256.877 s |         not used in this check |
| Distance              |   58.8719 km |         not used in this check |
| Jumps                 |          117 |                            117 |
| Maximum height        |   6.416471 m |                          6.4 m |
| Average height        |   4.268046 m | not shown in inspected summary |
| Total height          | 499.361359 m | not shown in inspected summary |
| Maximum airtime       |       6.93 s |                          6.9 s |
| Maximum distance      |  54.340019 m |                           54 m |
| Session maximum speed | 40.0752 km/h |                        40 km/h |

The FIT advertised `TheSurfrApp_100_3.0.16`, a 100 Hz internal sample-rate
field, a 1.5 m minimum-height field, per-axis calibration offsets and gains,
and zero values for `dualprocessing`, `surfrai` and `syncissue`. The FIT record
stream itself was approximately 1 Hz and did not contain the full 100 Hz raw
IMU stream.

## Observed jump representation

Each resolved jump was repeated across adjacent FIT records and could be
deduplicated by its first vendor timestamp. The inspected developer fields had
the following observed semantics:

| Field        | Observed meaning                                           |
| ------------ | ---------------------------------------------------------- |
| `jump[0]`    | height in metres                                           |
| `jump[1]`    | airtime in seconds                                         |
| `jump[2]`    | distance in metres                                         |
| `jump[3]`    | per-jump maximum speed in metres per second                |
| `gps`        | start and end coordinates                                  |
| `jumpchart`  | 20-value reduced height profile, approximately centimetres |
| `timestamps` | three vendor event timestamps                              |

The first decoded jump occurred 135 seconds after session start and contained
2.520280 m height, 3.29 s airtime and 12.583574 m distance. SurfR displayed
2.52 m, 3.29 s, 13 m and `2m 15s`, matching straightforward rounding and the
relative FIT time.

The mobile maximum-speed card maps to the FIT session maximum, not to the
largest per-jump `jump[3]` value. This distinction must be preserved in the
WindWisher session model and UI.

## Consequences for WindWisher Watch

1. Record raw, timestamped sensor observations when platform and resource
   budgets permit; a reduced vendor curve is insufficient for algorithm replay.
2. Preserve algorithm version, sampling profile, calibration, quality flags and
   event timestamps with every derived jump.
3. Keep session maximum speed separate from per-jump approach or maximum speed.
4. Use stable event identity so repeated FIT developer fields do not become
   duplicate jumps during import.
5. Export explicit units and relative event timing without requiring vendor
   fields in Canonical Session v1.
6. Use this fixture for parser and mapping regression only. Runtime threshold
   tuning requires synchronized WindWisher input and an independent test split.

## Validation status

```text
SURFR_REFERENCE_IMPORT = VERIFIED_FOR_ONE_SESSION
SURFR_IMPORT_ROUTE_FROM_GARMIN_CONNECT = NOT_ESTABLISHED
SURFR_MOBILE_RECALCULATION_OBSERVED = NO
SURFR_FULL_RATE_RAW_IMU_AVAILABLE = NO
WATCH_VS_SURFR_SIMULTANEOUS_CAPTURE = NOT_RUN
WATCH_VS_SURFR_EVENT_MATCHING = NOT_RUN
SURFR_AS_PHYSICAL_GROUND_TRUTH = NO
JUMP_DETECTION_PRODUCT_READY = NO
```
