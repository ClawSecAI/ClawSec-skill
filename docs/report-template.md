# ClawSec Report Template

**Status**: ✅ Implemented (server/index.js, lines 314-433)  
**Last Updated**: 2026-02-06

---

## Overview

The ClawSec report template is implemented as a code-generated Markdown document that structures security audit findings into a professional, actionable format.

## Template Structure

### 1. Header
- Generated timestamp
- Scan ID (unique identifier)
- ClawSec version

### 2. Executive Summary
- Total findings count
- Overall risk level (CRITICAL/HIGH/MEDIUM/LOW)
- Key findings (top 3)
- Immediate actions required (top 3 critical/high issues)

### 3. Risk Breakdown
Table showing:
- Severity distribution (Critical/High/Medium/Low)
- Count per severity
- Percentage of total findings

### 4. Detailed Findings
For each finding:
- **Threat ID**: Reference to threat database (e.g., T001)
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW with emoji
- **Title**: Brief description
- **Description**: Detailed explanation
- **Impact**: What could happen if exploited
- **Likelihood**: Probability of exploitation
- **Evidence**: JSON data showing what was detected
- **Remediation Steps**: Organized by timeframe
  - Immediate (today)
  - Short-term (this week)
  - Long-term (ongoing)

### 5. OWASP LLM Top 10 Compliance (NEW - 2026-02-07)
- Compliance table showing status for all 10 OWASP LLM categories
- Overall compliance percentage
- Compliance risk level
- Critical categories requiring immediate attention
- Severity breakdown per category (Critical/High/Medium/Low)
- Status indicators (✅ Compliant, ⚠️ Issues Found, 🚨 Critical Issues)
- Links to OWASP mapping documentation

### 6. Next Steps
Actionable checklist organized by:
- Immediate (Today)
- This Week

### 7. Footer
- Generation metadata
- Support link

---

## Current Export Formats

### ✅ Markdown (Primary Format)
**Status**: Implemented

```markdown
# OpenClaw Security Audit Report

**Generated**: 2026-02-06T18:30:00.000Z
**Scan ID**: clawsec-1738867800-a1b2c3
**ClawSec Version**: 0.1.0-hackathon

---

## Executive Summary

This security audit analyzed your OpenClaw configuration and identified **3 security issues**.

**Overall Risk Level**: 🟠 **HIGH**

### Key Findings
- **Weak or Default Gateway Token** (CRITICAL)
- **Exposed Secrets in Configuration** (HIGH)
- **No Rate Limiting** (MEDIUM)
...
```

**Use Cases**:
- Human-readable reports
- Copy-paste into documentation
- Version control tracking
- GitHub/GitLab issue creation

**Advantages**:
- Native format for LLM generation
- Easy to parse and modify
- Git-friendly (diff tracking)
- Universal readability

---

## Planned Export Formats

### ✅ JSON (Machine-Readable)
**Status**: ✅ Implemented (2026-02-07)

**Usage**: Add `?format=json` query parameter to `/api/v1/scan` endpoint

```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan?format=json \
  -H "Content-Type: application/json" \
  -d @config.json
```

**Response Structure**:

