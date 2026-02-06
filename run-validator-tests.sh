#!/bin/bash
#
# ClawSec Validator Test Runner
#
# Runs the JSON schema validation test suite
#

set -e

cd "$(dirname "$0")"

echo "🔍 ClawSec JSON Schema Validator Test Suite"
echo "=============================================="
echo ""
echo "Running comprehensive validation tests..."
echo ""

# Run tests with Node.js
node tests/validator.test.js

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All validation tests passed!"
  echo ""
  exit 0
else
  echo ""
  echo "❌ Some tests failed. See output above for details."
  echo ""
  exit 1
fi
