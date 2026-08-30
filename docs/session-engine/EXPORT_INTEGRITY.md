# Export integrity

M4 uses two CRC32 layers:

- each record checksum covers the canonical JSON record without its `checksum` field;
- the completion record carries a streaming CRC32 over the exact UTF-8 bytes of every preceding NDJSON line, including newline delimiters.

The parser additionally enforces schema validity, unique contiguous record sequence, manifest-first/completion-last structure, declared record counts, a 16 KiB line limit and a terminal newline. It rejects malformed JSON, truncation, changed records, duplicates, missing records, unsupported versions and unexpected sections.

CRC32 detects accidental corruption; it is not authentication, encryption or a defense against a malicious party able to rewrite checksums. A future sync envelope may add a cryptographic digest or authenticated transport without changing the meaning of the canonical records.

Integrity failure never mutates or repairs the durable source journal. The caller receives an error and may retry from that unchanged source.
