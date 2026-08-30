import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const executable = process.platform === "win32" ? ".bat" : "";
const pathEntries = (process.env.PATH ?? "").split(path.delimiter);
const configuredSdkFile = path.join(
  os.homedir(),
  "Library/Application Support/Garmin/ConnectIQ/current-sdk.cfg",
);
let configuredSdk = null;
if (fs.existsSync(configuredSdkFile))
  configuredSdk = fs.readFileSync(configuredSdkFile, "utf8").trim();

function locate(name) {
  for (const directory of pathEntries) {
    const candidate = path.join(directory, `${name}${executable}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  if (configuredSdk) {
    const candidate = path.join(configuredSdk, "bin", `${name}${executable}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const report = {
  configuredSdk,
  monkeyc: locate("monkeyc"),
  monkeydo: locate("monkeydo"),
  connectiq: locate("connectiq"),
  developerKeyConfigured: Boolean(process.env.GARMIN_DEVELOPER_KEY),
  targetDevice: process.env.GARMIN_TARGET_DEVICE ?? "fenix7",
};
console.log(JSON.stringify(report, null, 2));
if (!report.monkeyc || !report.monkeydo || !report.connectiq)
  process.exitCode = 2;
