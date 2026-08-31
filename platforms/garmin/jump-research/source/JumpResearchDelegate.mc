import Toybox.WatchUi;

class JumpResearchDelegate extends WatchUi.InputDelegate {
    private var _controller;
    function initialize(controller) { InputDelegate.initialize(); _controller = controller; }

    function onKey(event) {
        var key = event.getKey();
        if (key == WatchUi.KEY_UP) { _controller.nextProfile(); return true; }
        if (key == WatchUi.KEY_DOWN) { _controller.nextMode(); return true; }
        if (key == WatchUi.KEY_MENU) { _controller.nextProtocol(); return true; }
        if (key == WatchUi.KEY_ENTER || key == WatchUi.KEY_START) {
            if (_controller.state().equals(JrConstants.STATE_RUNNING)) { _controller.stop(); }
            else { _controller.start(); }
            return true;
        }
        if (key == WatchUi.KEY_ESC && _controller.state().equals(JrConstants.STATE_RUNNING)) { _controller.cancel(); return true; }
        return false;
    }
}
