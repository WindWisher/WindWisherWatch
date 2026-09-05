module JrConstants {
    const APP_VERSION = "0.5.0-m5.4b";
    const SCHEMA_VERSION = "1.2.0";
    const ALGORITHM_VERSION = "experimental-0.5-phase-scoped-envelope";
    const PROFILE_VERSION = "garmin-research-0.1";
    const LOG_PREFIX = "WWJUMP|";

    const STATE_IDLE = "IDLE";
    const STATE_COUNTDOWN = "COUNTDOWN";
    const STATE_RUNNING = "RUNNING";
    const STATE_EXPORTING = "EXPORTING";
    const STATE_COMPLETED = "COMPLETED";
    const STATE_CANCELLED = "CANCELLED";
    const STATE_FAILED = "FAILED";

    const MODE_SUMMARY_ONLY = "SUMMARY_ONLY";
    const MODE_CANDIDATE_WINDOWS = "CANDIDATE_WINDOWS";
    const MODE_CONTROLLED_FULL_WINDOW = "CONTROLLED_FULL_WINDOW";

    // Garmin preserves roughly 10 KiB across the active and rotated app logs.
    // Keep the raw export below that physical transport ceiling; aggregate
    // statistics still cover every callback observed during the run.
    const MAX_CAPTURE_SAMPLES = 64;
    const MAX_CANDIDATE_WINDOW_SAMPLES = 40;
    const MAX_CONTROLLED_DURATION_MILLISECONDS = 12000;
    const MAX_RESEARCH_DURATION_MILLISECONDS = 30000;
    const MAX_CANDIDATES = 8;
    const MAX_OPERATOR_MARKERS = 4;
    // Canonical physical threshold: exactly 3000 mg. Host converts it with
    // 1 mg = 9.80665 / 1000 m/s^2 and does not round before comparison.
    const TAKEOFF_PEAK_THRESHOLD_MILLIG = 3000;
    const COUNTDOWN_MILLISECONDS = 3000;
    const POST_MARK_UNCERTAINTY_BEFORE_MILLISECONDS = 2500;
    const POST_MARK_UNCERTAINTY_AFTER_MILLISECONDS = 100;
    const POST_MARK_CAPTURE_TAIL_MILLISECONDS = 2000;
    const MAX_EXPORT_RECORDS = 64;
    const ESTIMATED_BYTES_PER_SAMPLE = 88;
    const MAX_RAW_WINDOW_BYTES = MAX_CAPTURE_SAMPLES * ESTIMATED_BYTES_PER_SAMPLE;
    const EXPORT_RECORDS_PER_TICK = 12;
    const TIMER_INTERVAL_MILLISECONDS = 100;

    const FLAG_TIMESTAMP_DEGRADED = 1;
    const FLAG_GYRO_OUTLIER = 2;
    const FLAG_SAMPLE_GAP = 4;
    const FLAG_ARM_MOTION_PATTERN = 8;

    const REASON_TAKEOFF_IMPULSE_FOUND = 1;
    const REASON_LOW_G_PHASE_FOUND = 2;
    const REASON_LOW_G_DURATION_PLAUSIBLE = 4;
    const REASON_LOW_G_TOO_BRIEF = 8;
    const REASON_LANDING_IMPULSE_FOUND = 16;
    const REASON_LANDING_STABLE = 32;
    const REASON_LANDING_NOT_STABLE = 64;
    const REASON_FLIGHT_DURATION_PLAUSIBLE = 128;
    const REASON_NO_FLIGHT_PHASE = 256;
    const REASON_IMPACT_ONLY = 512;
    const REASON_GYRO_CORRUPTED = 1024;
    const REASON_TIMESTAMP_DEGRADED = 2048;
    const REASON_SESSION_ENDED = 4096;
    const REASON_TAKEOFF_IMPULSE_UPDATED = 8192;
    const REASON_IMPULSE_DIRECTION_CONSISTENT = 16384;
    const REASON_ARM_MOTION_PATTERN = 32768;
    const REASON_JUMP_IMPULSE_LOW_G_ENVELOPE_FOUND = 65536;
    const REASON_JUMP_IMPULSE_LOW_G_ENVELOPE_MISSING = 131072;
}
