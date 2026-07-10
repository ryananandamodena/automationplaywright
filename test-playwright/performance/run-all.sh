#!/usr/bin/env bash
# Run k6 load test for every app defined in apps.config.js, one after another.
# Usage: ./run-all.sh [VUS_RAMP] [HOLD_DURATION]
set -e

cd "$(dirname "$0")"
mkdir -p results

VUS_RAMP="${1:-10}"
HOLD_DURATION="${2:-2m}"
APPS=(fms mhc gccs prive sfa scmp service1)

for app in "${APPS[@]}"; do
  echo "=== Running k6 load test for: $app ==="
  k6 run \
    -e APP="$app" \
    -e VUS_RAMP="$VUS_RAMP" \
    -e HOLD_DURATION="$HOLD_DURATION" \
    --summary-export="results/${app}-summary.json" \
    load-test.js || echo "!! $app load test finished with failures (see thresholds above)"
  echo
done

echo "All done. Summaries saved in test-playwright/performance/results/"
