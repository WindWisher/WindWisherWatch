# False-negative analysis

## J3 HIGH baseline

M5.1 observed one operator-labelled controlled hop under HIGH with zero confirmations and two rejections. The retained raw prefix contained no candidate and may not contain the hop. Exact physical root cause is therefore not recoverable from that capture.

## Code findings

Core phase windows already used milliseconds. The profile-dependent part was smoothing: three samples at 25 Hz versus five at 50 Hz. A separate sample-count dependency existed only in post-candidate capture retention and was changed to a normalized-timestamp deadline.

M5.2 found a transition defect shared by both profiles: the detector anchored the takeoff window to the first impulse. On controlled hops, low-g sometimes arrived near the 360 ms boundary. The candidate now tracks the newest plausible impulse while retaining a separate 1,000 ms total bound, and expiry is checked before accepting low-g.

## Evidence

- Synthetic J3 boundary hypothesis: confirmed under MEDIUM and HIGH with time-equivalent classification.
- Physical MEDIUM after correction: 4/4 controlled hops, followed by another 4/4 and another 4/4 across diagnostic/tuning runs.
- Physical HIGH after correction: `NOT_RUN`; HIGH was not repeated because brisk-walking false positives already made the M6 gate `NO_GO`.

The original J3 HIGH miss is not claimed solved. Plausible causes remain first-impulse anchoring, smoothing-boundary sensitivity and human repetition variance.
