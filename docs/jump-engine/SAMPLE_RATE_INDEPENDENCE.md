# Sample-rate independence

## Implemented invariants

- takeoff transition, candidate bound, minimum/maximum flight, low-g streak, landing stabilization and post-event periods use normalized milliseconds;
- low-g duration is a consecutive time interval, not a count of samples;
- post-candidate capture retention uses a timestamp deadline rather than `_rate` decrements;
- physical acceleration and direction thresholds are shared across MEDIUM and HIGH;
- only smoothing sample count and bounded capacities are profile-specific.

## Verification

Synthetic scenarios run under MEDIUM and HIGH. The J3 boundary hypothesis has identical status, and clean candidate timing differs by no more than one MEDIUM interval. The four-hour MEDIUM replay remains bounded.

## Limitation

No post-change HIGH hardware control was run. Sample-rate semantics are code- and synthetic-verified, but physical profile stability remains insufficiently evidenced. MEDIUM remains the research profile because M5.1 showed no HIGH benefit and roughly doubled callback throughput.
