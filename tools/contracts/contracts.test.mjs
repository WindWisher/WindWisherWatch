import assert from "node:assert/strict";
import test from "node:test";
import { runContractSuite } from "./contract-suite.mjs";

test("all schemas compile, references resolve, and fixtures have expected outcomes", async () => {
  const report = await runContractSuite();
  assert.equal(report.schemas, 10);
  assert.equal(report.results.length, 18);
  assert.equal(report.results.filter((result) => result.accepted).length, 9);
  assert.equal(report.results.filter((result) => !result.accepted).length, 9);
});
