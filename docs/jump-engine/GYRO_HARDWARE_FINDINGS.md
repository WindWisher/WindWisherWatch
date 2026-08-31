# M5.1 gyro hardware findings

## M5.2 provisional role

`GYRO_ROLE = QUALITY_ONLY`.

The detector remains accel-only. Invalid gyro is excluded from valid aggregates, flagged, retained raw only in ignored captures and never clamped. Synthetic valid/artifact-heavy gyro variants preserve classification.

M5.2 again found motion-dependent artifacts: N0 had 0/725 outliers; N1 619/725; N2 660/725; N4 364/725; N5 506/725. A reproduced J5 false candidate had 0 valid and 50 outlier samples, while controlled hops generally retained valid samples. This is quality evidence, not a safe dependency, because the values remain physically implausible and their batch origin is unresolved.

M1.1-B observed implausible values around 14,071–32,764 degrees/second. Cause remains `UNKNOWN`.

M5.1 preserves every captured gyro vector and raw gyro timestamp. Any axis at or beyond 3,000 degrees/second sets the bitmask `GYRO_OUTLIER`; aggregate occurrence is reported without clamp. Sequence, relative/raw time and candidate context can be inspected temporarily in the ignored raw capture. The bounded ring naturally supplies nearby samples, but no raw excerpt enters Git by default.

Host replay runs the same capture as `ACCEL_ONLY` and `ACCEL_PLUS_GYRO`. The experimental algorithm does not use gyro to trigger boundaries, so M5.1 tests whether gyro improves confidence/context without allowing an artifact to create a jump.

J0 MEDIUM/HIGH stationary runs reported zero gyro outliers. J1 MEDIUM normal wrist motion reported provisional outlier flags on 178 of 275 samples. In the bounded 64-sample prefix, 22 of 192 axis values exceeded 3,000 degrees/s, none reached 14,000 degrees/s and the maximum absolute axis value was 7,561.80 degrees/s. Values of that scale are not accepted as physical wrist rotation. The strong motion association makes gyro useful as quality/context evidence only; it remains unsafe as an independent jump boundary signal.

J1 HIGH reported flags on 468 of 550 samples. Its bounded prefix contained 47 of 192 axis values above 3,000 degrees/s, none at or above 14,000 degrees/s, with a 5,866.24 degrees/s maximum. HIGH did not eliminate or clarify the artifact.

J2 MEDIUM walking reported flags on 114 of 275 samples. Its bounded prefix contained 45 of 192 axis values above 3,000 degrees/s, none at or above 14,000 degrees/s, with an 8,883.56 degrees/s maximum. Acceleration-only and acceleration-plus-gyro replay results were identical: three rejected candidates, zero confirmed.

J2 HIGH walking reported flags on 266 of 550 samples. Its bounded prefix contained 51 of 192 axis values above 3,000 degrees/s, none at or above 14,000 degrees/s, with an 8,120.04 degrees/s maximum. Both replay modes produced the same one rejected candidate and zero confirmations.

J3 MEDIUM reported only two provisional full-run gyro outlier samples, with none in the raw prefix. Acceleration-only and acceleration-plus-gyro prefix replay were identical and both truncated before the on-device confirmed pattern completed. Gyro did not resolve the bounded-window limitation.

J3 HIGH reported one provisional full-run outlier and none in the raw prefix; both replay modes again agreed. The on-device detector rejected both candidates, so HIGH gyro did not recover the operator-noted controlled event.

J4 MEDIUM reported six provisional full-run outlier samples. The first raw-prefix candidate had the same rejected `SESSION_ENDED` result with and without gyro; gyro only added its quality flag. Gyro again changed confidence/context rather than boundaries.

J4 HIGH reported 14 provisional full-run outlier samples and none in its raw prefix. The HIGH prefix contained no candidate in either replay mode, while the on-device full run confirmed all three operator-noted events. Gyro provided no recovery from the short raw transport window.

J5 MEDIUM fast arm motion reported provisional gyro outliers on 235 of 275 samples. The raw prefix contained 64 of 192 axes above 3,000 degrees/s, three at or above 14,000 degrees/s and a maximum of 18,347.40 degrees/s. This coincided with one on-device confirmed false jump. Gyro remains invalid as an independent motion boundary signal and cannot currently rescue the acceleration-only state machine from this negative motion class.

J5 HIGH reported provisional outliers on 472 of 550 samples. Its raw prefix preceded most adversarial motion and contained no outlier, so it cannot localize the full-run artifacts. The on-device detector rejected all 25 candidates, but gyro behavior remained implausible at aggregate level.

J6 MEDIUM controlled grounded impacts reported zero provisional gyro outliers over the full run. Gyro cleanliness in this one motion class does not offset the recurrent artifacts in wrist, walking and fast-arm protocols.

J6 HIGH reported four provisional full-run outliers and none in its raw prefix. Across J0–J6, artifacts were strongly motion-class dependent and especially prevalent in wrist, walking and fast-arm runs. Their firmware/root cause and exact batch position outside the bounded raw prefixes remain `UNKNOWN`.
