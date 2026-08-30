import Toybox.Sensor;
import Toybox.System;
import Toybox.Lang;

class DeviceProbe {
    function inspect(profile) {
        var settings = System.getDeviceSettings();
        var maxRate = 0;
        var accelerometerMaxRate = 0;
        var gyroscopeMaxRate = 0;
        try {
            if (Sensor has :getMaxSampleRate) { maxRate = Sensor.getMaxSampleRate(); }
        } catch (ex) { maxRate = 0; }
        try {
            if (Sensor has :getMaxSampleRateForSensorType) {
                accelerometerMaxRate = Sensor.getMaxSampleRateForSensorType(:accelerometer);
                gyroscopeMaxRate = Sensor.getMaxSampleRateForSensorType(:gyroscope);
            }
        } catch (ex) {
            accelerometerMaxRate = 0;
            gyroscopeMaxRate = 0;
        }
        if (accelerometerMaxRate <= 0) { accelerometerMaxRate = maxRate; }
        if (gyroscopeMaxRate <= 0) { gyroscopeMaxRate = maxRate; }
        var profiles = new LabProfiles();
        var requestedAccelerometerRate = profiles.requestedRate(profile, accelerometerMaxRate);
        var requestedGyroscopeRate = profiles.requestedRate(profile, gyroscopeMaxRate);
        return {
            :partNumber => settings.partNumber,
            :firmware => Lang.format("$1$.$2$", settings.firmwareVersion),
            :ciqApiLevel => Lang.format("$1$.$2$.$3$", settings.monkeyVersion),
            :screenWidth => settings.screenWidth,
            :screenHeight => settings.screenHeight,
            :screenShape => settings.screenShape,
            :inputButtons => settings.inputButtons,
            :isTouchScreen => settings.isTouchScreen,
            :maxSampleRate => maxRate,
            :accelerometerMaxSampleRate => accelerometerMaxRate,
            :gyroscopeMaxSampleRate => gyroscopeMaxRate,
            :requestedAccelerometerRate => requestedAccelerometerRate,
            :requestedGyroscopeRate => requestedGyroscopeRate
        };
    }
}
