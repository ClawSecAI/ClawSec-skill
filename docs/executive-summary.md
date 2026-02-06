# Executive Summary Generation

**Module:** `server/lib/executive-summary.js`  
**Version:** 1.0.0  
**Author:** Ubik (@ClawSecAI)  
**Created:** 2026-02-06

## Overview

The Executive Summary Generator transforms detailed technical security findings into concise, business-friendly summaries suitable for executive audiences. It addresses a critical gap in security reporting: making technical risks understandable and actionable for non-technical decision makers.

## Purpose

Security teams need to communicate risks to executives who:
- Don't understand technical jargon
- Need quick insights (3-5 minutes max)
- Want to know business impact, not technical details
- Need clear action items and timeframes

This module bridges that gap by:
1. Translating technical threats into business language
2. Highlighting business impact over technical details
3. Providing clear, actionable recommendations
4. Limiting output to 3-5 digestible bullet points

## Key Features

### 1. Business-Friendly Language

**Technical → Business Translation:**

| Technical Term | Business Translation |
|----------------|---------------------|
| Weak Gateway Token | Weak system access password |
| Exposed Secrets in Configuration | Credentials stored insecurely |
| Public Gateway Exposure | System exposed to internet |
| Unrestricted Tool Execution | Uncontrolled system commands |
| Unencrypted Session Storage | Unprotected conversation history |

### 2. Business Impact Mapping

Each threat is mapped to:
- **Impact**: What the vulnerability means in business terms
- **Consequence**: What could happen if exploited
- **Priority**: When it needs to be fixed

Example:
```javascript
{
  impact: 'login credentials and API keys exposed',
  consequence: 'unauthorized cloud spending or data access',
  priority: 'immediate'
}
```

### 3. Risk Level Communication

**Technical Risk Levels → Business Language:**

| Technical | Business Label | Description | Timeframe |
|-----------|---------------|-------------|-----------|
| CRITICAL | Critical Business Risk | requires immediate action to prevent security incident | within 24 hours |
| HIGH | Significant Risk | should be addressed urgently to protect operations | within 1 week |
| MEDIUM | Moderate Risk | should be planned for remediation soon | within 1 month |
| LOW | Minor Risk | can be addressed during regular maintenance | within 3 months |
| SECURE | Secure | no significant risks detected | no action required |

### 4. Structured Output

Every executive summary includes:
1. **Summary Statement**: One-sentence overview with risk level and score
2. **Key Points**: 3-5 bullet points with findings and impacts
3. **Recommendations**: Clear action items with timeframes

## API Reference

### `generateExecutiveSummary(findings, scoreResult, options)`

Generate executive summary from security findings.

**Parameters:**
- `findings` (Array): Array of security finding objects
- `scoreResult` (Object): Risk score calculation result
- `options` (Object): Generation options
  - `maxBullets` (number): Maximum bullet points (default: 5)
  - `includeRecommendations` (boolean): Include action items (default: true)
  - `focusOnCritical` (boolean): Prioritize critical/high issues (default: true)

**Returns:**
```javascript
{
  summary: "Security review identified...",
  bullets: [
    "🚨 **Finding** - Impact and consequence",
    "🎯 **Recommended Action**: ..."
  ],
  risk_level: "CRITICAL",
  confidence: "high",
  total_issues: 5,
  critical_issues: 2,
  high_issues: 3
}
```

**Example:**
```javascript
const { generateExecutiveSummary } = require('./lib/executive-summary');

const findings = [
  {
    threat_id: 'T005',
    severity: 'CRITICAL',
    title: 'Exposed Secrets in Configuration',
    impact: 'Credential leakage',
    likelihood: 'HIGH'
  }
];

const scoreResult = {
  score: 95,
  level: 'CRITICAL',
  confidence: 'high'
};

const summary = generateExecutiveSummary(findings, scoreResult);
console.log(summary.summary);
// "Security review identified 1 area requiring attention, including 1 issue requiring immediate action..."
```

### `formatExecutiveSummaryMarkdown(executiveSummary)`

Format executive summary as Markdown for reports.

**Parameters:**
- `executiveSummary` (Object): Executive summary object from `generateExecutiveSummary()`

**Returns:** String (Markdown formatted)

**Example:**
```javascript
const markdown = formatExecutiveSummaryMarkdown(summary);
console.log(markdown);
// ## Executive Summary
//
// Security review identified...
//
// ### Key Points
//
// 🚨 **Finding** - Impact...
```

### `formatExecutiveSummaryPlainText(executiveSummary)`

