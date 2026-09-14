import fs from "node:fs";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createSyncPlan } from "./sync-plan.mjs";

const contract = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../contracts/sync/v1/sync-package.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const ajv = new Ajv2020({ strict: true });
addFormats(ajv);
const validateBinding = ajv.compile({
  type: "object",
  additionalProperties: false,
  required: [
    "localDeviceReference",
    "sourceSessionId",
    "deviceId",
    "sessionId",
  ],
  properties: {
    localDeviceReference: {
      type: "string",
      pattern: "^[A-Za-z0-9._:-]{1,128}$",
    },
    sourceSessionId: { type: "string", minLength: 1, maxLength: 128 },
    deviceId: { type: "string", format: "uuid" },
    sessionId: { type: "string", format: "uuid" },
  },
});
function check(ok) {
  if (!ok) throw new Error("Invalid sync identity binding");
}

// Trusted-adapter input, not an authorization proof. Never derive a cloud identity
// from GPS/time, truncate the source ID, or silently replace the canonical ID.
export async function bindCanonicalIdentity(canonical, binding) {
  check(validateBinding(binding));
  const snapshot = structuredClone(binding);
  const plan = await createSyncPlan(canonical, snapshot.localDeviceReference);
  check(plan.sessionId === snapshot.sourceSessionId);
  const digest = createHash("sha256")
    .update(
      JSON.stringify([
        "bound-sync-identity-1",
        plan.planId,
        snapshot.deviceId.toLowerCase(),
        snapshot.sessionId.toLowerCase(),
      ]),
    )
    .digest("hex");
  return Object.freeze({
    kind: "LOCAL_BOUND_SYNC_IDENTITY_V1",
    binding: Object.freeze({
      ...snapshot,
      deviceId: snapshot.deviceId.toLowerCase(),
      sessionId: snapshot.sessionId.toLowerCase(),
    }),
    plan,
    // New binding => new namespace. Local queue keys must not be reused as cloud keys.
    bindingDigest: digest,
    authorization: "NOT_VERIFIED",
    wireCompatibility: "BLOCKED_CANONICAL_CONTENT_PROFILE",
  });
}

export function inspectSyncCompatibility() {
  const accepted =
    contract.properties.contentManifest.items.properties.contentType.enum;
  return Object.freeze({
    contractId: contract.$id,
    sessionIdentityFormat: contract.properties.sessionId.format,
    deviceIdentityFormat: contract.properties.deviceId.format,
    canonicalStreamContentSupported: accepted.includes(
      "canonical_session_stream",
    ),
    sourceSessionIdentityFieldSupported: Object.hasOwn(
      contract.properties,
      "sourceSessionId",
    ),
    compressionDoesNotResolveContentMismatch: true,
    remoteDelivery: "NOT_RUN",
    decision: "NO_GO_FOR_DIRECT_CANONICAL_UPLOAD",
  });
}
