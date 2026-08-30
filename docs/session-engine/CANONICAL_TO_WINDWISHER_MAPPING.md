# Canonical to WindWisher mapping

This is a semantic mapping, not an implemented database migration.

| Canonical section   | Future WindWisher responsibility                                           |
| ------------------- | -------------------------------------------------------------------------- |
| manifest/session id | Idempotent session identity, ownership and source metadata                 |
| timing              | Session start/end and elapsed duration                                     |
| track               | Ordered private geospatial observations                                    |
| heart rate          | Optional private health observations with provenance                       |
| pressure            | Optional sensor observations; no inferred jump/altitude claim              |
| quality             | Import diagnostics and data-quality evidence                               |
| operational summary | Preserve the watch projection and its version, not authoritative analytics |
| completion          | Reject incomplete/corrupt packages and support idempotent ingestion        |

WindWisher may recompute richer analytics from accepted primary observations. It must retain provenance and must not silently replace watch-derived values with backend-derived values under the same field meaning. Exact tables, RLS, auth, migrations and ingestion APIs belong to the WindWisher backend repository and are outside M4.
