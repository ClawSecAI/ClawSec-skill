# ClawSec Risk Score Calculation

**Version**: 1.0.0  
**Last Updated**: 2026-02-06

## Overview

ClawSec uses a sophisticated risk scoring algorithm that normalizes all security findings to a **0-100 scale** with clear, actionable thresholds. This document explains the methodology, thresholds, and calculation logic.

---

## Score Scale (0-100)

**Aligned with CVSS v3.x/v4.0 Standards** (NIST/NVD)

| Score Range | Risk Level | Description | Action Required | CVSS Equivalent |
|-------------|-----------|-------------|-----------------|-----------------|
| **90-100** | 🔴 CRITICAL | Severe security issues requiring immediate action | Fix within 24 hours | 9.0-10.0 |
| **70-89** | 🟠 HIGH | Significant vulnerabilities needing urgent remediation | Fix within 1 week | 7.0-8.9 |
| **40-69** | 🟡 MEDIUM | Moderate security concerns that should be addressed | Fix within 1 month | 4.0-6.9 |
| **1-39** | 🟢 LOW | Minor issues with minimal risk | Monitor and plan fix | 0.1-3.9 |
| **0** | ✅ SECURE | No security issues detected | Maintain current posture | 0.0 |

**Standards Alignment:**
- **CVSS v3.x/v4.0:** Common Vulnerability Scoring System (industry standard)
- **NIST/NVD:** National Vulnerability Database thresholds
- **Used by:** Qualys, Tenable, Rapid7, Snyk, GitHub Security, AWS Inspector

---

## Calculation Algorithm

### 1. Base Score Calculation

Each finding contributes to the base score based on its severity:

```javascript
SEVERITY_WEIGHTS = {
  CRITICAL: 25,  // Each critical finding adds 25 points
  HIGH: 15,      // Each high finding adds 15 points
  MEDIUM: 8,     // Each medium finding adds 8 points
  LOW: 3         // Each low finding adds 3 points
}
```

**Example**:
- 1 CRITICAL + 2 HIGH + 1 MEDIUM = 25 + 15 + 15 + 8 = **63 points** (HIGH risk)

### 2. Diminishing Returns

To prevent score inflation from many low-severity findings, each subsequent finding within the same severity level contributes **85%** of the previous one:

```
Finding 1: 100% weight
Finding 2: 85% weight
Finding 3: 72.25% weight
Finding 4: 61.4% weight
...
```

**Why?** 10 low-severity findings shouldn't score higher than 1 critical finding.

### 3. Context Multipliers

The score is adjusted based on the nature and context of findings:

| Context Factor | Multiplier | Description |
|---------------|-----------|-------------|
| **Credential Exposure** | 1.5x | Hardcoded API keys, tokens, passwords |
| **Public Exposure** | 1.4x | Services bound to 0.0.0.0 or public IPs |
| **Weak Configuration** | 1.2x | Default passwords, weak tokens |
| **High Likelihood** | 1.3x | >50% of findings have HIGH exploit likelihood |
| **Medium Likelihood** | 1.0x | Default (no adjustment) |
| **Low Likelihood** | 0.7x | Findings are difficult to exploit |

**Example**:
```
Base Score: 40
+ Credential Exposure (1.5x) = 60
+ Public Exposure (1.4x) = 84
Final Score: 84 (CRITICAL)
```

### 4. Scan Type Weights

Different scan types may have different risk profiles:

| Scan Type | Multiplier | Use Case |
|-----------|-----------|----------|
| **Config Audit** | 1.0x | Default scan (OpenClaw config) |
| **Vulnerability Scan** | 1.2x | CVE and exploit detection |
| **Credential Scan** | 1.5x | Secret leak detection (highest priority) |
| **Compliance Check** | 0.9x | Informational/policy checks |
| **Permission Audit** | 1.1x | Access control review |

### 5. Final Score Calculation

```javascript
finalScore = Math.min(100, Math.round(
  baseScore * contextMultiplier * scanTypeMultiplier * diminishingReturns
));
```

---

## Confidence Levels

Each score includes a confidence rating based on the quality of evidence:

| Confidence | Criteria |
|-----------|----------|
| **HIGH** | >70% of findings have evidence and high-confidence patterns |
| **MEDIUM** | 40-70% of findings have evidence |
| **LOW** | <40% of findings have evidence |

---

## Examples

### Example 1: Insecure OpenClaw Config

**Findings**:
- 1 CRITICAL: Weak gateway token (T001)
- 1 HIGH: Public gateway exposure (T002)
- 1 HIGH: Exposed API keys (T005)

**Calculation**:
```
Base Score: 25 (CRITICAL) + 15 (HIGH) + 12.75 (HIGH with diminishing) = 52.75
Context Multipliers:
  - Credential Exposure (T005): 1.5x
  - Public Exposure (T002): 1.4x
  - Weak Configuration (T001): 1.2x
Adjusted Score: 52.75 × 1.5 × 1.4 × 1.2 = 133 (capped at 100)
Final Score: 100 (CRITICAL)
```

### Example 2: Moderate Security Posture

**Findings**:
- 2 MEDIUM: Unencrypted sessions, no rate limiting
- 1 LOW: Default port usage

