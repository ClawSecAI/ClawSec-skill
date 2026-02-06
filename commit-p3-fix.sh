#!/bin/bash
# Commit P3 threshold fix

cd /root/.openclaw/workspace/clawsec

echo "📝 Adding changed files..."
git add server/lib/recommendation-engine.js
git add server/tests/recommendation-engine.test.js
git add PROJECT.md

echo ""
echo "📦 Committing changes..."
git commit -m "Fix P3 threshold in recommendation engine - all tests passing

- Adjusted PRIORITY_THRESHOLDS.P2 from 40 to 50
- Low severity findings now correctly classified as P3
- Fixed Test 4: Low Severity Prioritization 
- Fixed Test 13: Time-to-Fix Recommendations for P3
- All 15 tests now passing (15/15)
- Updated PROJECT.md with completion status

Resolves: Test failures in recommendation-engine.test.js
Issue: Low severity findings scoring 40-49 were incorrectly classified as P2
Solution: Raised P2 threshold to 50, creating proper separation between P2 and P3"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Git workflow complete!"
