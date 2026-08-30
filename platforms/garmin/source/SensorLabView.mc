import Toybox.Graphics;
import Toybox.WatchUi;

class SensorLabView extends WatchUi.View {
    private var _controller;

    function initialize() { View.initialize(); }
    function setController(controller) { _controller = controller; }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var center = dc.getWidth() / 2;
        dc.drawText(center, 10, Graphics.FONT_SMALL, "WW SENSOR LAB", Graphics.TEXT_JUSTIFY_CENTER);
        if (_controller == null) { return; }
        dc.drawText(center, 42, Graphics.FONT_SMALL, _controller.experiment() + " / " + _controller.profile(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 70, Graphics.FONT_MEDIUM, _controller.state(), Graphics.TEXT_JUSTIFY_CENTER);
        var counts = _controller.counts();
        dc.drawText(center, 105, Graphics.FONT_XTINY, "A " + counts[:accelerometer] + "  G " + counts[:gyroscope] + "  GPS " + counts[:position], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 125, Graphics.FONT_XTINY, "HR " + counts[:heartRate] + "  P " + counts[:pressure], Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 150, Graphics.FONT_XTINY, "elapsed " + (_controller.elapsedMilliseconds() / 1000) + "s", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 35, Graphics.FONT_XTINY, "MENU test  UP/DN rate", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 20, Graphics.FONT_XTINY, "SELECT start/stop  BACK cancel", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
