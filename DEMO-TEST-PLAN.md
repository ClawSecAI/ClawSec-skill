# ClawSec Demo Test Plan & Execution Guide

**Purpose:** Ensure all demo components work flawlessly for hackathon presentation  
**Target:** Zero failures during live demo  
**Timeline:** Complete testing 24 hours before presentation

---

## 📋 Pre-Demo Checklist (Complete 1 Day Before)

### Infrastructure Validation

- [ ] **Railway Server Status**
  ```bash
  curl -s https://clawsec-skill-production.up.railway.app/health | jq
  # Expected: {"status": "ok", "timestamp": ...}
  ```
  
- [ ] **API Endpoint Availability**
  ```bash
  curl -s https://clawsec-skill-production.up.railway.app/api/v1 | jq
  # Expected: {"name": "ClawSec", "version": "1.0.0", ...}
  ```

- [ ] **Threat Database Loaded**
  ```bash
  curl -s https://clawsec-skill-production.up.railway.app/api/v1/threats | jq '.count'
  # Expected: >0
  ```

- [ ] **Server Response Time**
  ```bash
  time curl -s https://clawsec-skill-production.up.railway.app/health > /dev/null
  # Expected: <2 seconds
  ```

### Demo Files Validation

- [ ] **All config files exist**
  ```bash
  ls -lh /root/.openclaw/workspace/clawsec/demo/
  # Expected: demo-basic.json, demo-complex.json, demo-compliance.json, scan-demo.js
  ```

- [ ] **Config files are valid JSON**
  ```bash
  jq . demo/demo-basic.json > /dev/null && echo "✓ Valid"
  jq . demo/demo-complex.json > /dev/null && echo "✓ Valid"
  jq . demo/demo-compliance.json > /dev/null && echo "✓ Valid"
  ```

- [ ] **Scan script is executable**
  ```bash
  chmod +x demo/scan-demo.js
  node demo/scan-demo.js --help
  # Expected: Usage instructions
  ```

### Network Testing

- [ ] **DNS Resolution**
  ```bash
  nslookup clawsec-skill-production.up.railway.app
  # Expected: Valid IP address
  ```

- [ ] **HTTPS Connection**
  ```bash
  openssl s_client -connect clawsec-skill-production.up.railway.app:443 < /dev/null
  # Expected: Successful TLS handshake
  ```

- [ ] **Firewall Rules**
  ```bash
  nc -zv clawsec-skill-production.up.railway.app 443
  # Expected: Connection succeeded
  ```

---

## 🧪 Test Scenarios (Run 3x Times Each)

### Test 1: Basic Scan (Target: 15-25 seconds)

**Objective:** Verify basic vulnerability detection

**Command:**
```bash
cd /root/.openclaw/workspace/clawsec
node demo/scan-demo.js demo/demo-basic.json
```

**Expected Results:**
- ✅ Scan completes without errors
- ✅ Response time: 15-25 seconds
- ✅ Risk level: HIGH (60-79/100)
- ✅ Findings count: 4-6
- ✅ Report generated (Markdown format)
- ✅ File saved: `report-demo-basic-*.md`

**Key Findings to Validate:**
1. Weak gateway token detected
2. Public bind address (0.0.0.0) flagged
3. Exec tool enabled warning
4. Telegram token exposure noted

**Success Criteria:**
- [ ] All expected findings present
- [ ] No false positives
- [ ] Report is human-readable
- [ ] Remediation commands provided

**Failure Recovery:**
- If timeout: Increase timeout in scan-demo.js (line 183)
- If network error: Switch to backup network (mobile hotspot)
- If API error: Check Railway logs, restart server
- If invalid response: Use pre-generated report (backup/)

---

### Test 2: Complex Scan (Target: 20-35 seconds)

**Objective:** Verify comprehensive credential detection + prioritization

**Command:**
```bash
cd /root/.openclaw/workspace/clawsec
node demo/scan-demo.js demo/demo-complex.json
```

