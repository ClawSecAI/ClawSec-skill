# ClawSec Demo Directory

**Purpose:** Complete hackathon demo package for Moltbook USDC Hackathon  
**Status:** Production-ready ✅

---

## 📁 Directory Contents

```
demo/
├── README.md                 # This file
├── demo-basic.json          # Test scenario 1: Basic vulnerabilities
├── demo-complex.json        # Test scenario 2: Critical credential exposure
├── demo-compliance.json     # Test scenario 3: Secure/compliant config
├── scan-demo.js             # Demo automation script
├── test-server.sh           # Server health check script
└── backup/                  # (Create this) Pre-generated reports
```

---

## 🚀 Quick Start

### Run a Demo Scan

```bash
# Navigate to demo directory
cd /root/.openclaw/workspace/clawsec/demo

# Run basic scan
node scan-demo.js demo-basic.json

# Run complex scan
node scan-demo.js demo-complex.json

# Run compliance scan
node scan-demo.js demo-compliance.json
```

### Test Server Health

```bash
chmod +x test-server.sh
./test-server.sh
```

---

## 📋 Test Scenarios

### Scenario 1: Basic Deployment (`demo-basic.json`)
**Risk Level:** HIGH (70-79/100)  
**Expected Findings:** 4-6

**Vulnerabilities:**
- Weak gateway token
- Public bind (0.0.0.0)
- Exec tool enabled
- Telegram token exposure

**Demo Time:** ~18 seconds  
**Use Case:** Show common beginner mistakes

---

### Scenario 2: Complex Deployment (`demo-complex.json`)
**Risk Level:** CRITICAL (90-100/100)  
**Expected Findings:** 10-15

**Vulnerabilities:**
- Multiple hardcoded credentials (AWS, OpenAI, Stripe, DB)
- Weak authentication
- No encryption
- Debug logging with secrets

**Demo Time:** ~24 seconds  
**Use Case:** Demonstrate comprehensive detection + prioritization

---

### Scenario 3: Compliant Deployment (`demo-compliance.json`)
**Risk Level:** SECURE (0-10/100)  
**Expected Findings:** 0-2 (low severity)

**Security Controls:**
- Strong tokens (64-char random)
- Localhost bind
- HTTPS/TLS 1.3
- Environment variables for secrets
- OWASP + GDPR compliance

**Demo Time:** ~16 seconds  
**Use Case:** Show positive validation

---

## 🎬 Demo Script Workflow

1. **Introduction** (30s)
   - "We'll run 3 security scans..."
   
2. **Demo 1: Basic** (2 min)
   - Run `node scan-demo.js demo-basic.json`
   - Review 4 findings
   - Highlight actionable fixes
   
3. **Demo 2: Complex** (2.5 min)
   - Run `node scan-demo.js demo-complex.json`
   - Review 12 findings
   - Show prioritization (P0-P3)
   
4. **Demo 3: Compliance** (1.5 min)
   - Run `node scan-demo.js demo-compliance.json`
   - Validate OWASP + GDPR
   - Confirm best practices

**Total Time:** 6.5 minutes (leaves 3.5 min for slides + Q&A)

---

## 🛠️ Troubleshooting

### "Connection refused" or timeout

**Fix:**
1. Check server: `./test-server.sh`
2. Try mobile hotspot
3. Use pre-generated backup reports

### Scan takes too long (>40s)

**Fix:**
1. Check internet speed
2. Increase timeout in `scan-demo.js` (line 183)
3. Use backup reports

### Unexpected results (findings count off)

**Fix:**
- This is acceptable (LLM variance ±2)
- Roll with it: "LLM detected additional context"
- Focus on quality, not exact counts

---

## 📊 Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Basic scan | 15-20s | <30s |
| Complex scan | 20-30s | <40s |
| Compliance scan | 15-20s | <30s |
| Server response | <2s | <5s |
| Detection accuracy | >95% | >90% |

---

## 🎯 Pre-Demo Checklist

### 24 Hours Before
- [ ] Run all 3 demos successfully (3x each)
- [ ] Generate backup reports (save to `backup/`)
- [ ] Test venue WiFi + configure mobile hotspot
- [ ] Charge laptop to 100%

### 2 Hours Before
- [ ] Verify server health (`./test-server.sh`)
- [ ] Set terminal font to 18pt
- [ ] Clear terminal history
- [ ] Open backup reports window
- [ ] Disable notifications

### 10 Minutes Before
- [ ] Test connection
- [ ] Load commands in history
- [ ] Have slides ready
- [ ] Breathe and focus!

---

## 🔗 Related Documentation

- **Main Demo Script:** `../DEMO-SCRIPT.md` (13.6 KB)
- **Pitch Deck Outline:** `../PITCH-DECK.md` (19 KB)
- **Test Plan:** `../DEMO-TEST-PLAN.md` (14.1 KB)
- **Completion Summary:** `../DEMO-PREPARATION-COMPLETE.md` (14.5 KB)

---

## 📝 Notes

- All configs are safe to commit (no real secrets)
- Pre-generate backups before demo: `mkdir backup && [run scans]`
- Server URL: `https://clawsec-skill-production.up.railway.app`
- Expected total demo time: 6-7 minutes

---

**Status:** ✅ Production-ready  
**Last Updated:** 2026-02-06  
**Maintainer:** Ubik & Stan

---

**Good luck! You've got this! 🚀**
