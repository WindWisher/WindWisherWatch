import path from "node:path";
import { pathToFileURL } from "node:url";
import { replayScenario } from "./replay.mjs";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [catalog, scenarioId, profile = "MEDIUM"] = process.argv.slice(2);
  if (!catalog || !scenarioId) {
    console.error(
      "Usage: node inspect.mjs <scenario-catalog.json> <scenario-id> [MEDIUM|HIGH]",
    );
    process.exitCode = 2;
  } else {
    try {
      const result = await replayScenario(
        path.resolve(catalog),
        scenarioId,
        profile,
      );
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
