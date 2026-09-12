import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  stat,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { archiveRecovery } from "./archive-recovery.mjs";

test("archive preserves failed captures, verifies bytes and never overwrites a previous trial", async (t) => {
  // Only this test's newly created, uniquely named synthetic directory is removed.
  const parent = path.resolve("research/garmin/jump-engine/results");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, "archive-unit-"));
  t.after(() => rm(root, { recursive: true }));
  const bakPath = path.join(root, "source.BAK"),
    txtPath = path.join(root, "source.TXT");
  await writeFile(bakPath, "synthetic truncated capture");
  await writeFile(txtPath, "");
  const options = {
    destination: path.join(root, "archives"),
    trialId: "R0",
    bakPath,
    txtPath,
    observedHops: 0,
  };
  const first = await archiveRecovery(options),
    second = await archiveRecovery(options);
  assert.notEqual(first.directory, second.directory);
  assert.equal(first.coverage.status, "INVALID_CAPTURE_PRESERVED");
  assert.equal(first.sourceClearingAuthorized, false);
  assert.equal(await readFile(bakPath, "utf8"), "synthetic truncated capture");
  assert.equal(
    await readFile(path.join(first.directory, "WWJumpResearch.BAK"), "utf8"),
    "synthetic truncated capture",
  );
  const manifest = JSON.parse(
    await readFile(path.join(first.directory, "archive-manifest.json"), "utf8"),
  );
  assert.equal(manifest.files.length, 2);
  assert.equal(manifest.files[0].sha256.length, 64);
  assert.equal(manifest.independentBackupVerified, false);
  assert.equal((await stat(first.directory)).mode & 0o777, 0o700);
  await assert.rejects(() =>
    archiveRecovery({ ...options, trialId: "../escape" }),
  );
  await assert.rejects(() =>
    archiveRecovery({ ...options, observedHops: null }),
  );
  await assert.rejects(
    () => archiveRecovery({ ...options, destination: tmpdir() }),
    /temporary storage/,
  );
  const alias = path.join(root, "temporary-alias");
  await symlink(tmpdir(), alias);
  await assert.rejects(
    () => archiveRecovery({ ...options, destination: alias }),
    /temporary storage/,
  );
});
