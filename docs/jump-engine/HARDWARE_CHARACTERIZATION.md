# M5.1 hardware characterization

## Evidence status

Physical characterization is complete for one controlled J0–J6 MEDIUM/HIGH pass on the reference fēnix 7. This document distinguishes structurally valid hardware captures from incomplete attempts and does not generalize to other devices or kitesurf conditions.

| Protocol                   | MEDIUM                    | HIGH                    | Evidence                                                                                |
| -------------------------- | ------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| J0 stationary              | `VERIFIED`                | `VERIFIED`              | Comparable 12 s hardware captures plus host replay                                      |
| J1 wrist movement          | `VERIFIED`                | `VERIFIED`              | Comparable 12 s hardware captures; host replay covers bounded raw prefixes              |
| J2 walking                 | `VERIFIED`                | `VERIFIED`              | Comparable 12 s hardware captures; bounded raw-prefix replay                            |
| J3 safe small hop          | `VERIFIED_EXPERIMENTAL`   | `VERIFIED_MISSED_EVENT` | MEDIUM confirmed one pattern; HIGH rejected two candidates for one operator-noted event |
| J4 repeated safe hops      | `VERIFIED_EXPERIMENTAL`   | `VERIFIED_EXPERIMENTAL` | Three operator-noted hops and three confirmations under both profiles                   |
| J5 fast arm motion         | `VERIFIED_FALSE_POSITIVE` | `VERIFIED`              | MEDIUM produced one false confirmation; HIGH rejected all candidates                    |
| J6 safe impact-like motion | `VERIFIED`                | `VERIFIED`              | Three grounded impacts; zero confirmations under both profiles                          |

For every run record only non-sensitive experiment/protocol/profile ids, requested/observed rate, callback/batch/timestamp/gyro aggregates, buffer/drop counts, memory, on-device candidate aggregate and safe host replay result. Never record coordinates, HR, serial, route or credentials in this document.

Controlled hops are positive motion references, not kitesurf jumps. J0/J1/J2/J5/J6 confirmed candidates count as controlled false positives. Human event counts are coarse operator notes, not precise ground truth.

## J0 stationary — MEDIUM

Evidence: `VERIFIED` from the final bounded physical capture. Earlier installation/log-transport attempts are retained only as invalid diagnostics and do not contribute to this result.

- Requested rate: 25 Hz; device-reported maximum: 100 Hz.
- Duration: 12,021 ms; observed samples: 275 (22.88 samples/s over the bounded wall-clock interval).
- Raw transport: 64 contiguous samples exported; 211 later raw samples deliberately rejected and counted after the transport buffer filled. Aggregate statistics continued for the full run.
- Callbacks: 11 batches, each 25 samples; maximum inter-callback interval 1,012 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- Callback processing: mean 48.36 ms, max 55 ms. All 11 values landed in the current open-ended `over8` histogram bucket, so p95/p99 are conservatively `>8 ms`; the serialized numeric overflow marker is not treated as an exact percentile.
- Gyro outliers: zero.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end. No growth is inferred from a single run.
- On-device detector: zero candidates, zero confirmed, zero rejected, final state `GROUND`.
- Host replay, acceleration-only and acceleration-plus-gyro: zero confirmed and zero rejected candidates.
- Completion: `COMPLETED`, structural count 64/64.

## J0 stationary — HIGH

Evidence: `VERIFIED` from a bounded physical capture comparable to J0 MEDIUM.

- Requested rate: 50 Hz; device-reported maximum: 100 Hz.
- Duration: 12,025 ms; observed samples: 550 (45.74 samples/s over the bounded wall-clock interval).
- Raw transport: 64 contiguous samples exported; 486 later raw samples deliberately rejected and counted. Aggregate statistics continued for the full run.
- Callbacks: 11 batches, each 50 samples; maximum inter-callback interval 1,011 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- Callback processing: mean 92.73 ms, max 107 ms. All 11 values landed in the current open-ended `over8` bucket, so p95/p99 remain conservatively `>8 ms`; the serialized overflow marker is not an exact percentile.
- Gyro outliers: zero.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- On-device detector: zero candidates, zero confirmed, zero rejected, final state `GROUND`.
- Host replay, acceleration-only and acceleration-plus-gyro: zero confirmed and zero rejected candidates.
- Completion: `COMPLETED`, structural count 64/64.

## J1 wrist movement — MEDIUM

Evidence: `VERIFIED` controlled negative hardware run; the operator performed normal wrist movements and varied rotations without jumps or impacts.

- Duration: 12,026 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,009 ms; mean/max processing 47.82/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: two candidates, zero confirmed and two rejected; final state `GROUND`.
- Host replay of the bounded raw prefix: zero candidates in acceleration-only and acceleration-plus-gyro modes. This does not replay the later full-run candidates and is not represented as full-run equivalence.
- Gyro quality: 178 of 275 full-run samples carried the provisional outlier flag. Within the 64-sample raw prefix, 22 of 192 axis values exceeded 3,000 degrees/s, none reached 14,000 degrees/s and the maximum absolute axis value was 7,561.80 degrees/s. These are implausible for normal wrist motion and remain artifact/saturation evidence, not physical rotation evidence.
- Memory: 758,168 free bytes at start and 758,504 at capture end; 23,504 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J1 wrist movement — HIGH

