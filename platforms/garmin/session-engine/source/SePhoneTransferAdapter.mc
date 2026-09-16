import Toybox.Communications;
import Toybox.Lang;

class SePhoneTransferListener extends Communications.ConnectionListener {
    private var _owner;
    function initialize(owner) { Communications.ConnectionListener.initialize(); _owner = owner; }
    function onComplete() { _owner.transmitFinished(); }
    function onError() { _owner.transmitFinished(); }
}

// The phone drives the protocol one response at a time. No web request is used.
class SePhoneTransferAdapter {
    private var _protocol;
    private var _listener;
    private var _phoneMethod as Method(msg as PhoneAppMessage) as Void;
    private var _busy = false;

    function initialize(port) {
        _protocol = new SePhoneTransferProtocol(port);
        _listener = new SePhoneTransferListener(self);
        _phoneMethod = method(:onPhoneMessage);
    }

    function start() {
        if (!(Communications has :registerForPhoneAppMessages)) { return false; }
        Communications.registerForPhoneAppMessages(_phoneMethod);
        return true;
    }

    function stop() {
        if (Communications has :registerForPhoneAppMessages) {
            Communications.registerForPhoneAppMessages(null);
        }
        _busy = false;
    }

    function onPhoneMessage(message as PhoneAppMessage) as Void {
        if (_busy || message == null) { return; }
        var response = _protocol.handle(message.data);
        if (response == null) { return; }
        _busy = true;
        try { Communications.transmit(response, {}, _listener); }
        catch (ex) { _busy = false; }
    }

    function transmitFinished() { _busy = false; }
}
