# AT2 fixture provenance audit — 2026-09-09

## Graph and scope

Historical operator labels -> aggregate report -> constructed waveform -> regression -> hardware interpretation.

This audit examines the aggregate-to-waveform edge. Sources inspected: `synthetic-scenarios.json`, `fixtures.mjs`, M5.4 findings/completion report, and Git introduction in `08eb008f69c9464b016841ccc64dfbb2f606ff1e`. This is not an exhaustive search of all historical private files. No fixture sample, expected outcome, detector or threshold is changed.

## Provenance

`brisk-walking-false-positive-envelope-v1` declares `SANITIZED_AGGREGATE_FROM_ALIGNED_AT2_TUNING`. Historical documentation reports three AT2 negative trials and two false positives with peaks 2335–2386 mg. The fixture uses 24 m/s², approximately 2447.32 mg, for takeoff and landing. This is not an exact conversion of that range; historical global peaks are also not necessarily current phase-scoped peaks.

| Element         | Construction                          | Evidence limit                                         |
| --------------- | ------------------------------------- | ------------------------------------------------------ |
| Negative label  | AT2-inspired expectedConfirmed=0      | Historical failures documented, not exact replay       |
| Impulses        | Two 80-ms [24,0,0] plateaus           | Simplified waveform; vector provenance unverified      |
| Low-g           | 360-ms constant 2.7 m/s²              | Exact sample/timing derivation unverified              |
| Post-event peak | 80-ms [50,0,0] after landing          | Tests snapshot isolation; not verified AT2 sample      |
| Rest            | 1000/1400-ms constant 9.80665         | Synthetic baseline                                     |
| Axes            | Positive x only                       | Generator construction, not observed wrist orientation |
| Gyro            | Constant [20,10,5]                    | Generator placeholder, not recorded gyro               |
| Clocks          | Uniform 40/20 ms; callback equals raw | Synthetic, not hardware batching                       |

There is no attached source-capture identifier or field-by-field derivation for these constants. The combined introduction commit does not establish chronology/provenance for every parameter. The fixture remains a useful structural and post-event-isolation regression, not a validated reconstruction of the historical AT2 trace.

## Correction to earlier interpretation

Lowering the takeoff threshold revives a **synthetic regression**. It has not been shown to replay the original physical AT2 false positive. The monotonic-dominance result is mathematically valid for these represented signals, but does not establish physical realism of their exact combination. Earlier shorthand suggesting certain recurrence on actual walking overstates the evidence. Preserve the fixture and its expected rejection; do not delete it or quietly relax its label to make an algorithm pass.

## Vector feasibility cycle

Offline descriptors use raw vectors while the unchanged engine is in FLIGHT, including entry and excluding the landing-trigger sample. Magnitude CV is population standard deviation divided by mean. Direction concentration is norm(sum(vectors))/sum(norm(vectors)). These are descriptive sample aggregates, invariant to a fixed coordinate rotation but not time-varying wrist rotation or sampling. No vertical velocity, gravity direction or calibrated gyro is inferred.

| Phase                             | Samples |    Magnitude CV | Direction concentration |
| --------------------------------- | ------: | --------------: | ----------------------: |
| DIAG_01 first flight candidate    |       6 |         0.50960 |                 0.84704 |
| DIAG_01 later unlabeled candidate |       2 |         0.33288 |                 0.99788 |
| WV1 negative                      |       5 |         0.28062 |                 0.99837 |
| WV2 negative                      |       6 |         0.29130 |                 0.99515 |
| AT2-like synthetic negative       |       7 | approximately 0 |                       1 |
| HP1-like synthetic timing control |       8 | approximately 0 |                       1 |
| Synthetic moving-hop positive     |       8 |               0 |                       1 |

Both positive and negative synthetic controls have constant collinear flight vectors. Rejecting this geometry would also reject a synthetic positive. Accepting hardware variability could learn generator-versus-hardware differences instead of jump-versus-walking. The few physical phases, including an uncertainly aligned positive, do not justify a cutoff. The vector hypothesis remains INSUFFICIENT_EVIDENCE, not disproved for all possible features.

## Decisions

- Keep fixture samples, labels, defaults and historical failures unchanged.
- Treat SYNTHETIC_REGRESSION and VERIFIED_HARDWARE_REPLAY separately.
- Correct the model document's stale mandatory direction-cosine gate; current code uses supporting evidence only.
- Do not extend the completed WV collection budget or tune to the current small set.
- A new study must explicitly define independent event timing, repeated controlled positives and matched negatives, full vector/clock retention, orientation/sampling controls, a fixed collection budget and separate holdout. No detector-output labels or synthetic-versus-real shortcuts.

New synchronized reference collection requires choosing a reference method and capture workflow; neither was performed here. Do not assume video permission or start further trials. This audit supports a provenance correction, not a new classifier. M6 remains NO_GO, detector EXPERIMENTAL and product-ready NO; height/airtime unvalidated, Woo NOT_RUN. No backend, raw publication, commit or push.
