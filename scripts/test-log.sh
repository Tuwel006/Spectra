#!/usr/bin/env bash
#
# Run a test and write its full output to a timestamped log file.
#
# Usage:
#   ./scripts/test-log.sh <test-name> <test-command...>
#
# Example:
#   ./scripts/test-log.sh documentation \
#       tsx packages/provider-nestjs/test/documentation-integration.test.ts
#
# Produces:
#   logs/<test-name>-<YYYY-MM-DDTHH-MM-SS>.log
#
# Test output is suppressed from the terminal; only a small summary
# line is printed at the end so the developer knows where the full
# log lives.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_NAME="${1:?Usage: $0 <test-name> <test-command...>}"
shift

mkdir -p "${REPO_ROOT}/logs"
TIMESTAMP="$(date +%Y-%m-%dT%H-%M-%S)"
LOG_FILE="${REPO_ROOT}/logs/${TEST_NAME}-${TIMESTAMP}.log"

cd "${REPO_ROOT}"

# Ensure locally-installed tools (tsx, tsc, etc.) are on PATH. pnpm
# already does this when invoked via `pnpm run`, but invoking the
# script directly via bash should behave the same way.
export PATH="${REPO_ROOT}/node_modules/.bin:${PATH}"

# Run the test, capture stdout + stderr, suppress terminal noise.
"${@}" >"${LOG_FILE}" 2>&1
TEST_EXIT=$?

LOG_SIZE=$(wc -c <"${LOG_FILE}" | tr -d ' ')
LOG_LINES=$(wc -l <"${LOG_FILE}" | tr -d ' ')

if [ "${TEST_EXIT}" -eq 0 ]; then
    echo "[test-log] ${TEST_NAME}  PASS"
else
    echo "[test-log] ${TEST_NAME}  FAIL (exit ${TEST_EXIT})"
fi
echo "[test-log] log written to: ${LOG_FILE}"
echo "[test-log] ${LOG_LINES} lines, ${LOG_SIZE} bytes"

exit "${TEST_EXIT}"