```json
{
  "metadata": {
    "scan_id": "clawsec-1738867800-a1b2c3",
    "timestamp": "2026-02-07T08:00:00.000Z",
    "report_version": "1.0.0",
    "clawsec_version": "0.1.0-hackathon",
    "format": "json",
    "generator": "ClawSec JSON Export Module"
  },
  "summary": {
    "total_findings": 3,
    "risk_level": "HIGH",
    "risk_score": 73,
    "score_confidence": 0.92,
    "severity_distribution": {
      "critical": 1,
      "high": 1,
      "medium": 1,
      "low": 0
    },
    "key_findings": [
      "Weak or Default Gateway Token",
      "Public Gateway Exposure",
      "Unencrypted Session Storage"
    ],
    "immediate_actions_required": 2
  },
  "findings": [
    {
      "threat_id": "T001",
      "severity": "CRITICAL",
      "title": "Weak or Default Gateway Token",
      "description": "Gateway token is weak or matches common patterns",
      "impact": "Complete system compromise possible",
      "likelihood": "HIGH",
      "evidence": {
        "token_length": 16,
        "token_pattern": "weak"
      },
      "remediation": {
        "immediate": [
          "Generate strong token: openssl rand -hex 32",
          "Update gateway.token in config",
          "Restart gateway"
        ],
        "short_term": ["Implement token rotation policy"],
        "long_term": ["Add monitoring for failed auth attempts"]
      },
      "priority": {
        "level": "P0",
        "score": 95,
        "time_to_fix": {
          "duration": "2 hours",
          "unit": "hours",
          "deadline": "2026-02-07T10:00:00Z"
        },
        "reasoning": "Critical authentication weakness with high exploitability"
      }
    }
  ],
  "recommendations": {
    "summary": {
      "total": 3,
      "p0_critical": 1,
      "p1_high": 1,
      "p2_medium": 1,
      "p3_low": 0
    },
    "immediate_actions": [
      {
        "threat_id": "T001",
        "title": "Weak or Default Gateway Token",
        "action": "Generate strong token: openssl rand -hex 32"
      }
    ],
    "priority_distribution": {
      "p0_critical": 1,
      "p1_high": 1,
      "p2_medium": 1,
      "p3_low": 0
    },
    "rankings": [
      {
        "threat_id": "T001",
        "title": "Weak or Default Gateway Token",
        "severity": "CRITICAL",
        "priority_level": "P0",
        "priority_score": 95,
        "time_to_fix": {
          "duration": "2 hours",
          "unit": "hours",
          "deadline": "2026-02-07T10:00:00Z"
        },
        "reasoning": "Critical authentication weakness with high exploitability",
        "exploitability": {
          "score": 90,
          "likelihood": "HIGH",
          "complexity": "LOW"
        },
        "impact": {
          "confidentiality": "HIGH",
          "integrity": "HIGH",
          "availability": "MEDIUM"
        }
      }
    ]
  },
  "risk_analysis": {
    "overall_score": 73,
    "risk_level": "HIGH",
    "confidence": 0.92,
    "score_breakdown": {
      "base_score": 75,
      "context_multiplier": 1.1,
      "diminishing_factor": 0.88
    },
    "risk_factors": [
      {
        "factor": "weak_authentication",
        "severity": "CRITICAL",
        "description": "Weak authentication mechanisms detected",
        "count": 1
      }
    ],
    "compliance_impact": {
      "owasp_llm_top10": {
        "categories_affected": [
          {
            "category": "LLM06 SENSITIVE INFO DISCLOSURE",
            "findings_count": 1
          }
        ],
        "total_owasp_findings": 1
      },
      "gdpr_considerations": {
        "issues_found": 1,
        "compliance_concerns": [
          {
            "article": "Article 32 - Security of Processing",
            "issue": "Unencrypted data storage detected",
            "severity": "HIGH",
            "description": "GDPR requires appropriate technical measures to secure personal data"
          }
        ],
        "recommendation": "Address identified issues to maintain GDPR compliance"
      }
    }
  },
  "optimization": {
    "model": "claude-3-5-haiku-20241022",
    "scan_tokens": 850,
    "context_tokens": 12400,
    "total_tokens": 13250,
    "categories_loaded": 5,
    "categories_skipped": 2,
    "budget_used_percent": 38.5
  },
  "scan_context": {
    "configuration_analyzed": ["gateway", "sessions", "channels", "tools"],
    "scan_type": "configuration_audit",
    "threat_database_version": "0.1.0"
  },
  "next_steps": {
    "immediate": [
      "Review and address all CRITICAL severity findings immediately",
      "Backup current configuration before making changes",
      "Rotate any exposed credentials found in this scan"
    ],
    "short_term": [
      "Address all HIGH severity findings within 48 hours",
      "Implement monitoring for security events",
      "Review and update access controls"
    ],
    "long_term": [
      "Schedule regular security scans (weekly recommended)",
      "Implement automated security testing in CI/CD",
      "Conduct security training for team members"
    ]
  }
}
```

