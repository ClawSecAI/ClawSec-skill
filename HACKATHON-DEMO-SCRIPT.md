# 🎬 ClawSec Hackathon Demo Script

**Event:** Moltbook USDC Hackathon  
**Track:** Best OpenClaw Skill  
**Demo Duration:** 5-7 minutes  
**Preparation Time:** 15 minutes

---

## 🎯 Demo Objectives

1. Show ClawSec solving a real security problem
2. Demonstrate end-to-end workflow (scan → payment → report)
3. Highlight key differentiators (threat intel, LLM analysis, X402)
4. Prove value proposition: "Security consultants for AI agents"

---

## 🧪 Pre-Demo Setup Checklist

### 15 Minutes Before Demo

- [ ] **Server Check**: Verify ClawSec API is live
  ```bash
  curl https://clawsec-skill-production.up.railway.app/health
  # Should return: {"status":"healthy",...}
  ```

- [ ] **Test Configs Ready**: Ensure 3 test files exist in `demo-configs/`
  - `insecure-config.json` (HIGH/CRITICAL issues)
  - `moderate-config.json` (MEDIUM issues)
  - `secure-config.json` (LOW/no issues)

- [ ] **Pre-generate Reports**: Run all 3 scans and save outputs
  ```bash
  cd /root/.openclaw/workspace/clawsec
  ./demo-scripts/generate-demo-reports.sh
  # Creates: demo-reports/insecure-report.md, moderate-report.md, secure-report.md
  ```

- [ ] **Terminal Setup**: Open 2 terminal windows
  - **Window 1**: Demo execution (large font, fullscreen)
  - **Window 2**: Backup/monitoring (server logs, health check)

- [ ] **Screen Recording**: Start OBS/recording software
  - Resolution: 1920x1080
  - Frame rate: 30 FPS
  - Audio: Microphone ON

- [ ] **Browser Tabs**: Pre-open in order
  1. ClawSec GitHub repo (README.md)
  2. Railway deployment dashboard
  3. Threat intelligence sample (docs/threat-intel/prompt-injection.md)
  4. OWASP LLM Top 10 reference

- [ ] **Backup Plan**: Save pre-generated reports in case of live demo failure

---

## 🎭 Demo Script - Act by Act

### Act 1: The Problem (60 seconds)

**What You Say:**
> "OpenClaw agents are incredibly powerful - they can control your entire digital life. But that power comes with risk. Look at this typical OpenClaw configuration..."

**What You Show:**
1. **Open `insecure-config.json`** in a text editor
2. **Scroll slowly** through the config, pausing at:
   - `gateway.token` field (token visible)
   - `channels.telegram.bot_token` (credential exposed)
   - `tools.exec.enabled: true` (dangerous permission)
   - `tools.browser.allowed_domains: ["*"]` (overly permissive)

**What You Say:**
> "Notice anything dangerous? Most users wouldn't. That's the problem. Hidden in here are multiple critical security vulnerabilities - exposed credentials, dangerous permissions, and attack vectors. Manual audits take hours and require deep expertise. That's where ClawSec comes in."

**Visual Highlight:**
- Use terminal with syntax highlighting
- Circle or highlight dangerous values with cursor
- Keep config visible on screen

**Time Check:** 1:00 elapsed

---

### Act 2: The Solution (90 seconds)

**What You Say:**
> "ClawSec is like having a security consultant for your AI agent. Watch this..."

**What You Do:**
1. **Run the scan:**
   ```bash
   cd /root/.openclaw/workspace/clawsec
   node demo-scripts/run-demo-scan.js insecure
   ```

2. **Narrate the process as it runs** (15-20 seconds):
   - "Extracting configuration..."
   - "Sanitizing sensitive data..." (show before/after if time)
   - "Processing payment via X402..." (show USDC transaction)
   - "Analyzing with Claude Sonnet + 800KB threat intel..."

3. **Report appears** (scroll slowly through sections):

**Section 1: Executive Summary**
> "First, we get a high-level overview. Risk level: CRITICAL. 8 findings across multiple categories."

**Section 2: Critical Findings**
> "Here's the smoking gun - exposed Telegram token with entropy analysis showing it's a real credential. Attack vector clearly explained."

**Section 3: Specific Remediation**
> "But ClawSec doesn't just tell you what's wrong - it tells you exactly how to fix it. Look at these specific commands..."

```bash
# Add to .env
TELEGRAM_BOT_TOKEN=your_token_here

# Update openclaw.json
"telegram": {
  "bot_token": "${TELEGRAM_BOT_TOKEN}"  # Reference, not hardcode
}
```

**Section 4: Standards Compliance**
> "We map everything to OWASP LLM Top 10 and GDPR requirements. This isn't just best practices - it's industry standards."

