import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class JumpResearchApp extends Application.AppBase {
    private var _controller;

    function initialize() { AppBase.initialize(); }

    function getInitialView() {
        var view = new JumpResearchView();
        _controller = new JrController(view);
        view.setController(_controller);
        return [view, new JumpResearchDelegate(_controller)];
    }

    function onStop(state as Lang.Dictionary?) as Void { if (_controller != null) { _controller.shutdown(); } }
}

function getApp() as JumpResearchApp { return Application.getApp() as JumpResearchApp; }
