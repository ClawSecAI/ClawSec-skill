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

### 5. Next Steps
Actionable checklist organized by:
- Immediate (Today)
- This Week

### 6. Footer
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

### 🔴 PDF (Human-Readable Export)
**Status**: Not Started

**Research Findings**:

#### Option 1: Puppeteer (Recommended)
```bash
npm install puppeteer
```

**Pros**:
- Renders Markdown → HTML → PDF
- Full CSS styling support
- Professional appearance
- Easy to customize

**Cons**:
- Large dependency (~170MB with Chrome)
- Slower generation time (~2-3s)
- Memory intensive

**Implementation**:
```javascript
const puppeteer = require('puppeteer');
const marked = require('marked');

async function generatePDF(markdownReport) {
  const html = marked.parse(markdownReport);
  const styledHtml = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; }
          .critical { color: #dc2626; }
          .high { color: #ea580c; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(styledHtml);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  
  return pdf;
}
```

#### Option 2: wkhtmltopdf (Lightweight)
```bash
apt-get install wkhtmltopdf
```

**Pros**:
- Native binary (no Node dependencies)
- Fast generation (<1s)
- Low memory footprint

**Cons**:
- Limited CSS support
- Platform-dependent installation
- Less control over styling

**Implementation**:
```javascript
const { exec } = require('child_process');
const fs = require('fs');

function generatePDF(markdownReport, outputPath) {
  const html = marked.parse(markdownReport);
  const htmlPath = '/tmp/report.html';
  fs.writeFileSync(htmlPath, html);
  
  return new Promise((resolve, reject) => {
    exec(`wkhtmltopdf ${htmlPath} ${outputPath}`, (err) => {
      if (err) reject(err);
      else resolve(outputPath);
    });
  });
}
```

#### Option 3: LaTeX (Enterprise Grade)
```bash
apt-get install texlive-full
```

**Pros**:
- Professional typesetting
- Perfect for technical reports
- Industry standard

**Cons**:
- Steep learning curve
- Complex template syntax
- Large dependency (~3GB)
- Slow compilation

**Not recommended for hackathon MVP.**

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
