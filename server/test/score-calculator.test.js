/**
 * ClawSec Risk Score Calculator - Test Suite
 * 
 * Tests for score calculation with edge cases and multiple scan types
 * 
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 */

const {
  calculateRiskScore,
  calculateScoreByType,
  scoreToRiskLevel,
  riskLevelToScoreRange,
  normalizeLegacyRiskLevel,
  generateScoreSummary,
  SEVERITY_WEIGHTS,
  RISK_THRESHOLDS
} = require('../lib/score-calculator');

// Test helper to create sample findings
function createFinding(severity, options = {}) {
  return {
    threat_id: options.threat_id || 'T999',
    severity: severity,
    title: options.title || `${severity} severity finding`,
    description: options.description || 'Test finding',
    impact: options.impact || 'Test impact',
    likelihood: options.likelihood || 'MEDIUM',
    evidence: options.evidence || {},
    ...options
  };
}

// Test Suite
console.log('🧪 ClawSec Score Calculator Test Suite\n');
console.log('=' .repeat(60) + '\n');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
  testsRun++;
  process.stdout.write(`${testsRun}. ${name}... `);
  
  try {
    testFn();
    testsPassed++;
    console.log('✅ PASS');
    return true;
  } catch (error) {
    testsFailed++;
    console.log('❌ FAIL');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertRange(value, min, max, label) {
  assert(
    value >= min && value <= max,
    `${label} should be between ${min} and ${max}, got ${value}`
  );
}

// ============================================================================
// TEST CATEGORY 1: Edge Cases
// ============================================================================

console.log('📊 Category 1: Edge Cases\n');

runTest('No findings (secure system)', () => {
  const result = calculateRiskScore([]);
  
  assert(result.score === 0, 'Score should be 0 for no findings');
  assert(result.level === 'SECURE', 'Level should be SECURE');
  assert(result.confidence === 'high', 'Confidence should be high');
  assert(result.breakdown.findingsCount === 0, 'Findings count should be 0');
});

runTest('Single critical finding', () => {
  const findings = [createFinding('CRITICAL', { likelihood: 'HIGH' })];
  const result = calculateRiskScore(findings);
  
  assert(result.score > 0, 'Score should be greater than 0');
  assert(result.score >= 20, 'Single critical should score at least 20');
  assert(result.level === 'MEDIUM' || result.level === 'HIGH' || result.level === 'CRITICAL', 
    'Level should be at least MEDIUM');
  assert(result.breakdown.severityDistribution.critical === 1, 'Should count 1 critical');
});

runTest('All critical findings (worst case)', () => {
  const findings = [
    createFinding('CRITICAL', { threat_id: 'T001', likelihood: 'HIGH' }),
    createFinding('CRITICAL', { threat_id: 'T002', likelihood: 'HIGH' }),
    createFinding('CRITICAL', { threat_id: 'T005', likelihood: 'HIGH' }),
    createFinding('CRITICAL', { threat_id: 'T003', likelihood: 'HIGH' })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.score >= 70, 'Multiple criticals should score at least 70 (HIGH or CRITICAL)');
  assert(result.level === 'CRITICAL' || result.level === 'HIGH', 
    'Level should be CRITICAL or HIGH with multiple critical findings');
  assert(result.breakdown.severityDistribution.critical === 4, 'Should count 4 criticals');
});

runTest('Mixed severity findings', () => {
  const findings = [
    createFinding('CRITICAL', { likelihood: 'HIGH' }),
    createFinding('HIGH', { likelihood: 'MEDIUM' }),
    createFinding('MEDIUM', { likelihood: 'MEDIUM' }),
    createFinding('LOW', { likelihood: 'LOW' })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.score > 0 && result.score <= 100, 'Score should be in valid range');
  assert(result.breakdown.severityDistribution.critical === 1, 'Should count 1 critical');
  assert(result.breakdown.severityDistribution.high === 1, 'Should count 1 high');
  assert(result.breakdown.severityDistribution.medium === 1, 'Should count 1 medium');
  assert(result.breakdown.severityDistribution.low === 1, 'Should count 1 low');
});

runTest('Many low severity findings', () => {
  const findings = Array(20).fill(null).map(() => createFinding('LOW'));
  const result = calculateRiskScore(findings);
  
  // Diminishing returns should prevent score inflation
  assert(result.score < 90, 'Many low findings should not reach CRITICAL score');
  assert(result.breakdown.findingsCount === 20, 'Should count all findings');
});

// ============================================================================
// TEST CATEGORY 2: Score Normalization (0-100 Scale)
// ============================================================================

console.log('\n📏 Category 2: Score Normalization\n');

runTest('Score is always within 0-100 range', () => {
  const testCases = [
    [],
    [createFinding('LOW')],
    [createFinding('MEDIUM')],
    [createFinding('HIGH')],
    [createFinding('CRITICAL')],
    Array(10).fill(null).map(() => createFinding('CRITICAL')),
    Array(50).fill(null).map(() => createFinding('MEDIUM'))
  ];
  
  testCases.forEach((findings, i) => {
    const result = calculateRiskScore(findings);
    assertRange(result.score, 0, 100, `Test case ${i + 1} score`);
  });
});

runTest('Score thresholds are CVSS-aligned', () => {
  assert(RISK_THRESHOLDS.CRITICAL === 90, 'CRITICAL threshold should be 90 (CVSS aligned)');
  assert(RISK_THRESHOLDS.HIGH === 70, 'HIGH threshold should be 70 (CVSS aligned)');
  assert(RISK_THRESHOLDS.MEDIUM === 40, 'MEDIUM threshold should be 40 (CVSS aligned)');
  assert(RISK_THRESHOLDS.LOW === 1, 'LOW threshold should be 1 (CVSS aligned)');
  assert(RISK_THRESHOLDS.SECURE === 0, 'SECURE threshold should be 0 (CVSS aligned)');
});

runTest('Score to risk level conversion (CVSS-aligned)', () => {
  assert(scoreToRiskLevel(95) === 'CRITICAL', '95 should be CRITICAL');
  assert(scoreToRiskLevel(90) === 'CRITICAL', '90 should be CRITICAL');
  assert(scoreToRiskLevel(85) === 'HIGH', '85 should be HIGH (was CRITICAL in old thresholds)');
  assert(scoreToRiskLevel(70) === 'HIGH', '70 should be HIGH');
  assert(scoreToRiskLevel(65) === 'MEDIUM', '65 should be MEDIUM (was HIGH in old thresholds)');
  assert(scoreToRiskLevel(40) === 'MEDIUM', '40 should be MEDIUM');
  assert(scoreToRiskLevel(35) === 'LOW', '35 should be LOW (was MEDIUM in old thresholds)');
  assert(scoreToRiskLevel(20) === 'LOW', '20 should be LOW');
  assert(scoreToRiskLevel(1) === 'LOW', '1 should be LOW');
  assert(scoreToRiskLevel(0) === 'SECURE', '0 should be SECURE');
});

runTest('Risk level to score range conversion (CVSS-aligned)', () => {
  const critical = riskLevelToScoreRange('CRITICAL');
  assert(critical.min === 90 && critical.max === 100, 'CRITICAL range should be 90-100');
  
  const high = riskLevelToScoreRange('HIGH');
  assert(high.min === 70 && high.max === 89, 'HIGH range should be 70-89');
  
  const medium = riskLevelToScoreRange('MEDIUM');
  assert(medium.min === 40 && medium.max === 69, 'MEDIUM range should be 40-69');
  
  const low = riskLevelToScoreRange('LOW');
  assert(low.min === 1 && low.max === 39, 'LOW range should be 1-39');
  
  const secure = riskLevelToScoreRange('SECURE');
  assert(secure.min === 0 && secure.max === 0, 'SECURE range should be 0');
});

// ============================================================================
// TEST CATEGORY 3: Context-Aware Scoring
// ============================================================================

console.log('\n🎯 Category 3: Context-Aware Scoring\n');

runTest('Credential exposure increases score', () => {
  const findingsWithoutCreds = [createFinding('HIGH', { threat_id: 'T002' })];
  const findingsWithCreds = [
    createFinding('HIGH', { threat_id: 'T002' }),
    createFinding('HIGH', { threat_id: 'T005', title: 'Exposed Credentials' })
  ];
  
  const resultWithout = calculateRiskScore(findingsWithoutCreds);
  const resultWith = calculateRiskScore(findingsWithCreds);
  
  assert(resultWith.score > resultWithout.score, 'Credential exposure should increase score');
  
  const hasCredFactor = resultWith.breakdown.appliedFactors.some(f => 
    f.name === 'Credential Exposure'
  );
  assert(hasCredFactor, 'Credential factor should be applied');
});

runTest('Public exposure increases score', () => {
  const findingsPrivate = [createFinding('HIGH', { threat_id: 'T003' })];
  const findingsPublic = [
    createFinding('HIGH', { threat_id: 'T003' }),
    createFinding('HIGH', { 
      threat_id: 'T002', 
      title: 'Public Gateway Exposure',
      evidence: { bind_address: '0.0.0.0' }
    })
  ];
  
  const resultPrivate = calculateRiskScore(findingsPrivate);
  const resultPublic = calculateRiskScore(findingsPublic);
  
  assert(resultPublic.score > resultPrivate.score, 'Public exposure should increase score');
});

runTest('Weak configuration increases score', () => {
  const findingsNormal = [createFinding('MEDIUM', { threat_id: 'T004' })];
  const findingsWeak = [
    createFinding('MEDIUM', { threat_id: 'T004' }),
    createFinding('CRITICAL', { threat_id: 'T001', title: 'Weak Gateway Token' })
  ];
  
  const resultNormal = calculateRiskScore(findingsNormal);
  const resultWeak = calculateRiskScore(findingsWeak);
  
  assert(resultWeak.score > resultNormal.score, 'Weak config should increase score');
});

runTest('High likelihood findings increase score', () => {
  const findingsLowLikelihood = [
    createFinding('HIGH', { likelihood: 'LOW' }),
    createFinding('HIGH', { likelihood: 'LOW' })
  ];
  const findingsHighLikelihood = [
    createFinding('HIGH', { likelihood: 'HIGH' }),
    createFinding('HIGH', { likelihood: 'HIGH' })
  ];
  
  const resultLow = calculateRiskScore(findingsLowLikelihood);
  const resultHigh = calculateRiskScore(findingsHighLikelihood);
  
  assert(resultHigh.score >= resultLow.score, 'High likelihood should increase/maintain score');
});

// ============================================================================
// TEST CATEGORY 4: Diminishing Returns
// ============================================================================

console.log('\n📉 Category 4: Diminishing Returns\n');

runTest('Diminishing returns prevents score inflation', () => {
  const findings10 = Array(10).fill(null).map(() => createFinding('MEDIUM'));
  const findings20 = Array(20).fill(null).map(() => createFinding('MEDIUM'));
  
  const result10 = calculateRiskScore(findings10);
  const result20 = calculateRiskScore(findings20);
  
  // Score should increase, but not linearly
  const scoreRatio = result20.score / result10.score;
  assert(scoreRatio < 2.0, 'Doubling findings should not double score (diminishing returns)');
});

runTest('Diminishing returns factor is applied for many findings', () => {
  const findings = Array(15).fill(null).map(() => createFinding('LOW'));
  const result = calculateRiskScore(findings);
  
  const hasDiminishingFactor = result.breakdown.appliedFactors.some(f => 
    f.name === 'Diminishing Returns'
  );
  assert(hasDiminishingFactor, 'Diminishing returns should be applied for 15 findings');
});

// ============================================================================
// TEST CATEGORY 5: Multiple Scan Types
// ============================================================================

console.log('\n🔍 Category 5: Multiple Scan Types\n');

runTest('Config audit scan type', () => {
  const findings = [createFinding('HIGH')];
  const result = calculateScoreByType(findings, 'config');
  
  assert(result.scanType === 'config', 'Scan type should be config');
  assert(result.typeMultiplier === 1.0, 'Config multiplier should be 1.0');
});

runTest('Vulnerability scan type (higher weight)', () => {
  const findings = [createFinding('HIGH')];
  const configResult = calculateScoreByType(findings, 'config');
  const vulnResult = calculateScoreByType(findings, 'vulnerability');
  
  assert(vulnResult.score >= configResult.score, 'Vulnerability scans should have higher/equal score');
  assert(vulnResult.typeMultiplier === 1.2, 'Vulnerability multiplier should be 1.2');
});

runTest('Credential scan type (highest weight)', () => {
  const findings = [createFinding('MEDIUM')];
  const configResult = calculateScoreByType(findings, 'config');
  const credResult = calculateScoreByType(findings, 'credential');
  
  assert(credResult.score > configResult.score, 'Credential scans should have highest score');
  assert(credResult.typeMultiplier === 1.5, 'Credential multiplier should be 1.5');
});

runTest('Compliance scan type (informational)', () => {
  const findings = [createFinding('MEDIUM')];
  const configResult = calculateScoreByType(findings, 'config');
  const complianceResult = calculateScoreByType(findings, 'compliance');
  
  assert(complianceResult.score <= configResult.score, 'Compliance scans should have lower score');
  assert(complianceResult.typeMultiplier === 0.9, 'Compliance multiplier should be 0.9');
});

// ============================================================================
// TEST CATEGORY 6: Confidence Calculation
// ============================================================================

console.log('\n✅ Category 6: Confidence Calculation\n');

runTest('High confidence for findings with evidence', () => {
  const findings = [
    createFinding('HIGH', { 
      evidence: { token_length: 16, pattern: 'weak' },
      likelihood: 'HIGH',
      confidence: 'high'
    })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.confidence === 'high', 'Should have high confidence with evidence');
});

runTest('Lower confidence for findings without evidence', () => {
  const findings = [
    createFinding('MEDIUM', { evidence: {}, likelihood: 'LOW' })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.confidence !== 'high', 'Should have lower confidence without evidence');
});

// ============================================================================
// TEST CATEGORY 7: Score Summary Generation
// ============================================================================

console.log('\n📝 Category 7: Score Summary Generation\n');

runTest('Score summary contains all required fields', () => {
  const findings = [
    createFinding('CRITICAL', { threat_id: 'T005' }),
    createFinding('HIGH', { threat_id: 'T002' })
  ];
  const result = calculateRiskScore(findings);
  const summary = generateScoreSummary(result);
  
  assert(summary.includes('Risk Score'), 'Summary should include risk score');
  assert(summary.includes('Confidence'), 'Summary should include confidence');
  assert(summary.includes('Score Breakdown'), 'Summary should include breakdown');
  assert(summary.includes('Findings Distribution'), 'Summary should include distribution');
});

runTest('Score summary includes applied factors', () => {
  const findings = [
    createFinding('HIGH', { threat_id: 'T005', title: 'Exposed Credentials' })
  ];
  const result = calculateRiskScore(findings);
  const summary = generateScoreSummary(result);
  
  assert(summary.includes('Risk Factors Applied'), 'Summary should include risk factors');
  assert(summary.includes('Credential Exposure'), 'Summary should mention credential exposure');
});

// ============================================================================
// TEST CATEGORY 8: Legacy Compatibility
// ============================================================================

console.log('\n🔄 Category 8: Legacy Compatibility\n');

runTest('Normalize legacy CRITICAL risk level (CVSS-aligned)', () => {
  const score = normalizeLegacyRiskLevel('CRITICAL', 3);
  assertRange(score, 90, 100, 'CRITICAL legacy score should be 90-100');
});

runTest('Normalize legacy HIGH risk level (CVSS-aligned)', () => {
  const score = normalizeLegacyRiskLevel('HIGH', 2);
  assertRange(score, 70, 89, 'HIGH legacy score should be 70-89');
});

runTest('Normalize legacy MEDIUM risk level (CVSS-aligned)', () => {
  const score = normalizeLegacyRiskLevel('MEDIUM', 1);
  assertRange(score, 40, 69, 'MEDIUM legacy score should be 40-69');
});

runTest('Normalize legacy LOW risk level (CVSS-aligned)', () => {
  const score = normalizeLegacyRiskLevel('LOW', 1);
  assertRange(score, 1, 39, 'LOW legacy score should be 1-39');
});

// ============================================================================
// TEST CATEGORY 9: Realistic Scenarios
// ============================================================================

console.log('\n🎬 Category 9: Realistic Scenarios\n');

runTest('Scenario: Insecure OpenClaw config', () => {
  const findings = [
    createFinding('CRITICAL', { 
      threat_id: 'T001', 
      title: 'Weak Gateway Token',
      likelihood: 'HIGH',
      evidence: { token_length: 8 }
    }),
    createFinding('HIGH', { 
      threat_id: 'T002', 
      title: 'Public Gateway Exposure',
      likelihood: 'MEDIUM',
      evidence: { bind_address: '0.0.0.0' }
    }),
    createFinding('HIGH', { 
      threat_id: 'T005', 
      title: 'Exposed API Keys',
      likelihood: 'HIGH',
      evidence: { exposed_secrets: ['OpenAI', 'GitHub'] }
    })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.level === 'CRITICAL' || result.level === 'HIGH', 
    'Insecure config should be CRITICAL or HIGH (CVSS-aligned)');
  assert(result.score >= 70, 'Insecure config should score at least 70 (HIGH threshold)');
});

runTest('Scenario: Moderate security posture', () => {
  const findings = [
    createFinding('MEDIUM', { 
      threat_id: 'T004', 
      title: 'Unencrypted Sessions'
    }),
    createFinding('MEDIUM', { 
      threat_id: 'T006', 
      title: 'No Rate Limiting'
    }),
    createFinding('LOW', { 
      threat_id: 'T008', 
      title: 'Default Port'
    })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.level === 'MEDIUM' || result.level === 'LOW', 
    'Moderate config should be MEDIUM or LOW (CVSS-aligned)');
  assertRange(result.score, 10, 70, 'Moderate config score range');
});

runTest('Scenario: Well-secured system', () => {
  const findings = [
    createFinding('LOW', { 
      threat_id: 'T008', 
      title: 'Default Port',
      likelihood: 'LOW'
    })
  ];
  const result = calculateRiskScore(findings);
  
  assert(result.level === 'LOW', 'Secure system should be LOW (CVSS-aligned)');
  assert(result.score < 40, 'Secure system should score under 40 (below MEDIUM threshold)');
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY\n');
console.log(`Total Tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success Rate: ${Math.round(testsPassed / testsRun * 100)}%\n`);

if (testsFailed === 0) {
  console.log('🎉 All tests passed! Score calculator is production ready.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review failures above.\n');
  process.exit(1);
}
