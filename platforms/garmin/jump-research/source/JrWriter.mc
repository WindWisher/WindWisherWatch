import Toybox.System;

class JrWriter {
    function emit(record) { System.println(JrConstants.LOG_PREFIX + record); }

    function manifest(experimentId, protocol, profile, mode, rate, maximumRate, settings) {
        emit("{\"recordType\":\"manifest\",\"researchSchemaVersion\":\"" + JrConstants.SCHEMA_VERSION + "\",\"experimentId\":\"" + experimentId + "\",\"protocolId\":\"" + protocol + "\",\"sensorProfile\":\"" + profile + "\",\"sensorProfileVersion\":\"" + JrConstants.PROFILE_VERSION + "\",\"jumpAlgorithmVersion\":\"" + JrConstants.ALGORITHM_VERSION + "\",\"captureMode\":\"" + mode + "\",\"deviceFamily\":\"" + settings.partNumber + "\",\"firmware\":\"" + settings.firmwareVersion[0] + "." + settings.firmwareVersion[1] + "\",\"requestedRateHz\":" + rate + ",\"maximumReportedRateHz\":" + maximumRate + ",\"limits\":{\"maxDurationMilliseconds\":" + durationLimit(mode) + ",\"maxSamples\":" + JrConstants.MAX_CAPTURE_SAMPLES + ",\"maxCandidates\":" + JrConstants.MAX_CANDIDATES + ",\"maxExportRecords\":" + JrConstants.MAX_EXPORT_RECORDS + ",\"maxRawWindowBytes\":" + JrConstants.MAX_RAW_WINDOW_BYTES + "},\"privacy\":\"SENSITIVE_RESEARCH_TELEMETRY\"}");
    }

    function sample(record) {
        // Compact technical record. Field order is schema-versioned by the
        // manifest and avoids Garmin's approximately 10 KiB log retention cap.
        emit("M|" + value(record[0]) + "|" + value(record[1]) + "|" + value(record[2]) + "|" + value(record[3]) + "|" + value(record[4]) + "|" + value(record[5]) + "|" + value(record[6]) + "|" + value(record[7]) + "|" + value(record[8]) + "|" + value(record[9]) + "|" + value(record[10]) + "|" + value(record[11]));
    }

    function summary(result, duration, source, startMemory, endMemory) {
        var buffer = source.buffer();
        var detector = source.detector();
        emit("{\"recordType\":\"summary\",\"result\":\"" + result + "\",\"durationMilliseconds\":" + duration + ",\"observedSamples\":" + source.sequence() + ",\"exportedSamples\":" + buffer.size() + ",\"overwrittenOrDroppedSamples\":" + buffer.dropped() + ",\"callbackStatistics\":" + source.stats().toJson() + ",\"detector\":{\"candidateCount\":" + detector.candidateCount() + ",\"confirmedCandidates\":" + detector.confirmed() + ",\"rejectedCandidates\":" + detector.rejected() + ",\"lastExperimentalAirtimeMilliseconds\":" + value(detector.lastAirtime()) + ",\"state\":\"" + detector.stateName() + "\"},\"memory\":{\"startFreeBytes\":" + startMemory.freeMemory + ",\"endFreeBytes\":" + endMemory.freeMemory + ",\"endUsedBytes\":" + endMemory.usedMemory + "},\"exportPolicy\":\"POST_CAPTURE_TIMER_DRAIN\"}");
        emit("{\"recordType\":\"completion\",\"result\":\"" + result + "\",\"integrity\":\"STRUCTURAL_ONLY\",\"records\":" + buffer.size() + "}");
    }

    function durationLimit(mode) { return mode.equals(JrConstants.MODE_CONTROLLED_FULL_WINDOW) ? JrConstants.MAX_CONTROLLED_DURATION_MILLISECONDS : JrConstants.MAX_RESEARCH_DURATION_MILLISECONDS; }
    function value(item) { return item == null ? "null" : item.toString(); }
}
