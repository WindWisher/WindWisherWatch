import Toybox.System;
import Toybox.Time;

class SeClock {
    private const TIMER_MODULUS = 4294967296l;

    function monotonicMilliseconds() { return System.getTimer(); }
    function epochSeconds() { return Time.now().value(); }

    function elapsed(startValue, endValue) {
        if (endValue >= startValue) { return endValue - startValue; }
        return (TIMER_MODULUS - startValue) + endValue;
    }
}
