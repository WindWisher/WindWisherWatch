# M5.2 findings

## Decisions

```text
M5_2_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
GYRO_ROLE = QUALITY_ONLY
M6_WOO_VALIDATION_GATE = NO_GO
```

## What improved

- confirmation now requires sustained multi-phase evidence and stable landing;
- low-g is consecutive duration rather than elapsed time since its first occurrence;
- takeoff timing follows the newest plausible impulse inside a separately bounded candidate;
- expired transitions fail before a late low-g sample can enter flight;
- direction consistency is a typed accel-only discriminator;
- candidates explain confirmation/rejection with typed codes and compact bounded evidence;
- confirmed traces are retained preferentially within the eight-candidate cap;
- sample-rate-sensitive capture countdown was replaced with elapsed time;
- gyro outliers are excluded from valid aggregates, flagged and never clamped.

## What remains unresolved

J5-class arm motion improved from recurrent false confirmations to 0 confirmed in the final directional control, but N5 brisk walking produced three false confirmations. Those false events overlap controlled positives in flight duration and direction. The current wrist accelerometer feature space is therefore not robust enough for M6.

The J3 HIGH physical miss lacks a complete historical trace. Synthetic time equivalence passes, but post-change HIGH hardware evidence is not available.

Gyro artifacts remain motion-dependent and physically implausible. Gyro is useful for quality reporting only; it is not safe as a required discriminator.
