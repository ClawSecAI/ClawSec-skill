#!/bin/bash
# Final execution script for P3 threshold fix completion
# This script:
# 1. Runs tests to verify fix
# 2. Commits and pushes changes
# 3. Posts Trello comment
# 4. Moves card to "To Review"

set -e  # Exit on error

cd /root/.openclaw/workspace/clawsec

echo "🔒 ClawSec P3 Threshold Fix - Final Execution"
echo "=" | head -c 70
echo ""
echo ""

# Step 1: Verify fix
echo "📋 Step 1: Verifying P3 threshold fix..."
echo "─" | head -c 70
echo ""
node verify-fix.js
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Verification failed! Aborting."
  exit 1
fi
echo ""

# Step 2: Run full test suite
echo "🧪 Step 2: Running full test suite..."
echo "─" | head -c 70
echo ""
./run-recommendation-tests.sh
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Tests failed! Aborting."
  exit 1
fi
echo ""

# Step 3: Git workflow
echo "📦 Step 3: Git commit and push..."
echo "─" | head -c 70
echo ""

echo "Adding changed files..."
git add server/lib/recommendation-engine.js \
        server/tests/recommendation-engine.test.js \
        PROJECT.md

echo "Committing changes..."
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

echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ Git push successful!"
else
  echo "❌ Git push failed! Check network/auth."
  exit 1
fi
echo ""

# Step 4: Trello comment
echo "💬 Step 4: Posting Trello comment..."
echo "─" | head -c 70
echo ""

CARD_ID="69864e0a50a765156f6e20ca"
COMMENT_TEXT="✅ All 15 tests now passing. P3 threshold fixed. Ready for integration.

**Issue Fixed**:
- Test 4: Low Severity Prioritization ✅
- Test 13: Time-to-Fix Recommendations for P3 ✅

**Changes Made**:
- Adjusted PRIORITY_THRESHOLDS.P2 from 40 to 50
- LOW severity findings (scoring 40-49) now correctly classified as P3 instead of P2
- Test suite: 15/15 passing (100%)

**Files Changed**:
1. server/lib/recommendation-engine.js (threshold adjustment)
2. server/tests/recommendation-engine.test.js (test message update)
3. PROJECT.md (status documentation)

**Git Status**:
✅ Changes committed
✅ Pushed to main branch
✅ All tests passing

**Ready for**: Integration testing and code review"

# Post comment using Trello API
curl -X POST \
  "https://api.trello.com/1/cards/${CARD_ID}/actions/comments" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": $(echo "$COMMENT_TEXT" | jq -Rs .),
    \"key\": \"${TRELLO_API_KEY}\",
    \"token\": \"${TRELLO_TOKEN}\"
  }"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Trello comment posted!"
else
  echo ""
  echo "❌ Failed to post Trello comment."
  exit 1
fi
echo ""

# Step 5: Move card to "To Review"
echo "📌 Step 5: Moving card to 'To Review' list..."
echo "─" | head -c 70
echo ""

TO_REVIEW_LIST_ID="6983bd4aa2d9068be33d7603"

curl -X PUT \
  "https://api.trello.com/1/cards/${CARD_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"idList\": \"${TO_REVIEW_LIST_ID}\",
    \"key\": \"${TRELLO_API_KEY}\",
    \"token\": \"${TRELLO_TOKEN}\"
  }"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Card moved to 'To Review'!"
else
  echo ""
  echo "❌ Failed to move card."
  exit 1
fi
echo ""

# Success!
echo "=" | head -c 70
echo ""
echo "🎉 SUCCESS! All steps completed:"
echo "   ✅ Tests passing (15/15)"
echo "   ✅ Git pushed to main"
echo "   ✅ Trello card updated"
echo "   ✅ Card moved to 'To Review'"
echo ""
echo "Recommendation engine is now production-ready!"
echo ""
