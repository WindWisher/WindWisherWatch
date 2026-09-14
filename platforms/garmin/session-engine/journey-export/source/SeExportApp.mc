import Toybox.Application;
import Toybox.Application.Storage;
import Toybox.Graphics;
import Toybox.System;
import Toybox.Timer;
import Toybox.WatchUi;

// Explicitly authorized temporary private diagnostic export, not production sync.
// The isolated Journey identity preserves its journals. Never record or recover.
class SeExportReadPort {
    function readIndex() { return Storage.getValue(SeConstants.INDEX_KEY); }
    function readChunk(id, number) { return Storage.getValue("se." + id + "." + number); }
}

class SeExportView extends WatchUi.View {
    private var _port;
    private var _audit;
    private var _timer;
    private var _status = "CHECKING";
    private var _pages;
    private var _selected = 1;
    function initialize() {
        View.initialize();
        _port = new SeExportReadPort();
        _audit = new SeReadOnlyAudit(_port);
        _timer = new Timer.Timer();
    }
    function onShow() { _timer.start(method(:tick), 100, true); }
    function onHide() { _timer.stop(); }
    function begin() {
        if (!_status.equals("PAGE READY")) { return; }
        System.println(_pages.header());
        System.print(_pages.contents());
        System.println("WWSE_PAGE_END");
        _status = "PAGE EMITTED";
        WatchUi.requestUpdate();
    }
    function nextPage() {
        if (!_status.equals("PAGE READY") && !_status.equals("PAGE EMITTED")) { return; }
        _selected = _selected < _pages.pageCount() ? _selected + 1 : 1;
        _pages = new SeExportPages(_port, _selected);
        _status = "PAGING";
        _timer.start(method(:tick), 100, true);
    }
    function tick() {
        try {
            if (_status.equals("CHECKING")) {
                _audit.step();
                if (!_audit.status().equals("SCANNING")) {
                    if (_audit.status().equals("VALID") && _audit.verifiedSessions() == 2) {
                        _pages = new SeExportPages(_port, _selected); _status = "PAGING";
                    } else { _status = "AUDIT FAILED"; _timer.stop(); }
                }
            } else if (_status.equals("PAGING")) {
                for (var i = 0; i < 4 && _pages.status().equals("SCANNING"); i += 1) { _pages.step(); }
                if (!_pages.status().equals("SCANNING")) { _status = _pages.status().equals("READY") ? "PAGE READY" : "EXPORT FAILED"; _timer.stop(); }
            }
        } catch (ex) { _status = "EXPORT FAILED"; _timer.stop(); }
        WatchUi.requestUpdate();
    }
    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK); dc.clear();
        var x = dc.getWidth() / 2;
        dc.drawText(x, 45, Graphics.FONT_SMALL, "PRIVATE EXPORT", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 95, Graphics.FONT_SMALL, _status, Graphics.TEXT_JUSTIFY_CENTER);
        if (_pages != null) { dc.drawText(x, 125, Graphics.FONT_XTINY, "PAGE " + _selected + "/" + _pages.pageCount(), Graphics.TEXT_JUSTIFY_CENTER); }
        dc.drawText(x, 155, Graphics.FONT_XTINY, "START send / DOWN page", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 185, Graphics.FONT_XTINY, "Host verification required", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
class SeExportDelegate extends WatchUi.BehaviorDelegate {
    private var _view;
    function initialize(view) { BehaviorDelegate.initialize(); _view = view; }
    function onSelect() { _view.begin(); return true; }
    function onNextPage() { _view.nextPage(); return true; }
}
class SeExportApp extends Application.AppBase {
    function initialize() { AppBase.initialize(); }
    function getInitialView() { var view = new SeExportView(); return [view, new SeExportDelegate(view)]; }
}
