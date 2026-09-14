import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalFromGarminTransfer } from "./garmin-canonical.mjs";
import { adler32 } from "./garmin-transfer.mjs";

const MAX_BYTES = 10 * 1024 * 1024;

export function assemblePrivatePages(text) {
  if (Buffer.byteLength(text) > MAX_BYTES)
    throw new Error("Page input exceeds bound");
  const pages = new Map();
  let expected = null,
    active = null;
  for (const line of text.split("\n")) {
    const header = /^WWSE_PAGE\|1\|(\d+)\|(\d+)\|(\d+)$/.exec(line);
    if (header) {
      const [, indexText, totalText, checksumText] = header;
      const index = Number(indexText),
        total = Number(totalText),
        checksum = Number(checksumText);
      if (
        total < 1 ||
        total > 512 ||
        index < 1 ||
        index > total ||
        (expected !== null && expected !== total)
      )
        throw new Error("Inconsistent page identity");
      expected = total;
      active = { index, checksum, text: "" };
    } else if (line === "WWSE_PAGE_END" && active) {
      if (adler32(active.text) !== active.checksum)
        throw new Error("Page checksum failed");
      if (pages.has(active.index) && pages.get(active.index) !== active.text)
        throw new Error("Conflicting page retries");
      pages.set(active.index, active.text);
      active = null;
    } else if (active) {
      active.text += line + "\n";
      if (active.text.length > 4000) throw new Error("Page exceeds bound");
    }
    // Rotation may leave a prefix fragment outside a complete page. It is never
    // used as evidence; every expected page must still exist intact and checksummed.
  }
  if (expected === null || pages.size !== expected)
    throw new Error("Missing complete pages");
  return Array.from({ length: expected }, (_, i) => pages.get(i + 1)).join("");
}

// Dedicated export log only. Never silently select a convenient subset of runs.
export async function validatePrivateExport(text) {
  if (Buffer.byteLength(text) > MAX_BYTES || !text.endsWith("\n"))
    throw new Error("Export exceeds bound or is truncated");
  const sessions = [];
  let pending = null;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    if (Buffer.byteLength(line) > 4096)
      throw new Error("Export line exceeds bound");
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error("Export contains non-protocol data");
    }
    if (record?.recordType === "manifest") {
      if (pending || sessions.length >= 2)
        throw new Error("Unexpected export run");
      pending = [];
    }
    if (!pending) throw new Error("Missing export manifest");
    pending.push(line + "\n");
    if (record?.recordType === "completion") {
      sessions.push(await canonicalFromGarminTransfer(pending));
      pending = null;
    }
  }
  if (pending || sessions.length !== 2)
    throw new Error("Expected two complete sessions");
  const ids = sessions.map((s) => JSON.parse(s.lines[0]).payload.sessionId);
  if (ids[0] === ids[1]) throw new Error("Duplicate session export");
  return sessions;
}

export async function importPrivateExport(input, outputParent) {
  const handle = await fs.open(
    input,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  let buffer;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES)
      throw new Error("Invalid export file");
    // Bound actual reads too, even if a source file grows after stat.
    buffer = Buffer.alloc(MAX_BYTES + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        offset,
        buffer.length - offset,
        null,
      );
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset > MAX_BYTES) throw new Error("Export exceeds bound");
    buffer = buffer.subarray(0, offset);
  } finally {
    await handle.close();
  }
  const raw = buffer.toString("utf8");
  const sessions = await validatePrivateExport(
    raw.includes("WWSE_PAGE|") ? assemblePrivatePages(raw) : raw,
  );
  // No output is published until both envelopes and canonical streams validate.
  const directory = await fs.mkdtemp(
    path.join(outputParent, "private-session-export-"),
  );
  await fs.chmod(directory, 0o700);
  await fs.writeFile(path.join(directory, "source.txt"), buffer, {
    flag: "wx",
    mode: 0o600,
  });
  for (let i = 0; i < sessions.length; i++) {
    await fs.writeFile(
      path.join(directory, `session-${i + 1}.jsonl`),
      sessions[i].lines.join(""),
      { flag: "wx", mode: 0o600 },
    );
  }
  await fs.writeFile(
    path.join(directory, "VERIFIED"),
    "Two distinct complete transfers and canonical streams validated.\n",
    { flag: "wx", mode: 0o600 },
  );
  return {
    directory,
    sessions: 2,
    frames: sessions.reduce((n, s) => n + s.sourceFrames.length, 0),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    if (process.argv.length !== 4) throw new Error("Usage");
    const result = await importPrivateExport(process.argv[2], process.argv[3]);
    console.log(JSON.stringify(result)); // Counts and local destination only, never telemetry.
  } catch {
    console.error(
      "Private import failed; source preserved. No verified result claimed. Check input and destination locally.",
    );
    process.exitCode = 1;
  }
}
