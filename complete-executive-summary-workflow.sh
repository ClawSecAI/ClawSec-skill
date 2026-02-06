#!/bin/bash
# Complete ClawSec Workflow for Executive Summary Implementation
# Executes all required steps: git commit, push, Trello update, move card

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ClawSec Complete Workflow - Executive Summary Module         ║"
echo "║  Trello Card: #fA0Sw5o5                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1-4: Git workflow (add, commit, push)
echo "🔹 PHASE 1: Git Workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash "${SCRIPT_DIR}/commit-executive-summary.sh"

if [ $? -ne 0 ]; then
    echo "❌ Git workflow failed. Stopping."
    exit 1
fi

echo ""
echo "🔹 PHASE 2: Trello Update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash "${SCRIPT_DIR}/update-trello-executive-summary.sh"

if [ $? -ne 0 ]; then
    echo "⚠️  Trello update failed, but code is pushed to GitHub"
    echo "Please update Trello manually:"
    echo "  1. Open: https://trello.com/c/fA0Sw5o5"
    echo "  2. Add comment with implementation details"
    echo "  3. Move to 'To review' list"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ WORKFLOW COMPLETE - ALL STEPS SUCCESSFUL                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  ✅ PROJECT.md updated (Section 3.3)"
echo "  ✅ Files committed to git"
echo "  ✅ Pushed to GitHub (main branch)"
echo "  ✅ Trello comment posted"
echo "  ✅ Card moved to 'To review'"
echo ""
echo "Next: Awaiting review from @stanhaupt1"
echo ""