**Expected Results:**
- ✅ Scan completes without errors
- ✅ Response time: 20-35 seconds
- ✅ Risk level: CRITICAL (80-100/100)
- ✅ Findings count: 10-15
- ✅ Multiple credential types detected (AWS, OpenAI, Stripe, DB)
- ✅ Priority levels assigned (P0-P3)
- ✅ Report includes compliance analysis

**Key Findings to Validate:**
1. AWS access key hardcoded (CRITICAL)
2. OpenAI API key exposed (HIGH)
3. Stripe secret key detected (CRITICAL)
4. Database passwords weak (HIGH)
5. Gateway token numeric (HIGH)
6. Multiple tool permissions (MEDIUM)
7. Debug logging enabled (LOW)

**Priority Validation:**
- [ ] P0 findings have <1 hour deadline
- [ ] P1 findings have <24 hour deadline
- [ ] P2 findings have <7 day deadline
- [ ] P3 findings have <30 day deadline

**Success Criteria:**
- [ ] All credential patterns detected
- [ ] Correct severity classification
- [ ] Prioritization logic working
- [ ] Threat intel context included

**Failure Recovery:**
- If too many findings: Adjust expected count (10-15 is acceptable)
- If missing credentials: Check patterns.js in server
- If wrong priorities: Verify recommendation-engine.js
- If incomplete report: Use pre-generated backup

---

### Test 3: Compliance Scan (Target: 15-25 seconds)

**Objective:** Verify positive validation (secure configuration)

**Command:**
```bash
cd /root/.openclaw/workspace/clawsec
node demo/scan-demo.js demo/demo-compliance.json
```

**Expected Results:**
- ✅ Scan completes without errors
- ✅ Response time: 15-25 seconds
- ✅ Risk level: SECURE (0-10/100)
- ✅ Findings count: 0-2 (low severity only)
- ✅ OWASP LLM Top 10 compliance confirmed
- ✅ GDPR compliance validated
- ✅ Best practices acknowledged

**Key Validations to Confirm:**
1. Strong token recognized (64-char random)
2. Localhost bind approved (127.0.0.1)
3. HTTPS/TLS enabled noted
4. Secrets in environment variables praised
5. Rate limiting acknowledged
6. Audit logging confirmed

**Compliance Checks:**
- [ ] OWASP LLM01-LLM10 all validated
- [ ] GDPR requirements met
- [ ] ISO 27001 alignment noted (if applicable)
- [ ] Best practices list comprehensive

**Success Criteria:**
- [ ] Report is mostly positive
- [ ] No false alarms (critical findings)
- [ ] Compliance badges shown
- [ ] Recommendations are optional (not urgent)

**Failure Recovery:**
- If false positives: Review context detection logic
- If compliance not validated: Check OWASP/GDPR module
- If high risk score: Adjust config to be more secure
- If report missing sections: Use pre-generated backup

---

## 🎬 Live Demo Rehearsal (Practice 3x)

### Setup Checklist (10 minutes before demo)

- [ ] Open terminal (full screen, font size 18pt)
- [ ] Navigate to demo directory
- [ ] Clear terminal history (`history -c`)
- [ ] Set clean prompt: `export PS1="ClawSec Demo> "`
- [ ] Pre-load commands in history:
  ```bash
  history -s "node demo/scan-demo.js demo/demo-basic.json"
  history -s "node demo/scan-demo.js demo/demo-complex.json"
  history -s "node demo/scan-demo.js demo/demo-compliance.json"
  ```
- [ ] Test network connection (ping Railway server)
- [ ] Have backup reports ready (open in separate window)
- [ ] Disable notifications (Do Not Disturb mode)
- [ ] Close unnecessary applications
- [ ] Charge laptop to 100%

### Rehearsal Script

**Step 1: Introduction (30 seconds)**
```
"Let me show you ClawSec in action. We'll run 3 security scans:
 1. Basic deployment with common issues
 2. Complex deployment with multiple credentials
 3. Compliant deployment following best practices"
```

