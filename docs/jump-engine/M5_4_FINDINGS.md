# M5.4 Operator Reference Markers and Independent Holdout — Findings

## Status

M5.4 is complete. The aligned tuning phase and independent frozen holdout are historical evidence. No M5.4 holdout result was used to modify its frozen detector or thresholds.

## Aligned tuning evidence

All figures below use operator-declared protocol labels. Positive matches use the independent post-event marker; detector output is never used as ground truth. Raw hardware captures remain local and uncommitted.

| Protocol                              | Expected | Valid repetitions | Result with pre-freeze algorithm |
| ------------------------------------- | -------- | ----------------: | -------------------------------- |
| AT1 walking                           | negative |                 3 | 0 false positives                |
| AT2 brisk walking                     | negative |                 3 | 2 false positives                |
| AT4 walking, hop, walking             | positive |                 3 | 2 matched, 1 missed              |
| AT5 brisk walking, hop, brisk walking | positive |                 3 | 0 matched, 3 missed              |
| AT6 arm motion only                   | negative |                 3 | 0 false positives                |

The principal aligned contrast is:

- the two AT2 false positives had peak acceleration of 2335–2386 mg;
- aligned hop candidates in AT4 and AT5 had peak acceleration of 3239–4715 mg;
- AT4 and AT5 hop candidates reached flight minima of 161–394 mg;
- AT6 arm-motion candidates could have strong peaks, but did not combine a peak of at least 3000 mg with a flight minimum of at most 408 mg and a stable landing in the observed tuning trials;
- takeoff-to-landing direction was unstable for real marked hops, including negative cosine values, and is therefore supporting evidence rather than a rejection gate.

These are exploratory single-operator hardware ranges, not population estimates or product thresholds.

## Single discrimination hypothesis

A controlled hop on this wrist-worn sensor is more plausibly represented by the conjunction of a strong acceleration peak and a deep low-g minimum than by takeoff-to-landing vector agreement. The detector therefore evaluates one composite physical envelope:

```text
peak acceleration >= 3000 mg
AND
minimum flight acceleration <= 408 mg
```

The existing multi-phase, duration, and stable-landing requirements remain mandatory. Gyro remains quality-only. Locomotion context remains bounded evidence and is not a rejection gate.

Synthetic sanitized regressions cover both sides of the hypothesis:

- an AT2-like lower-peak false-positive structure is rejected;
- an AT5-like strong, deep-low-g structure with divergent wrist direction is accepted;
- existing negatives, sample-rate controls, three-hop separation, resource bounds, and the four-hour synthetic run continue to pass.

## Frozen configuration

```text
FROZEN_ALGORITHM_VERSION = experimental-0.4-impulse-lowg-envelope
FROZEN_SENSOR_PROFILE = MEDIUM
FROZEN_THRESHOLDS = peak>=3000mg; flightMinimum<=408mg; flight>=240ms; sustainedLowG>=120ms; stableLanding=true
FROZEN_REFERENCE_MATCH_POLICY = normalized sensor-time overlap; 2500ms before marker; 100ms after marker; measured callback lag included; ambiguous overlap never nearest-matched
GYRO_ROLE = QUALITY_ONLY
```

The Fenix 7 and Fenix 7S builds passed, Garmin unit tests passed 10/10, and the frozen Fenix 7 binary was installed before holdout collection.

## Holdout lock

HN1–HN5 and HP1–HP4 are fresh trials. Once the first holdout trial is observed, algorithm version, thresholds, feature policy, and matching policy are locked. A failure may change the M5.4 decision, but cannot trigger retuning against the same holdout.

Current gate remains:

```text
M6_WOO_VALIDATION_GATE = NO_GO
```

## Independent holdout observations

The following results were observed only after the configuration freeze. They are append-only validation evidence and did not cause algorithm or threshold changes.

| Protocol                                   | Expected | Samples | Confirmed | Rejected | Outcome       |
| ------------------------------------------ | -------- | ------: | --------: | -------: | ------------- |
| HN1 normal walking                         | negative |     725 |         0 |       40 | true negative |
| HN2 brisk walking                          | negative |     725 |         0 |       41 | true negative |
| HN3 brisk walking with different arm swing | negative |     725 |         0 |       28 | true negative |
| HN4 fast arm movement                      | negative |     725 |         0 |       26 | true negative |
| HN5 impact without hop                     | negative |     725 |         0 |       19 | true negative |
| HP1 isolated controlled hop                | positive |     250 |         0 |        1 | missed        |
| HP2 three repeated controlled hops         | positive |     450 |         2 |        1 | 2/3 detected  |
| HP3 walking, hop, walking                  | positive |     250 |         1 |       10 | matched       |
| HP4 brisk walking, hop, brisk walking      | positive |     325 |         1 |        4 | matched       |

HP1 produced a physically strong rejected candidate: 408 ms takeoff-to-landing duration, 368 ms sustained low-g, 4779.97 mg recorded peak, 179.47 mg flight minimum, stable landing, and 0.961287 takeoff-to-landing direction cosine. The post-event reference did not match any confirmed candidate, so HP1 is a false negative under the frozen policy.

The trace indicates an evaluation-timing mismatch in the frozen envelope hypothesis: the candidate peak can continue updating during landing stabilization, while the envelope decision is made at the landing transition. This is a root-cause hypothesis for a future milestone, not a holdout-triggered correction. The frozen implementation remains unchanged.

HP2 contained three detector candidates for the operator-declared three-hop protocol. Candidates 1 and 2 were confirmed and candidate 0 was rejected, giving an operator-count result of 2/3 detected and 1/3 missed. The sole post-event marker matched confirmed candidate 2, the final hop. Candidate 0 again had a strong final trace envelope (5362.57 mg peak, 152.56 mg flight minimum, 408 ms flight, 368 ms sustained low-g, and stable landing), consistent with the evaluation-timing hypothesis observed in HP1. Because the current reference UI records only one post-event marker, the earlier confirmed candidate is reported by the automatic one-marker alignment as an extra detection; under the independently declared three-hop protocol it is an expected event, not a false positive.

HP3 matched the independently marked walking-to-hop-to-walking event. The detector produced one confirmed candidate and ten rejected locomotion candidates, with no unmatched confirmation. The matched hop had a 3572.51 mg peak, 274.40 mg flight minimum, 328 ms flight, 288 ms sustained low-g, and stable landing. Locomotion context was observer-only and classified the pre-hop context as possible locomotion; it did not control confirmation.

HP4 matched the independently marked brisk-walking-to-hop-to-brisk-walking event. The detector produced one confirmed candidate and four rejected locomotion candidates, with no unmatched confirmation. The matched hop had an 8631.88 mg peak, 174.41 mg flight minimum, 328 ms flight, 288 ms sustained low-g, and stable landing. The critical moving-hop case therefore passed this single holdout trial without turning brisk-walking impacts into confirmed events.
