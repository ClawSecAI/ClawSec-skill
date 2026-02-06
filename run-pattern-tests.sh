#!/bin/bash
# ClawSec Pattern Matching Test Runner
# Run pattern detection tests

set -e

echo "🔍 ClawSec Pattern Matching Engine - Test Runner"
echo "================================================"
echo ""

cd /root/.openclaw/workspace/clawsec/server

echo "Running pattern detection tests..."
node test-patterns.js

echo ""
echo "✅ All tests completed!"
