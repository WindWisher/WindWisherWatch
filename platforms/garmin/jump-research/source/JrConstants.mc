module JrConstants {
    const APP_VERSION = "0.1.0-m5.1";
    const SCHEMA_VERSION = "1.0.0";
    const ALGORITHM_VERSION = "experimental-0.1-hardware-observer";
    const PROFILE_VERSION = "garmin-research-0.1";
    const LOG_PREFIX = "WWJUMP|";

    const STATE_IDLE = "IDLE";
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
    const MAX_CONTROLLED_DURATION_MILLISECONDS = 12000;
    const MAX_RESEARCH_DURATION_MILLISECONDS = 30000;
    const MAX_CANDIDATES = 8;
    const MAX_EXPORT_RECORDS = 64;
    const ESTIMATED_BYTES_PER_SAMPLE = 88;
    const MAX_RAW_WINDOW_BYTES = MAX_CAPTURE_SAMPLES * ESTIMATED_BYTES_PER_SAMPLE;
    const EXPORT_RECORDS_PER_TICK = 12;
    const TIMER_INTERVAL_MILLISECONDS = 100;

    const FLAG_TIMESTAMP_DEGRADED = 1;
    const FLAG_GYRO_OUTLIER = 2;
    const FLAG_SAMPLE_GAP = 4;
}
