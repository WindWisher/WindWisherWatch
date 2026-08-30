# Session live state

`SessionLiveState` is an immutable projection containing:

- identity, lifecycle state, monotonic elapsed time and separate wall clock;
- current and maximum speed in m/s;
- accumulated distance in meters;
- latest fresh HR in bpm;
- GPS and HR availability/freshness;
- recording, persistence and quality health;
- bounded sample, rejection and quality counters.

Unknown is represented by `null`/`UNAVAILABLE`, never by a fabricated zero. A real stationary speed remains `0 m/s`. When GPS exceeds 10 seconds without an accepted point, current speed becomes unavailable while maximum speed and distance remain preserved. HR becomes stale after 15 seconds.

The Garmin developer harness converts speed to km/h and distance to km only for display. It is not product UI.
