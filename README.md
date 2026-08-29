# WindWisherWatch

WindWisherWatch is the pre-alpha wearable instrument for recording offline kitesurf sessions, presenting glanceable ride and jump metrics, and synchronizing completed data with WindWisher. It is not a reduced mobile app and currently contains no wearable runtime.

## Status

**M0 — Foundation.** This repository defines product boundaries, architecture, versioned contracts, realistic fixtures, automated validation, and the technical roadmap. Garmin is the first implementation target; watchOS and Wear OS follow with native implementations.

## Architecture at a glance

Each platform owns its sensor adapters, durable local storage implementation, UI, and sync adapter. Platforms share semantics through JSON Schema contracts, specifications, fixtures, test vectors, and ADRs—not a mandatory UI or runtime. Recording is offline-first and sensor-first. The future Jump Engine is isolated from platform UI and emits traceable results with algorithm version, confidence, and quality flags.

Data flows from the wearable's local session journal through an idempotent `SyncPackage` to the existing WindWisher backend and then to the WindWisher Flutter app. Contracts contain no Supabase SDK concepts.

## Repository map

- `contracts/`: JSON Schema Draft 2020-12 contracts, versioned at `v1`.
- `fixtures/contracts/`: synthetic valid and deliberately invalid contract examples.
- `specs/`: domain, session, sensor, Jump Engine, offline, sync, privacy, and validation semantics.
- `docs/`: product, architecture, platform matrix, roadmap, quality, security, privacy, versioning, glossary, and ADRs.
- `research/`: bounded research backlogs; no unverified platform claims.
- `platforms/`: boundary READMEs for future native implementations.
- `tools/contracts/`: independent Node-based validation and architectural guards.

## Validate the foundation

Requirements: Node.js 18.18 or newer.

```sh
npm ci
npm run check
```

`npm run validate:contracts` verifies that schemas compile, references resolve, valid fixtures pass, invalid fixtures fail, schema versions agree, and contracts do not contain platform/backend coupling. `npm test` exercises the same behavior through Node's built-in test runner.

## Product relationship

WindWisherWatch records and owns the durable on-device copy until acknowledged synchronization. WindWisher's existing backend remains the expected canonical cross-device store. Publishing is a separate, explicit decision: recording never implies public visibility.

## Roadmap

M0 establishes the foundation. The next milestone is **M1 — Garmin Sensor Lab**, followed by raw recording, experimental Jump Engine work, empirical Woo comparison, Garmin UX and synchronization, production hardening, watchOS, and Wear OS. See [the detailed roadmap](docs/ROADMAP.md).

## Development

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing contracts or architecture. This project is pre-alpha; contracts may evolve through documented migrations. Licensing is intentionally unresolved—no license is granted until the project owner selects one.
