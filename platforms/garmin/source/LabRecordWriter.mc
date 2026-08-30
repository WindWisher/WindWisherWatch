import Toybox.Application.Storage;
import Toybox.System;
import Toybox.Time;

class LabRecordWriter {
    function emit(record) { System.println(LabConstants.LOG_PREFIX + record); }

    function manifest(experimentId, experimentName, profile, capabilities) {
        emit("{\"recordType\":\"manifest\",\"labSchemaVersion\":\"" + LabConstants.LAB_SCHEMA_VERSION + "\",\"experimentId\":\"" + experimentId + "\",\"experiment\":\"" + experimentName + "\",\"appVersion\":\"" + LabConstants.APP_VERSION + "\",\"sdkVersion\":\"RECORD_FROM_BUILD_ENVIRONMENT\",\"ciqApiLevel\":\"" + capabilities[:ciqApiLevel] + "\",\"profile\":\"" + profile + "\",\"environment\":{\"kind\":\"DEVICE_OR_SIMULATOR_UNCLASSIFIED\",\"evidenceLevel\":\"UNKNOWN\"},\"startedAt\":" + Time.now().value() + ",\"device\":{\"model\":\"" + capabilities[:partNumber] + "\",\"firmware\":\"" + capabilities[:firmware] + "\"},\"maximumReportedRatesHz\":{\"system\":" + capabilities[:maxSampleRate] + ",\"accelerometer\":" + capabilities[:accelerometerMaxSampleRate] + ",\"gyroscope\":" + capabilities[:gyroscopeMaxSampleRate] + "},\"requestedRatesHz\":{\"accelerometer\":" + capabilities[:requestedAccelerometerRate] + ",\"gyroscope\":" + capabilities[:requestedGyroscopeRate] + "}}");
    }

    function sample(sensor, sequence, sampleTimestamp, callbackTimestamp, rawJson) {
        emit("{\"recordType\":\"sample\",\"sensor\":\"" + sensor + "\",\"sequence\":" + sequence + ",\"monotonicMilliseconds\":" + sampleTimestamp + ",\"callbackMonotonicMilliseconds\":" + callbackTimestamp + ",\"raw\":" + rawJson + "}");
    }

    function runtime(stats, monotonicMilliseconds) {
        emit("{\"recordType\":\"runtime\",\"monotonicMilliseconds\":" + monotonicMilliseconds + ",\"batteryPercent\":" + stats.battery + ",\"freeMemoryBytes\":" + stats.freeMemory + ",\"usedMemoryBytes\":" + stats.usedMemory + ",\"totalMemoryBytes\":" + stats.totalMemory + "}");
    }

    function warning(code, detail) {
        emit("{\"recordType\":\"warning\",\"monotonicMilliseconds\":" + LabClock.now() + ",\"code\":\"" + code + "\",\"detail\":\"" + detail + "\"}");
    }

    function completion(result, startedAt, counts, capabilities, runtimeSummaryJson, motionTimingJson, positionTimingJson, healthTimingJson, ttffJson, motionDiagnosticsJson) {
        var summary = { "result" => result, "durationMilliseconds" => LabClock.elapsed(startedAt, LabClock.now()), "accelerometerSamples" => counts[:accelerometer], "gyroscopeSamples" => counts[:gyroscope], "positionSamples" => counts[:position], "heartRateSamples" => counts[:heartRate], "pressureSamples" => counts[:pressure] };
        try { Storage.setValue("wwlab.lastSummary", summary); }
        catch (ex) { warning(LabConstants.ERROR_EXPORT_FAILED, "summary_storage_failed"); }
        emit("{\"recordType\":\"completion\",\"endedAt\":" + Time.now().value() + ",\"monotonicMilliseconds\":" + LabClock.now() + ",\"durationMilliseconds\":" + summary["durationMilliseconds"] + ",\"result\":\"" + result + "\",\"maximumReportedRatesHz\":{\"system\":" + capabilities[:maxSampleRate] + ",\"accelerometer\":" + capabilities[:accelerometerMaxSampleRate] + ",\"gyroscope\":" + capabilities[:gyroscopeMaxSampleRate] + "},\"requestedRatesHz\":{\"accelerometer\":" + capabilities[:requestedAccelerometerRate] + ",\"gyroscope\":" + capabilities[:requestedGyroscopeRate] + "},\"runtimeSummary\":" + runtimeSummaryJson + ",\"sampleCounts\":{\"accelerometer\":" + counts[:accelerometer] + ",\"gyroscope\":" + counts[:gyroscope] + ",\"position\":" + counts[:position] + ",\"heartRate\":" + counts[:heartRate] + ",\"pressure\":" + counts[:pressure] + "},\"timingStatistics\":{\"motion\":" + motionTimingJson + ",\"position\":" + positionTimingJson + ",\"health\":" + healthTimingJson + "},\"gpsTtff\":" + ttffJson + ",\"motionDiagnostics\":" + motionDiagnosticsJson + ",\"motionMaxAbs\":{\"accelerometer\":{\"x\":" + counts[:accelerometerMaxAbsX] + ",\"y\":" + counts[:accelerometerMaxAbsY] + ",\"z\":" + counts[:accelerometerMaxAbsZ] + "},\"gyroscope\":{\"x\":" + counts[:gyroscopeMaxAbsX] + ",\"y\":" + counts[:gyroscopeMaxAbsY] + ",\"z\":" + counts[:gyroscopeMaxAbsZ] + "}},\"rawExportPolicy\":\"FIRST_32_THEN_EVERY_100\",\"timingPolicy\":\"FIXED_RELATIVE_HISTOGRAM_GAP_GT_2_5X_EXPECTED\",\"warnings\":[]}");
    }
}
