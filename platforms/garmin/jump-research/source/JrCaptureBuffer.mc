class JrCaptureBuffer {
    private var _capacity;
    private var _sequence;
    private var _sampleTimestamp;
    private var _gyroTimestamp;
    private var _callbackTimestamp;
    private var _normalizedTimestamp;
    private var _ax;
    private var _ay;
    private var _az;
    private var _gx;
    private var _gy;
    private var _gz;
    private var _quality;
    private var _start = 0;
    private var _size = 0;
    private var _dropped = 0;
    private var _circular = false;

    function initialize(capacity) {
        _capacity = capacity;
        _sequence = new [capacity];
        _sampleTimestamp = new [capacity];
        _gyroTimestamp = new [capacity];
        _callbackTimestamp = new [capacity];
        _normalizedTimestamp = new [capacity];
        _ax = new [capacity]; _ay = new [capacity]; _az = new [capacity];
        _gx = new [capacity]; _gy = new [capacity]; _gz = new [capacity];
        _quality = new [capacity];
    }

    function reset(circular) {
        _start = 0;
        _size = 0;
        _dropped = 0;
        _circular = circular;
    }

    function append(sequence, sampleTimestamp, gyroTimestamp, callbackTimestamp, normalizedTimestamp, ax, ay, az, gx, gy, gz, quality) {
        var index = (_start + _size) % _capacity;
        if (_size >= _capacity) {
            if (!_circular) { _dropped += 1; return false; }
            index = _start;
            _start = (_start + 1) % _capacity;
            _dropped += 1;
        } else { _size += 1; }
        _sequence[index] = sequence;
        _sampleTimestamp[index] = sampleTimestamp;
        _gyroTimestamp[index] = gyroTimestamp;
        _callbackTimestamp[index] = callbackTimestamp;
        _normalizedTimestamp[index] = normalizedTimestamp;
        _ax[index] = ax; _ay[index] = ay; _az[index] = az;
        _gx[index] = gx; _gy[index] = gy; _gz[index] = gz;
        _quality[index] = quality;
        return true;
    }

    function record(logicalIndex) {
        var index = (_start + logicalIndex) % _capacity;
        return [_sequence[index], _sampleTimestamp[index], _gyroTimestamp[index], _callbackTimestamp[index], _normalizedTimestamp[index], _ax[index], _ay[index], _az[index], _gx[index], _gy[index], _gz[index], _quality[index]];
    }

    function size() { return _size; }
    function capacity() { return _capacity; }
    function dropped() { return _dropped; }
}
