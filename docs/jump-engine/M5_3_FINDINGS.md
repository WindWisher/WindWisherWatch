# M5.3 Locomotion Context Findings

```text
M5_3_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE
FALSE_POSITIVE_DISCRIMINATION_BRISK_WALKING = UNRESOLVED
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
GYRO_ROLE = QUALITY_ONLY
M6_WOO_VALIDATION_GATE = NO_GO
```

The bounded observer recognizes regular impact trains, but distributions overlap controlled hops. Walking-only TN2/TN3 trials produced no confirmations. TP3 was intermittent: TP3-1 had one observed hop and three confirmations; TP3-2 had two hops and three confirmations but degraded timing; three later one-hop diagnostics each produced exactly one confirmation.

A periodic-context veto is contradicted by a true TP3 hop with periodic pre-context. No detector threshold, confirmation rule or reason code was added. With no defensible frozen suppression configuration, independent M5.3 holdout was not opened. Synthetic periodic-walking and walking→jump→walking cases demonstrate bounds and positive preservation, not physical resolution.

The next scientific need is bounded ground-reference alignment (for example, an operator event marker) to locate the real hop inside transition captures, followed by frozen tuning and independent holdout. Woo remains blocked.

Memory stayed bounded. Physical callback means ranged roughly 46–98 ms, with a maximum of 127 ms in the latest TP3 diagnostic; callback-path optimization is required before product claims.
