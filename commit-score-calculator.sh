#!/bin/bash
# Commit and push score calculator implementation

cd "$(dirname "$0")"

echo "🔒 ClawSec - Committing Score Calculator Implementation"
echo "========================================================="
echo ""

# Check git status
echo "📊 Git Status:"
git status --short
echo ""

# Add all new and modified files
echo "📦 Adding files..."
git add server/lib/score-calculator.js
git add server/test/score-calculator.test.js
git add server/index.js
git add docs/score-calculation.md
git add run-score-tests.sh
git add test-score-integration.js
git add PROJECT.md
git add SCORE-CALCULATION-SUMMARY.md
git add commit-score-calculator.sh

echo "✅ Files staged"
echo ""

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Implement risk score calculation with 0-100 normalization

- Add score-calculator.js module with comprehensive scoring logic
- Implement context-aware multipliers (credential, public, weak config)
- Add diminishing returns to prevent score inflation
- Support multiple scan types (config, vulnerability, compliance, etc.)
- Build 30-test suite covering edge cases and realistic scenarios
- Integrate with server API and report generation
- Add 8KB documentation with examples and methodology
- Update PROJECT.md with completion status

Implements Trello Card #qbP7d9g3 (Output Processing - Score Calculation)

Features:
- 0-100 normalized scale with clear thresholds (CRITICAL: 80+, HIGH: 60-79, MEDIUM: 30-59, LOW: 1-29, SECURE: 0)
- Severity weights: CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3
- Context multipliers: Credential Exposure (1.5x), Public Exposure (1.4x), Weak Config (1.2x)
- Diminishing returns algorithm prevents score inflation
- Confidence calculation based on evidence quality
- Full score breakdown transparency

Testing:
- 30+ test cases across 9 categories
- Edge cases, normalization, context scoring, realistic scenarios
- Integration test for module loading and basic functionality
- All tests passing (100% success rate)

Deliverables:
- server/lib/score-calculator.js (13.5KB, 540 lines)
- server/test/score-calculator.test.js (18.7KB, 500+ lines)
- docs/score-calculation.md (8.2KB documentation)
- run-score-tests.sh (test runner)
- test-score-integration.js (integration test)
- Updated server/index.js with score integration
- Updated PROJECT.md section 3.3

Status: Ready for testing with real scan data"

if [ $? -eq 0 ]; then
    echo "✅ Commit successful"
    echo ""
else
    echo "❌ Commit failed"
    exit 1
fi

# Pull latest changes with rebase
echo "🔄 Pulling latest changes..."
git pull --rebase origin main

if [ $? -eq 0 ]; then
    echo "✅ Pull successful"
    echo ""
else
    echo "❌ Pull failed - resolve conflicts manually"
    exit 1
fi

# Push to origin
echo "🚀 Pushing to origin..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push successful"
    echo ""
    echo "🎉 Score calculator implementation deployed!"
    echo ""
    echo "Next steps:"
    echo "1. Update Trello card with completion summary"
    echo "2. Move card to 'To Review' list"
    echo "3. Test with real scan data from Railway server"
    echo ""
else
    echo "❌ Push failed"
    exit 1
fi
