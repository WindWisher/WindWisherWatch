# Pre-Woo validation

## Dataset separation

Tuning/diagnostic trials drove structural changes. After the final directional configuration was frozen, N0, N1, N2, N4 and N5 were run as holdout. N3 directional was a pre-freeze control, not holdout. N6 and positive holdout were not run after N5 established a systematic blocking failure.

## Frozen holdout confusion matrix

| Operator class         | Trials | Expected positive detected | Expected positive missed | Expected negative detected | Expected negative rejected |
| ---------------------- | -----: | -------------------------: | -----------------------: | -------------------------: | -------------------------: |
| N0 stationary          |      1 |                          0 |                        0 |                          0 |                          1 |
| N1 slow wrist rotation |      1 |                          0 |                        0 |                          0 |                          1 |
| N2 fast wrist rotation |      1 |                          0 |                        0 |                          0 |                          1 |
| N4 walking             |      1 |                          0 |                        0 |                          0 |                          1 |
| N5 brisk walking       |      1 |                          0 |                        0 |                          1 |                          0 |

N5 produced three confirmed false events within its negative trial. Event counts are not treated as independent operator trials.

## Preliminary metrics

- controlled tuning/diagnostic events after takeoff-window correction: 12/12 detected;
- frozen negative trials: 4/5 rejected without a confirmation;
- confirmed false positives: 3 in the N5 trial;
- candidate rejection remained normal and desirable: N2 rejected 28/28 and N4 rejected 36/36 candidates;
- no timestamp duplicates, out-of-order samples, gaps or fallback interpolation occurred in the reported M5.2 hardware trials.

These are controlled-motion research results, not kitesurf precision or recall.

## Gate

`M6_WOO_VALIDATION_GATE = NO_GO`

Blocker: `FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING`. The accel-only features currently tested cannot separate the shortest controlled hop from brisk-walking false events without overlapping timing and direction ranges.
