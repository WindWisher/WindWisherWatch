import Toybox.Application.Storage;

class StorageProbe {
    private var _writer;

    function initialize(writer) { _writer = writer; }

    function runSafeProbe() {
        var payload = "wwlab-safe-probe-256-bytes........................................................................................................................................................................................................................................";
        var started = LabClock.now();
        try {
            Storage.setValue("wwlab.storageProbe", payload);
            var written = Storage.getValue("wwlab.storageProbe");
            Storage.deleteValue("wwlab.storageProbe");
            _writer.emit("{\"recordType\":\"storage\",\"writeReadDeleteMilliseconds\":" + LabClock.elapsed(started, LabClock.now()) + ",\"payloadBytesApproximate\":256,\"verified\":" + (written != null) + "}");
            return true;
        } catch (ex) {
            _writer.warning(LabConstants.ERROR_EXPORT_FAILED, "storage_probe");
            return false;
        }
    }

    function runRepeatedProbe(repetitions) {
        for (var index = 0; index < repetitions; index += 1) { runSafeProbe(); }
    }

    function runRecoveryProbe() {
        var key = "wwlab.recoveryMarker";
        try {
            var existing = Storage.getValue(key);
            if (existing == null) {
                Storage.setValue(key, "M1_1_B_RECOVERY_MARKER_V1");
                var verified = Storage.getValue(key) != null;
                _writer.emit("{\"recordType\":\"recovery\",\"phase\":\"MARKER_WRITTEN_RELAUNCH_REQUIRED\",\"verified\":" + verified + "}");
                return verified;
            }
            var intact = existing.equals("M1_1_B_RECOVERY_MARKER_V1");
            Storage.deleteValue(key);
            var cleaned = Storage.getValue(key) == null;
            _writer.emit("{\"recordType\":\"recovery\",\"phase\":\"MARKER_RECOVERED_AFTER_RELAUNCH\",\"verified\":" + intact + ",\"cleanupVerified\":" + cleaned + "}");
            return intact && cleaned;
        } catch (ex) {
            _writer.warning(LabConstants.ERROR_EXPORT_FAILED, "recovery_probe");
            return false;
        }
    }
}
