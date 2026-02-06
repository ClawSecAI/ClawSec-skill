#!/bin/bash
# LLM Comparison Test Runner
# This script runs the test-llm-comparison.js with proper environment

set -e

cd /root/.openclaw/workspace/clawsec

echo "🔒 ClawSec LLM Comparison Test"
echo "================================"
echo ""

# Check environment
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

echo "✅ Environment: OK"
echo "✅ Working directory: $(pwd)"
echo ""

# Run the test
echo "🚀 Starting test execution..."
echo ""

node test-llm-comparison.js

echo ""
echo "✅ Test complete! Check test-results/ directory for output."
