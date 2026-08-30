import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../../contracts/session/v1/canonical-session-record.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export function validateCanonicalRecord(record) {
  const accepted = validate(record);
  return {
    accepted,
    errors: accepted ? [] : structuredClone(validate.errors ?? []),
  };
}
