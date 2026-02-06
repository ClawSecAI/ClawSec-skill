#!/bin/bash
# Run ClawSec End-to-End Testing

cd /root/.openclaw/workspace/clawsec/client

echo "==================================================================="
echo "🔒 ClawSec End-to-End Testing"
echo "==================================================================="
echo ""

# Make test executable
chmod +x ../test-e2e-complete.js

# Run the test
node ../test-e2e-complete.js

# Capture exit code
EXIT_CODE=$?

echo ""
echo "==================================================================="
echo "Test completed with exit code: $EXIT_CODE"
echo "==================================================================="

exit $EXIT_CODE