Evidence: `VERIFIED` controlled negative hardware run using similar, but not mechanically identical, normal wrist movements and rotations.

- Duration: 12,019 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,040 ms; mean/max processing 94/108 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: six candidates, zero confirmed and six rejected; final state `GROUND`.
- Host replay of the bounded raw prefix: zero candidates in acceleration-only and acceleration-plus-gyro modes. This does not replay the later full-run candidates.
- Gyro quality: 468 of 550 full-run samples carried the provisional outlier flag. Within the raw prefix, 47 of 192 axis values exceeded 3,000 degrees/s, none reached 14,000 degrees/s and the maximum absolute axis value was 5,866.24 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J2 walking — MEDIUM

Evidence: `VERIFIED` controlled negative hardware run with normal walking.

- Duration: 12,022 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,009 ms; mean/max processing 48.45/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: 11 candidates, zero confirmed and 11 rejected; final state `GROUND`.
- Host replay of the bounded raw prefix: three candidates, all rejected, in both acceleration-only and acceleration-plus-gyro modes. No confirmed false jump.
- Gyro quality: 114 of 275 full-run samples carried the provisional outlier flag. Within the raw prefix, 45 of 192 axis values exceeded 3,000 degrees/s, none reached 14,000 degrees/s and the maximum absolute axis value was 8,883.56 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J2 walking — HIGH

Evidence: `VERIFIED` controlled negative hardware run with normal walking at a similar but not mechanically controlled pace.

- Duration: 12,019 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,013 ms; mean/max processing 94.45/108 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: 14 candidates, zero confirmed and 14 rejected; final state `GROUND`.
- Host replay of the bounded raw prefix: one candidate, rejected, in both acceleration-only and acceleration-plus-gyro modes. No confirmed false jump.
- Gyro quality: 266 of 550 full-run samples carried the provisional outlier flag. Within the raw prefix, 51 of 192 axis values exceeded 3,000 degrees/s, none reached 14,000 degrees/s and the maximum absolute axis value was 8,120.04 degrees/s.
- Memory: 758,168 free bytes at start and 758,504 at capture end; 23,504 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J3 safe small hop — MEDIUM

Evidence: `VERIFIED_EXPERIMENTAL` controlled positive reference. The operator reported one small two-foot hop near the beginning of the run; this is not kitesurf ground truth.

- Duration: 12,021 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,037 ms; mean/max processing 47.82/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: two candidates, one confirmed and one rejected; final state `GROUND`. The last experimental airtime was 776 ms.
- The 776 ms value is `UNVALIDATED`: it is implausibly long for the coarse operator description and is not accepted as physical airtime or a product metric.
- Host replay of the bounded raw prefix: two rejected candidates in both modes. One entered takeoff near 1,968 ms, but the prefix ended before landing/post-event completion; therefore replay disagreement is classified as `TRUNCATED_RAW_WINDOW`, not a full-run detector contradiction.
- Gyro quality: two provisional outlier samples over the full run. The raw prefix contained no axis above 3,000 degrees/s; maximum absolute axis value 2,652.84 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J3 safe small hop — HIGH

Evidence: `VERIFIED_MISSED_EVENT` controlled positive reference. The operator reported one small two-foot hop near the beginning; the human motion was not mechanically identical to MEDIUM.

- Duration: 12,024 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,009 ms; mean/max processing 93.18/107 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: two candidates, zero confirmed and two rejected; final state `GROUND`. Against the coarse operator note, this run contains one missed controlled event.
- Host replay of the bounded raw prefix: zero candidates in both modes. It cannot establish whether the operator event fell inside the retained prefix.
- Gyro quality: one provisional full-run outlier sample. The raw prefix contained no axis above 3,000 degrees/s; maximum absolute axis value 158.60 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

The MEDIUM confirmation versus HIGH miss is a repeatability finding, not proof of sample-rate causation. A single pair of human hops cannot establish sensitivity ordering.

## J4 repeated safe hops — MEDIUM

Evidence: `VERIFIED_EXPERIMENTAL` controlled positive repeatability reference. The operator reported three small two-foot hops at approximately 1, 4 and 7 seconds; this is coarse human annotation, not kitesurf ground truth.

- Duration: 12,021 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,010 ms; mean/max processing 47.91/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: three candidates, three confirmed and zero rejected; final state `GROUND`. The last experimental airtime was 776 ms.
- The on-device count matches the coarse operator event count for this run. Individual event alignment and airtimes are unavailable in the aggregate and remain `UNVALIDATED`.
- Host replay of the bounded raw prefix: one candidate with takeoff at 1,800 ms and landing at 2,376 ms, rejected only because the prefix ended before post-event completion (`SESSION_ENDED`). Acceleration-plus-gyro added `GYRO_OUTLIER` but did not change classification.
- Gyro quality: six provisional full-run outlier samples. The raw prefix contained one axis above 3,000 degrees/s, none at or above 14,000 degrees/s, with a 4,064.52 degrees/s maximum.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J4 repeated safe hops — HIGH

