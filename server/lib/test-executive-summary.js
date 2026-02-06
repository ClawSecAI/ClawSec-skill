#!/usr/bin/env node
/**
 * Test Suite for Executive Summary Generator (Technical Version)
 * 
 * Tests technical summary generation with precise threat details
 * 
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 * @revised 2026-02-06 (Technical version tests)
 */

const {
  generateExecutiveSummary,
  formatExecutiveSummaryMarkdown,
  formatExecutiveSummaryPlainText,
  generateExecutiveSummaryBrief
} = require('./executive-summary');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;

/**
 * Test helper
 */
function test(description, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${description}`);
    passCount++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${description}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Got: ${actual}`);
  }
}

function assertContains(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(`${message}\n  Text does not contain: "${substring}"`);
  }
}

function assertNotContains(text, substring, message) {
  if (text.includes(substring)) {
    throw new Error(`${message}\n  Text should not contain: "${substring}"`);
  }
}

function assertLength(array, min, max, message) {
  if (array.length < min || array.length > max) {
    throw new Error(`${message}\n  Expected length between ${min} and ${max}\n  Got: ${array.length}`);
  }
}

function assertTechnicalLanguage(text) {
  // Check for technical terminology that SHOULD appear
  const shouldContainAny = [
    'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', // Severity levels
    'vulnerability', 'exploit', 'attack', 'remediation', // Security terms
    'T0', 'CVS', 'SLA', // Technical identifiers
  ];
  
  const hasAny = shouldContainAny.some(term => text.includes(term));
  if (!hasAny) {
    throw new Error(`Technical summary missing expected terminology`);
  }
}

/**
 * Sample findings for testing
 */
const sampleFindings = {
  critical: [
    {
      threat_id: 'T001',
      severity: 'CRITICAL',
      title: 'Weak or Default Gateway Token',
      description: 'Gateway token is weak',
      impact: 'Complete system compromise possible',
      likelihood: 'HIGH',
      evidence: { token_length: 16, entropy_bits: 64 }
    },
    {
      threat_id: 'T005',
      severity: 'CRITICAL',
      title: 'Exposed Secrets in Configuration',
      description: 'Found hardcoded credentials',
      impact: 'Credential leakage',
      likelihood: 'HIGH',
      evidence: { exposed_secrets: 5, file: 'openclaw.json' }
    }
  ],
  high: [
    {
      threat_id: 'T002',
      severity: 'HIGH',
      title: 'Public Gateway Exposure',
      description: 'Gateway bound to public interface',
      impact: 'Remote exploitation possible',
      likelihood: 'MEDIUM',
      evidence: { bind_address: '0.0.0.0', port: 2024 }
    },
    {
      threat_id: 'T003',
      severity: 'HIGH',
      title: 'Unrestricted Tool Execution',
      description: 'Exec tool has no restrictions',
      impact: 'Arbitrary code execution',
      likelihood: 'HIGH',
      evidence: { exec_policy: 'allow-all' }
    }
  ],
  medium: [
    {
      threat_id: 'T004',
      severity: 'MEDIUM',
      title: 'Unencrypted Session Storage',
      description: 'Conversation history in plaintext',
      impact: 'Privacy breach',
      likelihood: 'MEDIUM',
      evidence: { encryption_enabled: false }
    },
    {
      threat_id: 'T006',
      severity: 'MEDIUM',
      title: 'No Rate Limiting',
      description: 'No rate limiting configured',
      impact: 'API abuse possible',
      likelihood: 'MEDIUM',
      evidence: { rate_limit_configured: false }
    }
  ],
  low: [
    {
      threat_id: 'T008',
      severity: 'LOW',
      title: 'Default Port Usage',
      description: 'Using default port',
      impact: 'Easier reconnaissance',
      likelihood: 'LOW',
      evidence: { port: 2024, is_default: true }
    }
  ]
};

