import fs from "node:fs/promises";
import { frameTypeName, parseJournal } from "./journal.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node tools/session-engine/inspect.mjs <journal.bin>");
  process.exitCode = 2;
} else {
  const parsed = parseJournal(await fs.readFile(file));
  console.log(
    JSON.stringify(
      {
        integrity: parsed.integrity,
        validBytes: parsed.validBytes,
        discardedBytes: parsed.discardedBytes,
        issues: parsed.issues,
        frames: parsed.frames.map((frame) => ({
          sequence: frame.sequence,
          type: frameTypeName(frame.type),
          payloadBytes: frame.frameLength - 20,
          checksum: frame.checksum,
        })),
      },
      null,
      2,
    ),
  );
}