Evidence: `VERIFIED_EXPERIMENTAL` controlled positive repeatability reference. The operator again reported three small hops at approximately 1, 4 and 7 seconds; motions were not mechanically identical to MEDIUM.

- Duration: 12,021 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,012 ms; mean/max processing 95.91/110 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: five candidates, three confirmed and two rejected; final state `GROUND`. The three confirmations match the coarse operator event count.
- Last experimental airtime: 672 ms, still `UNVALIDATED`; individual event alignment and airtimes are unavailable from the aggregate.
- Host replay of the 64-sample HIGH prefix: zero candidates in either mode. At 50 Hz this prefix covers too little elapsed time to represent the later operator events and cannot assess full-run equivalence.
- Gyro quality: 14 provisional full-run outlier samples. The raw prefix contained no axis above 3,000 degrees/s; maximum absolute axis value 592 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J5 fast arm motion — MEDIUM

Evidence: `VERIFIED_FALSE_POSITIVE` controlled negative hardware run. The operator kept both feet grounded and performed rapid, varied arm rotations, swings and direction changes without impacts or jumps.

- Duration: 12,020 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,017 ms; mean/max processing 48.73/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: 20 candidates, one confirmed and 19 rejected; final state `GROUND`. The confirmed candidate is a controlled false positive. Its experimental airtime was 488 ms and is not a physical jump metric.
- Host replay of the bounded raw prefix: three candidates, all rejected, in both modes. The prefix does not cover the full-run false confirmation and cannot overturn the on-device result.
- Gyro quality: 235 of 275 full-run samples carried the provisional outlier flag. Within the raw prefix, 64 of 192 axis values exceeded 3,000 degrees/s, three reached at least 14,000 degrees/s and the maximum absolute axis value was 18,347.40 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

This recurrent controlled false positive is a gate blocker. It must remain as baseline evidence; no threshold is tuned during this protocol sequence.

## J5 fast arm motion — HIGH

Evidence: `VERIFIED` controlled negative hardware run using similar but not mechanically identical fast arm rotations, swings and direction changes with both feet grounded.

- Duration: 12,022 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,012 ms; mean/max processing 95.18/106 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: 25 candidates, zero confirmed and 25 rejected; final state `GROUND`. No false confirmation occurred in this HIGH run.
- Host replay of the 64-sample prefix: zero candidates in either mode. The operator motion evidently fell mainly outside this short prefix; it cannot assess the later full-run candidate sequence.
- Gyro quality: 472 of 550 full-run samples carried the provisional outlier flag. The raw prefix contained no axis above 3,000 degrees/s and a 235.48 degrees/s maximum, further showing that the prefix did not represent the later adversarial motion.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

HIGH non-reproduction does not clear the MEDIUM false-positive gate. The two human motion executions are not interchangeable controlled inputs.

## J6 controlled impact / landing-like motion — MEDIUM

Evidence: `VERIFIED` controlled negative hardware run. The operator reported three moderate grounded foot strikes while retaining support and without a jump or flight phase.

- Duration: 12,024 ms; observed samples: 275; 64 contiguous prefix samples exported and 211 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 25; maximum inter-callback interval 1,012 ms; mean/max processing 47.45/54 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: two candidates, zero confirmed and two rejected; final state `GROUND`. No false jump was confirmed.
- Host replay of the bounded raw prefix: zero candidates in both modes. The prefix does not represent all three operator-noted impacts.
- Gyro quality: zero provisional full-run outliers. The raw prefix contained no axis above 3,000 degrees/s; maximum absolute axis value 1,308.28 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## J6 controlled impact / landing-like motion — HIGH

Evidence: `VERIFIED` controlled negative hardware run. The operator again reported three moderate grounded foot strikes without a jump or flight phase; motions were not mechanically identical to MEDIUM.

- Duration: 12,020 ms; observed samples: 550; 64 contiguous prefix samples exported and 486 later raw records deliberately rejected/countable.
- Callbacks: 11 batches of 50; maximum inter-callback interval 1,002 ms; mean/max processing 94.18/108 ms.
- Timestamp quality: zero duplicates, out-of-order values, gaps or fallback/interpolated timestamps.
- On-device full-run detector: three candidates, zero confirmed and three rejected; final state `GROUND`. No false jump was confirmed.
- Host replay of the bounded raw prefix: zero candidates in both modes. The prefix does not represent all three operator-noted impacts.
- Gyro quality: four provisional full-run outliers. The raw prefix contained no axis above 3,000 degrees/s; maximum absolute axis value 1,087.48 degrees/s.
- Memory: 758,520 free bytes at start and 758,680 at capture end; 23,328 used bytes at capture end.
- Completion: `COMPLETED`, structural count 64/64.

## Characterization conclusion

All 14 requested protocol/profile combinations completed structurally on the reference hardware with stable timestamp quality and no observed watchdog or listener failure. This closes the bounded characterization campaign, not the Jump Engine science: J5 MEDIUM produced one confirmed false positive, J3 HIGH missed its operator-noted event, and all reported airtimes remain unvalidated.