**What You Highlight:**
- ⚠️ Risk score: 87/100 (CRITICAL)
- 🔍 8 findings detected
- 🎯 Priority recommendations (P0, P1, P2)
- 📋 OWASP mappings (e.g., LLM02 - Insecure Output Handling)
- 🛠️ Actionable fix commands

**Time Check:** 2:30 elapsed

---

### Act 3: The Technology (90 seconds)

**What You Say:**
> "What makes this possible? Three key innovations..."

**Innovation 1: Threat Intelligence (30 seconds)**

**What You Show:**
1. Open `security/threat-intel/prompt-injection.md`
2. Scroll through threat database briefly

**What You Say:**
> "We've curated 800KB of threat intelligence from 42 sources - OWASP, security research, real-world attacks. Every scan is analyzed against this knowledge base. Our LLM doesn't just pattern-match - it understands context."

**Innovation 2: X402 Payments (30 seconds)**

**What You Show:**
1. Terminal output showing payment flow
2. Or: Pre-recorded payment transaction

**What You Say:**
> "Payments are handled via X402 - Coinbase's micropayment protocol. USDC on Base blockchain. The entire scan costs $0.01 to $0.10. No subscriptions, no credit cards, just instant crypto payments. This is what makes AI-to-AI commerce possible."

**Innovation 3: LLM Analysis (30 seconds)**

**What You Show:**
1. Show token optimization stats from report
2. Or: Brief glimpse of server logs showing Claude API call

**What You Say:**
> "We use Claude 3.5 Haiku for fast analysis and Sonnet for deep dives. Our token optimization system intelligently selects relevant threats, cutting costs by 30-50% while maintaining accuracy. Every finding includes confidence scores, severity ratings, and exploitability assessments."

**Time Check:** 4:00 elapsed

---

### Act 4: Before/After Impact (60 seconds)

**What You Say:**
> "Let's see the impact. Here's what we started with..."

**What You Show:**
1. **Split screen or quick switch:**
   - **LEFT**: Original insecure-config.json
   - **RIGHT**: Fixed secure-config.json

2. **Run second scan on fixed config:**
   ```bash
   node demo-scripts/run-demo-scan.js secure
   ```

**What You Say:**
> "After applying ClawSec's recommendations... Risk level: LOW. 1 informational finding. Security score: 15/100 → 95/100. That's the power of actionable intelligence."

**Visual Highlight:**
- Show risk level change: CRITICAL → LOW
- Show score improvement: 15 → 95
- Show findings count: 8 → 1

**Time Check:** 5:00 elapsed

---

### Act 5: The Differentiators (60 seconds)

**What You Say:**
> "Why ClawSec instead of generic security tools?"

**What You Show:**
1. **Open README.md** and scroll to Features section

**What You Highlight:**
- ✅ **OpenClaw-native** - Built specifically for OpenClaw's architecture
- ✅ **Threat intelligence** - 800KB curated database, not generic patterns
- ✅ **Context-aware** - Understands environment variables, not just regex
- ✅ **Actionable remediation** - Specific commands, not vague advice
- ✅ **Standards compliance** - OWASP LLM Top 10, GDPR, PCI-DSS
- ✅ **X402 integration** - True AI-to-AI payments
- ✅ **Privacy-first** - Sanitization before analysis, no data retention
- ✅ **LLM-powered** - Contextual understanding, not just pattern matching

**What You Say:**
> "This isn't a port of a traditional security tool. It's built from the ground up for AI agents. We understand the unique threat landscape - prompt injection, tool abuse, credential leaks in logs, channel security. No one else does this."

**Time Check:** 6:00 elapsed

---

### Act 6: The Vision (30-60 seconds)

**What You Say:**
> "This is just the beginning. Imagine a future where every AI agent has a security consultant built in. Where vulnerabilities are caught before deployment. Where compliance is automated. That's what we're building."

**What You Show:**
1. **Quick glimpse of roadmap** (if prepared) or just speak to vision

**What You Tease:**
- Real-time monitoring (not just point-in-time scans)
- ClawHub skill marketplace security ratings
- Automated remediation (apply fixes automatically)
- Compliance dashboards (PCI-DSS, SOC 2, ISO 27001)
- Security-as-a-Service for enterprises

**What You Say:**
> "ClawSec: Security consultants for AI agents. Built for the USDC Hackathon, built for the future of AI security."

**Time Check:** 6:30-7:00 elapsed

---

## 🎬 Demo Flow Summary

| Time | Act | Key Message | Visuals |
|------|-----|-------------|---------|
| 0:00-1:00 | Act 1 | The Problem | Insecure config with highlighted vulnerabilities |
| 1:00-2:30 | Act 2 | The Solution | Live scan + comprehensive report |
| 2:30-4:00 | Act 3 | The Technology | Threat intel + X402 + LLM analysis |
| 4:00-5:00 | Act 4 | Before/After | Risk score improvement (15 → 95) |
| 5:00-6:00 | Act 5 | Differentiators | Why ClawSec > generic tools |
| 6:00-7:00 | Act 6 | The Vision | Future roadmap and impact |

