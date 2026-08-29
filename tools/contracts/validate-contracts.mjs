import { runContractSuite } from "./contract-suite.mjs";

try {
  const report = await runContractSuite();
  const accepted = report.results.filter((result) => result.accepted).length;
  const rejected = report.results.length - accepted;
  console.log(
    `Contract validation passed: ${report.schemas} schemas compiled; ${accepted} valid fixtures accepted; ${rejected} invalid fixtures rejected.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