**Use Cases**:
- ✅ Agent-to-agent communication
- ✅ Automated remediation pipelines
- ✅ Integration with SIEM/monitoring tools
- ✅ Programmatic analysis
- ✅ Dashboard visualizations
- ✅ CI/CD security gates

**Features**:
- ✅ Complete findings with evidence and remediation steps
- ✅ Prioritized recommendations (P0-P3)
- ✅ Risk analysis with 0-100 scoring
- ✅ OWASP LLM Top 10 compliance mapping
- ✅ GDPR considerations
- ✅ Token optimization statistics
- ✅ Structured for downstream processing

**Module**: `server/json-export.js`
**Test Suite**: `test-json-export.js`
**Implementation**: Full JSON schema with metadata, summary, findings, recommendations, risk analysis, and compliance

---

### ✅ PDF (Professional Documents)
**Status**: ✅ Complete (2026-02-07)

**Usage**: Add `?format=pdf` query parameter to `/api/v1/scan` endpoint

```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan?format=pdf \
  -H "Content-Type: application/json" \
  -d @config.json \
  --output clawsec-report.pdf
```

**Module**: `server/pdf-export.js` (20KB, 680+ lines)  
**Test Suite**: `test-pdf-export.js` (14KB, 6 comprehensive tests)  
**Test Report**: `PDF-EXPORT-TESTING-REPORT.md` (validation complete)

**Key Features**:
- ✅ Puppeteer-based HTML-to-PDF conversion
- ✅ Professional CSS styling with color-coded severity badges
- ✅ Multiple page formats (A4, Letter) with customizable margins
- ✅ Complete report sections (metadata, summary, findings, remediation, compliance)
- ✅ OWASP LLM Top 10 compliance checklist
- ✅ GDPR considerations included
- ✅ High-resolution rendering (2x device scale factor)
- ✅ Print-friendly layout with page breaks
- ✅ Graceful error handling (fallback to JSON on failure)

**Core Functions**:
```javascript
// server/pdf-export.js
const { generatePDFFromScan, generateHTMLReport, generatePDFReport } = require('./server/pdf-export');

// Generate PDF from scan results
const pdfBuffer = await generatePDFFromScan(
  scanId, scanInput, findings, threatsIndex, 
  scoreResult, prioritized, optimization, 
  { format: 'A4', printBackground: true }
);

// Returns: Buffer (PDF bytes)
```

**API Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="clawsec-report-{scanId}.pdf"

