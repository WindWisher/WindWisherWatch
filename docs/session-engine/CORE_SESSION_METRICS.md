# Core session metrics

M3 adds a constant-size `CoreMetricProjector` between normalized observations and `SessionLiveState`. Adapters acquire; the Session Engine coordinates durability; the projector calculates only live essentials.

Canonical units are SI: milliseconds, meters, meters per second and bpm. Presentation conversion is outside the projector. Current speed uses Garmin GPS ground speed with `GPS_GROUND_SPEED` provenance; maximum speed is an incremental maximum. Distance uses the Haversine formula with a 6,371,000 m mean Earth radius and retains only the previous accepted position.

The projector also retains latest valid HR, GPS/HR timestamps, valid GPS count and bounded rejection counters. Average speed, P95, active time, VMG, maneuvers, area, scores and jump metrics remain WindWisher or later-capability work.

Per-sample time and memory are O(1). An eight-hour synthetic host test confirms fixed-shape state. `stop()` appends a bounded checkpoint/final tail and validates only that tail; it never scans the track or journal.
