# Safe M5 experiment protocols

These protocols characterize signals; they do not validate kitesurf jump accuracy. Stop if the environment, surface or participant makes the motion unsafe.

| ID  | Controlled action                                   | Expected research result                        |
| --- | --------------------------------------------------- | ----------------------------------------------- |
| J0  | Stationary, watch worn normally                     | No confirmed candidate                          |
| J1  | Ordinary wrist movement                             | No confirmed candidate                          |
| J2  | Normal walking                                      | No confirmed candidate                          |
| J3  | One comfortable small hop on safe dry land          | Positive motion reference, not a kitesurf claim |
| J4  | Several comfortable hops with full recovery between | Timing repeatability evidence                   |
| J5  | Fast arm movement while stationary                  | Negative adversarial evidence                   |
| J6  | Only a naturally safe landing-like step/impact      | Negative/ambiguity characterization             |

Capture MEDIUM and HIGH in comparable short windows, in that order, without MAX. Record only aggregate counts, flags, callback/sample timing and candidate boundary differences. Raw captures are temporary, ignored, treated as sensitive telemetry and never committed by default. Do not record coordinates, individual HR, serials or credentials.

For M5.1 select `CONTROLLED_FULL_WINDOW`; each run stops automatically at 12 seconds, then shows `EXPORTING` while telemetry is emitted outside the sensor callback. Begin with J0 MEDIUM only. Review completion, drops, callback cost and free memory before proceeding. Alternate the starting profile across repeated protocols when practical; operator notes record only the number/type of intended motions.

Only after J0–J6 and engine stability may an ordinary kitesurf session capture be considered. The rider must navigate normally and must not attempt risky maneuvers for the test.
