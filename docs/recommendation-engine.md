# ClawSec Recommendation Engine

**Version**: 1.0.0  
**Created**: 2026-02-06  
**Author**: Ubik (@ClawSecAI)

## Overview

The ClawSec Recommendation Engine is a sophisticated prioritization system that ranks security findings based on three key dimensions:

1. **Severity**: Base risk level (CRITICAL/HIGH/MEDIUM/LOW)
2. **Exploitability**: How easy the vulnerability is to exploit
3. **Impact**: Business and operational consequences

By combining these factors, the engine provides actionable, prioritized recommendations that help teams focus on the most critical security issues first.

## Architecture

### Priority Calculation Algorithm

```
Priority Score = Severity + Exploitability + Impact + Boosters
                 (0-100 normalized scale)

Priority Level:
- P0 (90-100): Fix immediately (within hours)
- P1 (70-89): Fix urgently (within 1-3 days)
- P2 (40-69): Fix soon (within 1-2 weeks)
- P3 (1-39): Fix eventually (backlog)
```

### Scoring Components

#### 1. Severity Weights (Base Score)
- **CRITICAL**: 40 points
- **HIGH**: 30 points
- **MEDIUM**: 20 points
- **LOW**: 10 points

#### 2. Exploitability Factors (0-55 points)

**Likelihood** (0-30 points):
- HIGH: 30 points (very likely to be exploited)
- MEDIUM: 20 points (moderate likelihood)
- LOW: 10 points (lower likelihood)

**Attack Complexity** (0-15 points):
- LOW: 15 points (easy to exploit, no auth required)
- MEDIUM: 10 points (moderate effort)
- HIGH: 5 points (difficult to exploit)

**Prerequisites** (0-10 points):
- NONE: 10 points (publicly accessible)
- LOCAL: 5 points (requires local access)
- AUTH: 3 points (requires authentication)
- ADMIN: 1 point (requires admin privileges)

#### 3. Impact Factors (0-30 points)

Based on CIA Triad:

**Confidentiality Impact** (0-10 points):
- CRITICAL: 10 points (credentials, API keys, private data)
- HIGH: 7 points (sensitive configuration)
- MEDIUM: 4 points (internal information)
- LOW: 2 points (public information)

**Integrity Impact** (0-10 points):
- CRITICAL: 10 points (system compromise, code execution)
- HIGH: 7 points (configuration tampering)
- MEDIUM: 4 points (limited modification)
- LOW: 2 points (minimal impact)

**Availability Impact** (0-10 points):
- CRITICAL: 10 points (complete service disruption)
- HIGH: 7 points (significant degradation)
- MEDIUM: 4 points (minor disruption)
- LOW: 2 points (negligible impact)

#### 4. Priority Boosters (Special Cases)

- **Credential Exposure**: +20 points
- **Public Exposure**: +15 points
- **Weak Credentials**: +15 points
- **Active CVE**: +25 points
- **Enables Attack Chaining**: +10 points
- **Compliance Violation**: +10 points
- **No Quick Fix**: -5 points

## Usage

### Basic Priority Calculation

```javascript
const { calculatePriority } = require('./lib/recommendation-engine');

const finding = {
  threat_id: 'T005',
  severity: 'CRITICAL',
  title: 'Exposed AWS Credentials',
  likelihood: 'HIGH',
  impact: 'Complete AWS account compromise',
  // ...
};

const priority = calculatePriority(finding);

console.log(priority);
// {
//   score: 95,
//   level: 'P0',
//   timeToFix: {
//     deadline: 'Fix immediately',
//     duration: 'Within hours',
//     urgency: 'CRITICAL'
//   },
//   breakdown: {
//     severity: 40,
//     exploitability: 45,
//     impact: 30,
//     boosters: 20,
//     total: 135,
//     normalized: 95
//   },
//   reasoning: 'CRITICAL severity baseline (+40 points); High exploitability: HIGH likelihood (+45 points); ...'
// }
```

### Prioritizing Multiple Findings

```javascript
const { prioritizeFindings } = require('./lib/recommendation-engine');

const findings = [
  { /* finding 1 */ },
  { /* finding 2 */ },
  { /* finding 3 */ }
];

const prioritized = prioritizeFindings(findings);

console.log(prioritized);
// {
//   rankings: [
//     { ...finding, priority: { score: 95, level: 'P0', ... } },
//     { ...finding, priority: { score: 78, level: 'P1', ... } },
//     // ... sorted by priority score (highest first)
//   ],
//   summary: {
//     total: 3,
//     byPriority: { P0: 1, P1: 1, P2: 0, P3: 1 },
//     recommendations: [
//       {
//         priority: 'P0',
//         action: 'IMMEDIATE ACTION REQUIRED',
//         tasks: [
//           {
//             order: 1,
//             title: 'Exposed AWS Credentials',
//             deadline: 'Within hours',
//             steps: ['Move to .env', 'Rotate credentials', ...],
//             reasoning: '...'
//           }
//         ]
//       },
//       // ... more recommendation groups
//     ]
//   },
//   grouped: {
//     P0: [...],
//     P1: [...],
//     P2: [...],
//     P3: [...]
//   }
// }
```

### Generating Priority Report

```javascript
const { generatePriorityReport } = require('./lib/recommendation-engine');

const report = generatePriorityReport(prioritized);

// Returns markdown report with:
// - Priority distribution table
// - P0 items with immediate actions
// - P1 items with urgent tasks
// - P2/P3 summaries
```

