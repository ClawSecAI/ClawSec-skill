#!/bin/bash
################################################################################
# ClawSec Advanced Sanitization - Complete Git & Trello Workflow
# 
# This script completes the mandatory workflow for Trello card nz8e77Q7:
# 1. Commit and push to GitHub
# 2. Update Trello card (ONLY after successful push)
# 3. Move card to "To Review"
#
# Usage: ./EXECUTE-SANITIZATION-WORKFLOW.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CARD_ID="nz8e77Q7"
CARD_URL="https://trello.com/c/nz8e77Q7"
TO_REVIEW_LIST_ID="698494df21ba5eabb84c00ee"  # Get from Trello board

################################################################################
# Step 1: Git Workflow
################################################################################

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ClawSec Advanced Sanitization - Git Workflow                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd /root/.openclaw/workspace/clawsec

echo -e "${YELLOW}→ Checking git status...${NC}"
git status

echo ""
echo -e "${YELLOW}→ Staging files...${NC}"
git add client/advanced-sanitizer.js
git add client/test-advanced-sanitization.js
git add client/example-usage.js
git add client/run-advanced-sanitization-tests.sh
git add docs/advanced-sanitization.md
git add PROJECT.md
git add SANITIZATION-COMPLETION-CHECKLIST.md
git add EXECUTE-SANITIZATION-WORKFLOW.sh

echo ""
echo -e "${YELLOW}→ Files staged for commit:${NC}"
git diff --staged --name-only

echo ""
echo -e "${YELLOW}→ Creating commit...${NC}"
git commit -m "feat: Advanced sanitization for credit cards, SSNs, private keys, and 50+ credential types

- Implement comprehensive redaction engine with 50+ detection patterns
- Add credit card validation using Luhn algorithm  
- Add SSN/SIN redaction with context awareness
- Add private key detection (RSA, EC, DSA, OpenSSH, PGP)
- Add payment gateway credentials (Stripe, Square, PayPal)
- Add cloud provider keys (AWS, Azure, GCP, DigitalOcean)
- Add package manager tokens (npm, PyPI, Docker)
- Add communication service keys (Twilio, SendGrid, Mailgun, Mailchimp)
- Add database connection strings (PostgreSQL, MySQL, MongoDB, Redis)
- Add webhook URLs (Slack, Discord)
- Add social media tokens (Telegram, Facebook, Twitter)
- Include 40+ comprehensive test cases with Luhn validation
- Add complete API documentation (13KB)
- Add usage examples and test runner
- Update PROJECT.md Section 1.3 to Done status

Features:
- 50+ detection patterns across 11 credential categories
- Luhn algorithm validation for credit cards (prevents false positives)
- Context-aware SSN detection
- Last-4 digit preservation for tracking
- Comprehensive test coverage (40+ test cases)

Files:
- client/advanced-sanitizer.js (14KB) - Core engine
- client/test-advanced-sanitization.js (14KB) - Test suite
- client/example-usage.js (5KB) - Usage examples
- client/run-advanced-sanitization-tests.sh (1KB) - Test runner
- docs/advanced-sanitization.md (13.4KB) - API documentation

Trello: ${CARD_URL}
Card: Sanitization - Advanced Redaction"

echo ""
echo -e "${YELLOW}→ Pulling remote changes...${NC}"
git pull --rebase origin main

echo ""
echo -e "${YELLOW}→ Pushing to GitHub...${NC}"
git push origin main

PUSH_SUCCESS=$?

if [ $PUSH_SUCCESS -ne 0 ]; then
    echo -e "${RED}❌ Git push failed! Aborting workflow.${NC}"
    echo -e "${RED}   Trello will NOT be updated (per TOOLS.md rules)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git push successful!${NC}"
echo ""

# Get commit hash for verification
COMMIT_HASH=$(git log --oneline -1)
echo -e "${GREEN}Latest commit: ${COMMIT_HASH}${NC}"
echo ""

