# Canonical data privacy classification

Every canonical export has `visibility: private`. Recording and export never imply publication.

| Classification       | Examples                                  | Handling                                                      |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `PUBLIC_METADATA`    | schema and producer versions              | Low sensitivity alone; remains inside the private export      |
| `OPERATIONAL`        | duration, counters, quality, device model | Private operational data                                      |
| `SENSITIVE_LOCATION` | GPS coordinates and track timing          | Sensitive; never printed by the inspector or logs             |
| `SENSITIVE_HEALTH`   | heart-rate observations                   | Sensitive health data; never printed by the inspector or logs |

Synthetic fixtures use no real identities, routes or health measurements. Exports must not enter source control, support logs or public sharing by default. M4 adds no cloud transmission, credentials, auth tokens or environment-variable access.
