# ClawSec Architecture

## Architecture Overview

**Privacy-First Design:** User data stays local, only sanitized metadata sent to server.

---

## Client Side (User OpenClaw Instance)

**ClawSec Skill Architecture:**

The skill is implemented as a single `SKILL.md` file with:
- **YAML Frontmatter:** Name, description, metadata (emoji, required bins/env vars)
- **Natural Language Instructions:** How the agent should scan, what to look for, how to handle errors
- **No rigid APIs:** Just clear English instructions for the AI to follow

**Execution Flow:**

1. **Scan with Filters** (via OpenClaw tools)
   - Scan config files (`openclaw.json`, `.env`)
   - Scan session logs (check for credential leaks)
   - Scan workspace files (memory/, scripts, custom skills)
   - Look for: exposed tokens, unsafe configs, prompt injection vulnerabilities

2. **Review & Sanitize Before Sending**
   - Strip: API keys, tokens, credentials, passwords
   - Redact: Personal information, file paths
   - Hash: Sensitive identifiers
   - **User reviews** what will be sent (transparency)
   - Only security-relevant metadata goes out

3. **Send to ClawSec Server**
   - POST sanitized scan data to API
   - Initiate USDC transaction via X402 (payment protocol)

---

## Server Side (ClawSec Service)

**Receives Scan Results:**

1. **Verify Payment** (X402 transaction)
2. **Add Context - Threat Database**
   - Load relevant CVEs, attack patterns
   - Our intel: `/root/.openclaw/workspace/security/threat-intel/*.md`
   - Filter/select most relevant threats based on scan

3. **Add Context - Report Template**
   - Structured format for LLM to fill
   - Security score, vulnerabilities, recommendations

4. **Generate Report**
   - Send to LLM: `scan_results + threat_db + report_template`
   - Model: Haiku (fast, cheap ~$0.01) or Sonnet (better quality ~$0.03)
   - LLM identifies flaws and produces security report

5. **Return Report to User**
   - Send back via API
   - Finalize USDC transaction

---

## Key Decisions

**Why LLM + Context instead of building scanning logic:**
- ✅ **Fast to build** (43-hour deadline)
- ✅ **Leverages existing threat intel**
- ✅ **Flexible** (can add new patterns without code changes)
- ✅ **Good enough for hackathon** MVP

**Future improvements** (post-hackathon):
- Build dedicated scanning logic
- Database of patterns
- Real-time threat feed integration
- Agent-to-agent reputation system

---

## Components Needed

- [x] ClawSec Skill (client-side scanning tool)
- [x] API Server (receives scans, returns reports)
- [ ] X402 Payment Integration (USDC transactions)
- [x] LLM Pipeline (Haiku/Sonnet + context)
- [x] Threat Database Format (for LLM context)
- [x] Report Template (structured output)
- [ ] Deployment Infrastructure (hosting)

---

**Status:** Architecture defined, MVP server implemented
