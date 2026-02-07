#!/bin/bash
# Commit JSON Export Implementation

cd /root/.openclaw/workspace/clawsec

echo "📦 Staging files for commit..."

# Stage new files
git add server/json-export.js
git add test-json-export.js
git add run-json-test.sh
git add JSON-EXPORT-IMPLEMENTATION.md

# Stage modified files
git add server/index.js
git add docs/report-template.md
git add PROJECT.md

echo "✅ Files staged"

echo ""
echo "📝 Committing changes..."

git commit -m "Implement JSON export format for reports

✅ Completed: JSON export for ClawSec security reports

Core Implementation:
- Created server/json-export.js (11KB) - JSON export module
- Integrated with /api/v1/scan?format=json endpoint
- Complete structured format with 8 main sections
- OWASP LLM Top 10 compliance mapping
- GDPR considerations in risk analysis
- Risk factor extraction and analysis
- Priority integration (P0-P3)
- Token optimization statistics

Test Suite:
- Created test-json-export.js (12KB)
- 10 comprehensive test cases
- All tests passing
- Realistic 4-finding security scan test data

Documentation:
- Updated docs/report-template.md with JSON schema
- Updated PROJECT.md Section 5.2 (marked complete)
- Created JSON-EXPORT-IMPLEMENTATION.md (8.5KB)

Features:
✅ Machine-readable JSON format
✅ All findings with evidence and remediation
✅ Prioritized recommendations
✅ OWASP/GDPR compliance checks
✅ Backward compatible (default format unchanged)
✅ Production-ready

Files Created:
- server/json-export.js
- test-json-export.js
- run-json-test.sh
- JSON-EXPORT-IMPLEMENTATION.md

Files Modified:
- server/index.js
- docs/report-template.md
- PROJECT.md

Status: Production-ready, fully tested, documented
Trello: Card #Di8N8qb1 - JSON export complete
Time: ~2 hours (as estimated)
Developer: Ubik (subagent)"

echo ""
echo "✅ Commit created"

echo ""
echo "🚀 Pushing to GitHub..."

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 JSON Export Implementation Complete!"
    echo ""
    echo "Next Steps:"
    echo "1. Update Trello card with completion details"
    echo "2. Move card to 'To Review' list"
    echo "3. Wait for Stan's review"
else
    echo ""
    echo "❌ Push failed - check error above"
    exit 1
fi
