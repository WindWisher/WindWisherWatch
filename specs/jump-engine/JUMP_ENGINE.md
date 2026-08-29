# Future Jump Engine

The Jump Engine is a platform-neutral conceptual subsystem, not implemented in M0. It consumes normalized, ordered observations and a `DeviceCapabilities` snapshot and emits candidates, validated events, or an explicit insufficient-evidence outcome.

Pipeline: timestamp normalization -> preprocessing -> motion classification -> takeoff detection -> flight detection -> apex estimation -> landing detection -> height estimation -> airtime estimation -> horizontal-distance estimation -> confidence evaluation -> validation -> `JumpEvent`.

Strategies are selected from evidence-based capability profiles, initially conceptual: inertial+barometer, full inertial without barometer, GPS+inertial, and limited sensing. Names and thresholds are not product claims. Each strategy specifies required sensors, supported sample-rate/clock quality, calibration, fallback, resource budget, algorithm version, and validation dataset.

Raw observations, estimates, and metadata remain separate. Reprocessing never mutates provenance; it creates results under a new algorithm version. Low confidence can suppress a public metric. M3 may build an experimental detector only after M1/M2 produce suitable, consented data.
