# Experimental detection pipeline

The state machine uses `GROUND`, `POSSIBLE_TAKEOFF`, `FLIGHT` and `POSSIBLE_LANDING`; terminal candidates are separately `CONFIRMED` or `REJECTED`.

1. A raw acceleration impulse opens a possible takeoff.
2. A following sustained low-acceleration signature within a bounded interval enters flight.
3. A landing impulse after minimum duration opens possible landing.
4. Ground-like stabilization and a fixed post-event tail confirm the candidate.
5. Ambiguous takeoff, short flight, excessive duration, missing landing or session end rejects/fails closed.

Experimental airtime is `landingCandidate - takeoffCandidate`. Apex is only an `EXPERIMENTAL_UNKNOWN` midpoint placeholder. Height and horizontal distance are not implemented. Confidence is `HIGH`, `MEDIUM` or `LOW` from observable boundary clarity and quality degradation; it is not probability or sports accuracy.

Negative fixtures cover stationary input, walking-like motion, arm swings, short patterns and excessive low-g. Synthetic positives prove only code/state-machine behavior. They do not establish that Garmin wrist signals represent a real kite jump.
