import assert from "node:assert/strict";
import test from "node:test";
import { assessOperatorCount } from "./operator-count.mjs";
const valid = {
  captureVerified: true,
  operatorConfirmsCoverage: true,
  protocolDeviation: false,
};
test("equal counts do not manufacture matched positive events", () => {
  const result = assessOperatorCount({
    ...valid,
    observedHops: 1,
    confirmedDetections: 1,
  });
  assert.equal(result.status, "COUNT_COMPATIBLE_NOT_EVENT_MATCHED");
  assert.equal(result.eventMatching, "NOT_ESTABLISHED");
});
test("negative detections and absent detections are reported explicitly", () => {
  for (const [observedHops, confirmedDetections, status] of [
    [0, 0, "NEGATIVE_TRIAL_NO_DETECTION"],
    [0, 2, "NEGATIVE_TRIAL_FALSE_DETECTION"],
    [1, 0, "NO_DETECTION_FOR_REPORTED_HOPS"],
    [1, 2, "COUNT_MISMATCH_NOT_EVENT_MATCHED"],
  ])
    assert.equal(
      assessOperatorCount({ ...valid, observedHops, confirmedDetections })
        .status,
      status,
    );
});
test("missing operator coverage or deviations never become trial successes", () => {
  for (const changes of [
    { captureVerified: false },
    { operatorConfirmsCoverage: undefined },
    { protocolDeviation: true },
    { protocolDeviation: undefined },
  ])
    assert.equal(
      assessOperatorCount({
        ...valid,
        ...changes,
        observedHops: 1,
        confirmedDetections: 1,
      }).status,
      "INCONCLUSIVE_REFERENCE_OR_CAPTURE",
    );
  assert.throws(() =>
    assessOperatorCount({ ...valid, confirmedDetections: 1 }),
  );
});
