# ADR-015: Multiple empirical jump references

- Status: Accepted
- Date: 2026-09-11

## Context

WOO, SurfR and Garmin can expose useful jump events and derived metrics, but
each product has private algorithms, sensor placement, filtering, clocks and
rounding. Agreement with one vendor is not physical ground truth and copying a
vendor-specific representation would weaken portability.

## Decision

WindWisher Watch may use consented vendor sessions as versioned empirical
references. Every reference records its source, observed software profile,
field semantics, import behaviour and evidence limits. Comparisons report each
reference separately and never combine vendor values into an unlabeled truth.

Repository fixtures contain only de-identified aggregates and relative times.
Raw FIT files, exact tracks, absolute timestamps, account data and proprietary
binaries remain outside Git. WindWisher algorithms keep their own versioned
configuration and provenance; no vendor output silently changes runtime
thresholds.

## Consequences

Multiple references can expose systematic bias and help define interoperable
session exports without claiming that any one implementation is correct.
Validation needs simultaneous recordings, explicit clock alignment and
one-to-one event matching. A single imported vendor session can document
serialization and display semantics, but cannot validate WindWisher detection,
height, airtime or distance.

## Rejected alternatives

- Treating one vendor as physical truth.
- Averaging vendor metrics without independent alignment and uncertainty.
- Committing personal tracks or raw third-party application data.
- Reproducing proprietary implementation details in the product algorithm.