################################################################################
# Step 2: Trello Update (ONLY after successful push)
################################################################################

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Trello Card Update                                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Trello credentials
if [ -z "$TRELLO_API_KEY" ] || [ -z "$TRELLO_TOKEN" ]; then
    echo -e "${RED}❌ Error: TRELLO_API_KEY or TRELLO_TOKEN not set${NC}"
    echo -e "${YELLOW}   Git push succeeded, but Trello update failed${NC}"
    echo -e "${YELLOW}   Please update Trello manually:${NC}"
    echo -e "${YELLOW}   1. Open: ${CARD_URL}${NC}"
    echo -e "${YELLOW}   2. Post comment (see SANITIZATION-COMPLETION-CHECKLIST.md)${NC}"
    echo -e "${YELLOW}   3. Move to 'To Review' list${NC}"
    exit 1
fi

# Prepare comment text
COMMENT_TEXT="✅ Advanced sanitization implementation complete!

**What was done:**
- Implemented 50+ detection patterns for sensitive data redaction
- Credit cards (Visa, MC, Amex, Discover) with Luhn validation
- Social Security Numbers (US SSN, Canadian SIN)
- Private keys (RSA, EC, DSA, OpenSSH, PGP)
- Payment gateways (Stripe, Square, PayPal)
- Cloud providers (AWS, Azure, GCP, DigitalOcean)
- Package managers (npm, PyPI, Docker)
- Communication services (Twilio, SendGrid, Mailgun, Mailchimp)
- Database connection strings (PostgreSQL, MySQL, MongoDB, Redis)
- Webhooks (Slack, Discord)
- Social media tokens (Telegram, Facebook, Twitter)

**Deliverables:**
- \`client/advanced-sanitizer.js\` (14KB) - Core engine
- \`client/test-advanced-sanitization.js\` (14KB) - 40+ tests
- \`docs/advanced-sanitization.md\` (13.4KB) - Complete docs
- \`client/example-usage.js\` (5KB) - Usage examples
- \`client/run-advanced-sanitization-tests.sh\` - Test runner

**PROJECT.md Status:**
- Section 1.3: 🔴 Not Started → ✅ Done (Enhanced with Advanced Redaction)
- Last Updated: 2026-02-06 20:54 UTC

**Testing:**
- All 40+ test cases passing
- Luhn validation for credit cards working
- Context-aware SSN detection operational
- No false positives in test suite

**Git:**
- Committed and pushed to main branch
- Commit: ${COMMIT_HASH}

**No blockers - Ready for review!**

@stanhaupt1 Please review when ready."

echo -e "${YELLOW}→ Posting comment to Trello card...${NC}"

# Post comment to Trello
curl -X POST "https://api.trello.com/1/cards/${CARD_ID}/actions/comments" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "text=${COMMENT_TEXT}" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}"

COMMENT_SUCCESS=$?

if [ $COMMENT_SUCCESS -ne 0 ]; then
    echo -e "${RED}❌ Failed to post Trello comment${NC}"
    echo -e "${YELLOW}   Please post manually to: ${CARD_URL}${NC}"
else
    echo -e "${GREEN}✅ Comment posted successfully${NC}"
fi

echo ""
echo -e "${YELLOW}→ Moving card to 'To Review' list...${NC}"

# Move card to "To Review" list
curl -X PUT "https://api.trello.com/1/cards/${CARD_ID}" \
  --data-urlencode "idList=${TO_REVIEW_LIST_ID}" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}"

MOVE_SUCCESS=$?

if [ $MOVE_SUCCESS -ne 0 ]; then
    echo -e "${RED}❌ Failed to move card${NC}"
    echo -e "${YELLOW}   Please move manually to 'To Review' list${NC}"
else
    echo -e "${GREEN}✅ Card moved to 'To Review'${NC}"
fi

################################################################################
# Summary
################################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Workflow Complete!                                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Git push: SUCCESS${NC}"
echo -e "${GREEN}✅ Trello comment: $([ $COMMENT_SUCCESS -eq 0 ] && echo 'SUCCESS' || echo 'FAILED (manual action needed)')${NC}"
echo -e "${GREEN}✅ Card moved: $([ $MOVE_SUCCESS -eq 0 ] && echo 'SUCCESS' || echo 'FAILED (manual action needed)')${NC}"
echo ""
echo -e "${GREEN}Card URL: ${CARD_URL}${NC}"
echo -e "${GREEN}Commit: ${COMMIT_HASH}${NC}"
echo ""
echo -e "${YELLOW}Next step: Wait for @stanhaupt1 review${NC}"
echo ""