const sampleScoreResults = {
  critical: { score: 95, level: 'CRITICAL', confidence: 'high' },
  high: { score: 75, level: 'HIGH', confidence: 'high' },
  medium: { score: 45, level: 'MEDIUM', confidence: 'medium' },
  low: { score: 15, level: 'LOW', confidence: 'low' },
  secure: { score: 0, level: 'SECURE', confidence: 'high' }
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  ClawSec Executive Summary (Technical) - Test Suite           ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// ============================================================================
// TEST CATEGORY 1: Basic Technical Generation
// ============================================================================

console.log(`${colors.blue}Testing: Basic Technical Generation${colors.reset}\n`);

test('Generate technical summary for secure configuration', () => {
  const result = generateExecutiveSummary([], sampleScoreResults.secure);
  assertEqual(result.risk_level, 'SECURE', 'Risk level should be SECURE');
  assertLength(result.bullets, 3, 5, 'Should have 3-5 bullets');
  assertContains(result.summary, 'No exploitable vulnerabilities', 'Should mention no vulnerabilities');
  assertContains(result.bullets.join(' '), '✅', 'Should have positive indicators');
  assertEqual(result.total_issues, 0, 'Should have 0 total issues');
});

test('Generate technical summary for critical findings', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertEqual(result.risk_level, 'CRITICAL', 'Risk level should be CRITICAL');
  assertLength(result.bullets, 3, 5, 'Should have 3-5 bullets');
  assertContains(result.summary, 'CRITICAL', 'Should mention CRITICAL severity');
  assertContains(result.summary, '2 CRITICAL', 'Should count critical findings');
  assertEqual(result.critical_issues, 2, 'Should track critical count');
});

test('Generate technical summary with severity breakdown', () => {
  const mixedFindings = [
    ...sampleFindings.critical,
    ...sampleFindings.high,
    ...sampleFindings.medium
  ];
  const result = generateExecutiveSummary(mixedFindings, sampleScoreResults.critical);
  assertEqual(result.total_issues, 6, 'Should count all issues');
  assertEqual(result.critical_issues, 2, 'Should count critical issues');
  assertEqual(result.high_issues, 2, 'Should count high issues');
  assertEqual(result.medium_issues, 2, 'Should count medium issues');
  assertContains(result.summary, '2 CRITICAL, 2 HIGH, 2 MEDIUM', 'Should list all severities');
});

// ============================================================================
// TEST CATEGORY 2: Technical Language & Terminology
// ============================================================================

console.log(`\n${colors.blue}Testing: Technical Language & Terminology${colors.reset}\n`);

test('Summary uses technical terminology', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertTechnicalLanguage(fullText);
});

test('Includes threat IDs in findings', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'T001', 'Should include threat ID');
  assertContains(bulletText, '[T001]', 'Should format threat ID correctly');
});

test('Includes attack vector information', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'brute-force', 'Should describe attack vector');
  assertContains(bulletText, 'Impact:', 'Should include impact section');
});

test('Includes evidence data', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'Evidence:', 'Should include evidence section');
  assertContains(bulletText, 'token_length', 'Should show evidence fields');
});

test('Uses CVSS scoring terminology', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertContains(result.summary, 'CVSS', 'Should reference CVSS');
  assertContains(result.summary, '9.0-10.0', 'Should include CVSS range');
});

// ============================================================================
// TEST CATEGORY 3: Severity & Priority Handling
// ============================================================================

console.log(`\n${colors.blue}Testing: Severity & Priority Handling${colors.reset}\n`);

test('Critical findings include P0 priority', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertContains(result.summary, 'P0', 'Should mention P0 priority');
  assertContains(result.summary, '< 24 hours', 'Should include SLA');
});

test('High findings include P1 priority', () => {
  const result = generateExecutiveSummary(
    sampleFindings.high,
    sampleScoreResults.high
  );
  assertContains(result.summary, 'P1', 'Should mention P1 priority');
  assertContains(result.summary, '< 7 days', 'Should include SLA');
});

test('Severity emoji indicators are technical', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high, ...sampleFindings.medium],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, '🔴', 'Should use red for CRITICAL');
  assertContains(bulletText, '🟠', 'Should use orange for HIGH');
});

