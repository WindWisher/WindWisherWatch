# Controlled false-positive analysis

## M5.2 update

The historical J5 event was outside the retained raw prefix, so its exact trace is not recoverable. M5.2 reproduced recurrent J5-class false confirmations after adding bounded candidate traces. The original code accepted an impulse, one low-g crossing and a later impact; flight started at the first impulse and Garmin did not require landing stabilization.

After correcting those defects, a complete J5 false candidate showed 160 ms consecutive low-g, 240 ms flight, stable landing and direction cosine 0.757. Direction coherence rejected this class while preserving controlled hops at 0.948–0.998.

The discriminator did not generalize to brisk walking. Frozen N5 holdout produced three false confirmations with 248–288 ms flight and direction cosine 0.934–0.988, overlapping controlled positives. The blocker is `FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING`.

The critical M5.1 outcome is the number of confirmed candidates in negative protocols:

```text
confirmed false jumps
candidate count
rejected candidate count
```

J0, J1, J2, J5 and J6 are negative. Recurrent confirmation in any of them is a gate blocker, not a threshold-tuning invitation. Classify the motion first, preserve the baseline algorithm result and increment the algorithm version before any hypothesis-driven change. Do not tune on one J3 execution and call the same motion validation.

J0 MEDIUM and HIGH stationary hardware results: zero on-device candidates and zero confirmed/rejected candidates in both acceleration-only and acceleration-plus-gyro host replay. These are two controlled negative runs, not a false-positive rate claim. Synthetic negative scenarios remain state-machine regressions only and cannot populate this analysis.

J1 MEDIUM normal wrist movement produced two on-device candidates, both rejected, and zero confirmed false jumps. Host replay saw no candidate in the 64-sample raw prefix; it cannot make a claim about the later portion that produced the on-device candidates. This is one controlled motion run, not a false-positive rate.

J1 HIGH produced six on-device candidates, all rejected, and zero confirmed false jumps. Its bounded raw-prefix replay again saw no candidate. The human motions were similar but not mechanically identical, so the higher candidate count is a characterization observation rather than a causal sample-rate claim.

J2 MEDIUM normal walking produced 11 on-device candidates, all rejected, and zero confirmed false jumps. Both host replay modes reproduced three rejected candidates within the bounded raw prefix. Repeated step impacts therefore enter the candidate path but did not complete the experimental jump state machine in this run.

J2 HIGH produced 14 on-device candidates, all rejected, and zero confirmed false jumps. Both replay modes reproduced one rejected candidate in the raw prefix. The walking trials were not mechanically identical, so 14 versus 11 is not attributed solely to sample rate.

J5 MEDIUM fast arm motion produced 20 on-device candidates, including one confirmed false jump and 19 rejections. The operator reported no jump or impact. The experimental 488 ms airtime is therefore false-positive output, not physical airtime. Both bounded-prefix replay modes rejected their three visible candidates, but the prefix does not include the later full-run confirmation. This hardware result blocks M6/Woo validation regardless of synthetic performance.

J5 HIGH produced 25 on-device candidates, all rejected, and no confirmation. This does not negate the MEDIUM failure because the adversarial human motions were similar rather than mechanically replayed. The conservative gate remains blocked.

J6 MEDIUM controlled grounded impacts produced two on-device candidates, both rejected, and zero confirmed false jumps. The bounded raw prefix contained no candidate and did not cover all operator-noted impacts.

J6 HIGH produced three on-device candidates, all rejected, and zero confirmed false jumps. Across all controlled negatives, the decisive failure remains the single J5 MEDIUM fast-arm confirmation. Therefore the negative suite is not clean and M6 remains `NO_GO`.
