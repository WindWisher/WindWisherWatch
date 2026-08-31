import Toybox.System;

module JrClock {
    const TIMER_MODULUS = 4294967296l;

    function now() { return System.getTimer(); }

    function elapsed(startValue, endValue) {
        if (endValue >= startValue) { return endValue - startValue; }
        return (TIMER_MODULUS - startValue) + endValue;
    }
}