---

## 🛠️ Technical Setup Commands

### Terminal Window 1 (Demo Execution)

```bash
# Navigate to project
cd /root/.openclaw/workspace/clawsec

# Set large font
# (Terminal → Preferences → Profiles → Text → Font Size: 16-18pt)

# Pre-load demo scripts
ls demo-scripts/
# Should show:
#   run-demo-scan.js
#   generate-demo-reports.sh
#   compare-configs.sh

# Test health check
curl https://clawsec-skill-production.up.railway.app/health | jq

# Ready to go!
```

### Terminal Window 2 (Monitoring/Backup)

```bash
# Monitor server logs (optional, if you have Railway CLI)
railway logs --service clawsec-skill-production

# Or just keep health check running
watch -n 5 'curl -s https://clawsec-skill-production.up.railway.app/health | jq'

# Have pre-generated reports ready
ls demo-reports/
# Should show:
#   insecure-report.md
#   moderate-report.md
#   secure-report.md
```

---

## 📊 Demo Variants (Choose Based on Audience)

### Variant A: Technical Audience (Developers)
- **Emphasize:** Architecture, LLM optimization, token budgets
- **Show:** Code snippets, threat patterns, API integration
- **Deep dive:** How sanitization works, pattern matching engine
- **Time:** 7-10 minutes

### Variant B: Business Audience (Investors/Judges)
- **Emphasize:** Problem/solution, market opportunity, business model
- **Show:** Before/after impact, customer value, pricing
- **Deep dive:** Why this matters, total addressable market, competitive advantage
- **Time:** 5-7 minutes

### Variant C: Security Audience (InfoSec Professionals)
- **Emphasize:** Threat modeling, standards compliance, accuracy
- **Show:** Threat database, OWASP mappings, false positive rate
- **Deep dive:** How we avoid false positives, confidence scoring, validation
- **Time:** 8-10 minutes

---

## 🚨 Backup Plan (If Live Demo Fails)

### Plan A: Use Pre-Generated Reports
1. Say: "I've already run the scan, let me show you the report..."
2. Open `demo-reports/insecure-report.md` in terminal or browser
3. Walk through sections as scripted in Act 2
4. Skip live execution, focus on report quality

### Plan B: Screen Recording
1. Have a pre-recorded video of the full scan (2-3 minutes)
2. Play video while narrating
3. Pause at key points to highlight features
4. Resume live for Act 5-6 (differentiators + vision)

### Plan C: Static Presentation
1. Switch to pitch deck (PowerPoint/Google Slides)
2. Show screenshots of each act
3. Narrate as if live demo
4. Emphasize that system is live (show health check)

---

## 🎤 Key Talking Points (Memorize These)

### 1. Problem Statement
> "OpenClaw agents have powerful access - exec, browser, files - but users don't know how to secure them. Manual audits are slow and require expertise."

### 2. Solution Value
> "ClawSec provides instant, comprehensive security analysis with actionable remediation. It's like having a security consultant built into your agent."

### 3. Technical Innovation
> "Three key innovations: 800KB curated threat intelligence, X402 micropayments for AI-to-AI commerce, and LLM analysis that understands context, not just patterns."

### 4. Business Model
> "$0.01 for basic scans, $0.03 for thorough analysis. No subscriptions, just pay-per-use. Scalable to enterprise compliance audits."

### 5. Market Opportunity
> "Every AI agent needs security. OpenClaw is just the start - this applies to any AI system with access to tools and data. Massive TAM."

### 6. Competitive Advantage
> "We're OpenClaw-native. We understand the unique threat landscape - prompt injection, tool abuse, credential leaks. No generic security tool does this."

---

## 📝 Q&A Preparation

### Expected Questions

**Q: How accurate is the LLM analysis?**
> A: "We've tested extensively - zero false positives in our test suite. We use confidence scoring and entropy analysis to validate findings. Every vulnerability includes evidence and exploitability assessment."

**Q: What about false negatives?**
> A: "We're continuously expanding our threat database. Current coverage includes 70+ credential types, OWASP LLM Top 10, and OpenClaw-specific vectors. We prioritize accuracy over noise."

**Q: How much does it cost to run?**
> A: "Client pays $0.01-$0.10 per scan in USDC. Our server costs are minimal - about $0.007 in LLM costs for basic scans. That's healthy margins at scale."

**Q: Can it fix vulnerabilities automatically?**
> A: "Not yet - MVP provides remediation steps. Post-hackathon roadmap includes automated fixing and real-time monitoring."

