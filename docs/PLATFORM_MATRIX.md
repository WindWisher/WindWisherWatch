# Platform matrix

M0 records only high-level direction. Hardware and API capabilities vary by model, OS, permissions, and runtime mode; unverified cells are deliberately `RESEARCH_REQUIRED`.

| Concern                      | Garmin (priority 1)                       | watchOS (priority 2)                                       | Wear OS (priority 3)                       |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Language                     | Monkey C                                  | Swift                                                      | Kotlin                                     |
| UI framework                 | Connect IQ APIs                           | SwiftUI                                                    | Compose for Wear OS                        |
| GPS                          | RESEARCH_REQUIRED per model/profile       | RESEARCH_REQUIRED per model/authorization                  | RESEARCH_REQUIRED per device/authorization |
| Heart rate                   | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Accelerometer                | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Gyroscope                    | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Barometer                    | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Background/session execution | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Offline storage              | RESEARCH_REQUIRED: limits/durability      | RESEARCH_REQUIRED: APIs/limits                             | RESEARCH_REQUIRED: APIs/limits             |
| Physical buttons             | Model-dependent; RESEARCH_REQUIRED        | Model-dependent; RESEARCH_REQUIRED                         | Device-dependent; RESEARCH_REQUIRED        |
| Touchscreen                  | Model-dependent; RESEARCH_REQUIRED        | Available on target devices; constraints RESEARCH_REQUIRED | Device-dependent; RESEARCH_REQUIRED        |
| Activity integration         | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Sensor limitations           | Establish in M1 Sensor Lab                | Establish before M10                                       | Establish before M11                       |
| Battery constraints          | Measure profiles in M1                    | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Simulator/emulator           | Validate simulator vs hardware gaps in M1 | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |
| Distribution                 | RESEARCH_REQUIRED                         | RESEARCH_REQUIRED                                          | RESEARCH_REQUIRED                          |

No row promises uniform capabilities. `DeviceCapabilities` is captured per recording device and the future engine chooses only supported strategies.
