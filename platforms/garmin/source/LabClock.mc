import Toybox.System;

module LabClock {
    const TIMER_MODULUS = 4294967296l;

    function elapsed(startValue, endValue) {
        if (endValue >= startValue) { return endValue - startValue; }
        return (TIMER_MODULUS - startValue) + endValue;
    }

    function now() { return System.getTimer(); }
}
