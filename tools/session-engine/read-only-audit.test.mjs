import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("audit build isolates a read-only entrypoint with no sensor or storage-write capability", async () => {
  const base = new URL(
    "../../platforms/garmin/session-engine/",
    import.meta.url,
  );
  const read = (name) => fs.readFile(new URL(name, base), "utf8");
  const jungle = await read("journey-audit.jungle");
  assert.match(jungle, /source\/SeReadOnlyAudit\.mc/);
  assert.doesNotMatch(jungle, /base.sourcePath = source;/);
  const entry = await read("journey-audit/source/SeAuditApp.mc");
  const audit = await read("source/SeReadOnlyAudit.mc");
  const producer = await read("source/SeTransferProducer.mc");
  for (const text of [entry, audit, producer]) {
    assert.doesNotMatch(
      text,
      /Storage\.(setValue|deleteValue|clearValues)|new SessionEngine|recoverFirst|System\.println|Sensor\.|Position\./,
    );
  }
  assert.match(entry, /Storage\.getValue/);
  const manifest = await read("journey-audit/manifest.xml");
  const smoke = await read("journey-smoke/manifest.xml");
  assert.equal(
    manifest.match(/application id="([^"]+)"/)[1],
    smoke.match(/application id="([^"]+)"/)[1],
  );
  assert.match(manifest, /entry="SeAuditApp"/);
  assert.doesNotMatch(manifest, /uses-permission/);
  assert.match(audit, /MAX_SESSIONS = 8/);
  assert.match(audit, /MAX_CHUNKS = 64/);
});
