import test from "node:test";
import assert from "node:assert/strict";
import {
  bindCanonicalIdentity,
  inspectSyncCompatibility,
} from "./sync-compatibility.mjs";
import { canonicalFromGarminTransfer } from "./garmin-canonical.mjs";
import { adler32, encodeGarminTransfer } from "./garmin-transfer.mjs";
async function source() {
  const frames = [
    ["SESSION_START", "schema=1.0.0;wall=1700000000;mono=1"],
    [
      "SESSION_FINAL",
      "elapsed=1000;pos=0;hr=0;pressure=0;quality=0;dist=0;max=-;completed=1700000001",
    ],
  ].map(([frameType, payload], sequence) => ({
    magic: "WWJF",
    formatVersion: 1,
    sequence,
    frameType,
    payload,
    payloadLength: payload.length,
    checksum: adler32(`WWJF|1|${sequence}|${frameType}|${payload}`),
  }));
  return (
    await canonicalFromGarminTransfer(
      encodeGarminTransfer("synthetic-opaque-session", frames),
    )
  ).lines.join("");
}
const binding = () => ({
  localDeviceReference: "synthetic-device",
  sourceSessionId: "synthetic-opaque-session",
  deviceId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
});
test("identity binding preserves opaque canonical identity without inventing cloud UUIDs", async () => {
  const text = await source(),
    input = binding(),
    before = structuredClone(input);
  const bound = await bindCanonicalIdentity(text, input);
  assert.equal(bound.plan.sessionId, input.sourceSessionId);
  assert.deepEqual(input, before);
  assert.ok(Object.isFrozen(bound.binding));
  assert.equal(
    Buffer.concat(
      bound.plan.chunks.map((c) => Buffer.from(c.payloadBase64, "base64")),
    ).toString("utf8"),
    text,
  );
  assert.equal(
    (await bindCanonicalIdentity(text, input)).bindingDigest,
    bound.bindingDigest,
  );
  assert.notEqual(
    (
      await bindCanonicalIdentity(text, {
        ...input,
        sessionId: "33333333-3333-4333-8333-333333333333",
      })
    ).bindingDigest,
    bound.bindingDigest,
  );
  assert.equal(bound.authorization, "NOT_VERIFIED");
});
test("missing, wrong-session and malformed bindings fail closed", async () => {
  const text = await source();
  for (const value of [
    undefined,
    {},
    { ...binding(), sourceSessionId: "different-session" },
    { ...binding(), sessionId: "invented" },
    { ...binding(), deviceId: null },
    { ...binding(), extra: true },
  ])
    await assert.rejects(() => bindCanonicalIdentity(text, value));
});
test("legacy contract cannot be passed off as canonical-stream transport", () => {
  const report = inspectSyncCompatibility();
  assert.equal(report.sessionIdentityFormat, "uuid");
  assert.equal(report.canonicalStreamContentSupported, false);
  assert.equal(report.sourceSessionIdentityFieldSupported, false);
  assert.equal(report.decision, "NO_GO_FOR_DIRECT_CANONICAL_UPLOAD");
});
