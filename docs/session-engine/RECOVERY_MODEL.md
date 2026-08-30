# Recovery model

On relaunch the engine discovers journals without a valid final marker. The journal, not the potentially stale index, is authoritative.

```text
discover → validate bounded frames → retain valid prefix
         → locate latest valid checkpoint → replay valid tail
         → RECOVERED → explicit finalization
```

An incomplete or bad-checksum tail produces `RECOVERABLE` when a valid prefix exists. Only invalid tail bytes/frames are discarded, and `PARTIAL_TAIL_DISCARDED` is recorded. A corrupt later checkpoint falls back to the earlier valid prefix/checkpoint. Unknown journal versions produce `UNSUPPORTED_VERSION`; no automatic skip is attempted because frame semantics may differ.

Recovery preserves session identity and never reactivates sensors. Explicit finalization appends a protected checkpoint/final frame. Repeated recovery does not append during discovery, preventing duplicate frames.

Host tests cover normal finalization, missing final, partial tail, bad checksum, corrupt later checkpoint, unknown version, duplicate/out-of-order sequence, sequence gap and stale index. Sudden-power atomicity remains unknown; hardware partial-tail corruption is not forced.
