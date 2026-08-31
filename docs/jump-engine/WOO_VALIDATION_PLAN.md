# M6 Woo validation preparation

Woo is an empirical reference, not absolute physical ground truth. M5 performs no Woo API integration and no matching/scoring.

A future reference record may contain `referenceId`, reference timestamp, optional reported height/airtime and `source = WOO`. It must be associated through consented test metadata, not treated as canonical watch truth. A configurable temporal window can later match an `ExperimentalJumpCandidate` to at most one reference record with explicit ambiguity handling.

M6 must predeclare precision, recall, false positives, false negatives, temporal offset and airtime MAE. Height MAE/RMSE is relevant only if a separately justified height estimator exists. Evaluation must segment scenario/device/profile cohorts and retain unmatched records rather than forcing matches.

Current gate is `M6_WOO_VALIDATION_GATE = NO_GO`. Controlled hardware evidence now exists and selects MEDIUM for continued research, but J5 MEDIUM produced a confirmed false positive, J3/J4 airtimes remain unvalidated, and raw-window replay is incomplete. M6 must not begin until a versioned hypothesis resolves those blockers and repeats the affected controls without erasing this baseline.
