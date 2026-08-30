import Toybox.WatchUi;

class SessionDevDelegate extends WatchUi.InputDelegate {
    private var _controller;
    function initialize(controller) { InputDelegate.initialize(); _controller = controller; }
    function onKey(event) {
        var key = event.getKey();
        if (key == WatchUi.KEY_ENTER || key == WatchUi.KEY_START) { _controller.onSelect(); return true; }
        return false;
    }
}
