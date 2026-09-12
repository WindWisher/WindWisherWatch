import { pathToFileURL } from "node:url";
import { SustainedSegmentationExperiment } from "./sustained-segmentation-experiment.mjs";
import { vectorMagnitude } from "./features.mjs";
import { compareTimeoutReseed } from "./timeout-reseed-experiment.mjs";
import { loadScenarioCatalog } from "./fixtures.mjs";

// Causal, explicitly hypothetical additive-background model. Not marine noise
// calibration and not a change to the normal detector, raw capture or export.
export class PeriodicBackgroundExperiment extends SustainedSegmentationExperiment {
  constructor(options) {
    super(options);
    this.config = Object.freeze({
      ...this.config,
      algorithmVersion: "experimental-periodic-background-offline-v1",
    });
    this.backgroundPulses = [];
    this.pendingBackground = null;
    this.backgroundModel = null;
    this.previousBackgroundTime = null;
    this.backgroundCorrections = 0;
  }

  process(sample) {
    if (sample.sequence <= this.lastSequence) return super.process(sample);
    const time = sample.rawSampleTimestamp;
    const magnitude = vectorMagnitude(sample.accel);
    const interval = 1000 / this.config.sampleRateHz;
    const continuous =
      Number.isFinite(time) &&
      time >= 0 &&
      (this.previousBackgroundTime === null ||
        (time > this.previousBackgroundTime &&
          time - this.previousBackgroundTime <=
            interval * this.config.sampleGapMultiplier));
    if (!continuous || magnitude === null) {
      this.backgroundPulses = [];
      this.pendingBackground = null;
      this.backgroundModel = null;
      this.previousBackgroundTime = Number.isFinite(time) ? time : null;
      return super.process(sample);
    }
    this.previousBackgroundTime = time;
    // Prediction uses only previously completed pulses; this observation cannot
    // retroactively fit its own correction. Original sample remains untouched.
    const model = this.backgroundModel;
    let derived = sample;
    if (
      model &&
      time - model.lastEnd <= 2 * model.period &&
      (time - model.lastStart) % model.period < model.width
    ) {
      derived = {
        ...sample,
        accel: {
          x: sample.accel.x - model.delta.x,
          y: sample.accel.y - model.delta.y,
          z: sample.accel.z - model.delta.z,
        },
      };
      this.backgroundCorrections++;
    }
    this.observeBackground(sample, time, magnitude);
    return super.process(derived);
  }

  observeBackground(sample, time, magnitude) {
    const quiet =
      magnitude >= this.config.groundedMinimumMps2 &&
      magnitude <= this.config.groundedMaximumMps2;
    const impulse =
      magnitude >= this.config.takeoffImpulseMps2 &&
      magnitude < this.config.minimumTakeoffPeakMps2;
    if (impulse) {
      this.pendingBackground ??= {
        start: time,
        sum: { x: 0, y: 0, z: 0 },
        count: 0,
        invalid: false,
      };
      const pulse = this.pendingBackground;
      if (time - pulse.start >= this.config.maximumTakeoffCandidateMilliseconds)
        pulse.invalid = true;
      if (!pulse.invalid) {
        for (const axis of ["x", "y", "z"])
          pulse.sum[axis] += sample.accel[axis];
        pulse.count++;
      }
      return;
    }
    if (quiet && this.pendingBackground) {
      const pulse = this.pendingBackground;
      if (!pulse.invalid && pulse.count > 0) {
        const delta = {};
        for (const axis of ["x", "y", "z"])
          delta[axis] = pulse.sum[axis] / pulse.count - sample.accel[axis];
        this.backgroundPulses.push({
          start: pulse.start,
          end: time,
          width: time - pulse.start,
          delta,
        });
        if (this.backgroundPulses.length > 3) this.backgroundPulses.shift();
        this.fitBackground();
      }
      this.pendingBackground = null;
    } else if (!quiet && this.pendingBackground) {
      // A strong takeoff or low-g excursion invalidates this learning pulse.
      this.pendingBackground.invalid = true;
    }
  }

  fitBackground() {
    this.backgroundModel = null;
    if (this.backgroundPulses.length !== 3) return;
    const [a, b, c] = this.backgroundPulses;
    const period = c.start - b.start;
    // Sampling uncertainty is one configured interval; amplitude consistency
    // tolerance is a provisional 1 m/s² vector difference, not tuned per trial.
    const tolerance = 1000 / this.config.sampleRateHz;
    if (
      period <= 0 ||
      period > this.config.maximumTakeoffCandidateMilliseconds ||
      Math.abs(period - (b.start - a.start)) > tolerance ||
      c.width >= period ||
      [a, b].some(
        (p) =>
          Math.abs(p.width - c.width) > tolerance ||
          Math.hypot(
            p.delta.x - c.delta.x,
            p.delta.y - c.delta.y,
            p.delta.z - c.delta.z,
          ) > 1,
      )
    )
      return;
    this.backgroundModel = {
      period,
      width: c.width,
      lastStart: c.start,
      lastEnd: c.end,
      delta: { ...c.delta },
    };
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2)
    throw new Error("Fixed tuning study accepts no arguments");
  console.log(
    JSON.stringify(
      compareTimeoutReseed(
        await loadScenarioCatalog(
          "fixtures/jump-engine/synthetic-scenarios.json",
        ),
        PeriodicBackgroundExperiment,
      ),
      null,
      2,
    ),
  );
}
