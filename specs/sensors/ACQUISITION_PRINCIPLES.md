# Sensor acquisition principles

M1 must measure, not assume: available channels, requested/actual sample rate, batching, jitter, clock domain, dropout, GPS accuracy, HR cadence, runtime restrictions, durable write cost, display cost, and battery drain per device/profile.

Adapters attach source, normalized UTC time, monotonic order where possible, accuracy/quality, and capability snapshot. Clock discontinuities are flags, not silently smoothed. Sampling profiles are versioned names with measured energy/storage envelopes. Degraded sensors may reduce strategy capability; they must not silently produce equally precise metrics.
