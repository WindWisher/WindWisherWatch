import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class SensorLabApp extends Application.AppBase {
    private var _controller;

    function initialize() { AppBase.initialize(); }

    function getInitialView() {
        var view = new SensorLabView();
        _controller = new LabController(view);
        view.setController(_controller);
        return [view, new SensorLabDelegate(_controller)];
    }

    function onStop(state as Lang.Dictionary?) as Void {
        if (_controller != null) { _controller.shutdown(); }
    }
}

function getApp() as SensorLabApp { return Application.getApp() as SensorLabApp; }
