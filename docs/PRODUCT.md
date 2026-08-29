# Product

## Problem and user

Kitesurfers need a reliable, glanceable instrument that records a session when the phone and network are unavailable. The primary user is an active rider wearing wet equipment in bright light, spray, motion, cold, and wind, with little attention available for interaction.

WindWisherWatch records locally, reports only defensible sport metrics, survives connectivity loss, and synchronizes later with WindWisher. It is not a watch-sized copy of forecast, community, or profile features.

## Experience principles

- **Sensor-first and offline-first:** acquisition and durable recovery outrank UI freshness and connectivity.
- **Glanceable:** essential information is readable quickly without precise touch interaction.
- **Measure less, measure well:** no live wind or gust estimation and no pseudo-scientific score.
- **Private by default:** recording and publishing are different actions.
- **Traceable estimates:** derived jump metrics retain algorithm, confidence, timing, and quality metadata.

## Conceptual session views

The main session screen is centered on the **latest jump**. Its hierarchy is: latest height (dominant), horizontal distance, airtime, session time, current time, and heart rate. Missing or low-confidence derived values are shown as unavailable or qualified, never as precise facts.

The **Ride** view shows reliable on-watch metrics: current, maximum, and average speed; distance; jump count; highest jump; optional heading; and useful heart rate. Each metric must declare whether it is observed, aggregated, or derived.

The **Forecast** view shows a previously downloaded `ForecastSnapshot`: source, generation/download times, validity interval, spot, wind forecast, gust forecast, and warnings. Forecast wind is cached prediction—not wind measured live by the watch.

## Expected journey

The rider prepares and starts a session, records without phone/network dependency, can pause where supported, stops explicitly, receives a durable completion result, and synchronizes opportunistically. Crashes or partial writes enter explicit recovery rather than silently fabricating completion.

## Initial metrics

Session time, track distance, speed summaries, heart-rate sport samples when available, and versioned jump estimates are in scope over later milestones. Jump height, airtime, and distance remain estimates until empirically validated for the device/capability profile.

## Non-goals

M0 implements no wearable app, sensors, Jump Engine, real sync, backend migration, maps, rankings, social flow, medical analysis, AI, or live wind/gust estimator. A forecast snapshot may contain predicted wind and gusts.

## Future opportunities

Native watchOS and Wear OS apps, capability-tuned jump strategies, richer WindWisher analysis, consented validation cohorts, and carefully defined versioned scores may follow evidence and roadmap gates.
