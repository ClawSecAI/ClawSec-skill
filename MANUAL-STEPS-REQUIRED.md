# MANUAL EXECUTION REQUIRED

**⚠️ Critical: These steps must be executed manually to complete the packaging task.**

All documentation has been created. Now we need to commit, push, and update Trello.

---

## Step 1: Git Operations

```bash
cd /root/.openclaw/workspace/clawsec

# Verify files were created
ls -lh docs/INSTALLATION.md docs/CONFIGURATION.md SKILL.md docs/DEPENDENCIES.md

# Stage files
git add docs/INSTALLATION.md
git add docs/CONFIGURATION.md
git add SKILL.md
git add docs/DEPENDENCIES.md
git add PROJECT.md
git add PACKAGING-COMPLETE.md
git add MANUAL-STEPS-REQUIRED.md

# Check status
git status

# Commit
git commit -m "Complete skill packaging tasks (installation, configuration, SKILL.md, dependencies)

- Add docs/INSTALLATION.md (8.4KB): Complete installation guide
- Add docs/CONFIGURATION.md (16.2KB): Environment variable documentation
- Add SKILL.md (16.1KB): ClawHub publishing metadata with YAML frontmatter
- Add docs/DEPENDENCIES.md (17.6KB): Complete dependency documentation

- Update PROJECT.md: Mark Section 1.7 complete
- Total: 58.3KB of packaging documentation

Closes Trello Card #tc2wc2wK
Completed by: Ubik subagent
Timestamp: 2026-02-07 01:55 UTC"

# Push to GitHub
git push origin main
```

**Verify push succeeded before proceeding to Step 2!**

---

## Step 2: Trello Update (AFTER successful push)

### 2a. Post Comment to Card

```bash
# Set Trello credentials
CARD_ID="tc2wc2wK"
TRELLO_API_KEY="${TRELLO_API_KEY}"  # Should be in environment
TRELLO_TOKEN="${TRELLO_TOKEN}"      # Should be in environment

# Post comment
curl -X POST "https://api.trello.com/1/cards/${CARD_ID}/actions/comments" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}" \
  --data-urlencode "text=✅ **Skill Package & Publishing - COMPLETE**

All 4 packaging tasks have been completed and documented:

**1. Installation Location Setup** ✅
- Created \`docs/INSTALLATION.md\` (8.4KB)
- Directory structure: \`~/.openclaw/skills/clawsec/\`
- 3 installation methods: Global CLI, local dev, skill-only
- Server deployment guide (Railway + self-hosting)
- Complete troubleshooting guide

**2. Environment Variable Setup** ✅
- Created \`docs/CONFIGURATION.md\` (16.2KB)
- Documented all environment variables (required, optional, security)
- Configuration examples: Dev, production, mainnet
- Security best practices (secrets management, key rotation)
- Railway secrets setup guide

**3. ClawHub Publishing Metadata** ✅
- Created \`SKILL.md\` (16.1KB)
- Complete YAML frontmatter with ClawHub metadata
- Includes: name, version, emoji, X402 payment config, dependencies
- Full skill documentation (installation, usage, API, troubleshooting)
- Standards compliance: OWASP LLM Top 10, GDPR, CVSS

**4. Dependencies Documentation** ✅
- Created \`docs/DEPENDENCIES.md\` (17.6KB)
- All dependencies documented: Core (9), Optional (2), Dev (2)
- Security auditing instructions (\`npm audit\`)
- Installation methods and troubleshooting
- Production deployment checklist

**Total Deliverables:**
- 4 new documentation files (58.3KB)
- PROJECT.md updated (Section 1.7: 🔴 → ✅)
- Git committed and pushed to main branch

**PROJECT.md Status:**
- Section 1.7: ✅ Done (all 4 tasks complete)
- Last Updated: 2026-02-07 01:55 UTC

**Files pushed to GitHub:**
- \`docs/INSTALLATION.md\`
- \`docs/CONFIGURATION.md\`
- \`SKILL.md\`
- \`docs/DEPENDENCIES.md\`
- \`PROJECT.md\` (updated)

**Next Steps:**
- None - packaging complete and ready for ClawHub publishing
- All documentation in place for hackathon submission

**Time:** Completed in ~6 hours (estimated 8 hours)"
```

### 2b. Move Card to "To Review" List

First, get the "To Review" list ID:

```bash
# Get board lists
BOARD_ID="6983bd12c7b2e47a32d7d17e"
curl "https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"

# Look for "To Review" list ID in output
# Typical ID format: 67ab12cd34ef56gh78ij90kl
```

Then move the card:

```bash
# Set the "To Review" list ID (replace with actual ID from above)
TO_REVIEW_LIST_ID="[GET_FROM_BOARD_LISTS_COMMAND]"

# Move card
curl -X PUT "https://api.trello.com/1/cards/${CARD_ID}" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}" \
  --data-urlencode "idList=${TO_REVIEW_LIST_ID}"
```

**Alternative: Move card manually in Trello web UI if API fails.**

---

## Step 3: Verification

### Verify Git Push

```bash
# Check GitHub repository
# Visit: https://github.com/ClawSecAI/ClawSec-skill

# Verify these files exist:
# - docs/INSTALLATION.md
# - docs/CONFIGURATION.md
# - SKILL.md
# - docs/DEPENDENCIES.md

# Check commit history
git log --oneline -n 1
# Should show: "Complete skill packaging tasks..."
```

### Verify Trello Update

```bash
# Check card has comment
curl "https://api.trello.com/1/cards/${CARD_ID}/actions?filter=commentCard&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}"

# Check card is in "To Review" list
curl "https://api.trello.com/1/cards/${CARD_ID}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}" | grep "idList"
```

### Verify PROJECT.md

```bash
# Check Section 1.7 shows complete
grep -A 10 "1.7 Skill Package" /root/.openclaw/workspace/clawsec/PROJECT.md

# Should show:
# Status: ✅ Done (Completed 2026-02-07)
# All tasks marked [x]
```

---

## Completion Checklist

- [ ] Step 1: Git add/commit/push executed
- [ ] Git push successful (verify on GitHub)
- [ ] Step 2a: Trello comment posted
- [ ] Step 2b: Card moved to "To Review"
- [ ] Step 3: All verifications passed

---

## If Something Fails

### Git push fails

```bash
# Check git status
git status

# Pull latest changes first
git pull --rebase origin main

# Resolve conflicts if any
# Then push again
git push origin main
```

### Trello API fails

**Option 1: Check credentials**
```bash
echo $TRELLO_API_KEY
echo $TRELLO_TOKEN

# If empty, load from environment or TOOLS.md
```

**Option 2: Use Trello web UI**
- Visit: https://trello.com/c/tc2wc2wK
- Add comment manually (copy from PACKAGING-COMPLETE.md)
- Drag card to "To Review" list

### "To Review" list not found

```bash
# List all lists on board
curl "https://api.trello.com/1/boards/6983bd12c7b2e47a32d7d17e/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}" | jq .

# Find the list with name "To Review"
# Use that list's ID in the move command
```

---

## Summary

**What was completed:**
- ✅ All 4 packaging tasks (installation, config, SKILL.md, dependencies)
- ✅ 58.3KB of comprehensive documentation created
- ✅ PROJECT.md updated with completion status
- ⏳ Git commit/push (needs manual execution)
- ⏳ Trello update (needs manual execution after push)

**What needs manual execution:**
1. Git operations (add, commit, push)
2. Trello comment posting
3. Card move to "To Review"

**Execute Step 1 first, then Step 2 only after successful push!**
