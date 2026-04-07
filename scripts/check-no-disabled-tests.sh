#!/usr/bin/env bash
# check-no-disabled-tests.sh
#
# Fails if any test file contains skipped/disabled tests.
# Patterns checked: test.skip, it.skip, describe.skip, xtest, xit, xdescribe
#
# Usage:
#   bash scripts/check-no-disabled-tests.sh
#
# Run automatically in CI (amplify.yml) and as an npm script (npm run check:no-skip).

set -euo pipefail

PATTERNS=(
  'test\.skip\s*('
  'it\.skip\s*('
  'describe\.skip\s*('
  '\bxtest\s*('
  '\bxit\s*('
  '\bxdescribe\s*('
)

SEARCH_DIRS=("__tests__" "e2e")

FOUND=0

for dir in "${SEARCH_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    continue
  fi
  for pattern in "${PATTERNS[@]}"; do
    matches=$(grep -rn --include="*.js" --include="*.ts" -E "$pattern" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "ERROR: Disabled test(s) found matching pattern '$pattern':"
      echo "$matches"
      FOUND=1
    fi
  done
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Disabled tests violate project guardrails. Remove all .skip / x-prefixed tests before merging."
  exit 1
fi

echo "check-no-disabled-tests: OK — no disabled tests found."
