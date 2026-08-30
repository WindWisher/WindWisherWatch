# M6 Woo validation preparation

Woo is an empirical reference, not absolute physical ground truth. M5 performs no Woo API integration and no matching/scoring.

A future reference record may contain `referenceId`, reference timestamp, optional reported height/airtime and `source = WOO`. It must be associated through consented test metadata, not treated as canonical watch truth. A configurable temporal window can later match an `ExperimentalJumpCandidate` to at most one reference record with explicit ambiguity handling.

M6 must predeclare precision, recall, false positives, false negatives, temporal offset and airtime MAE. Height MAE/RMSE is relevant only if a separately justified height estimator exists. Evaluation must segment scenario/device/profile cohorts and retain unmatched records rather than forcing matches.

Current gate is `M6_WOO_VALIDATION_GATE = NO_GO`: synthetic stability is insufficient without controlled hardware evidence and a preliminary MEDIUM/HIGH signal comparison.