## Integration with ClawSec Server

The recommendation engine is integrated into the main scan endpoint:

```javascript
// server/index.js

// Prioritize findings
const prioritized = prioritizeFindings(findings, {
  scanType: 'config'
});

// Generate report with prioritized recommendations
const report = generateReport(scanId, scanInput, findings, threatsIndex, scoreResult, prioritized);

// Include in API response
const response = {
  // ... other fields
  prioritized_recommendations: {
    summary: prioritized.summary,
    rankings: prioritized.rankings.map(f => ({
      threat_id: f.threat_id,
      title: f.title,
      severity: f.severity,
      priority_level: f.priority.level,
      priority_score: f.priority.score,
      time_to_fix: f.priority.timeToFix.duration,
      reasoning: f.priority.reasoning
    }))
  }
};
```

## API Response Format

The `/api/v1/scan` endpoint now includes prioritized recommendations:

```json
{
  "scan_id": "clawsec-1234567890-abc123",
  "timestamp": "2026-02-06T21:00:00.000Z",
  "findings_count": 5,
  "risk_level": "CRITICAL",
  "risk_score": 87,
  "score_confidence": "high",
  "findings": [...],
  "prioritized_recommendations": {
    "summary": {
      "total": 5,
      "byPriority": {
        "P0": 2,
        "P1": 1,
        "P2": 1,
        "P3": 1
      },
      "recommendations": [
        {
          "priority": "P0",
          "action": "IMMEDIATE ACTION REQUIRED",
          "tasks": [
            {
              "order": 1,
              "title": "Exposed AWS Credentials",
              "deadline": "Within hours",
              "steps": ["Move to .env", "Rotate credentials"],
              "reasoning": "CRITICAL severity baseline (+40 points); High exploitability: HIGH likelihood (+45 points); Priority boosters: credential exposure (+20 points)"
            }
          ]
        }
      ]
    },
    "rankings": [
      {
        "threat_id": "T005",
        "title": "Exposed AWS Credentials",
        "severity": "CRITICAL",
        "priority_level": "P0",
        "priority_score": 95,
        "time_to_fix": "Within hours",
        "reasoning": "..."
      },
      // ... more findings sorted by priority
    ]
  },
  "report": "# OpenClaw Security Audit Report\n\n..."
}
```

## Report Output Example

```markdown
## 🎯 Prioritized Recommendations

Based on severity, exploitability, and business impact, here are your prioritized action items:

### Priority Distribution

| Priority | Count | Timeline | Action Required |
|----------|-------|----------|-----------------|
| 🔴 P0 (Critical) | 2 | Hours | Fix immediately |
| 🟠 P1 (High) | 1 | 1-3 Days | Fix urgently |
| 🟡 P2 (Medium) | 1 | 1-2 Weeks | Schedule fix |
| 🟢 P3 (Low) | 1 | 1 Month | Backlog |
| **Total** | **5** | - | - |

### 🚨 P0 - IMMEDIATE ACTION REQUIRED

**Timeline**: Fix within hours  
**Impact**: Critical risk to system security

#### 1. Exposed AWS Credentials

**Priority Score**: 95/100  
**Severity**: CRITICAL | **Exploitability**: HIGH  
**Why this is P0**: CRITICAL severity baseline (+40 points); High exploitability: HIGH likelihood (+45 points); High business impact: affects confidentiality/integrity/availability (+30 points); Priority boosters: credential exposure (+20 points)

**Fix now**:
- [ ] Move credentials to .env file immediately
- [ ] Add .env to .gitignore
- [ ] Rotate all exposed credentials

---

### 🟠 P1 - URGENT REMEDIATION

...
```

## Testing

Comprehensive test suite available:

```bash
# Run recommendation engine tests
./run-recommendation-tests.sh

# Or directly with node
node server/tests/recommendation-engine.test.js
```

Test coverage includes:
- ✅ Priority calculation for all severity levels
- ✅ Exploitability assessment
- ✅ Impact analysis (CIA triad)
- ✅ Priority boosters
- ✅ Multiple findings ranking
- ✅ Recommendations generation
- ✅ Report generation
- ✅ Edge cases (empty findings, score normalization)
- ✅ Time-to-fix recommendations
- ✅ Realistic mixed severity scenarios

## Design Principles

1. **Actionable**: Every priority includes specific deadlines and action steps
2. **Transparent**: Detailed reasoning explains why each finding received its priority
3. **Balanced**: Considers multiple dimensions (severity, exploitability, impact)
4. **Realistic**: Time-to-fix recommendations are practical and achievable
5. **Flexible**: Can be customized with different weights and boosters

## Future Enhancements

- **Risk Acceptance Tracking**: Track which findings were accepted vs. remediated
- **Historical Analysis**: Learn from past findings to improve prioritization
- **Custom Weights**: Allow users to adjust weights based on their risk appetite
- **Attack Path Analysis**: Identify findings that enable attack chains
- **Compliance Mapping**: Map findings to specific compliance requirements (PCI-DSS, GDPR, etc.)
- **CVSS Integration**: Incorporate CVSS scores for vulnerability-based findings
- **ML-Based Prioritization**: Use machine learning to predict likelihood of exploitation

## References

- **OWASP Risk Rating Methodology**: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
- **CVSS v3.1 Specification**: https://www.first.org/cvss/v3.1/specification-document
- **NIST SP 800-30**: Guide for Conducting Risk Assessments

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-02-06  
**Maintainer**: Ubik (@ClawSecAI)
