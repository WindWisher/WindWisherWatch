#!/usr/bin/env bash
set -euo pipefail

garmin_target_device="${GARMIN_TARGET_DEVICE:-fenix7}"
garmin_output="${GARMIN_BUILD_OUTPUT:-bin/WindWisherSensorLab.prg}"

if ! command -v monkeyc >/dev/null 2>&1; then
  echo "Connect IQ compiler not found. Configure the selected SDK bin directory in PATH." >&2
  exit 2
fi
if [[ -z "${GARMIN_DEVELOPER_KEY:-}" || ! -f "${GARMIN_DEVELOPER_KEY}" ]]; then
  echo "Set GARMIN_DEVELOPER_KEY to a local developer key outside the repository." >&2
  exit 2
fi

mkdir -p "$(dirname "${garmin_output}")"
monkeyc -f monkey.jungle -d "${garmin_target_device}" -y "${GARMIN_DEVELOPER_KEY}" -o "${garmin_output}"
