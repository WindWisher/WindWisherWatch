// Deterministic read-only pagination below Garmin's diagnostic log rotation size.
// Scans the bounded source, retaining only the selected page (<= 4000 ASCII bytes).
class SeExportPages {
    private var _port;
    private var _ids;
    private var _selected;
    private var _session = 0;
    private var _producer;
    private var _page = 1;
    private var _bytes = 0;
    private var _text = "";
    private var _status = "SCANNING";
    function initialize(port, selected) { _port = port; _ids = port.readIndex().keys(); _ids.sort(null); _selected = selected; if (_ids.size() != 2) { _status = "FAILED"; } }
    function status() { return _status; }
    function pageCount() { return _page; }
    function contents() { return _text; }
    function header() { return "WWSE_PAGE|1|" + _selected + "|" + _page + "|" + new SeChecksum().calculate(_text); }
    function step() {
        if (!_status.equals("SCANNING")) { return; }
        try {
            if (_producer == null) { _producer = new SeTransferProducer(_port, _ids[_session]); }
            var line = _producer.nextLine();
            if (line == null || line.length() > 4000) { _status = "FAILED"; return; }
            if (_bytes + line.length() > 4000) { _page += 1; _bytes = 0; }
            _bytes += line.length();
            if (_page == _selected) { _text += line; }
            _producer.acknowledge();
            if (_producer.status().equals("EXHAUSTED")) {
                _session += 1; _producer = null;
                if (_session == 2) { _status = _selected <= _page ? "READY" : "FAILED"; }
            }
        } catch (ex) { _status = "FAILED"; }
    }
}
