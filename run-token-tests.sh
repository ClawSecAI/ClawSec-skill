#!/bin/bash
# Test runner for token optimization features

echo "=========================================="
echo "ClawSec Token Optimization Test Suite"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Run token counter tests
echo "🔢 Running Token Counter Tests..."
echo "=========================================="
node tests/token-counter.test.js
if [ $? -ne 0 ]; then
  echo "❌ Token counter tests failed"
  exit 1
fi

echo ""
echo "🧠 Running Context Optimizer Tests..."
echo "=========================================="
node tests/context-optimizer.test.js
if [ $? -ne 0 ]; then
  echo "❌ Context optimizer tests failed"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ All token optimization tests passed!"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "  - Token counter: ✅ All tests passed"
echo "  - Context optimizer: ✅ All tests passed"
echo ""
echo "Ready for integration with ClawSec server!"
