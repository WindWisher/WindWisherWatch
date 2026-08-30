# Garmin Sensor Lab dataset 1.0.0

The developer export is UTF-8 NDJSON. Every line is independently parseable and begins with one of these `recordType` values after the `WWLAB|` console prefix is removed:

- `manifest`: experiment/device/app/SDK/API/profile/environment identity, requested rates, and UTC/epoch start anchor.
- `sample`: sensor, monotonically increasing per-sensor sequence, sensor monotonic timestamp when exposed, callback monotonic timestamp, untouched `raw` values/units, and optional normalized values with conversion provenance.
- `runtime`: battery percent and application memory counters.
- `storage`: bounded probe size, latency, and verification result.
- `warning`: structured error code, detail, and time.
- `completion`: end anchor, result, and warnings. Its absence means incomplete capture.

Connect IQ does not expose the compiler SDK release at runtime. The raw watch manifest therefore carries `RECORD_FROM_BUILD_ENVIRONMENT`; the export operator must replace or accompany it with the exact `monkeyc --version` result before classifying evidence. Likewise, `DEVICE_OR_SIMULATOR_UNCLASSIFIED` remains `UNKNOWN` until the operator records whether the run came from simulator or exact physical hardware. Unclassified captures cannot support platform conclusions.

The watch streams records and retains no minute-scale IMU buffer. `System.println` is a developer extraction transport, not WindWisher synchronization and not a production journal. Callback-time fallback is labelled and must not be mistaken for a per-sample sensor timestamp. Host tooling calculates timing statistics without rewriting raw data.

Real captures are sensitive research data and are excluded from Git. Fixture timestamps, locations, HR, battery, memory, and device names are synthetic.
