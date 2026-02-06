#!/bin/bash
# Commit LLM testing infrastructure changes

cd /root/.openclaw/workspace/clawsec

# Make scripts executable
chmod +x test-llm-curl.sh
chmod +x run-llm-test.sh
chmod +x test-llm-comparison.js
chmod +x quick-test.js

# Stage all new and modified files
git add test-llm-curl.sh
git add run-llm-test.sh
git add EXECUTE-LLM-TEST.md
git add LLM-TEST-STATUS.md
git add SUBAGENT-HANDOFF.md
git add docs/llm-comparison-analysis-template.md
git add PROJECT.md
git add commit-changes.sh

# Commit
git commit -m "LLM Testing: Infrastructure and analysis framework complete

- Added test-llm-curl.sh (bash/curl test implementation)
- Added run-llm-test.sh (wrapper script)
- Added EXECUTE-LLM-TEST.md (6KB execution guide)
- Added LLM-TEST-STATUS.md (10KB comprehensive status)
- Added SUBAGENT-HANDOFF.md (10KB handoff document)
- Added docs/llm-comparison-analysis-template.md (9KB analysis framework)
- Updated PROJECT.md with current status (90% complete)

Status: READY FOR EXECUTION
Blocker: Requires shell/Node.js runtime to execute tests
Next: Run ./test-llm-curl.sh to generate comparison results

Card: LLM Testing - Haiku vs Sonnet (6985ca68ae36c4548057e80a)
Cost: ~\$0.15 for complete test suite
Time: 5-10 min execution + 1-2 hours analysis

Deliverables:
✅ Test infrastructure (2 implementations)
✅ Analysis framework (structured template)
✅ Execution guide (with troubleshooting)
⏸️ Test results (awaiting execution)
⏸️ Final recommendation (awaiting results)"

# Push to remote
git push origin main

echo "✅ Changes committed and pushed!"
