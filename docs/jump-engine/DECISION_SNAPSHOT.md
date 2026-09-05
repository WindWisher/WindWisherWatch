# Jump decision snapshot

The envelope is evaluated once on the sample that triggers the `FLIGHT → POSSIBLE_LANDING` transition. At that instant the detector stores an immutable `featuresAtDecision` snapshot containing:

- takeoff peak;
- flight minimum;
- landing-trigger peak;
- flight duration;
- sustained low-g duration;
- physical threshold values;
- the envelope result.

`JUMP_IMPULSE_LOW_G_ENVELOPE_FOUND` and `JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING` are derived only from this snapshot. Later samples cannot change the reason.

The final trace exposes post-decision acceleration separately under `postEventDiagnostics`. It must never be interpreted as takeoff evidence or used to reconstruct the earlier decision.

The final candidate status still waits for bounded landing stabilization. Thus envelope evaluation and final confirmation remain distinct events, while the evidence used by each is explicit.
