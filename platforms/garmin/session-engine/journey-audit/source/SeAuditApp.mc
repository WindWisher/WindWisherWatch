import Toybox.Application;
import Toybox.Application.Storage;
import Toybox.Graphics;
import Toybox.Timer;
import Toybox.WatchUi;

class SeAuditReadPort {
    function readIndex() { return Storage.getValue(SeConstants.INDEX_KEY); }
    function readChunk(id, number) { return Storage.getValue("se." + id + "." + number); }
}

class SeAuditView extends WatchUi.View {
    private var _audit;
    private var _timer;
    function initialize() {
        View.initialize();
        _audit = new SeReadOnlyAudit(new SeAuditReadPort());
        _timer = new Timer.Timer();
    }
    function onShow() { _timer.start(method(:tick), 100, true); }
    function onHide() { _timer.stop(); }
    function tick() {
        _audit.step();
        if (!_audit.status().equals("SCANNING")) { _timer.stop(); }
        WatchUi.requestUpdate();
    }
    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK); dc.clear();
        var x = dc.getWidth() / 2;
        dc.drawText(x, 30, Graphics.FONT_SMALL, "SESSION AUDIT", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 70, Graphics.FONT_XTINY, _audit.status(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 105, Graphics.FONT_SMALL, "VALID " + _audit.verifiedSessions() + "/" + _audit.sessionCount(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 145, Graphics.FONT_XTINY, "FRAMES " + _audit.scannedFrames(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(x, 190, Graphics.FONT_XTINY, "READ ONLY / BACK exit", Graphics.TEXT_JUSTIFY_CENTER);
    }
}

class SeAuditApp extends Application.AppBase {
    function initialize() { AppBase.initialize(); }
    function getInitialView() { return [new SeAuditView(), new WatchUi.InputDelegate()]; }
}
