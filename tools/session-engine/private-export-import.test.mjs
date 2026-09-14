import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { adler32, encodeGarminTransfer } from "./garmin-transfer.mjs";
import {
  assemblePrivatePages,
  validatePrivateExport,
  importPrivateExport,
} from "./private-export-import.mjs";

test("private pages survive overlap but reject missing, corrupted and conflicting pages", async () => {
  const first = session("synthetic-one"),
    second = session("synthetic-two");
  const page = (n, text) =>
    `WWSE_PAGE|1|${n}|2|${adler32(text)}\n${text}WWSE_PAGE_END\n`;
  const one = page(1, first),
    two = page(2, second);
  assert.equal(
    (await validatePrivateExport(assemblePrivatePages(one + one + two))).length,
    2,
  );
  assert.equal(
    assemblePrivatePages("rotated fragment\n" + two + one),
    first + second,
  );
  assert.throws(() => assemblePrivatePages(one));
  assert.throws(() =>
    assemblePrivatePages(one + two.replace("dist=0", "dist=9")),
  );
  assert.throws(() => assemblePrivatePages(one + page(1, second) + two));
});

function session(id) {
  return encodeGarminTransfer(
    id,
    [
      ["SESSION_START", "schema=1.0.0;wall=1700000000;mono=100"],
      [
        "SESSION_FINAL",
        "elapsed=1000;pos=0;hr=0;pressure=0;quality=0;dist=0;max=-;completed=1700000001",
      ],
    ].map(([frameType, payload], sequence) => ({
      magic: "WWJF",
      formatVersion: 1,
      sequence,
      frameType,
      payloadLength: payload.length,
      payload,
      checksum: adler32(`WWJF|1|${sequence}|${frameType}|${payload}`),
    })),
  ).join("");
}
test("private importer requires exactly two distinct complete sessions", async () => {
  const first = session("synthetic-one"),
    second = session("synthetic-two");
  assert.equal((await validatePrivateExport(first + second)).length, 2);
  for (const input of [
    first,
    first + first,
    first + second + first,
    (first + second).slice(0, -3),
    "diagnostic\n" + first + second,
  ])
    await assert.rejects(() => validatePrivateExport(input));
});
test("private importer uses exclusive private destinations, preserves source and rejects symlinks", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "ww-private-import-test-"),
  );
  try {
    const input = path.join(root, "synthetic.txt"),
      text = session("synthetic-one") + session("synthetic-two");
    await fs.writeFile(input, text, { mode: 0o600 });
    const result = await importPrivateExport(input, root);
    assert.equal(result.frames, 4);
    assert.equal((await fs.stat(result.directory)).mode & 0o777, 0o700);
    for (const file of [
      "source.txt",
      "session-1.jsonl",
      "session-2.jsonl",
      "VERIFIED",
    ])
      assert.equal(
        (await fs.stat(path.join(result.directory, file))).mode & 0o777,
        0o600,
      );
    assert.equal(await fs.readFile(input, "utf8"), text);
    assert.notEqual(
      (await importPrivateExport(input, root)).directory,
      result.directory,
    );
    await fs.symlink(input, path.join(root, "link"));
    await assert.rejects(() =>
      importPrivateExport(path.join(root, "link"), root),
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