Format executive summary as plain text for email.

**Parameters:**
- `executiveSummary` (Object): Executive summary object

**Returns:** String (Plain text, no markdown/emoji)

**Example:**
```javascript
const plainText = formatExecutiveSummaryPlainText(summary);
// EXECUTIVE SUMMARY
// ==================================================
//
// Security review identified...
//
// KEY POINTS:
// 1. Finding - Impact...
```

### `generateExecutiveSummaryBrief(findings, scoreResult)`

Generate ultra-concise summary for notifications (email/Slack).

**Parameters:**
- `findings` (Array): Security findings
- `scoreResult` (Object): Risk score result

**Returns:** String (50-200 characters)

**Example:**
```javascript
const brief = generateExecutiveSummaryBrief(findings, scoreResult);
console.log(brief);
// "Security Scan: 2 issues found (Risk: CRITICAL).
//  ⚠️ 2 critical - immediate action required."
```

## Integration

### In Report Generation

The executive summary is automatically integrated into the report generation pipeline:

```javascript
const { generateExecutiveSummary, formatExecutiveSummaryMarkdown } = require('./lib/executive-summary');

function generateReport(scanId, config, findings, threatsIndex, scoreResult) {
  // ... header ...
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(findings, scoreResult, {
    maxBullets: 5,
    includeRecommendations: true,
    focusOnCritical: true
  });
  
  // Add to report
  report += formatExecutiveSummaryMarkdown(executiveSummary);
  
  // ... detailed findings ...
}
```

### Output Example

```markdown
## Executive Summary

Security review identified 2 areas requiring attention, including 2 issues requiring immediate action. Overall risk level: **Critical Business Risk** (95/100) - requires immediate action to prevent security incident.

### Key Points

🚨 **Weak system access password** - Weak system access password, which could lead to unauthorized access to company systems.

🚨 **Credentials stored insecurely** - Login credentials and API keys exposed, which could lead to unauthorized cloud spending or data access.

🎯 **Recommended Action**: Address 2 critical issues within 24 hours to prevent potential security incidents.

**Risk Score**: **95/100** | **Overall Risk**: 🔴 **CRITICAL** (high confidence)
```

## Design Principles

### 1. Executive Audience First

- **No technical jargon** - Use business language ("password" not "token")
- **No threat IDs** - Executives don't care about "T005"
- **No technical evidence** - Skip "bind_address: 0.0.0.0"

### 2. Business Impact Focus

Every finding must answer:
- **What could happen?** (business consequence)
- **How bad?** (severity in business terms)
- **When to fix?** (timeframe for action)

### 3. Conciseness

- **3-5 bullets maximum** - Executives have limited time
- **One-sentence explanations** - Get to the point
- **Clear recommendations** - Tell them what to do

### 4. Actionability

Every summary must:
- Identify **specific actions** to take
- Provide **clear timeframes** (24 hours, 1 week, etc.)
- Explain **business justification** (prevent incidents, protect operations)

## Testing

### Test Suite

Run comprehensive tests:
```bash
cd /root/.openclaw/workspace/clawsec
./run-executive-summary-tests.sh
```

### Test Coverage

The test suite includes **40+ tests** across 8 categories:

1. **Basic Generation** (3 tests)
   - Secure configuration
   - Critical findings
   - Mixed severity

2. **Business Language** (4 tests)
   - No technical jargon
   - Translation accuracy
   - Business impact phrases

3. **Bullet Point Structure** (5 tests)
   - 3-5 bullets requirement
   - Emoji indicators
   - Recommendations
   - Grouping similar findings

4. **Risk Level Handling** (4 tests)
   - Critical → immediate action
   - High → urgent
   - Medium → soon
   - Low → maintenance

5. **Formatting Options** (3 tests)
   - Markdown format
   - Plain text format
   - Brief notifications

6. **Edge Cases** (6 tests)
   - Empty findings
   - Undefined score
   - Single finding
   - Many findings (>10)
   - Missing threat_id

7. **Real-World Scenarios** (3 tests)
   - Startup with exposed credentials
   - Enterprise weak configuration
   - Well-secured system

8. **Output Quality** (3 tests)
   - Conciseness (< 500 chars)
   - Actionability
   - No duplication

### Sample Test

```javascript
test('Summary uses business language (no technical jargon)', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertBusinessLanguage(fullText); // Fails if technical terms found
});
```

## Business Impact Map

Complete mapping of technical threats to business consequences:

