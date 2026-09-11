# WOO and SurfR parallel reference session - 2026-09-11

## Purpose

This note records a de-identified black-box comparison from one kitesurf
session recorded concurrently with a board-mounted WOO and SurfR on the
reference Garmin fenix 7. It extends the SurfR-only import observations in
`SURFR_REFERENCE_SESSION_2026-09-11.md`.

The repository fixture contains aggregates and relative event times only. Raw
WOO BLE traffic, SurfR FIT data, GPS, account data and absolute timestamps stay
outside Git in the sibling WindWisher checkout.

For local development, the ignored directory
`research/garmin/jump-engine/results/parallel-20260911/` contains sanitized
event-level WOO and SurfR series, the exploratory alignment and a hash manifest.
It is a workstation handoff rather than a versioned dataset; the committed
aggregate fixture remains the portable regression reference.

## Capture evidence

The WOO memory was captured directly before using the mobile download flow.
The conservative capture sent the previously validated read/download sequence
and no clear or reset command. It ended with `AirsEnd` and contained:

- 109 sequential `Air` records, indexes 0 through 108.
- 109 complete `QhData` blobs, each reconstructed from seven 64-byte chunks.
- Three complete `RawDataStatic` blobs.
- 4,493 BLE notifications and 1,433 reconstructed packets.

The raw stream SHA-256 is
`6b5e65aaab342285045cace89a11ebdcb1f45844bd572e4ba2380b33ce1f7320`.
The parsed artifact SHA-256 is
`9684dc80dbd91ea52dd539ad7d4aff995256c14bfa5f7cb87161d566df3f23b5`.
These hashes identify local evidence without placing its sensitive payload in
the repository.

After the independent capture, WOO mobile detected the device and downloaded
one pending Big Air session. Before publication, its local summary showed
6.3 m maximum height, 5.3 s maximum airtime and 2 h 28 min duration. These
rounded values agree with the captured WOO records. No publication was needed
for this check.

## Vendor summaries

| Field             |            WOO | SurfR Garmin |
| ----------------- | -------------: | -----------: |
| Detected jumps    |            109 |          117 |
| Maximum height    |     6.326721 m |   6.416471 m |
| Average height    |     3.970645 m |   4.268046 m |
| Total height      |   432.800308 m | 499.361359 m |
| Maximum airtime   |     5.292755 s |       6.93 s |
| Recorded duration | about 8880.9 s |   9256.877 s |

Different recording windows account for part of the count difference. The
remaining detection differences must be measured after event alignment rather
than inferred from aggregate counts.

## Exploratory clock alignment

WOO stores event offsets at centisecond resolution. SurfR FIT record times are
whole seconds relative to its session start. The first event sequences showed
the same cadence but a small offset, while the mobile start labels differed by
one displayed minute. The labels are therefore unsuitable as exact alignment
anchors.

An exploratory monotonic one-to-one alignment fitted the affine relation
`surfrElapsed = -2.796879 + 1.000062673 * wooElapsed`. The relation was fitted
and evaluated on the same session, so it is a synchronization estimate rather
than independent clock validation.

| Match tolerance | Matched | SurfR unmatched | WOO unmatched | Time MAE |
| --------------: | ------: | --------------: | ------------: | -------: |
|           1.0 s |      90 |              27 |            19 |  0.438 s |
|           1.5 s |     100 |              17 |             9 |  0.521 s |
|           2.0 s |     101 |              16 |             8 |  0.533 s |
|           3.0 s |     105 |              12 |             4 |  0.597 s |

The 1.5-second result is retained as the primary exploratory view. On its 100
matched events, WOO minus SurfR height has a -0.376665 m bias and 0.546904 m
MAE. On the stricter 90-event, 1-second set, WOO minus SurfR airtime has a
-0.720200 s bias and 0.741252 s MAE. These differences describe agreement
between two proprietary systems, not error against physical truth.

## Consequences for WindWisher Watch

1. Preserve a monotonic sensor clock and a wall-clock anchor so cross-device
   alignment does not depend on minute-rounded UI labels.
2. Evaluate detection counts only after one-to-one event alignment and report
   unmatched events for both systems.
3. Keep timing tolerance, clock model and whether they were fitted on the test
   session in every comparison report.
4. Expect systematic vendor differences in both height and airtime; do not tune
   WindWisher to average them blindly.
5. A future three-way trial must record WindWisher Watch simultaneously and
   freeze the alignment/evaluation method before judging its detector.

## Validation status

```text
WOO_BLE_CAPTURE = VERIFIED_COMPLETE_FOR_109_AIR_AND_QH_EVENTS
WOO_MOBILE_LOCAL_IMPORT = VERIFIED_FOR_ONE_SESSION
WOO_VS_SURFR_PARALLEL_CAPTURE = VERIFIED_FOR_ONE_SESSION
WOO_VS_SURFR_ALIGNMENT = EXPLORATORY_SAME_SESSION_FIT
WINDWISHER_WATCH_CAPTURE_IN_THIS_SESSION = NO
WATCH_VS_VENDOR_EVENT_MATCHING = NOT_RUN
VENDOR_VALUES_AS_PHYSICAL_GROUND_TRUTH = NO
```
