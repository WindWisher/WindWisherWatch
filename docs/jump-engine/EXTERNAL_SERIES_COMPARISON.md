# External event-series comparison

Status: IMPLEMENTED host tooling; EXPERIMENTAL vendor agreement, not physical validation.
No Garmin runtime, detector, Canonical Session v1 or backend changes belong to this work.
The existing dirty worktree, including session-journey work, is preserved separately.

## Reproduce the local comparison

From repository root, using the existing ignored sanitized bundle (no extraction):

```sh
node tools/jump-engine/compare-external.mjs \
  research/garmin/jump-engine/results/parallel-20260911/woo-events.sanitized.json \
  research/garmin/jump-engine/results/parallel-20260911/surfr-events.sanitized.json \
  research/garmin/jump-engine/results/parallel-20260911/alignment-exploratory.json \
  1.5
```

The CLI writes JSON to stdout and never writes inputs or commits reports. Output contains
aggregate metrics and relative pair indices, not original event IDs, coordinates, absolute
timestamps or source paths. Keep event-level reports local too. SHA-256 of each loaded
input accompanies the result; hashes identify bytes, not trustworthy provenance by themselves.
Errors are generic to avoid echoing malformed personal payloads. Loading is bounded at
4 MiB per regular JSON file, including files that grow while being read.

## Input contract and units

Version 1.0.0 SANITIZED_EXTERNAL_EVENT_SERIES accepts the existing WOO_BOARD_SENSOR_BLE,
SURFR_GARMIN_FIT and synthetic sources. Time basis must be
SECONDS_FROM_SOURCE_SESSION_START. Event IDs must be unique bounded tokens;
times must be finite, nonnegative, strictly increasing and at most 604800 seconds.
Unordered/permuted inputs and duplicate times are rejected, not silently sorted or merged.

Optional/null heightMeters, airtimeSeconds, distanceMeters and
maximumSpeedMetersPerSecond denote missing metrics and are excluded pairwise from their
metric statistics, not replaced with zero. Finite nonnegative bounds are respectively
200 m, 120 s, 10000 m and 150 m/s. The existing five WOO VendorValue fields are checked
only for finite engineering bounds +/-1e9 and are not compared or assigned physical units.
Unknown fields fail closed. Field names and bounds check the declared units; they cannot
prove the producer actually measured those units or fully anonymized arbitrary ID strings.
Limits are explicit tool resource/input guards, not sporting thresholds or detector tuning.

## Clock fitting is not event evaluation

`fitClock(anchors, kind, provenance)` accepts explicit monotonic anchor pairs in relative
seconds, not event lists. OFFSET fits the mean difference; AFFINE fits centered ordinary
least squares, rejecting degenerate anchor spans. At least one/two anchors respectively
are required; scale must remain positive within 0.9–1.1. Anchors are not automatically
inferred by repeatedly matching the evaluation events. An anchor's correspondence still
needs external justification. A clock fit is not independent calibration.

`compareExternal(candidate, reference, {clock, toleranceSeconds})` only applies the
supplied frozen model. It never adjusts it. Generic clock JSON has exactly these fields:

```json
{
  "kind": "OFFSET",
  "offsetSeconds": 0,
  "scale": 1,
  "provenance": "EXTERNALLY_SUPPLIED_UNVERIFIED"
}
```

The mapping is referenceSeconds = offsetSeconds + scale \* candidateSeconds. Provenance
must be FITTED_SAME_SESSION, FITTED_SEPARATE_DATA_DECLARED or
EXTERNALLY_SUPPLIED_UNVERIFIED. The fit API cannot label its output as unfitted.
Separate-data provenance is caller-declared, not verified split enforcement; every report
keeps independentClockValidation=NOT_ESTABLISHED. For the legacy exploratory alignment
adapter, direction is explicitly WOO -> SurfR and fittedOnSameSession must be true.

## Matching and reporting

Dynamic programming over ordered prefixes maximizes matched count, then minimizes the
sum of absolute aligned time differences. It replaces greedy nearest selection, including
the known [1,2.5] versus [0,1.5] counterexample at 1.1 seconds. Pairs are monotonic and
one-to-one. Inclusive tolerance is in seconds, range 0–60. Exact objective ties follow
a deterministic skip-candidate, skip-reference, match preference. Height and airtime
never select or break ties. A selected pairing is not proof of physical correspondence.

Complexity: O(N*M) time and space, at most 1000 events per series. DP typed-array storage
is 11*(N+1)\*(M+1) bytes, approximately 11 MB at the limit, plus inputs/report overhead.
This is a bounded offline evaluator, not an embedded implementation.

All supplied events count, including different recording windows; no implicit overlap
cropping occurs. Report matched and unmatched indices for both sides. Descriptive
precision=matched/candidateCount and recall=matched/referenceCount, with null for an
empty denominator. These are directional comparator overlap ratios, not physical
precision/recall or Watch detector KPIs. Differences use candidate minus reference;
each metric includes its own pair count, bias and mean absolute difference. Empty
metric sets produce null, not fabricated zero error.

## Local replay verified on 2026-09-12

Generated-bundle hashes match the existing manifest; raw sources were not reopened.
Reused the existing same-session affine fit without modification.

| Tolerance seconds | Matched | WOO unmatched | SurfR unmatched | Time MAD seconds |
| ----------------- | ------- | ------------- | --------------- | ---------------- |
| 1.0               | 90      | 19            | 27              | 0.437973         |
| 1.5               | 100     | 9             | 17              | 0.521425         |
| 2.0               | 101     | 8             | 16              | 0.532873         |
| 3.0               | 105     | 4             | 12              | 0.597393         |

At 1.5 s: height MAD 0.546904 m, WOO-minus-SurfR bias -0.376665 m;
descriptive precision 100/109 and recall 100/117. At 1.0 s: airtime MAD
0.741252 s, bias -0.720200 s. These reproduce the previous aggregate fixture;
they do not constitute new independent evidence. No tolerances were optimized here.

Validation: `npm run check` PASS (format, lint, full host suite, contracts and source
guards); `git diff --check` PASS. No npm audit was run in this task.
Focused tests: 14/14 PASS, including the prior seven reference tests. New tests
cover ambiguity, close events, ties, missing events/metrics, offset/drift, schema/units,
permutations, privacy-field rejection, file bounds and direction. The matching test
checks 768 small inputs against an exhaustive assignment oracle. Native builds are
NOT_RUN_NOT_REQUIRED for this host-only work.

```text
WATCH_VS_VENDOR_EVENT_MATCHING = NOT_RUN
JUMP_HEIGHT_VALIDATED = NO
JUMP_AIRTIME_VALIDATED = NO
JUMP_DETECTION_PRODUCT_READY = NO
SURFR_IMPORT_ROUTE_FROM_GARMIN_CONNECT = NOT_ESTABLISHED
M6_WOO_VALIDATION_GATE = NO_GO
```

Next: use this frozen comparison tooling with explicitly prepared clock references and
a future simultaneous Watch capture. No new collection or vendor sync investigation
was performed or automatically authorized by implementing this evaluator.
