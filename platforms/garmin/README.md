# Garmin Sensor Lab

M1 is a developer-only Connect IQ Device App used to characterize acquisition, clocks, memory, battery, and storage before a production Session Engine exists. It does not record FIT activities, detect jumps, compute navigation analytics, or synchronize data.

## Environment

Install Connect IQ SDK through Garmin's SDK Manager. Add its `bin` directory to `PATH` using `current-sdk.cfg`; do not commit or hardcode that local path. Java requirements follow the selected SDK release.

Generate a local developer key outside the repository. `.key`, `.der`, `.pem`, `.prg`, and SDK binaries are ignored.

```sh
export PATH="$PATH:$(cat "$HOME/Library/Application Support/Garmin/ConnectIQ/current-sdk.cfg")/bin"
export GARMIN_DEVELOPER_KEY=/absolute/local/path/developer_key.der
./scripts/build.sh
connectiq
monkeydo bin/WindWisherSensorLab.prg fenix7
```

Run No Evil tests:

```sh
./scripts/test.sh
```

`fenix7` is the initial compile profile, not a claim that every fēnix 7 capability is hardware-verified. Change `-d` to the actual test device and record it in the experiment manifest.

## Controls and capture

- Select/Enter starts or stops the selected experiment.
- Up/Down chooses `LOW`, `MEDIUM`, `HIGH`, or `MAX_SUPPORTED` while idle.
- Back cancels an active experiment; Back exits while idle.
- Experiments auto-stop after one hour; long runs remain controlled lab protocols and should be stopped manually at their target duration.

The app emits line-delimited records prefixed with `WWLAB|` to the simulator/device application log. Strip the prefix into an `.ndjson` file, then run `node tools/garmin-sensor-lab/analyze.mjs capture.ndjson`.

The log is raw research data: do not commit real GPS, HR, or large IMU captures. The app persists only a bounded last-run summary under `wwlab.lastSummary`.

## Permissions

- `Positioning`: continuous GPS callbacks for the GPS and combined probes.
- `Sensor`: onboard sensor events and high-frequency IMU batches.

No communications, background, FIT/activity recording, health-history, or cloud permissions are requested.

## M2 Session Engine developer harness

`session-engine/` is a separate Connect IQ project named `WW Session Engine Dev`. It exercises the product-core boundaries without turning the M1 Sensor Lab into a product UI.

```sh
cd session-engine
GARMIN_TARGET_DEVICE=fenix7 ./scripts/build.sh
GARMIN_TARGET_DEVICE=fenix7s ./scripts/build.sh
./scripts/test.sh
```

Select starts/stops a developer session. A controlled app exit while recording intentionally leaves a recoverable journal; after relaunch, Select explicitly finalizes recovered data. Developer transition logs never include coordinates or heart-rate values.
