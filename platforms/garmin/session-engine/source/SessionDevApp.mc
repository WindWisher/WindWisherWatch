import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class SessionDevApp extends Application.AppBase {
    private var _controller;
    private var _phoneTransfer;

    function initialize() {
        AppBase.initialize();
        _phoneTransfer = new SePhoneTransferAdapter(new GarminSessionStore());
        _phoneTransfer.start();
    }

    function getInitialView() {
        _controller = new SessionDevController();
        return [new SessionDevView(_controller), new SessionDevDelegate(_controller)];
    }

    function onStop(state as Lang.Dictionary?) as Void {
        if (_phoneTransfer != null) { _phoneTransfer.stop(); }
        if (_controller != null) { _controller.shutdown(); }
    }
}

function getApp() as SessionDevApp { return Application.getApp() as SessionDevApp; }
