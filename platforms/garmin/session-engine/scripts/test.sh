#!/usr/bin/env bash
set -euo pipefail

garmin_target_device="${GARMIN_TARGET_DEVICE:-fenix7}"
garmin_test_output="${GARMIN_TEST_OUTPUT:-bin/WindWisherSessionDevTests.prg}"

if ! command -v monkeyc >/dev/null 2>&1 || ! command -v monkeydo >/dev/null 2>&1; then
  echo "Connect IQ compiler and simulator runner are required." >&2
  exit 2
fi
if [[ -z "${GARMIN_DEVELOPER_KEY:-}" || ! -f "${GARMIN_DEVELOPER_KEY}" ]]; then
  echo "Set GARMIN_DEVELOPER_KEY to a local key outside the repository." >&2
  exit 2
fi

mkdir -p "$(dirname "${garmin_test_output}")"
monkeyc -f monkey.jungle -d "${garmin_target_device}" -y "${GARMIN_DEVELOPER_KEY}" --unit-test -o "${garmin_test_output}"
monkeydo "${garmin_test_output}" "${garmin_target_device}" -t
