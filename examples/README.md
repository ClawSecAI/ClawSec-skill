# ClawSec Sample Reports

This directory contains example security audit reports demonstrating ClawSec's capabilities.

## 📄 Available Samples

### sample-owasp-report.md

**Purpose:** Demonstrates OWASP LLM Top 10 (2025) compliance mapping in ClawSec reports

**Features Highlighted:**
- ✅ Complete OWASP LLM Top 10 compliance checklist
- ✅ Threat ID to OWASP category mappings
- ✅ Severity-based compliance status indicators (✅ ⚠️ 🚨)
- ✅ Per-category finding breakdown
- ✅ Critical OWASP category details
- ✅ 8 realistic security findings across 5 OWASP categories
- ✅ Prioritized remediation recommendations (P0-P3)
- ✅ Risk score calculation (0-100 scale)
- ✅ GDPR compliance considerations

**Scenario:** Medium-security OpenClaw deployment with multiple issues
- **Risk Level:** HIGH (42/100)
- **OWASP Compliance:** 50% (5/10 categories compliant)
- **Critical Findings:** 3 (credential exposure, weak auth, database exposure)
- **Total Findings:** 8

**OWASP Categories Covered:**
- LLM01: Prompt Injection (2 findings)
- LLM02: Sensitive Information Disclosure (3 findings)
- LLM04: Data and Model Poisoning (1 finding)
- LLM05: Improper Output Handling (1 finding)
- LLM06: Excessive Agency (2 findings)
- LLM10: Unbounded Consumption (1 finding)

---

## 🎯 How to Use These Examples

### For Developers
Study the report structure and OWASP mapping format:
```bash
# View the OWASP compliance section
grep -A 50 "OWASP LLM Top 10 Compliance" sample-owasp-report.md

# Check how threats map to OWASP categories
grep "OWASP Category:" sample-owasp-report.md
```

### For Security Teams
Use as a template for understanding ClawSec output:
- Review the compliance checklist format (table with status indicators)
- Study the critical category details section
- Understand the prioritization system (P0-P3)
- See how findings link to OWASP categories

### For Sales/Marketing
Demonstrate ClawSec capabilities:
- Professional report formatting
- Industry-standard compliance mapping (OWASP, GDPR)
- Clear prioritization and remediation guidance
- Executive summary with business impact

---

## 📚 Related Documentation

- **OWASP Mapping Reference:** `../docs/owasp-llm-top-10-mapping.md` (17KB)
  - Complete threat-to-OWASP category mappings
  - Detailed rationale for each mapping
  - Detection coverage analysis

- **Report Template Docs:** `../docs/report-template.md`
  - Report structure specification
  - Output format options (markdown, JSON, PDF)
  - Section-by-section breakdown

- **Implementation Module:** `../server/owasp-mapper.js` (14KB)
  - OWASP compliance generation algorithm
  - Markdown checklist generator
  - Helper functions for category lookups

---

## 🔄 Generating Your Own Reports

### Option 1: Run a Real Scan
```bash
# Install ClawSec client
cd /root/.openclaw/workspace/clawsec
npm install

# Run audit (requires ClawSec server running)
node client/clawsec.js --config /path/to/openclaw/config.json
```

### Option 2: Test with Sample Data
```bash
# Run test suite (generates sample compliance data)
cd /root/.openclaw/workspace/clawsec
node test-owasp-mapping.js
```

### Option 3: API Request (Manual)
```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "config": {...},
    "logs": [...],
    "workspace_files": [...]
  }'
```

---

## 🧪 Sample Report Statistics

| Metric | Value | Description |
|--------|-------|-------------|
| **Total Size** | 17KB | Complete markdown report |
| **Findings** | 8 | Security issues detected |
| **OWASP Categories** | 6/10 | Categories with findings |
| **Critical Issues** | 3 | P0 immediate action required |
| **High Issues** | 3 | P1 urgent (24-48h) |
| **Medium Issues** | 2 | P2 short-term (7 days) |
| **Security Score** | 42/100 | HIGH risk level |
| **OWASP Compliance** | 50% | 5/10 categories compliant |

---

## 📝 Report Versions

### v1.0.0 (Current)
- OWASP LLM Top 10 (2025) compliance mapping
- Risk score calculation (0-100 scale)
- Prioritized recommendations (P0-P3)
- Executive summary with business impact
- GDPR compliance considerations
- Professional formatting (tables, emoji indicators)

### Future Enhancements
- [ ] JSON export format examples
- [ ] PDF report samples
- [ ] Secure configuration example (100/100 score)
- [ ] Edge case scenarios (no findings, critical-only, etc.)
- [ ] Multi-language report samples
- [ ] ClawHub-specific vulnerability examples

---

## 🤝 Contributing

To add new sample reports:

1. **Create the report file**
   ```bash
   touch examples/sample-{scenario}-report.md
   ```

2. **Follow the template structure**
   - Executive Summary
   - Risk Score Breakdown
   - OWASP LLM Top 10 Compliance
   - Detailed Findings
   - Prioritized Recommendations
   - Reference Documentation

3. **Update this README**
   - Add to "Available Samples" section
   - Document the scenario and key features
   - Include statistics table

4. **Test the report**
   - Verify markdown rendering
   - Check OWASP compliance section format
   - Validate all findings have threat IDs

---

## 📧 Questions?

- **Documentation:** See `../docs/` directory
- **Issues:** https://github.com/ClawSecAI/ClawSec-skill/issues
- **Support:** security@clawsec.ai

---

**Last Updated:** 2026-02-07  
**Maintained by:** ClawSec Team (@ClawSecAI)