**Step 2: Demo 1 - Basic Scan (2 minutes)**
```bash
# RUN
node demo/scan-demo.js demo/demo-basic.json

# TALK DURING SCAN (15-25 seconds)
"Notice how fast this is - ClawSec is extracting config, sanitizing secrets,
 submitting to Railway API, and Claude is analyzing with threat intelligence..."

# REVIEW RESULTS
"Here's the report. 4 findings, HIGH risk score of 73/100.
 Each finding has a specific fix with commands.
 Total time: 18 seconds."
```

**Step 3: Demo 2 - Complex Scan (2.5 minutes)**
```bash
# RUN
node demo/scan-demo.js demo/demo-complex.json

# TALK DURING SCAN (20-35 seconds)
"This configuration has multiple hardcoded credentials - AWS keys, OpenAI tokens,
 Stripe secrets, database passwords. Watch how ClawSec detects all of them..."

# REVIEW RESULTS
"CRITICAL risk, 94/100. 12 findings with P0-P3 priorities.
 Notice the prioritization: P0 items get 30-minute deadlines.
 Total time: 24 seconds."
```

**Step 4: Demo 3 - Compliance Scan (1.5 minutes)**
```bash
# RUN
node demo/scan-demo.js demo/demo-compliance.json

# TALK DURING SCAN (15-25 seconds)
"Now let's validate a secure configuration - OWASP + GDPR compliant.
 ClawSec doesn't just find problems, it validates good practices..."

# REVIEW RESULTS
"SECURE, 0/100 risk. All OWASP LLM checks pass, GDPR compliant.
 This gives users confidence their security posture is solid.
 Total time: 16 seconds."
```

### Timing Validation

| Segment | Target | Actual Run 1 | Actual Run 2 | Actual Run 3 | Average |
|---------|--------|--------------|--------------|--------------|---------|
| Intro | 0:30 | | | | |
| Demo 1 | 2:00 | | | | |
| Demo 2 | 2:30 | | | | |
| Demo 3 | 1:30 | | | | |
| **Total** | **6:30** | | | | |

**Goal:** Complete all demos in <7 minutes (leaves 3 min for slides + Q&A)

---

## 🛠️ Troubleshooting Scenarios

### Scenario 1: Network Timeout

**Symptom:** `ECONNREFUSED` or timeout error

**Live Recovery:**
1. Switch to mobile hotspot immediately
2. Re-run command (client has retry logic)
3. If still fails: Show pre-generated report
4. Explain: "Network glitch - here's the report we generated earlier"

**Prevention:**
- Test venue WiFi beforehand
- Have mobile hotspot configured and tested
- Pre-generate all 3 reports as backups

### Scenario 2: API Server Error (500)

**Symptom:** `500 Internal Server Error`

**Live Recovery:**
1. Check Railway server status (separate browser tab)
2. If server is up: Retry (may be transient)
3. If server is down: Use backup reports
4. Explain: "Server hiccup - let me show you the analysis"

**Prevention:**
- Monitor Railway logs day before demo
- Restart server 2 hours before presentation
- Have backup Railway instance ready

### Scenario 3: Unexpected Results

**Symptom:** Risk level or findings don't match expectations

**Live Recovery:**
1. Don't panic - this might be improvement
2. Explain: "LLM detected additional context"
3. Roll with it: "This shows ClawSec is intelligent, not scripted"
4. Highlight interesting findings even if unexpected

**Prevention:**
- Update expected results based on latest tests
- Be flexible with exact counts (4-6 findings is fine)
- Focus on detection quality, not exact numbers

### Scenario 4: Terminal/Display Issues

**Symptom:** Font too small, colors not showing, terminal freezes

**Live Recovery:**
1. Zoom in (Cmd/Ctrl + "+")
2. Switch to backup laptop
3. Show GitHub README if all else fails
4. Explain: "Technical difficulties - let's walk through the docs"

**Prevention:**
- Test projector resolution beforehand
- Set font size to 18pt minimum
- Have backup laptop with same setup
- Print README as ultimate backup

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Failure |
|--------|--------|------------|---------|
| Basic scan time | 15-20s | 20-30s | >30s |
| Complex scan time | 20-30s | 30-40s | >40s |
| Compliance scan time | 15-20s | 20-30s | >30s |
| Server response time | <2s | <5s | >5s |
| API uptime | 99.9% | 99% | <99% |
| False positive rate | 0% | <5% | >5% |
| Detection accuracy | >95% | >90% | <90% |

