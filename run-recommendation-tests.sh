#!/bin/bash
# Test runner for recommendation engine
# Runs tests and displays results

echo "🔒 ClawSec - Recommendation Engine Test Suite"
echo "=============================================="
echo ""

cd /root/.openclaw/workspace/clawsec

# Run tests
node server/tests/recommendation-engine.test.js

# Capture exit code
exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
  echo "✅ All recommendation engine tests passed!"
else
  echo "❌ Some tests failed (exit code: $exit_code)"
fi

exit $exit_code
