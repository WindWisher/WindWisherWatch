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
        var label = _controller.protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL) ? JrConstants.DIAGNOSTIC_LABEL : _controller.protocol();
        dc.drawText(center, 38, Graphics.FONT_SMALL, label + " / " + _controller.profile(), Graphics.TEXT_JUSTIFY_CENTER);
        var modeLabel = _controller.protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL) ? "ONE HOP - 8s" : _controller.mode();
        dc.drawText(center, 62, Graphics.FONT_XTINY, modeLabel, Graphics.TEXT_JUSTIFY_CENTER);
        var stateText = _controller.state();
        if (stateText.equals(JrConstants.STATE_COUNTDOWN)) { stateText = "GO IN " + _controller.countdownSeconds(); }
        if (_controller.state().equals(JrConstants.STATE_RUNNING) && !_controller.markerStatus().equals("")) { stateText = _controller.markerStatus(); }
        dc.drawText(center, 88, Graphics.FONT_MEDIUM, stateText, Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 124, Graphics.FONT_XTINY, "SAMPLES " + _controller.sampleCount() + "  CAND " + _controller.confirmedCount(), Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, 145, Graphics.FONT_XTINY, "elapsed " + (_controller.elapsedMilliseconds() / 1000) + "s", Graphics.TEXT_JUSTIFY_CENTER);
        if (_controller.protocol().equals(JrConstants.DIAGNOSTIC_PROTOCOL)) { dc.drawText(center, 165, Graphics.FONT_XTINY, JrConstants.APP_VERSION, Graphics.TEXT_JUSTIFY_CENTER); }
        dc.drawText(center, dc.getHeight() - 35, Graphics.FONT_XTINY, "MENU J#  UP rate  DN mode", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(center, dc.getHeight() - 20, Graphics.FONT_XTINY, "SELECT start/mark BACK cancel", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