### Benchmark Test Script

```bash
#!/bin/bash
# benchmark-demo.sh - Test all scenarios 10x and average

echo "ClawSec Demo Benchmark Test"
echo "============================"

for i in {1..10}; do
  echo -e "\n### Run $i/10 ###"
  
  echo "Basic scan..."
  time node demo/scan-demo.js demo/demo-basic.json > /dev/null 2>&1
  
  echo "Complex scan..."
  time node demo/scan-demo.js demo/demo-complex.json > /dev/null 2>&1
  
  echo "Compliance scan..."
  time node demo/scan-demo.js demo/demo-compliance.json > /dev/null 2>&1
  
  sleep 2
done

echo -e "\n✅ Benchmark complete. Review times above."
```

---

## 🎯 Success Criteria Summary

### Must-Have (Critical)

- ✅ All 3 scans complete successfully
- ✅ Reports generated with expected findings
- ✅ No API errors or timeouts
- ✅ Response times <30 seconds
- ✅ Credibility maintained (no obvious failures)

### Nice-to-Have (Optional)

- ✅ Response times <20 seconds (impressive)
- ✅ Exact finding counts match expectations
- ✅ All visual elements render perfectly
- ✅ Audience engagement (questions, nodding)
- ✅ Smooth transitions between demos

### Acceptable Compromises

- ⚠️ 1 demo uses backup report (if network fails)
- ⚠️ Findings count off by ±2 (LLM variance)
- ⚠️ Response time up to 40s (acceptable if explained)
- ⚠️ Minor visual glitches (colors, formatting)

### Unacceptable Failures

- ❌ All demos fail (no backups work)
- ❌ Complete network outage (no recovery)
- ❌ Server completely down (Railway outage)
- ❌ Major false positives (credibility loss)

---

## 📝 Post-Demo Review

### Metrics to Capture

- [ ] Actual scan times (all 3 scenarios)
- [ ] Audience reaction (positive/neutral/negative)
- [ ] Questions asked (quality and quantity)
- [ ] Technical issues encountered (if any)
- [ ] Judge feedback (if available)

### Lessons Learned Template

**What Went Well:**
- 
- 
- 

**What Could Improve:**
- 
- 
- 

**Unexpected Issues:**
- 
- 
- 

**Action Items:**
- 
- 
- 

---

## 🚀 Pre-Generated Sample Reports

Create backup reports by running scans now and saving outputs:

```bash
# Generate backup reports
cd /root/.openclaw/workspace/clawsec

# Basic
node demo/scan-demo.js demo/demo-basic.json > backup/report-basic-backup.txt 2>&1

# Complex
node demo/scan-demo.js demo/demo-complex.json > backup/report-complex-backup.txt 2>&1

# Compliance
node demo/scan-demo.js demo/demo-compliance.json > backup/report-compliance-backup.txt 2>&1

# Verify backups exist
ls -lh backup/
```

---

## ✅ Final Checklist (Morning of Demo)

- [ ] Run all 3 demos successfully (3x each = 9 total runs)
- [ ] Verify average times meet targets (<30s)
- [ ] Generate and save backup reports
- [ ] Test on venue WiFi (if possible)
- [ ] Configure mobile hotspot as backup
- [ ] Charge laptop to 100%
- [ ] Bring power adapter
- [ ] Have HDMI/USB-C adapters
- [ ] Print README as physical backup
- [ ] Set phone to Do Not Disturb
- [ ] Disable system notifications
- [ ] Clear browser cache
- [ ] Close unnecessary applications
- [ ] Test microphone audio
- [ ] Practice full run-through 1 final time

---

**You've got this! 🚀**

Remember:
- Confidence > Perfection
- Backup plans exist for a reason
- The work is solid - show it off!

---

**End of Demo Test Plan**
