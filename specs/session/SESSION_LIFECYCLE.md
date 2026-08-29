# Session lifecycle

Start creates identity, device snapshot, `prepared` metadata, and durable journal header before acquisition. Transition to `recording` only after the store can append. Pause stops or marks applicable acquisition without finalizing. Stop enters `stopping`, drains bounded buffers, writes summaries and a checksum-covered completion marker, then enters `completed` and `pending` sync.

On launch, any journal lacking a valid completion marker is scanned. Valid frames through the last checkpoint are retained and state becomes `recovered`; the user/application may finalize it through `stopping`. A checksum failure quarantines the damaged tail. If core identity/header cannot be recovered, state becomes `corrupted`.

Invalid examples include `prepared -> completed`, `paused -> completed`, `completed -> recording`, and any UI-only state mutation. Storage exhaustion must be surfaced before loss where possible and must never manufacture successful completion.
