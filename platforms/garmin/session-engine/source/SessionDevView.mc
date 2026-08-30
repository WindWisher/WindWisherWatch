import Toybox.Graphics;
import Toybox.WatchUi;

class SessionDevView extends WatchUi.View {
    private var _controller;
    function initialize(controller) { View.initialize(); _controller = controller; }
    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var center = dc.getWidth() / 2;
        var live = _controller.engine().liveState();
        dc.drawText(center, 12, Graphics.FONT_SMALL, "WW SESSION DEV", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 46, Graphics.FONT_MEDIUM, live["state"], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 82, Graphics.FONT_XTINY, "elapsed " + (live["elapsedMilliseconds"] / 1000) + "s", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 102, Graphics.FONT_XTINY, "GPS " + live["positionCount"] + " HR " + live["heartRateCount"], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 122, Graphics.FONT_XTINY, "STORE " + live["lastPersistedSequence"] + " Q " + live["qualityCount"], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 24, Graphics.FONT_XTINY, "SELECT start/stop/finalize", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
