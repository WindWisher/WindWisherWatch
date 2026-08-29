# Session privacy semantics

Visibility is metadata independent of recording and sync. `private` is the default; `followers` and `public` are publication policies applied by the backend after explicit user action. Syncing a private session does not publish it. A visibility change must be authenticated, auditable, reversible where product policy permits, and must not expose raw data beyond the published representation.
