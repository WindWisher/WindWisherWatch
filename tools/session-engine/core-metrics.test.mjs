import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  CoreMetricProjector,
  MetricAvailability,
  MetricQualityCode,
  haversineMeters,
} from "./core-metrics.mjs";

const fixture = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../fixtures/session-engine/core-metrics-scenarios.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

function point({ t, latitude = 0, longitude = 0, speed = 2, ...rest }) {
  return {
    relativeMilliseconds: t,
    latitudeDegrees: latitude,
    longitudeDegrees: longitude,
    groundSpeedMps: speed,
    usable: true,
    accuracyMeters: 5,
    source: "SYNTHETIC_GPS",
    ...rest,
  };
}

test("haversine matches a known synthetic equatorial vector", () => {
  const distance = haversineMeters(
    point({ t: 0 }),
    point({ t: 1000, longitude: 0.001 }),
  );
  assert.ok(Math.abs(distance - 111.19) < 0.2);
});

test("projects current and maximum speed plus incremental distance", () => {
  const metrics = new CoreMetricProjector();
  metrics.ingestPosition(point({ t: 0, speed: 2 }));
  metrics.ingestPosition(point({ t: 10_000, longitude: 0.0001, speed: 4 }));
  const live = metrics.snapshot(10_000);
  assert.equal(live.currentSpeedMps, 4);
  assert.equal(live.maximumSpeedMps, 4);
  assert.ok(Math.abs(live.distanceMeters - 11.119) < 0.1);
  assert.equal(live.validGpsSampleCount, 2);
});

test("stationary duplicates do not add distance", () => {
  const metrics = new CoreMetricProjector();
  metrics.ingestPosition(point({ t: 1000, speed: 0 }));
  const issues = metrics.ingestPosition(point({ t: 2000, speed: 0 }));
  assert.deepEqual(issues, []);
  assert.equal(metrics.snapshot(2000).distanceMeters, 0);
});

test("rejects duplicate, backward, poor and spatial spike samples", () => {
  const metrics = new CoreMetricProjector();
  metrics.ingestPosition(point({ t: 1000 }));
  assert.deepEqual(metrics.ingestPosition(point({ t: 1000 })), [
    MetricQualityCode.GPS_DUPLICATE,
  ]);
  assert.deepEqual(metrics.ingestPosition(point({ t: 500 })), [
    MetricQualityCode.GPS_BACKWARD_TIMESTAMP,
  ]);
  assert.deepEqual(metrics.ingestPosition(point({ t: 2000, usable: false })), [
    MetricQualityCode.GPS_POOR_FIX,
  ]);
  assert.deepEqual(metrics.ingestPosition(point({ t: 2000, longitude: 1 })), [
    MetricQualityCode.GPS_SPIKE,
  ]);
  assert.equal(metrics.snapshot(2000).distanceMeters, 0);
});

test("invalid speed never replaces valid current or maximum speed", () => {
  const metrics = new CoreMetricProjector();
  metrics.ingestPosition(point({ t: 0, speed: 5 }));
  const issues = metrics.ingestPosition(
    point({ t: 1000, longitude: 0.00001, speed: -1 }),
  );
  assert.deepEqual(issues, [MetricQualityCode.GPS_INVALID_SPEED]);
  assert.equal(metrics.snapshot(1000).currentSpeedMps, 5);
  assert.equal(metrics.snapshot(1000).maximumSpeedMps, 5);
});

test("a position without speed does not refresh an older speed", () => {
  const metrics = new CoreMetricProjector();
  metrics.ingestPosition(point({ t: 0, speed: 5 }));
  metrics.ingestPosition(point({ t: 11_000, longitude: 0.00001, speed: null }));
  const live = metrics.snapshot(11_000);
  assert.equal(live.gpsStatus, MetricAvailability.VALID);
  assert.equal(live.currentSpeedMps, null);
  assert.equal(live.maximumSpeedMps, 5);
});

test("freshness distinguishes unavailable, valid and stale", () => {
  const metrics = new CoreMetricProjector();
  assert.equal(metrics.snapshot(0).gpsStatus, MetricAvailability.UNAVAILABLE);
  assert.equal(
    metrics.snapshot(0).heartRateStatus,
    MetricAvailability.UNAVAILABLE,
  );
  metrics.ingestPosition(point({ t: 1000, speed: 0 }));
  metrics.ingestHeartRate({ relativeMilliseconds: 1000, bpm: 120 });
  assert.equal(metrics.snapshot(2000).gpsStatus, MetricAvailability.VALID);
  assert.equal(metrics.snapshot(20_000).gpsStatus, MetricAvailability.STALE);
  assert.equal(metrics.snapshot(20_000).currentSpeedMps, null);
  assert.equal(metrics.snapshot(20_000).heartRateBpm, null);
});

test("checkpoint restore is deterministic and idempotent", () => {
  const continuous = new CoreMetricProjector();
  continuous.ingestPosition(point({ t: 0, speed: 2 }));
  continuous.ingestPosition(point({ t: 10_000, longitude: 0.0001, speed: 3 }));
  const recovered = new CoreMetricProjector();
  recovered.restore(continuous.checkpointState());
  assert.deepEqual(recovered.snapshot(10_000), continuous.snapshot(10_000));
  recovered.restore(continuous.checkpointState());
  assert.deepEqual(recovered.snapshot(10_000), continuous.snapshot(10_000));
});

test("eight virtual hours keep constant-size metric state", () => {
  const metrics = new CoreMetricProjector();
  const initialKeys = Object.keys(metrics.checkpointState());
  for (let second = 0; second <= 8 * 60 * 60; second += 1)
    metrics.ingestPosition(
      point({
        t: second * 1000,
        longitude: second * 0.000001,
        speed: 1,
      }),
    );
  const state = metrics.checkpointState();
  assert.deepEqual(Object.keys(state), initialKeys);
  assert.equal(state.validGpsSampleCount, 28_801);
  assert.equal(state.maximumSpeedMps, 1);
});

test("synthetic replay fixture produces its declared projections", () => {
  for (const scenario of fixture.scenarios) {
    const metrics = new CoreMetricProjector();
    const issues = scenario.positions.flatMap((sample) =>
      metrics.ingestPosition(sample),
    );
    const live = metrics.snapshot(
      scenario.positions.at(-1).relativeMilliseconds,
    );
    assert.ok(
      Math.abs(live.distanceMeters - scenario.expected.distanceMetersApprox) <
        0.2,
      scenario.name,
    );
    if (scenario.expected.maximumSpeedMps !== undefined)
      assert.equal(
        live.maximumSpeedMps,
        scenario.expected.maximumSpeedMps,
        scenario.name,
      );
    if (scenario.expected.validGpsSampleCount !== undefined)
      assert.equal(
        live.validGpsSampleCount,
        scenario.expected.validGpsSampleCount,
        scenario.name,
      );
    if (scenario.expected.rejectedSegmentCount !== undefined)
      assert.equal(
        live.rejectedSegmentCount,
        scenario.expected.rejectedSegmentCount,
        scenario.name,
      );
    if (scenario.expected.quality !== undefined)
      assert.ok(issues.includes(scenario.expected.quality), scenario.name);
  }
});
