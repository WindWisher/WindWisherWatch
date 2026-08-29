# Privacy

## Principle

`recording != publishing`. Creating or synchronizing a session does not make it social. New sessions default to `private`; changing visibility is a separate, explicit, authenticated action in WindWisher.

## Sensitive data

Tracks reveal precise locations and routines. Timestamps, spot association, heart rate, device identity, and diagnostics can also identify or profile a person. Collect only fields needed for recording, quality, recovery, validation, and user-visible analysis.

## Visibility

Contracts prepare for `private`, `followers`, and `public`, but M0 implements no sharing. Visibility controls access to published representations; it does not weaken storage, transport, deletion, or consent requirements. Validation datasets require separate explicit consent and de-identification.

## Lifecycle

The wearable retains recoverable data until synchronization is durably acknowledged and a documented retention policy permits cleanup. Backend retention, export, deletion, account removal, and derived-data deletion must be designed with WindWisher before production sync. Backups and cached forecasts need matching expiry behavior.

## Minimization and observability

Production logs must not contain precise coordinates, raw HR streams, access tokens, or complete payloads. Diagnostics use coarse counts, error categories, hashes safe for correlation, and bounded retention. Synthetic data is mandatory in repository fixtures.

## Open decisions before production

Legal basis and privacy notice, age handling, data residency, retention durations, deletion propagation, consent for scientific comparison, location redaction options, and platform health-data requirements remain milestone gates—not assumptions.
