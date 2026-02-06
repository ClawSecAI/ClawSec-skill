#!/usr/bin/env node
/**
 * Test Suite for Executive Summary Generator
 * 
 * Tests business-friendly summary generation from technical findings
 * 
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
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

function assertLength(array, min, max, message) {
  if (array.length < min || array.length > max) {
    throw new Error(`${message}\n  Expected length between ${min} and ${max}\n  Got: ${array.length}`);
  }
}

function assertBusinessLanguage(text) {
  // Check for technical jargon that should NOT appear
  const technicalTerms = [
    'T001', 'T002', 'T003', 'T004', 'T005', // Threat IDs
    'config', 'gateway', 'bind', '0.0.0.0', // Technical config terms
    'API key', 'token length', 'RSA', 'JWT' // Technical security terms
  ];
  
  technicalTerms.forEach(term => {
    if (text.includes(term)) {
      throw new Error(`Executive summary contains technical term: "${term}"`);
    }
  });
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
      evidence: { token_length: 16 }
    },
    {
      threat_id: 'T005',
      severity: 'CRITICAL',
      title: 'Exposed Secrets in Configuration',
      description: 'Found hardcoded credentials',
      impact: 'Credential leakage',
      likelihood: 'HIGH',
      evidence: { exposed_secrets: 5 }
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
      evidence: { bind_address: '0.0.0.0' }
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
      evidence: { port: 2024 }
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
console.log(`${colors.cyan}║  ClawSec Executive Summary Generator - Test Suite             ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// ============================================================================
// TEST CATEGORY 1: Basic Generation
// ============================================================================

console.log(`${colors.blue}Testing: Basic Generation${colors.reset}\n`);

test('Generate summary for secure configuration (no findings)', () => {
  const result = generateExecutiveSummary([], sampleScoreResults.secure);
  assertEqual(result.risk_level, 'SECURE', 'Risk level should be SECURE');
  assertLength(result.bullets, 3, 5, 'Should have 3-5 bullets');
  assertContains(result.summary, 'best practices', 'Should mention best practices');
  assertContains(result.bullets.join(' '), '✅', 'Should have positive checkmarks');
});

test('Generate summary for critical findings', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertEqual(result.risk_level, 'CRITICAL', 'Risk level should be CRITICAL');
  assertLength(result.bullets, 3, 5, 'Should have 3-5 bullets');
  assertContains(result.summary, 'immediate action', 'Should mention immediate action');
});

test('Generate summary for mixed severity findings', () => {
  const mixedFindings = [
    ...sampleFindings.critical,
    ...sampleFindings.high,
    ...sampleFindings.medium
  ];
  const result = generateExecutiveSummary(mixedFindings, sampleScoreResults.critical);
  assertLength(result.bullets, 3, 5, 'Should have exactly 5 bullets (max)');
  assertEqual(result.total_issues, 6, 'Should count all issues');
});

// ============================================================================
// TEST CATEGORY 2: Business Language
// ============================================================================

console.log(`\n${colors.blue}Testing: Business-Friendly Language${colors.reset}\n`);

test('Summary uses business language (no technical jargon)', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertBusinessLanguage(fullText);
});

test('Translates "Weak Gateway Token" to business language', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[0]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'password', 'Should use "password" instead of "token"');
});

test('Translates "Exposed Secrets" to business language', () => {
  const result = generateExecutiveSummary(
    [sampleFindings.critical[1]],
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'Credentials', 'Should mention "credentials"');
  assertContains(bulletText, 'insecurely', 'Should mention insecure storage');
});

test('Uses business impact language', () => {
  const result = generateExecutiveSummary(
    sampleFindings.high,
    sampleScoreResults.high
  );
  const bulletText = result.bullets.join(' ');
  // Should contain business impact phrases
  const hasBusinessImpact = 
    bulletText.includes('could lead to') ||
    bulletText.includes('potential') ||
    bulletText.includes('risk of');
  if (!hasBusinessImpact) {
    throw new Error('Summary should explain business impact');
  }
});

// ============================================================================
// TEST CATEGORY 3: Bullet Point Structure
// ============================================================================

console.log(`\n${colors.blue}Testing: Bullet Point Structure${colors.reset}\n`);

test('Generates 3-5 bullet points as required', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high, ...sampleFindings.medium],
    sampleScoreResults.critical,
    { maxBullets: 5 }
  );
  assertLength(result.bullets, 3, 5, 'Should generate 3-5 bullets');
});

test('Each bullet includes severity emoji', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  result.bullets.forEach((bullet, i) => {
    const hasEmoji = /[🚨⚠️⚡ℹ️✅🎯📊]/.test(bullet);
    if (!hasEmoji) {
      throw new Error(`Bullet ${i + 1} missing emoji indicator`);
    }
  });
});

test('Includes recommendation bullet', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical,
    { includeRecommendations: true }
  );
  const hasRecommendation = result.bullets.some(b => 
    b.includes('Recommended Action') || b.includes('🎯')
  );
  if (!hasRecommendation) {
    throw new Error('Should include recommendation bullet');
  }
});

test('Groups similar findings together', () => {
  const duplicateFindings = [
    ...sampleFindings.critical,
    ...sampleFindings.critical // Duplicate for grouping test
  ];
  const result = generateExecutiveSummary(
    duplicateFindings,
    sampleScoreResults.critical
  );
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'issues', 'Should mention multiple issues when grouped');
});

// ============================================================================
// TEST CATEGORY 4: Risk Level Handling
// ============================================================================

console.log(`\n${colors.blue}Testing: Risk Level Handling${colors.reset}\n`);

test('Critical risk includes "immediate action"', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertContains(fullText, 'immediate', 'Should mention immediate action for critical');
});

test('High risk includes "urgent"', () => {
  const result = generateExecutiveSummary(
    sampleFindings.high,
    sampleScoreResults.high
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertContains(fullText, 'urgent', 'Should mention urgency for high risk');
});

test('Medium risk suggests "soon"', () => {
  const result = generateExecutiveSummary(
    sampleFindings.medium,
    sampleScoreResults.medium
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  const hasSoonLanguage = 
    fullText.includes('soon') || 
    fullText.includes('planned') ||
    fullText.includes('1 month');
  if (!hasSoonLanguage) {
    throw new Error('Medium risk should suggest addressing soon');
  }
});

test('Low risk mentions "maintenance"', () => {
  const result = generateExecutiveSummary(
    sampleFindings.low,
    sampleScoreResults.low
  );
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertContains(fullText, 'maintenance', 'Should mention maintenance window for low risk');
});

// ============================================================================
// TEST CATEGORY 5: Formatting Options
// ============================================================================

console.log(`\n${colors.blue}Testing: Formatting Options${colors.reset}\n`);

test('Format as Markdown', () => {
  const summary = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  const markdown = formatExecutiveSummaryMarkdown(summary);
  assertContains(markdown, '## Executive Summary', 'Should have markdown header');
  assertContains(markdown, '### Key Points', 'Should have key points section');
  assertContains(markdown, '🚨', 'Should preserve emoji');
  assertContains(markdown, '**', 'Should use markdown bold');
});

test('Format as Plain Text', () => {
  const summary = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  const plainText = formatExecutiveSummaryPlainText(summary);
  assertContains(plainText, 'EXECUTIVE SUMMARY', 'Should have plain text header');
  assertContains(plainText, 'KEY POINTS:', 'Should have key points label');
  assertContains(plainText, '1.', 'Should have numbered list');
  // Plain text should strip markdown
  if (plainText.includes('**') || plainText.includes('##')) {
    throw new Error('Plain text should not contain markdown syntax');
  }
});

test('Generate brief summary for notifications', () => {
  const brief = generateExecutiveSummaryBrief(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  assertLength(brief, 50, 200, 'Brief should be 50-200 characters');
  assertContains(brief, 'critical', 'Should mention critical issues');
  assertContains(brief, 'immediate', 'Should mention immediate action');
});

// ============================================================================
// TEST CATEGORY 6: Edge Cases
// ============================================================================

console.log(`\n${colors.blue}Testing: Edge Cases${colors.reset}\n`);

test('Handle empty findings array', () => {
  const result = generateExecutiveSummary([], sampleScoreResults.secure);
  assertEqual(result.total_issues, 0, 'Should handle empty array');
  assertLength(result.bullets, 3, 5, 'Should still generate bullets');
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
  assertLength(result.bullets, 2, 5, 'Should generate appropriate number of bullets');
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
  assertLength(result.bullets, 3, 5, 'Should limit to 5 bullets even with many findings');
  assertEqual(result.total_issues, manyFindings.length, 'Should count all issues');
});

test('Handle missing threat_id gracefully', () => {
  const findingWithoutId = {
    severity: 'HIGH',
    title: 'Unknown Threat',
    description: 'Test threat without ID',
    impact: 'Test impact',
    likelihood: 'MEDIUM'
  };
  const result = generateExecutiveSummary([findingWithoutId], sampleScoreResults.high);
  assertLength(result.bullets, 2, 5, 'Should handle missing threat_id');
});

// ============================================================================
// TEST CATEGORY 7: Real-World Scenarios
// ============================================================================

console.log(`\n${colors.blue}Testing: Real-World Scenarios${colors.reset}\n`);

test('Scenario: Startup with exposed credentials', () => {
  const startupFindings = [
    sampleFindings.critical[1], // Exposed secrets
    sampleFindings.high[0], // Public exposure
    sampleFindings.medium[0] // Unencrypted sessions
  ];
  const result = generateExecutiveSummary(startupFindings, sampleScoreResults.critical);
  
  const bulletText = result.bullets.join(' ');
  assertContains(bulletText, 'Credentials', 'Should highlight credential exposure');
  assertContains(result.summary, 'immediate', 'Should emphasize urgency');
  assertEqual(result.critical_issues, 1, 'Should identify 1 critical issue');
});

test('Scenario: Enterprise with weak configuration', () => {
  const enterpriseFindings = [
    sampleFindings.high[1], // Unrestricted tool execution
    sampleFindings.medium[1], // No rate limiting
    sampleFindings.low[0] // Default port
  ];
  const result = generateExecutiveSummary(enterpriseFindings, sampleScoreResults.high);
  
  assertContains(result.summary, 'urgent', 'Should mention urgency');
  assertEqual(result.high_issues, 1, 'Should identify 1 high issue');
  assertLength(result.bullets, 3, 5, 'Should provide adequate bullets');
});

test('Scenario: Well-secured system with minor issues', () => {
  const secureFindings = [
    sampleFindings.low[0], // Default port
    sampleFindings.medium[1] // No rate limiting
  ];
  const result = generateExecutiveSummary(secureFindings, sampleScoreResults.medium);
  
  assertContains(result.summary, 'moderate', 'Should indicate moderate risk');
  assertEqual(result.critical_issues, 0, 'Should have no critical issues');
  const fullText = result.summary + ' ' + result.bullets.join(' ');
  assertContains(fullText, 'maintenance', 'Should suggest maintenance window');
});

// ============================================================================
// TEST CATEGORY 8: Output Quality
// ============================================================================

console.log(`\n${colors.blue}Testing: Output Quality${colors.reset}\n`);

test('Summary is concise (under 500 characters)', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high],
    sampleScoreResults.critical
  );
  if (result.summary.length > 500) {
    throw new Error(`Summary too long: ${result.summary.length} chars (max 500)`);
  }
});

test('Each bullet is actionable', () => {
  const result = generateExecutiveSummary(
    sampleFindings.critical,
    sampleScoreResults.critical
  );
  result.bullets.forEach((bullet, i) => {
    const hasAction = 
      bullet.includes('could lead to') ||
      bullet.includes('requires') ||
      bullet.includes('should') ||
      bullet.includes('Recommended') ||
      bullet.includes('action');
    if (!hasAction) {
      throw new Error(`Bullet ${i + 1} is not actionable: ${bullet}`);
    }
  });
});

test('No duplicate information in bullets', () => {
  const result = generateExecutiveSummary(
    [...sampleFindings.critical, ...sampleFindings.high, ...sampleFindings.medium],
    sampleScoreResults.critical
  );
  const bulletWords = result.bullets.map(b => b.toLowerCase().split(' '));
  const allWords = bulletWords.flat();
  const uniqueWords = [...new Set(allWords)];
  
  // Allow some duplication (articles, conjunctions, etc.)
  const duplicationRatio = uniqueWords.length / allWords.length;
  if (duplicationRatio < 0.4) {
    throw new Error(`Too much duplication in bullets (${Math.round(duplicationRatio * 100)}% unique)`);
  }
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}Test Results${colors.reset}\n`);
console.log(`${colors.green}✓ Passed: ${passCount}${colors.reset}`);
if (failCount > 0) {
  console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}`);
}
console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

if (failCount === 0) {
  console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some tests failed. Please review.${colors.reset}\n`);
  process.exit(1);
}