test('Findings sorted by severity', () => {
  const unsorted = [
    ...sampleFindings.low,
    ...sampleFindings.critical,
    ...sampleFindings.medium
  ];
  const result = generateExecutiveSummary(unsorted, sampleScoreResults.critical);
  const firstBullet = result.bullets[0];
  assertContains(firstBullet, 'CRITICAL', 'First bullet should be CRITICAL severity');
});

// ============================================================================
// TEST CATEGORY 4: Remediation & Technical Recommendations
// ============================================================================

console.log(`\n${colors.blue}Testing: Remediation & Technical Recommendations${colors.reset}\n`);

test('Includes specific technical remediation', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical,
    { includeRemediation: true }
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, '🔧', 'Should include remediation indicator');
  assertContains(bulletText, 'Remediation', 'Should mention remediation');
});

test('Remediation includes technical specifics', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical,
    { includeRemediation: true }
  );
  const bulletText = result.bullets.join(' ');
  // Should include specific technical guidance (bytes, bits, etc.)
  const hasTechnicalDetails = 
    bulletText.includes('bytes') ||
    bulletText.includes('bit') ||
    bulletText.includes('≥') ||
    bulletText.includes('cryptographically');
  if (!hasTechnicalDetails) {
    throw new Error('Remediation should include technical implementation details');
  }
});

test('Critical findings trigger urgent remediation', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical,
    { includeRemediation: true }
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'Urgent', 'Should mark as urgent');
  assertContains(bulletText, '< 24 hours', 'Should specify SLA');
});

// ============================================================================
// TEST CATEGORY 5: Formatting Options
// ============================================================================

console.log(`\n${colors.blue}Testing: Formatting Options${colors.reset}\n`);

test('Format as technical Markdown', () => {
  const summary = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  const markdown = formatExecutiveSummaryMarkdown(summary);
  assertContains(markdown, '## Executive Summary (Technical)', 'Should have technical header');
  assertContains(markdown, '### Security Findings', 'Should have findings section');
  assertContains(markdown, '### Severity Distribution', 'Should include severity table');
  assertContains(markdown, '| Severity | Count |', 'Should have markdown table');
});

test('Format as plain text with technical details', () => {
  const summary = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  const plainText = formatExecutiveSummaryPlainText(summary);
  assertContains(plainText, 'SECURITY AUDIT SUMMARY (TECHNICAL)', 'Should have technical header');
  assertContains(plainText, 'SEVERITY DISTRIBUTION:', 'Should include severity breakdown');
  assertContains(plainText, 'CRITICAL:', 'Should list critical count');
  assertContains(plainText, 'TOTAL:', 'Should show total count');
});

test('Generate technical brief for notifications', () => {
  const brief = generateExecutiveSummaryBrief(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertContains(brief, 'CRITICAL', 'Should mention severity');
  assertContains(brief, 'CVSS', 'Should reference CVSS');
  assertContains(brief, '🔴', 'Should use severity emoji');
  assertContains(brief, 'patch', 'Should use technical action verb');
});

// ============================================================================
// TEST CATEGORY 6: Edge Cases
// ============================================================================

console.log(`\n${colors.blue}Testing: Edge Cases${colors.reset}\n`);

test('Handle empty findings array', () => {
  const result = generateExecutiveSummary([], sampleScoreResults.secure);
  assertEqual(result.total_issues, 0, 'Should handle empty array');
  assertEqual(result.critical_issues, 0, 'Should have 0 critical');
  assertLength(result.bullets, 3, 5, 'Should still generate bullets');
  assertContains(result.summary, 'No exploitable', 'Should indicate secure state');
});

test('Handle undefined score result', () => {
  const result = generateExecutiveSummary(sampleFindings.medium, {});
  assertEqual(result.risk_level, 'MEDIUM', 'Should default to MEDIUM');
  assertLength(result.bullets, 3, 5, 'Should still generate bullets');
});

test('Handle single finding', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  assertEqual(result.total_issues, 1, 'Should count single issue');
  assertEqual(result.critical_issues, 1, 'Should count 1 critical');
  assertContains(result.bullets[0], 'T001', 'Should include threat ID');
});

