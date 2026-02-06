#!/bin/bash
# Validate recommendation engine and commit if tests pass

set -e  # Exit on any error

cd /root/.openclaw/workspace/clawsec

echo "🧪 Running recommendation engine tests..."
echo "=========================================="
echo ""

# Run tests
node server/tests/recommendation-engine.test.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All tests passed! Proceeding with git commit..."
  echo ""
  
  # Execute commit script
  bash commit-recommendation-engine.sh
  
  echo ""
  echo "🎉 Recommendation engine successfully implemented, tested, and pushed!"
else
  echo ""
  echo "❌ Tests failed. Not committing."
  exit 1
fi
