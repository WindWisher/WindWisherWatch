import Toybox.Graphics;
import Toybox.WatchUi;

class JumpResearchView extends WatchUi.View {
    private var _controller;
    function initialize() { View.initialize(); }
    function setController(controller) { _controller = controller; }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_BLACK);
        dc.clear();
        var center = dc.getWidth() / 2;
        dc.drawText(center, 8, Graphics.FONT_SMALL, "WW JUMP RESEARCH", Graphics.TEXT_JUSTIFY_CENTER);
        if (_controller == null) { return; }
        dc.drawText(center, 38, Graphics.FONT_SMALL, _controller.protocol() + " / " + _controller.profile(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 62, Graphics.FONT_XTINY, _controller.mode(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 88, Graphics.FONT_MEDIUM, _controller.state(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 124, Graphics.FONT_XTINY, "SAMPLES " + _controller.sampleCount() + "  CAND " + _controller.confirmedCount(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 145, Graphics.FONT_XTINY, "elapsed " + (_controller.elapsedMilliseconds() / 1000) + "s", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 35, Graphics.FONT_XTINY, "MENU J#  UP rate  DN mode", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 20, Graphics.FONT_XTINY, "SELECT start/stop BACK cancel", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
