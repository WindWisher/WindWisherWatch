import assert from "node:assert/strict";
import test from "node:test";
import { runContractSuite } from "./contract-suite.mjs";

test("all schemas compile, references resolve, and fixtures have expected outcomes", async () => {
  const report = await runContractSuite();
  assert.equal(report.schemas, 9);
  assert.equal(report.results.length, 16);
  assert.equal(report.results.filter((result) => result.accepted).length, 8);
  assert.equal(report.results.filter((result) => !result.accepted).length, 8);
});
