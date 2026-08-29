import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const fixtureToSchema = new Map([
  [
    "session",
    "https://windwisher.app/contracts/session/v1/session.schema.json",
  ],
  [
    "jump-event",
    "https://windwisher.app/contracts/jump/v1/jump-event.schema.json",
  ],
  [
    "track-point",
    "https://windwisher.app/contracts/track/v1/track-point.schema.json",
  ],
  [
    "heart-rate-sample",
    "https://windwisher.app/contracts/heart-rate/v1/heart-rate-sample.schema.json",
  ],
  [
    "device-capabilities",
    "https://windwisher.app/contracts/device/v1/device-capabilities.schema.json",
  ],
  [
    "device-info",
    "https://windwisher.app/contracts/device/v1/device-info.schema.json",
  ],
  [
    "forecast-snapshot",
    "https://windwisher.app/contracts/forecast/v1/forecast-snapshot.schema.json",
  ],
  [
    "sync-package",
    "https://windwisher.app/contracts/sync/v1/sync-package.schema.json",
  ],
]);

async function filesBelow(directory, suffix) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(target, suffix) : [target];
    }),
  );
  return nested
    .flat()
    .filter((file) => file.endsWith(suffix))
    .sort();
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function inspectArchitecture(schema, relativeFile) {
  const errors = [];
  const serialized = JSON.stringify(schema).toLowerCase();
  for (const forbidden of [
    "supabaseclient",
    "flutter/",
    "swiftui.",
    "androidx.",
    "toybox.",
  ]) {
    if (serialized.includes(forbidden))
      errors.push(`${relativeFile}: forbidden runtime coupling '${forbidden}'`);
  }
  if (schema.type === "object" && schema.additionalProperties !== false) {
    errors.push(
      `${relativeFile}: root object must set additionalProperties to false`,
    );
  }
  if (!schema.$id?.includes("/v1/"))
    errors.push(`${relativeFile}: $id must carry the v1 path`);
  if (!schema.$schema?.includes("2020-12"))
    errors.push(`${relativeFile}: Draft 2020-12 is required`);

  const ambiguous = new Set([
    "height",
    "distance",
    "duration",
    "speed",
    "airtime",
    "altitude",
    "accuracy",
    "heading",
  ]);
  const visit = (node, pointer = "#") => {
    if (!node || typeof node !== "object") return;
    if (node.properties) {
      for (const [name, value] of Object.entries(node.properties)) {
        if (ambiguous.has(name))
          errors.push(
            `${relativeFile}${pointer}/properties/${name}: unit is missing from field name`,
          );
        visit(value, `${pointer}/properties/${name}`);
      }
    }
    if (node.$defs)
      for (const [name, value] of Object.entries(node.$defs))
        visit(value, `${pointer}/$defs/${name}`);
    if (node.items) visit(node.items, `${pointer}/items`);
  };
  visit(schema);
  return errors;
}

export async function runContractSuite() {
  const schemaFiles = await filesBelow(
    path.join(root, "contracts"),
    ".schema.json",
  );
  const schemas = await Promise.all(schemaFiles.map(readJson));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const schema of schemas) ajv.addSchema(schema);

  const guardErrors = schemas.flatMap((schema, index) =>
    inspectArchitecture(schema, path.relative(root, schemaFiles[index])),
  );
  if (guardErrors.length)
    throw new Error(`Architectural guards failed:\n${guardErrors.join("\n")}`);

  const results = [];
  for (const expectation of ["valid", "invalid"]) {
    const fixtureFiles = await filesBelow(
      path.join(root, "fixtures/contracts", expectation),
      ".json",
    );
    for (const fixtureFile of fixtureFiles) {
      const name = path.basename(fixtureFile, ".json");
      const schemaId = fixtureToSchema.get(name);
      if (!schemaId)
        throw new Error(
          `No schema mapping for ${path.relative(root, fixtureFile)}`,
        );
      const validate = ajv.getSchema(schemaId);
      if (!validate) throw new Error(`Unresolved schema ${schemaId}`);
      const fixture = await readJson(fixtureFile);
      const accepted = validate(fixture);
      const expectedValid = expectation === "valid";
      results.push({ name, expectation, accepted, errors: validate.errors });
      if (accepted !== expectedValid) {
        throw new Error(
          `${path.relative(root, fixtureFile)} was ${accepted ? "accepted" : "rejected"}; expected ${expectation}. ${JSON.stringify(validate.errors)}`,
        );
      }
    }
  }
  if (results.length !== fixtureToSchema.size * 2) {
    throw new Error(
      `Expected ${fixtureToSchema.size * 2} fixture checks, ran ${results.length}`,
    );
  }
  return { schemas: schemas.length, results };
}