**Calculation**:
```
Base Score: 8 (MEDIUM) + 6.8 (MEDIUM with diminishing) + 3 (LOW) = 17.8
No context multipliers applied
Final Score: 18 (LOW)
```

### Example 3: Well-Secured System

**Findings**:
- 1 LOW: Using default port (informational)

**Calculation**:
```
Base Score: 3
Final Score: 3 (LOW)
```

### Example 4: Many Low Findings

**Findings**:
- 20 LOW severity findings

**Calculation**:
```
Base Score (with diminishing returns):
  Finding 1: 3
  Finding 2: 2.55
  Finding 3: 2.17
  ...
  Finding 20: ~0.5
Total: ~35

Diminishing Returns Factor (15+ findings): 0.95^12 = 0.54
Adjusted Score: 35 × 0.54 = 19
Final Score: 19 (LOW)
```

---

## Score Breakdown in Reports

Every ClawSec report includes a detailed score breakdown:

```markdown
### Risk Score Analysis

- **Final Score**: 84/100
- **Base Score**: 60
- **Context Multiplier**: 2.1x
- **Risk Level**: CRITICAL
- **Confidence**: HIGH

**Risk Factors Applied**:
- Credential Exposure (1.5x): Hardcoded credentials significantly increase risk
- Public Exposure (1.4x): Services exposed to internet increase attack surface
```

---

## API Response Format

```json
{
  "scan_id": "clawsec-1234567890-abc123",
  "timestamp": "2026-02-06T21:00:00Z",
  "risk_level": "CRITICAL",
  "risk_score": 84,
  "score_confidence": "high",
  "findings_count": 5,
  "report": "# OpenClaw Security Audit Report...",
  "findings": [...]
}
```

---

## Design Principles

### 1. **Transparency**
Every score includes a full breakdown showing how it was calculated.

### 2. **Consistency**
Same findings always produce the same score (reproducible).

### 3. **Context-Aware**
Scores reflect real-world risk, not just finding counts.

### 4. **Actionable Thresholds**
Clear boundaries between risk levels guide response priorities.

### 5. **Non-Linear Scaling**
Diminishing returns prevent score inflation from minor issues.

---

## Threshold Rationale

### Why 90+ is CRITICAL (CVSS v3.x/v4.0: 9.0-10.0)
- **Industry Standard:** Aligned with NIST, NVD, and all major security vendors
- Requires immediate action (within 24 hours)
- Reserved for truly severe vulnerabilities with high impact and exploitability
- System is at critical risk of compromise
- Examples: Exposed credentials, RCE vulnerabilities, complete system compromise

### Why 70-89 is HIGH (CVSS v3.x/v4.0: 7.0-8.9)
- **Industry Standard:** Used by Qualys, Tenable, Rapid7, GitHub Security
- Urgent remediation needed (within 1 week)
- Significant vulnerabilities with probable exploitation
- Attack surface is exposed with high likelihood of breach
- Examples: SQL injection, authentication bypass, sensitive data exposure

### Why 40-69 is MEDIUM (CVSS v3.x/v4.0: 4.0-6.9)
- **Industry Standard:** Common threshold for moderate risks
- Should be addressed soon (within 1 month)
- Moderate risk with possible exploitation under certain conditions
- Defense-in-depth improvements needed
- Examples: Weak configurations, missing security headers, outdated dependencies

### Why 1-39 is LOW (CVSS v3.x/v4.0: 0.1-3.9)
- **Industry Standard:** Informational or minimal risk
- Minimal risk (monitor and plan)
- Minor configuration improvements or informational findings
- Low likelihood of exploitation or minimal impact
- Examples: Default ports, verbose error messages, missing best practices

### Why 0 is SECURE
- No security issues detected
- Configuration follows best practices
- Maintain current security posture

---

## Integration with LLM Analysis

The score calculation works alongside LLM-generated analysis:

1. **Pattern-based detection** identifies issues (T001-T015)
2. **Score calculator** quantifies overall risk (0-100)
3. **LLM analysis** provides context and prioritization
4. **Report generator** combines all data into actionable report

---

## Testing

Comprehensive test suite covers:
- ✅ Edge cases (no findings, all critical, mixed severity)
- ✅ Score normalization (0-100 range)
- ✅ Context multipliers (credentials, public exposure, etc.)
- ✅ Diminishing returns (prevents inflation)
- ✅ Multiple scan types (config, vulnerability, compliance)
- ✅ Confidence calculation
- ✅ Realistic scenarios

**Run tests**:
```bash
./run-score-tests.sh
```

---

## Future Enhancements

1. **Machine learning** - Learn from historical scan data to improve weighting
2. **Custom thresholds** - Allow users to configure risk level boundaries
3. **Trend analysis** - Track score changes over time
4. **Comparative scoring** - Benchmark against similar organizations
5. **Industry-specific weights** - Adjust scoring for healthcare, finance, etc.

---

## References

- **OWASP Risk Rating Methodology**: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
- **CVSS Base Score**: https://www.first.org/cvss/specification-document
- **NIST SP 800-30**: Guide for Conducting Risk Assessments

---

**Questions?** Open an issue at https://github.com/ClawSecAI/ClawSec-skill
