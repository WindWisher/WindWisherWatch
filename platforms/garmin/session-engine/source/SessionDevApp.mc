import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class SessionDevApp extends Application.AppBase {
    private var _controller;

    function initialize() { AppBase.initialize(); }

    function getInitialView() {
        _controller = new SessionDevController();
        return [new SessionDevView(_controller), new SessionDevDelegate(_controller)];
    }

    function onStop(state as Lang.Dictionary?) as Void {
        if (_controller != null) { _controller.shutdown(); }
    }
}

function getApp() as SessionDevApp { return Application.getApp() as SessionDevApp; }
