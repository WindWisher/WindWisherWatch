import assert from "node:assert/strict";
import test from "node:test";
import {
  AlignmentCategory,
  alignOperatorReference,
  DatasetSplit,
  ExpectedEventType,
  MarkerType,
  MAX_OPERATOR_MARKERS,
  validateOperatorReference,
} from "./operator-reference.mjs";

function reference(overrides = {}) {
  return {
    referenceSchemaVersion: "1.0.0",
    trialId: "trial-001",
    datasetSplit: DatasetSplit.TUNING,
    expectedEventType: ExpectedEventType.CONTROLLED_HOP,
    timestampQuality: "VALID",
    markers: [
      {
        referenceId: "trial-001:post-1",
        markerType: MarkerType.POST_EVENT_MARK,
        timestampMilliseconds: 5000,
        uncertaintyBeforeMilliseconds: 2000,
        uncertaintyAfterMilliseconds: 100,
        provenance: "OPERATOR_POST_EVENT_BUTTON",
      },
    ],
    ...overrides,
  };
}

function candidate(id, takeoff, landing) {
  return {
    candidateId: id,
    status: "CONFIRMED",
    takeoffMilliseconds: takeoff,
    landingMilliseconds: landing,
  };
}

test("reference serialization is bounded and validates monotonic markers", () => {
  const value = reference();
  assert.deepEqual(
    validateOperatorReference(JSON.parse(JSON.stringify(value))),
    value,
  );
  assert.throws(() =>
    validateOperatorReference(
      reference({
        markers: Array.from(
          { length: MAX_OPERATOR_MARKERS + 1 },
          (_, index) => ({
            referenceId: `m-${index}`,
            markerType: MarkerType.GO_SIGNAL,
            timestampMilliseconds: index,
            uncertaintyBeforeMilliseconds: 0,
            uncertaintyAfterMilliseconds: 100,
            provenance: "COUNTDOWN_GO",
          }),
        ),
      }),
    ),
  );
});

test("one positive reference aligns to one confirmed candidate", () => {
  const result = alignOperatorReference({
    reference: reference(),
    candidates: [candidate("c-1", 3900, 4300)],
  });
  assert.equal(result.matches[0].category, AlignmentCategory.MATCHED);
  assert.equal(result.counts.matched, 1);
});

test("missing and extra detections remain distinct", () => {
  const missed = alignOperatorReference({
    reference: reference(),
    candidates: [],
  });
  assert.equal(missed.matches[0].category, AlignmentCategory.MISSED);
  const extra = alignOperatorReference({
    reference: reference(),
    candidates: [candidate("outside", 9000, 9400)],
  });
  assert.equal(extra.matches[1].category, AlignmentCategory.EXTRA_DETECTION);
});

test("multiple compatible candidates are ambiguous, never nearest-matched", () => {
  const result = alignOperatorReference({
    reference: reference(),
    candidates: [candidate("a", 3500, 3900), candidate("b", 4300, 4700)],
  });
  assert.equal(result.matches[0].category, AlignmentCategory.AMBIGUOUS);
  assert.deepEqual(result.matches[0].candidateIds, ["a", "b"]);
});

test("negative trial makes every confirmation a false positive", () => {
  const negative = reference({
    expectedEventType: ExpectedEventType.NONE,
    markers: [
      {
        referenceId: "negative",
        markerType: MarkerType.NEGATIVE_TRIAL,
        timestampMilliseconds: 0,
        uncertaintyBeforeMilliseconds: 0,
        uncertaintyAfterMilliseconds: 0,
        provenance: "PREDECLARED_PROTOCOL",
      },
    ],
  });
  const result = alignOperatorReference({
    reference: negative,
    candidates: [candidate("fp", 1000, 1300)],
  });
  assert.equal(result.matches[0].category, AlignmentCategory.FALSE_POSITIVE);
});

test("matching is deterministic under candidate permutation", () => {
  const candidates = [
    candidate("outside", 9000, 9400),
    candidate("hop", 3900, 4300),
  ];
  const first = alignOperatorReference({ reference: reference(), candidates });
  const second = alignOperatorReference({
    reference: reference(),
    candidates: [...candidates].reverse(),
  });
  assert.deepEqual(second, first);
});

test("degraded timing makes an overlapping match ambiguous", () => {
  const result = alignOperatorReference({
    reference: reference({ timestampQuality: "DEGRADED" }),
    candidates: [candidate("c-1", 3900, 4300)],
  });
  assert.equal(result.matches[0].category, AlignmentCategory.AMBIGUOUS);
});

test("alignment prefers the marker timestamp in normalized sensor time", () => {
  const value = reference();
  value.markers.find(
    (marker) => marker.markerType === MarkerType.POST_EVENT_MARK,
  ).normalizedTimestampMilliseconds = 2100;
  const result = alignOperatorReference({
    reference: value,
    candidates: [candidate("normalized", 1800, 2050)],
  });
  assert.equal(result.counts.matched, 1);
  assert.equal(
    result.matches[0].timestampBasis,
    "NORMALIZED_SENSOR_TIME_WITH_MEASURED_CALLBACK_LAG",
  );
  assert.equal(result.matches[0].callbackLagMilliseconds, 2900);
});

test("measured callback lag covers an event delivered after the marker", () => {
  const value = reference();
  const marker = value.markers[0];
  marker.timestampMilliseconds = 9376;
  marker.normalizedTimestampMilliseconds = 8152;
  marker.uncertaintyBeforeMilliseconds = 2500;
  marker.uncertaintyAfterMilliseconds = 100;
  const result = alignOperatorReference({
    reference: value,
    candidates: [candidate("batched", 8520, 8808)],
  });
  assert.equal(result.counts.matched, 1);
  assert.equal(result.matches[0].callbackLagMilliseconds, 1224);
});
