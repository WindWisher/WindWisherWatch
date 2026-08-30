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
        dc.drawText(center, 42, Graphics.FONT_MEDIUM, live["state"], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 74, Graphics.FONT_XTINY, "TIME " + (live["elapsedMilliseconds"] / 1000) + "s", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 94, Graphics.FONT_XTINY, "SPEED " + speedText(live["currentSpeedMps"]) + " km/h", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 114, Graphics.FONT_XTINY, "MAX " + speedText(live["maximumSpeedMps"]) + " km/h", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 134, Graphics.FONT_XTINY, "DIST " + distanceText(live["distanceMeters"]) + " km", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 154, Graphics.FONT_XTINY, "HR " + valueText(live["heartRate"]) + " GPS " + live["gpsStatus"], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 24, Graphics.FONT_XTINY, "SELECT start/stop/finalize", Graphics.TEXT_JUSTIFY_CENTER);
    }

    function speedText(value) { return value == null ? "--" : (value * 3.6).format("%.1f"); }
    function distanceText(value) { return value == null ? "--" : (value / 1000.0).format("%.2f"); }
    function valueText(value) { return value == null ? "--" : value.toString(); }
}
