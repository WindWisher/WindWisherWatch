# MEDIUM versus HIGH decision

Host/synthetic equivalence cannot choose a Garmin sensor profile. Complete this matrix only from comparable physical J0–J6 runs.

| Criterion                  |                                                                                   MEDIUM |                                                                                                               HIGH |
| -------------------------- | ---------------------------------------------------------------------------------------: | -----------------------------------------------------------------------------------------------------------------: |
| observed Hz                |                                                                            22.88 over J0 |                                                                                                      45.74 over J0 |
| timestamp gaps             |                                                                                0 over J0 |                                                                                                          0 over J0 |
| callback mean/max/p95/p99  |                                                                48.36/55/>8/>8 ms over J0 |                                                                                         92.73/107/>8/>8 ms over J0 |
| batch min/mean/max         |                                                                         25/25/25 over J0 |                                                                                                   50/50/50 over J0 |
| buffer/drop behavior       |                                                    64 exported/211 counted drops over J0 |                                                                              64 exported/486 counted drops over J0 |
| hardware memory            |                                             758,520 start/758,680 end free bytes over J0 |                                                                       758,520 start/758,680 end free bytes over J0 |
| candidate timing           |                              J1: 2 rejected; J2: 11 rejected; J4: 3 confirmed/0 rejected |                                                        J1: 6 rejected; J2: 14 rejected; J4: 3 confirmed/2 rejected |
| controlled false positives | J5 produced 1 false confirmation; J6 produced 0 confirmations/2 rejections; gate blocker | J5 produced 0 confirmations/25 rejections; J6 produced 0 confirmations/3 rejections; does not clear MEDIUM failure |
| missed controlled events   |                                      J3: 0 missed; J4: 0/3 missed by on-device aggregate |                                                                J3: 1 missed; J4: 0/3 missed by on-device aggregate |
| gyro usefulness            |                        J1: 178/275 and J2: 114/275 samples flagged; no replay difference |                                                   J1: 468/550 and J2: 266/550 samples flagged; no replay advantage |
| likely battery cost        |                                                                                `UNKNOWN` |                                                                                                          `UNKNOWN` |

Current decision:

```text
JUMP_RESEARCH_SENSOR_PROFILE = MEDIUM
```

MEDIUM is selected only as the preliminary profile for continued bounded research. HIGH doubled observed samples and roughly doubled callback processing, did not improve negative classification, missed the single J3 operator event that MEDIUM confirmed, and matched MEDIUM's 3/3 aggregate confirmations in J4. This does not make MEDIUM production-ready: its J5 false positive keeps M6 blocked and airtime remains unvalidated. MAX stays out of scope.
