import fs from "node:fs/promises";
import { ExperimentalJumpEngine } from "./engine.mjs";
import { generateScenario, loadScenarioCatalog } from "./fixtures.mjs";
import { parseLatestGarminResearchCapture } from "./garmin-capture.mjs";
import {
  measurePreflightWindow,
  measureLastImpulse,
} from "./takeoff-evidence.mjs";

// Offline tuning exploration only, not a classifier or holdout evaluator.
function study(samples, profile) {
  const engine = new ExperimentalJumpEngine({
    sessionId: "preflight-study",
    profile,
  });
  const history = [];
  const phases = [];
  for (const sample of samples) {
    const before = engine.state;
    engine.process(sample);
    history.push({
      time: engine.normalizer.previousNormalized,
      magnitudeMps2: Math.hypot(sample.accel.x, sample.accel.y, sample.accel.z),
    });
    while (history.length > 40) history.shift();
    if (before !== "POSSIBLE_TAKEOFF" || engine.state !== "FLIGHT") continue;
    const end = history.at(-1).time;
    phases.push({
      flightEntry: end,
      windows: [120, 240, 360].map((duration) => {
        try {
          return {
            duration,
            ...measurePreflightWindow(history, end, duration),
          };
        } catch (error) {
          return { duration, unavailable: error.message };
        }
      }),
      lastImpulse: measureLastImpulse(history),
    });
  }
  return phases;
}

const catalog = await loadScenarioCatalog(
  "fixtures/jump-engine/synthetic-scenarios.json",
);
for (const id of [
  "brisk-walking-false-positive-envelope-v1",
  "hp1-like-late-post-event-peak-v1",
  "hp2-like-late-post-event-peak-v1",
  "brisk-walking-hop-brisk-walking-phase-v1",
  "j5-arm-motion-structural-hypothesis-v1",
])
  for (const profile of ["MEDIUM", "HIGH"])
    console.log(
      JSON.stringify({
        source: "SYNTHETIC",
        id,
        profile,
        phases: study(generateScenario(catalog, id, profile).samples, profile),
      }),
    );

const files = process.argv.slice(2);
if (files.length) {
  if (files.length !== 2 || files.some((f) => !f.startsWith("/tmp/")))
    throw new Error("Supply BAK and TXT from /tmp only");
  const capture = await parseLatestGarminResearchCapture(
    (await Promise.all(files.map((f) => fs.readFile(f, "utf8")))).join(""),
  );
  const samples = capture.samples.map((s) => ({
    sequence: s.sequence,
    rawSampleTimestamp: s.rawSampleTimestamp,
    callbackTimestamp: s.callbackTimestamp,
    accel: {
      x: s.accelMillig[0] * 0.00980665,
      y: s.accelMillig[1] * 0.00980665,
      z: s.accelMillig[2] * 0.00980665,
    },
  }));
  console.log(
    JSON.stringify({
      source: "HARDWARE_TUNING",
      profile: "MEDIUM",
      phases: study(samples, "MEDIUM"),
    }),
  );
}
