#!/bin/bash
# ClawSec Advanced Sanitization Test Runner
# Executes comprehensive test suite for advanced redaction patterns

set -e

echo "🛡️  ClawSec Advanced Sanitization Test Suite"
echo "=============================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found"
    echo "   Please install Node.js to run tests"
    exit 1
fi

# Check if test file exists
if [ ! -f "test-advanced-sanitization.js" ]; then
    echo "❌ Error: test-advanced-sanitization.js not found"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if main module exists
if [ ! -f "advanced-sanitizer.js" ]; then
    echo "❌ Error: advanced-sanitizer.js not found"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Run tests
echo "Running test suite..."
echo ""

node test-advanced-sanitization.js

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE
