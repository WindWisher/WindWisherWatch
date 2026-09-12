import assert from "node:assert/strict";
import test from "node:test";
import {
  compareExternal,
  fitClock,
  validateSeries,
  LIMITS,
} from "./external-comparison.mjs";

const series = (times) => ({
  schemaVersion: "1.0.0",
  kind: "SANITIZED_EXTERNAL_EVENT_SERIES",
  source: "SYNTHETIC",
  timeBasis: "SECONDS_FROM_SOURCE_SESSION_START",
  events: times.map((eventTimeSeconds, i) => ({
    id: `event-${i}`,
    eventTimeSeconds,
  })),
});
const clock = {
  kind: "OFFSET",
  offsetSeconds: 0,
  scale: 1,
  provenance: "EXTERNALLY_SUPPLIED_UNVERIFIED",
};
const compare = (a, b, t = 1, model = clock) =>
  compareExternal(series(a), series(b), { clock: model, toleranceSeconds: t });

test("monotonic maximum-cardinality matching avoids the known greedy loss", () => {
  const r = compare([1, 2.5], [0, 1.5], 1.1);
  assert.equal(r.matched, 2);
  assert.deepEqual(r.pairs, [
    { candidateIndex: 0, referenceIndex: 0 },
    { candidateIndex: 1, referenceIndex: 1 },
  ]);
});

test("secondary objective minimizes total time error and ties are deterministic", () => {
  assert.deepEqual(compare([0, 0.9], [1], 1).pairs, [
    { candidateIndex: 1, referenceIndex: 0 },
  ]);
  assert.deepEqual(compare([0, 2], [1], 1), compare([0, 2], [1], 1));
  assert.equal(compare([1], [2], 1).matched, 1);
  assert.equal(compare([1], [2], 0.999).matched, 0);
});

test("clock fitting is separate, handles offset and drift without modifying events", () => {
  const anchors = [
    { candidateSeconds: 0, referenceSeconds: 3 },
    { candidateSeconds: 1000, referenceSeconds: 1004 },
  ];
  const model = fitClock(anchors, "AFFINE");
  assert.ok(Math.abs(model.scale - 1.001) < 1e-12);
  assert.ok(Math.abs(model.offsetSeconds - 3) < 1e-10);
  assert.equal(compare([0, 1000], [3, 1004], 1e-8, model).matched, 2);
  assert.equal(compare([0, 1000], [3, 1004], 1).matched, 0);
  const offset = fitClock(
    [{ candidateSeconds: 1, referenceSeconds: 4 }],
    "OFFSET",
  );
  assert.equal(offset.offsetSeconds, 3);
  assert.equal(offset.provenance, "FITTED_SAME_SESSION");
  assert.throws(() =>
    fitClock(
      [
        { candidateSeconds: 1, referenceSeconds: 1 },
        { candidateSeconds: 1, referenceSeconds: 2 },
      ],
      "AFFINE",
    ),
  );
});

test("absence, missing metrics and descriptive denominators remain explicit", () => {
  const a = series([0, 10, 20]),
    b = series([0, 20]);
  a.events[0].heightMeters = 3;
  b.events[0].heightMeters = 4;
  a.events[2].heightMeters = null;
  const before = JSON.stringify([a, b]);
  const r = compareExternal(a, b, { clock, toleranceSeconds: 0 });
  assert.equal(r.descriptivePrecision, 2 / 3);
  assert.equal(r.descriptiveRecall, 1);
  assert.deepEqual(r.unmatchedCandidateIndices, [1]);
  assert.deepEqual(r.heightDifferenceMeters, {
    count: 1,
    bias: -1,
    meanAbsoluteDifference: 1,
  });
  assert.equal(r.airtimeDifferenceSeconds.count, 0);
  assert.equal(r.airtimeDifferenceSeconds.bias, null);
  assert.equal(JSON.stringify([a, b]), before);
  assert.equal(compare([], []).descriptiveRecall, null);
  assert.equal(compare([], [1]).descriptivePrecision, null);
  assert.equal(r.WATCH_VS_VENDOR_EVENT_MATCHING, "NOT_RUN");
});

test("rejects permutations, duplicates, nonfinite values, bad units and unknown private fields", () => {
  for (const times of [
    [2, 1],
    [1, 1],
    [NaN],
    [Infinity],
    [-1],
    [LIMITS.seconds + 1],
  ])
    assert.throws(() => validateSeries(series(times)));
  const mutations = [
    (s) => (s.events[0].latitude = 1),
    (s) => (s.timeBasis = "MILLISECONDS"),
    (s) => (s.schemaVersion = "2"),
    (s) => (s.events[0].heightMeters = -1),
    (s) => (s.events[0].airtimeSeconds = Infinity),
    (s) => (s.events[1].id = s.events[0].id),
    (s) => (s.events[0].heightMeters = "3"),
  ];
  for (const mutate of mutations) {
    const s = series([1, 2]);
    mutate(s);
    assert.throws(() => validateSeries(s));
  }
  assert.throws(() =>
    validateSeries(series(Array.from({ length: 1001 }, (_, i) => i))),
  );
  assert.throws(() => compare([1], [1], NaN));
  assert.throws(() => compare([1], [1], 61));
  assert.throws(() => compare([1], [1], 1, { ...clock, scale: -1 }));
  assert.throws(() =>
    compare([1], [1], 1, { ...clock, provenance: undefined }),
  );
});

test("all small ordered assignments agree with exhaustive oracle", () => {
  function oracle(a, b, t, i = 0, j = 0) {
    if (i === a.length || j === b.length) return [0, 0];
    const options = [oracle(a, b, t, i + 1, j), oracle(a, b, t, i, j + 1)];
    if (Math.abs(a[i] - b[j]) <= t) {
      const [n, c] = oracle(a, b, t, i + 1, j + 1);
      options.push([n + 1, c + Math.abs(a[i] - b[j])]);
    }
    return options.sort((x, y) => y[0] - x[0] || x[1] - y[1])[0];
  }
  const subsets = Array.from({ length: 16 }, (_, mask) =>
    [0, 1, 2, 3].filter((_, i) => mask & (1 << i)),
  );
  for (const a of subsets)
    for (const b of subsets)
      for (const tolerance of [0, 0.5, 1.5]) {
        const shifted = b.map((x) => x + 0.5),
          r = compare(a, shifted, tolerance),
          [count, cost] = oracle(a, shifted, tolerance);
        assert.equal(r.matched, count);
        assert.ok(
          Math.abs(
            (r.alignedTimeDifferenceSeconds.meanAbsoluteDifference ?? 0) *
              count -
              cost,
          ) < 1e-10,
        );
        for (let k = 1; k < r.pairs.length; k++) {
          assert.ok(r.pairs[k].candidateIndex > r.pairs[k - 1].candidateIndex);
          assert.ok(r.pairs[k].referenceIndex > r.pairs[k - 1].referenceIndex);
        }
      }
});
