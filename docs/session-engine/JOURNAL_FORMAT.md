# Session journal format

Versions are independent:

- session schema: `1.0.0`;
- journal format: `1`;
- application version: platform release-specific.

## Deterministic host frame

The host reference uses a 20-byte fixed header followed by bounded UTF-8 JSON:

| Offset |   Size | Field                               |
| -----: | -----: | ----------------------------------- |
|      0 |      4 | ASCII magic `WWJF`                  |
|      4 |      1 | journal version                     |
|      5 |      1 | frame type                          |
|      6 |      2 | reserved flags                      |
|      8 |      4 | uint32 sequence                     |
|     12 |      4 | uint32 payload length               |
|     16 |      4 | CRC-32 over header prefix + payload |
|     20 | <=4096 | payload                             |

CRC-32 detects accidental corruption; it is not authentication. The parser validates magic, version, type, length, checksum, sequence and JSON before accepting a frame. It never allocates from an unchecked length.

Chunks are at most 8,192 bytes in the host reference, leaving margin below platform value limits. A frame cannot cross a chunk boundary.

## Garmin mapping

Garmin stores equivalent framed dictionaries in Object Store chunks of at most 16 frames. Each payload is at most 512 characters and protected by Adler-32 over a canonical representation. Adler-32 also detects accidental corruption and is not authentication. The adapter writes the chunk, reads and validates the appended frame, then updates the compact index.

Frame types: start, position, HR, pressure, runtime, quality, checkpoint, stop and final. There is deliberately no raw motion frame.

Checkpoint cadence defaults to 60 seconds: a bounded recovery-loss window with roughly one small metadata write per minute. It is configurable in deterministic tests.

M3 checkpoints add compact Core Metric projection state. Metrics are not duplicated into every frame, and the final operational summary remains within the same 512-character Garmin payload bound. Finalization validates only the last bounded chunk.
