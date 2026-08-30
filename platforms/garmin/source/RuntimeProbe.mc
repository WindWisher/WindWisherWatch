import Toybox.System;

class RuntimeProbe {
    private var _writer;
    private var _minimumFreeMemory;
    private var _peakUsedMemory;
    private var _startBattery;
    private var _endBattery;

    function initialize(writer) { _writer = writer; reset(); }

    function reset() {
        _minimumFreeMemory = null;
        _peakUsedMemory = 0;
        _startBattery = null;
        _endBattery = null;
    }

    function capture() {
        var stats = System.getSystemStats();
        if (_startBattery == null) { _startBattery = stats.battery; }
        _endBattery = stats.battery;
        _writer.runtime(stats, LabClock.now());
        if (_minimumFreeMemory == null || stats.freeMemory < _minimumFreeMemory) { _minimumFreeMemory = stats.freeMemory; }
        if (stats.usedMemory > _peakUsedMemory) { _peakUsedMemory = stats.usedMemory; }
        if (stats.freeMemory < LabConstants.LOW_MEMORY_BYTES) {
            _writer.warning(LabConstants.ERROR_LOW_MEMORY, "free_memory_guard");
            return false;
        }
        return true;
    }

    function minimumFreeMemory() { return _minimumFreeMemory; }
    function peakUsedMemory() { return _peakUsedMemory; }
    function summaryJson() {
        return "{\"minimumFreeMemoryBytes\":" + value(_minimumFreeMemory) + ",\"peakUsedMemoryBytes\":" + _peakUsedMemory + ",\"batteryStartPercent\":" + value(_startBattery) + ",\"batteryEndPercent\":" + value(_endBattery) + "}";
    }

    function value(item) { return item == null ? "null" : item.toString(); }
}