[PDF binary data]
```

**Performance**:
- **Generation Time**: 15-30s (first run), 5-15s (subsequent)
- **File Size**: 80-150 KB (standard 3-10 finding reports)
- **Memory**: ~400-500 MB peak (Puppeteer browser instance)

**Use Cases**:
- ✅ Professional audit documentation
- ✅ Client deliverables
- ✅ Compliance reporting
- ✅ Executive presentations
- ✅ Archival storage
- ✅ Email attachments

**Test Scenarios** (6 tests, all passing):
1. JSON report generation (prerequisite)
2. HTML template rendering
3. Full PDF pipeline (A4)
4. Letter-sized PDF generation
5. Large report stress test (10 findings)
6. Edge case - secure system (no findings)

**Known Limitations**:
- First run downloads Chromium (~170-300MB, one-time)
- Generation slower than JSON/Markdown (5-15s vs <1s)
- Higher memory usage (~400MB vs ~50MB)
- Railway deployment requires `--no-sandbox` flag (already configured)

**Validation Status**: ✅ Production-ready (tested 2026-02-07)

---

### 🟢 HTML Dashboard (Web View)
**Status**: Not Started (Low Priority)

**Concept**:
- Interactive web dashboard
- Real-time filtering by severity
- Click to expand findings
- Export buttons (PDF, JSON)

**Implementation Plan**:
1. Add HTML template with embedded CSS/JS
2. Serve via `/api/v1/report/:scan_id/html`
3. Use Chart.js for risk visualization
4. Add print stylesheet for browser-based PDF

**Time Estimate**: 4 hours

---

## Implementation Priority

For hackathon MVP:
1. ✅ **Markdown** - Done (primary format)
2. 🟡 **JSON** - High priority (2 hours)
3. 🔴 **PDF** - Medium priority (3 hours with Puppeteer)
4. ⏸️ **HTML Dashboard** - Low priority (post-hackathon)

**Recommendation**: Ship Markdown + JSON for hackathon, add PDF in v1.1.

---

## OWASP LLM Top 10 & GDPR Compliance

### What is OWASP LLM Top 10?

**OWASP LLM Top 10** is a security standard published by the Open Worldwide Application Security Project (OWASP) specifically for Large Language Model applications. It identifies the 10 most critical vulnerabilities in LLM systems:

1. **LLM01: Prompt Injection** - Manipulating LLM via crafted inputs
2. **LLM02: Insecure Output Handling** - Improper validation of LLM outputs
3. **LLM03: Training Data Poisoning** - Compromised training data
4. **LLM04: Model Denial of Service** - Resource exhaustion attacks
5. **LLM05: Supply Chain Vulnerabilities** - Compromised components/data
6. **LLM06: Sensitive Information Disclosure** - Leaking private data
7. **LLM07: Insecure Plugin Design** - Unsafe tool/function calling
8. **LLM08: Excessive Agency** - Over-permissioned LLM actions
9. **LLM09: Overreliance** - Blindly trusting LLM outputs
10. **LLM10: Model Theft** - Unauthorized model extraction

**Reference**: https://owasp.org/www-project-top-10-for-large-language-model-applications/

### What is GDPR Compliance?

**GDPR (General Data Protection Regulation)** is the EU's comprehensive data privacy law that governs how personal data is collected, stored, and processed.

**Key Requirements**:
- **Consent** - Explicit permission for data processing
- **Right to Access** - Users can request their data
- **Right to Erasure** - "Right to be forgotten"
- **Data Minimization** - Collect only necessary data
- **Purpose Limitation** - Use data only for stated purposes
- **Security** - Protect data from breaches
- **Breach Notification** - Report breaches within 72 hours

**Reference**: https://gdpr.eu/

### How ClawSec Addresses These

#### OWASP LLM Top 10 Coverage

**LLM01 - Prompt Injection**:
- ClawSec scans for prompt injection patterns in OpenClaw configs
- Uses Prompt Guard threat catalog (349+ patterns)
- Detects instruction override, role manipulation, jailbreak attempts

**LLM06 - Sensitive Information Disclosure**:
- Detects exposed API keys, tokens, credentials in configs
- Identifies unencrypted session storage
- Checks for secrets in environment variables

**LLM07 - Insecure Plugin Design**:
- Audits tool permission policies (exec, browser, file access)
- Flags unrestricted command execution
- Validates skill security configurations

**LLM08 - Excessive Agency**:
- Reviews cron job permissions
- Checks node pairing risks
- Identifies over-permissioned channels

#### GDPR Compliance Considerations

**Data Minimization**:
- ClawSec only collects sanitized configuration metadata
- No personal data, conversation history, or user content sent to server
- Privacy-first architecture (client-side filtering)

**Security**:
- Detects unencrypted session storage (GDPR Article 32)
- Checks for secure channel configurations
- Identifies potential data breach risks

**Transparency**:
- Users review what data is sent before transmission
- Clear reporting of security findings
- Actionable remediation steps

### Where This Appears in ClawSec

1. **README.md** - Listed as compliance features
2. **Threat Database** - OWASP patterns in Prompt Guard catalog
3. **Report Template** - Compliance checklist (planned)
4. **Client Sanitization** - GDPR-aware data filtering

### Recommendation for Stan

Add these to ClawSec roadmap:
- [ ] Create OWASP LLM Top 10 checklist in reports
- [ ] Add GDPR compliance section to reports
- [ ] Document which standards each threat ID maps to
- [ ] Create compliance dashboard (post-hackathon)

---

## Example Report Output

See `examples/sample-report.md` for full example output.

---

**Questions or improvements?** Open an issue: https://github.com/ClawSecAI/ClawSec-skill/issues
