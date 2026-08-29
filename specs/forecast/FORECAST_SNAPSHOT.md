# Forecast snapshot

A forecast snapshot is an immutable cached prediction downloaded before loss of connectivity. It records spot, source/version, generated/downloaded times, validity interval, and time buckets for forecast wind/gust/direction and warnings. It remains readable offline until expired, with staleness visible.

Forecast wind and gust are not observed by the watch and must never be labelled as live measured wind. M0 does not estimate either value.
