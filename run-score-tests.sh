#!/bin/bash
# Test runner for ClawSec Score Calculator

cd "$(dirname "$0")"

echo "🔒 ClawSec Score Calculator Test Runner"
echo "========================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if test file exists
if [ ! -f "server/test/score-calculator.test.js" ]; then
    echo "❌ Error: Test file not found"
    exit 1
fi

# Run tests
echo "Running test suite..."
echo ""

node server/test/score-calculator.test.js

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Test suite completed successfully"
else
    echo "❌ Test suite failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE
