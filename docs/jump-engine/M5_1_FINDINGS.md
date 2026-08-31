# M5.1 findings

## Current status

```text
M5_1_STATUS = HARDWARE_RESEARCH_INCONCLUSIVE
M6_WOO_VALIDATION_GATE = NO_GO
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
```

The isolated Garmin app and host capture/replay path are implemented and exercised across all 14 J0–J6 MEDIUM/HIGH combinations on the reference fēnix 7. Every valid run completed without timestamp-quality, watchdog or teardown failure. MEDIUM delivered 275 samples per approximately 12-second run; HIGH delivered 550 and roughly doubled callback processing cost.

Controlled negatives J0, J1, J2 and J6 produced no confirmation. J5 MEDIUM fast arm motion produced one confirmed false jump while J5 HIGH rejected all candidates; non-reproduction does not erase the baseline because the human motions were not mechanically identical. Controlled J4 hops matched 3/3 aggregate confirmations under both profiles, while J3 HIGH missed its single operator-noted event. All airtimes remain unvalidated.

Gyro artifacts were prevalent in wrist, walking and fast-arm motion and did not change any bounded replay classification. HIGH demonstrated no meaningful detection advantage that justified its doubled throughput, so MEDIUM is selected strictly for continued research. The false positive, missed event, raw-prefix limitations and invalid airtime keep M6 closed.

SDK 9.2.0 builds pass for `fenix7` and `fenix7s`. The unit-test binary builds, but Run No Evil still has no logical result because the runner produced no output. Raw captures remain ignored and are not promoted to fixtures or committed.
