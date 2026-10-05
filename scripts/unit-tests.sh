#!/usr/bin/env bash
# Pure unit tests (no emulator, no server): every scripts/unit/*.test.ts.
set -u
cd "$(dirname "$0")/.."
FAILED=()
for f in scripts/unit/*.test.ts; do
  echo
  echo "===== $f ====="
  npx tsx "$f" || FAILED+=("$f")
done
echo
if [ ${#FAILED[@]} -eq 0 ]; then echo "Unit: all passed"; else echo "Unit: FAILED: ${FAILED[*]}"; exit 1; fi
