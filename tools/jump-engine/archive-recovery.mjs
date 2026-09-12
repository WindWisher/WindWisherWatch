import { mkdir, readFile, writeFile, realpath, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { parseLatestGarminResearchCapture } from "./garmin-capture.mjs";
import { captureReplayEligibility } from "./capture-replay-eligibility.mjs";

const digest = (data) => createHash("sha256").update(data).digest("hex");

// Local archive primitive, not a device transfer or log-clearing command.
// Caller supplies an approved private destination; no discovery or cloud access.
export async function archiveRecovery({
  destination,
  trialId,
  bakPath,
  txtPath,
  observedHops,
}) {
  if (
    !/^[A-Z0-9_-]{1,48}$/.test(trialId) ||
    !path.isAbsolute(destination) ||
    !Number.isInteger(observedHops) ||
    observedHops < 0 ||
    observedHops > 10
  )
    throw new Error("Invalid archive request or missing operator count");
  const actualDestination = await realpath(destination).catch(async () =>
    path.join(
      await realpath(path.dirname(destination)),
      path.basename(destination),
    ),
  );
  const temporaryRoots = ["/tmp", "/private/tmp", await realpath(tmpdir())];
  if (
    temporaryRoots.some(
      (root) =>
        actualDestination === root || actualDestination.startsWith(`${root}/`),
    )
  )
    throw new Error("Research archives must not use temporary storage");
  for (const source of [bakPath, txtPath]) {
    const info = await stat(source);
    if (!info.isFile() || info.size > 4 * 1024 * 1024)
      throw new Error("Invalid bounded capture source");
  }
  // Snapshot both inputs before creating the archive. Never modify the sources.
  const originals = await Promise.all([readFile(bakPath), readFile(txtPath)]);
  if (originals.some((data) => data.length > 4 * 1024 * 1024))
    throw new Error("Capture exceeds archive input bound");
  await mkdir(destination, { recursive: true, mode: 0o700 });
  const directory = path.join(destination, `${trialId}-${randomUUID()}`);
  await mkdir(directory, { mode: 0o700 });
  const files = [];
  for (const [index, name] of [
    "WWJumpResearch.BAK",
    "WWJumpResearch.TXT",
  ].entries()) {
    const target = path.join(directory, name);
    await writeFile(target, originals[index], { flag: "wx", mode: 0o600 });
    const hash = digest(originals[index]);
    if (digest(await readFile(target)) !== hash)
      throw new Error("Archive readback mismatch; keep source logs");
    files.push({ name, bytes: originals[index].length, sha256: hash });
  }
  let coverage;
  try {
    const capture = await parseLatestGarminResearchCapture(
      originals.map((data) => data.toString("utf8")).join("\n"),
    );
    coverage = captureReplayEligibility(capture);
  } catch {
    // Invalid/truncated attempts are preserved, never silently discarded.
    coverage = { status: "INVALID_CAPTURE_PRESERVED" };
  }
  const manifest = {
    archiveVersion: 1,
    trialId,
    observedHops,
    referenceKind: "OPERATOR_COUNT_ONLY_NOT_EVENT_MATCHED",
    files,
    coverage,
    sourceClearingAuthorized: false,
    independentBackupVerified: false,
  };
  await writeFile(
    path.join(directory, "archive-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  return { directory, coverage, sourceClearingAuthorized: false };
}