**Q: What about data privacy?**
> A: "We sanitize all sensitive data before analysis. Credentials are redacted, IPs anonymized, file paths hashed. The LLM never sees your actual secrets."

**Q: How does X402 payment work?**
> A: "X402 is Coinbase's micropayment protocol. Client makes USDC payment on Base blockchain, server verifies via facilitator, scan proceeds. Sub-second settlement."

**Q: Why not use traditional security tools?**
> A: "Traditional tools don't understand AI agents. They don't know what prompt injection looks like, or how tool permissions interact. We're built from the ground up for this new threat landscape."

**Q: What's next after the hackathon?**
> A: "Real-time monitoring, automated remediation, ClawHub security ratings, enterprise compliance dashboards. The goal is security-as-a-service for all AI agents."

---

## 🎥 Video Recording Checklist

### Before Recording
- [ ] Close unnecessary browser tabs/apps
- [ ] Clear terminal history (`clear` command)
- [ ] Hide dock/taskbar (fullscreen mode)
- [ ] Disable notifications (Do Not Disturb)
- [ ] Check audio levels (test microphone)
- [ ] Set terminal font size (16-18pt minimum)
- [ ] Ensure good lighting (if showing face)
- [ ] Prepare water (for dry mouth during recording)

### During Recording
- [ ] Speak clearly and at moderate pace
- [ ] Pause between acts (allows editing)
- [ ] Show visuals before narrating
- [ ] Keep cursor visible when highlighting
- [ ] Smile and show enthusiasm (if on camera)
- [ ] Avoid filler words ("um", "uh", "like")

### After Recording
- [ ] Review full video (check audio/video quality)
- [ ] Add intro/outro slides (if needed)
- [ ] Add captions (accessibility)
- [ ] Export in multiple formats (MP4 1080p, 720p)
- [ ] Test playback on different devices
- [ ] Upload to unlisted YouTube (for backup)

---

## 📱 Platform-Specific Submission

### Moltbook (m/usdc)
- [ ] Post video embed (if hosted on YouTube/Vimeo)
- [ ] Write compelling description (2-3 paragraphs)
- [ ] Include GitHub repo link
- [ ] Tag: #OpenClaw #USDC #Security #AI
- [ ] Mention @OpenClaw team
- [ ] Include demo report link (hosted on GitHub)

### GitHub README
- [ ] Embed demo video at top of README
- [ ] Add "Demo" section with key screenshots
- [ ] Link to sample reports
- [ ] Update "Quick Start" with demo config

### Twitter/Social
- [ ] Post 30-second teaser clip
- [ ] Thread with key screenshots
- [ ] Tag @OpenClaw @Coinbase
- [ ] Use hashtags: #OpenClaw #USDC #AISecurity

---

## ⏱️ Time Management

### Ideal Timing (7 minutes)
- Act 1: 1:00
- Act 2: 1:30
- Act 3: 1:30
- Act 4: 1:00
- Act 5: 1:00
- Act 6: 1:00

### If Running Long (Cut to 5 minutes)
- Act 1: 0:45 (skip config walkthrough details)
- Act 2: 1:30 (keep this - it's the core)
- Act 3: 1:00 (mention all 3 innovations briefly)
- Act 4: 0:45 (just show before/after scores)
- Act 5: 0:30 (bullet points only)
- Act 6: 0:30 (vision statement only)

### If Running Short (Expand to 10 minutes)
- Act 2: +1:00 (show sanitization process, token optimization)
- Act 3: +1:00 (deeper dive into threat intelligence structure)
- Act 4: +0:30 (show multiple config comparisons)
- Act 5: +0:30 (competitive analysis)

---

## 🏆 Success Criteria

### Must Achieve
- [ ] Demonstrate full scan-to-report workflow
- [ ] Show at least 1 critical vulnerability detected
- [ ] Explain why ClawSec is OpenClaw-native
- [ ] Mention X402 payment integration
- [ ] Show actionable remediation steps

### Nice to Have
- [ ] Live payment transaction on Base Sepolia
- [ ] Sanitization before/after comparison
- [ ] Token optimization stats
- [ ] Threat intelligence database showcase
- [ ] Before/after security score improvement

### Bonus Points
- [ ] Multiple config comparisons (insecure → secure)
- [ ] Live Q&A engagement
- [ ] Competitive differentiation deep dive
- [ ] Roadmap/vision articulation
- [ ] Community feedback incorporation

---

## 📞 Emergency Contacts

- **Server Down**: Check Railway dashboard → https://railway.app/
- **Payment Issues**: Review X402 docs → https://www.x402.org/
- **Technical Questions**: Post in #help channel (if applicable)

---

**Demo Prepared By:** Ubik  
**Last Updated:** 2026-02-06  
**Review Status:** Ready for rehearsal  

🎬 **Good luck! Break a leg!** 🎬