```javascript
const BUSINESS_IMPACT_MAP = {
  'T001': { // Weak Gateway Token
    impact: 'unauthorized access to company systems',
    consequence: 'data breach or operational disruption',
    priority: 'immediate'
  },
  'T002': { // Public Gateway Exposure
    impact: 'system accessible from the internet',
    consequence: 'potential ransomware or data theft',
    priority: 'urgent'
  },
  'T005': { // Exposed Secrets
    impact: 'login credentials and API keys exposed',
    consequence: 'unauthorized cloud spending or data access',
    priority: 'immediate'
  },
  // ... etc
};
```

## Use Cases

### 1. Board Presentations

Generate executive summary for quarterly board meetings:
```javascript
const summary = generateExecutiveSummary(findings, scoreResult);
const slides = formatForPresentation(summary); // Custom formatter
```

### 2. Email Notifications

Send brief security alerts to executives:
```javascript
const brief = generateExecutiveSummaryBrief(findings, scoreResult);
sendEmail(exec_team, 'Security Alert', brief);
```

### 3. Dashboard Displays

Show high-level risk on security dashboard:
```javascript
const summary = generateExecutiveSummary(findings, scoreResult);
dashboard.updateRiskLevel(summary.risk_level);
dashboard.updateKeyPoints(summary.bullets);
```

### 4. Compliance Reports

Include in GDPR/SOC2 reports for auditors:
```javascript
const markdown = formatExecutiveSummaryMarkdown(summary);
complianceReport.addSection('Security Posture', markdown);
```

## Best Practices

### For Security Teams

1. **Use in all executive communications** - Board meetings, quarterly reviews, incidents
2. **Pair with detailed technical reports** - Summary for execs, details for team
3. **Update business impact map** - Add new threats as they emerge
4. **Test translations** - Ensure business language makes sense

### For Developers

1. **Keep business impact map updated** - New threats need business translations
2. **Test with real findings** - Ensure summaries make sense in context
3. **Validate bullet count** - Always 3-5, never more
4. **Check for jargon** - Run through business language validator

### For Executives

1. **Read summary first** - Get high-level view before details
2. **Use for prioritization** - Allocate resources based on timeframes
3. **Communicate risk clearly** - Share with board/stakeholders
4. **Request clarification** - If anything is unclear, ask security team

## Future Enhancements

### Planned Features

1. **Multi-language support** - Generate summaries in different languages
2. **Industry-specific translations** - Healthcare, finance, retail, etc.
3. **Trend analysis** - Compare current summary to historical data
4. **Risk appetite customization** - Adjust recommendations based on company risk tolerance
5. **Integration with ticketing** - Auto-create Jira/ServiceNow tickets from recommendations

### Experimental Features

1. **AI-generated summaries** - Use LLM to generate custom executive language
2. **Voice summaries** - Text-to-speech for executive briefings
3. **Interactive dashboards** - Drill down from summary to details
4. **Automated email delivery** - Schedule weekly executive reports

## Troubleshooting

### Issue: Summaries too technical

**Solution:** Update `BUSINESS_IMPACT_MAP` with better translations
```javascript
// Bad
impact: 'weak token detected'

// Good
impact: 'weak system access password'
```

### Issue: Too many bullet points

**Solution:** Adjust `maxBullets` parameter
```javascript
generateExecutiveSummary(findings, scoreResult, { maxBullets: 3 });
```

### Issue: Missing recommendations

**Solution:** Enable recommendations in options
```javascript
generateExecutiveSummary(findings, scoreResult, { includeRecommendations: true });
```

### Issue: No business impact shown

**Solution:** Add threat_id to `BUSINESS_IMPACT_MAP`
```javascript
'T999': {
  impact: 'business-friendly description',
  consequence: 'what could happen',
  priority: 'immediate|urgent|high|medium|low'
}
```

## Contributing

When adding new threat types:

1. **Add business impact mapping** in `BUSINESS_IMPACT_MAP`
2. **Add translation** in `translateToBusinessLanguage()`
3. **Write test case** in `test-executive-summary.js`
4. **Update documentation** (this file)
5. **Test with real findings** before deploying

## References

- PROJECT.md Section 3.3 Output Processing
- `server/lib/executive-summary.js` - Main implementation
- `server/lib/test-executive-summary.js` - Test suite
- `server/lib/sample-executive-summaries.md` - Example outputs
- `server/index.js` - Integration point

## License

Part of ClawSec - AI-powered security audits for OpenClaw  
USDC Hackathon Submission  
Built by Ubik (@ClawSecAI)