test('Handle missing evidence gracefully', () => {
  const findingWithoutEvidence = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'Test Threat',
    description: 'Test description',
    impact: 'Test impact',
    likelihood: 'MEDIUM'
  };
  const result = generateExecutiveSummary([findingWithoutEvidence], sampleScoreResults.high);
  assertLength(result.bullets, 2, 5, 'Should handle missing evidence');
});

test('Handle many findings (>10)', () => {
  const manyFindings = [
    ...sampleFindings.critical,
    ...sampleFindings.high,
    ...sampleFindings.medium,
    ...sampleFindings.medium,
    ...sampleFindings.low,
    ...sampleFindings.low
  ];
  const result = generateExecutiveSummary(manyFindings, sampleScoreResults.critical);
  assertLength(result.bullets, 3, 5, 'Should limit to 5 bullets');
  assertEqual(result.total_issues, manyFindings.length, 'Should count all issues');
});

// ============================================================================
// TEST CATEGORY 7: Real-World Technical Scenarios
// ============================================================================

console.log(`\n${colors.blue}Testing: Real-World Technical Scenarios${colors.reset}\n`);

test('Scenario: Critical RCE vulnerability', () => {
  const rceFindings = [
    sampleFindings.high[1], // Unrestricted tool execution
    sampleFindings.critical[0] // Weak token
  ];
  const result = generateExecutiveSummary(rceFindings, sampleScoreResults.critical);
  
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'T003', 'Should identify T003 (RCE threat)');
  assertContains(bulletText, 'Remote code execution', 'Should describe RCE impact');
  assertContains(result.summary, 'CRITICAL', 'Should classify as critical');
});

test('Scenario: Credential exposure incident', () => {
  const credExposure = [
    sampleFindings.critical[1], // Exposed secrets
    sampleFindings.high[0] // Public exposure
  ];
  const result = generateExecutiveSummary(credExposure, sampleScoreResults.critical);
  
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'T005', 'Should identify T005 (credential exposure)');
  assertContains(bulletText, 'API key', 'Should mention credential types');
  assertContains(bulletText, 'exposed_secrets', 'Should include evidence');
});

test('Scenario: Network security misconfiguration', () => {
  const networkIssues = [
    sampleFindings.high[0], // Public gateway
    sampleFindings.low[0] // Default port
  ];
  const result = generateExecutiveSummary(networkIssues, sampleScoreResults.high);
  
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'T002', 'Should identify T002 (network exposure)');
  assertContains(bulletText, '0.0.0.0', 'Should show bind address evidence');
  assertContains(result.summary, 'HIGH', 'Should classify as high risk');
});

// ============================================================================
// TEST CATEGORY 8: Technical Output Quality
// ============================================================================

console.log(`\n${colors.blue}Testing: Technical Output Quality${colors.reset}\n`);

test('Summary includes precise metrics', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  assertContains(result.summary, '/100', 'Should include risk score');
  assertContains(result.summary, 'CVSS', 'Should reference CVSS');
  assertContains(result.summary, 'SLA:', 'Should specify SLA');
});

test('Bullets include threat classification', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  result.bullets.forEach((bullet, i) => {
    if (i < 2) { // First two are findings (not remediation)
      const hasThreatId = /\[T\d{3}\]/.test(bullet);
      if (!hasThreatId) {
        throw new Error(`Bullet ${i + 1} missing threat ID: ${bullet}`);
      }
    }
  });
});

test('No business jargon in technical summary', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  
  // Should NOT contain business-speak
  assertNotContains(fullText, 'business risk', 'Should avoid business terminology');
  assertNotContains(fullText, 'stakeholder', 'Should avoid business terminology');
});

test('Technical precision in evidence formatting', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets[0];
  assertContains(bulletText, 'token_length=16', 'Should format evidence as key=value');
  assertContains(bulletText, 'entropy_bits=64', 'Should include all evidence fields');
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}Test Results (Technical Version)${colors.reset}\n`);
console.log(`${colors.green}✓ Passed: ${passCount}${colors.reset}`);
if (failCount > 0) {
  console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}`);
}
console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

if (failCount === 0) {
  console.log(`${colors.green}🎉 All technical tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some tests failed. Please review.${colors.reset}\n`);
  process.exit(1);
}
