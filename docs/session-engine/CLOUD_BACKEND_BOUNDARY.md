# Cloud/backend boundary

The architectural decision for M4 is exact:

```text
TARGET_BACKEND = EXISTING_WINDWISHER_BACKEND
TARGET_SUPABASE_PROJECT = EXISTING_WINDWISHER_SUPABASE_PROJECT
WATCH_DIRECT_SUPABASE_DEPENDENCY = NONE
SEPARATE_WATCH_DATABASE = NOT_PLANNED
```

## Cloud authority

Existing WindWisher backend.

## Database

Existing WindWisher Supabase project.

## Watch coupling

None. The watch depends only on portable contracts.

## Credentials

Never on the watch.

## Separate database

Not planned without future evidence.

## Schema ownership

WindWisher backend repository.

## Authentication

WindWisher's existing identity system; no parallel wearable identity.

The watch owns durable offline recording and produces a vendor-neutral canonical dataset. A future authenticated sync adapter will package and transmit completed data. The existing WindWisher backend will own ingestion, user identity, authorization/RLS, idempotency, persistence and migrations. WindWisher clients will consume backend-owned models.

Reusing the Supabase project does not require reusing an unsuitable table. New backend-owned structures may be added when M7/M8 designs them. M4 creates no tables, migrations, Edge Functions, buckets, credentials, auth flow, networking or production sync.

A separate watch database is an escape hatch only if later evidence establishes incompatible isolation, compliance, scale or lifecycle requirements. Convenience alone is insufficient evidence.
