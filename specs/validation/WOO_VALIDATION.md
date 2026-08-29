# Empirical validation

Woo is a practical comparison reference with its own algorithms, placement, clocks, rounding, missing events, and unknown uncertainty. It is not physical ground truth. `ValidationSession` metadata should reference consented dataset ID, anonymized device/configuration, algorithm versions, clock-alignment method, event pairs, unmatched events, and reference provenance without embedding personal identity.

Event matching uses a predeclared temporal window and one-to-one assignment; the tolerance must be reported, not tuned after viewing outcomes. KPIs include detection precision and recall, false-positive and false-negative rates, height MAE/RMSE, airtime MAE, optional distance MAE, temporal-offset distribution, coverage, and results stratified by device/capability, conditions, and height bands.

Dataset splits prevent threshold tuning on test data. Every report records dataset version, exclusions, missingness, sample/session/rider counts, uncertainty intervals where feasible, algorithm version, and failures. Repository data must be synthetic or consented and de-identified; exact tracks should normally remain outside Git in controlled storage.
