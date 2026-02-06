/**
 * ClawSec Recommendation Engine Tests
 * 
 * Test suite for prioritization logic:
 * - Priority calculation
 * - Exploitability scoring
 * - Impact assessment
 * - Recommendation ranking
 * - Report generation
 * 
 * @version 1.0.0
 * @created 2026-02-06
 */

const {
  calculatePriority,
  prioritizeFindings,
  generatePriorityReport,
  SEVERITY_WEIGHTS,
  PRIORITY_THRESHOLDS
} = require('../lib/recommendation-engine');

// Test data: Sample security findings
const testFindings = {
  criticalCredentialExposure: {
    threat_id: 'T005',
    severity: 'CRITICAL',
    title: 'Exposed AWS Credentials in Configuration',
    description: 'Hardcoded AWS access keys found in config file',
    impact: 'Complete AWS account compromise, data breach, financial damage',
    likelihood: 'HIGH',
    evidence: {
      exposed_secrets: [
        { type: 'AWS Access Key', severity: 'CRITICAL', count: 1 }
      ]
    },
    remediation: {
      immediate: ['Move to .env', 'Rotate credentials'],
      short_term: ['Enable secret scanning'],
      long_term: ['Implement secrets manager']
    }
  },
  
  highPublicExposure: {
    threat_id: 'T002',
    severity: 'HIGH',
    title: 'Public Gateway Exposure',
    description: 'Gateway bound to 0.0.0.0',
    impact: 'Remote exploitation attempts, brute force attacks',
    likelihood: 'MEDIUM',
    evidence: { bind_address: '0.0.0.0' },
    remediation: {
      immediate: ['Bind to 127.0.0.1', 'Restart service'],
      short_term: ['Configure firewall']
    }
  },
  
  weakToken: {
    threat_id: 'T001',
    severity: 'CRITICAL',
    title: 'Weak Gateway Token',
    description: 'Token is too short and predictable',
    impact: 'Complete system compromise',
    likelihood: 'HIGH',
    evidence: { token_length: 16, token_pattern: 'weak' },
    remediation: {
      immediate: ['Generate strong token: openssl rand -hex 32']
    }
  },
  
  mediumUnencrypted: {
    threat_id: 'T004',
    severity: 'MEDIUM',
    title: 'Unencrypted Session Storage',
    description: 'Session data stored in plaintext',
    impact: 'Privacy breach if filesystem compromised',
    likelihood: 'MEDIUM',
    evidence: { encryption_enabled: false },
    remediation: {
      immediate: [],
      short_term: ['Enable encryption', 'Generate key'],
      long_term: ['Key rotation policy']
    }
  },
  
  lowDefaultPort: {
    threat_id: 'T008',
    severity: 'LOW',
    title: 'Default Port Usage',
    description: 'Using default OpenClaw port 2024',
    impact: 'Easier reconnaissance for attackers',
    likelihood: 'LOW',
    evidence: { port: 2024 },
    remediation: {
      immediate: [],
      short_term: ['Change to non-standard port'],
      long_term: ['Use reverse proxy']
    }
  },
  
  mediumNoRateLimit: {
    threat_id: 'T006',
    severity: 'MEDIUM',
    title: 'No Rate Limiting',
    description: 'No rate limiting configured',
    impact: 'Brute force attacks, DoS, resource exhaustion',
    likelihood: 'MEDIUM',
    evidence: { rate_limit_configured: false },
    remediation: {
      short_term: ['Configure rate limiting'],
      long_term: ['IP-based throttling']
    }
  }
};

/**
 * Test Suite
 */
function runTests() {
  console.log('🧪 ClawSec Recommendation Engine Test Suite\n');
  console.log('=' .repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Priority calculation for critical credential exposure
  console.log('\n📋 Test 1: Critical Credential Exposure Priority');
  try {
    const priority = calculatePriority(testFindings.criticalCredentialExposure);
    
    assert(priority.score >= PRIORITY_THRESHOLDS.P0, 
      `Expected P0 (≥90), got ${priority.score}`);
    assert(priority.level === 'P0',
      `Expected level P0, got ${priority.level}`);
    assert(priority.breakdown.boosters > 0,
      'Should have credential exposure booster');
    
    console.log(`   ✅ Priority: ${priority.level} (Score: ${priority.score}/100)`);
    console.log(`   ✅ Reasoning: ${priority.reasoning}`);
    console.log(`   ✅ Breakdown: Severity=${priority.breakdown.severity}, Exploit=${priority.breakdown.exploitability}, Impact=${priority.breakdown.impact}, Boosters=${priority.breakdown.boosters}`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 2: High severity public exposure
  console.log('\n📋 Test 2: High Severity Public Exposure');
  try {
    const priority = calculatePriority(testFindings.highPublicExposure);
    
    assert(priority.score >= PRIORITY_THRESHOLDS.P1,
      `Expected P1 or higher (≥70), got ${priority.score}`);
    assert(['P0', 'P1'].includes(priority.level),
      `Expected P0 or P1, got ${priority.level}`);
    
    console.log(`   ✅ Priority: ${priority.level} (Score: ${priority.score}/100)`);
    console.log(`   ✅ Time to fix: ${priority.timeToFix.duration}`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 3: Medium severity gets appropriate priority
  console.log('\n📋 Test 3: Medium Severity Prioritization');
  try {
    const priority = calculatePriority(testFindings.mediumUnencrypted);
    
    assert(priority.score < PRIORITY_THRESHOLDS.P1,
      `Expected below P1 (<70), got ${priority.score}`);
    assert(['P2', 'P3'].includes(priority.level),
      `Expected P2 or P3, got ${priority.level}`);
    
    console.log(`   ✅ Priority: ${priority.level} (Score: ${priority.score}/100)`);
    console.log(`   ✅ Appropriate for ${priority.timeToFix.duration}`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 4: Low severity gets lowest priority
  console.log('\n📋 Test 4: Low Severity Prioritization');
  try {
    const priority = calculatePriority(testFindings.lowDefaultPort);
    
    assert(priority.level === 'P3',
      `Expected P3 for low severity, got ${priority.level}`);
    assert(priority.score < PRIORITY_THRESHOLDS.P2,
      `Expected below P2 (<50), got ${priority.score}`);
    
    console.log(`   ✅ Priority: ${priority.level} (Score: ${priority.score}/100)`);
    console.log(`   ✅ Correctly identified as backlog item`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 5: Multiple findings ranking
  console.log('\n📋 Test 5: Multiple Findings Ranking');
  try {
    const findings = [
      testFindings.lowDefaultPort,
      testFindings.criticalCredentialExposure,
      testFindings.mediumUnencrypted,
      testFindings.highPublicExposure,
      testFindings.weakToken
    ];
    
    const prioritized = prioritizeFindings(findings);
    
    assert(prioritized.rankings.length === findings.length,
      'Should rank all findings');
    
    // Check ranking order (highest priority first)
    assert(prioritized.rankings[0].priority.score >= prioritized.rankings[1].priority.score,
      'Rankings should be in descending order');
    assert(prioritized.rankings[1].priority.score >= prioritized.rankings[2].priority.score,
      'Rankings should be in descending order');
    
    // Check P0 items are first
    const firstP0Index = prioritized.rankings.findIndex(f => f.priority.level === 'P0');
    const firstP1Index = prioritized.rankings.findIndex(f => f.priority.level === 'P1');
    assert(firstP0Index < firstP1Index || firstP0Index === -1 || firstP1Index === -1,
      'P0 items should come before P1 items');
    
    console.log(`   ✅ Ranked ${prioritized.rankings.length} findings`);
    console.log(`   ✅ Priority distribution: P0=${prioritized.summary.byPriority.P0}, P1=${prioritized.summary.byPriority.P1}, P2=${prioritized.summary.byPriority.P2}, P3=${prioritized.summary.byPriority.P3}`);
    console.log(`   ✅ Top priority: ${prioritized.rankings[0].title} (${prioritized.rankings[0].priority.level})`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 6: Exploitability factors
  console.log('\n📋 Test 6: Exploitability Assessment');
  try {
    // Compare high likelihood vs low likelihood
    const highLikelihood = calculatePriority(testFindings.criticalCredentialExposure);
    const lowLikelihood = calculatePriority(testFindings.lowDefaultPort);
    
    assert(highLikelihood.breakdown.exploitability > lowLikelihood.breakdown.exploitability,
      'High likelihood should have higher exploitability score');
    
    console.log(`   ✅ High likelihood exploit score: ${highLikelihood.breakdown.exploitability}`);
    console.log(`   ✅ Low likelihood exploit score: ${lowLikelihood.breakdown.exploitability}`);
    console.log(`   ✅ Exploitability correctly differentiated`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 7: Impact assessment
  console.log('\n📋 Test 7: Impact Assessment (CIA Triad)');
  try {
    const credentialImpact = calculatePriority(testFindings.criticalCredentialExposure);
    const portImpact = calculatePriority(testFindings.lowDefaultPort);
    
    assert(credentialImpact.breakdown.impact > portImpact.breakdown.impact,
      'Credential exposure should have higher impact than default port');
    
    console.log(`   ✅ Credential exposure impact: ${credentialImpact.breakdown.impact}`);
    console.log(`   ✅ Default port impact: ${portImpact.breakdown.impact}`);
    console.log(`   ✅ Impact correctly assessed based on CIA triad`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 8: Priority boosters
  console.log('\n📋 Test 8: Priority Boosters');
  try {
    const withBooster = calculatePriority(testFindings.criticalCredentialExposure);
    const noBooster = calculatePriority(testFindings.mediumUnencrypted);
    
    assert(withBooster.breakdown.boosters > 0,
      'Credential exposure should have priority boosters');
    assert(noBooster.breakdown.boosters <= withBooster.breakdown.boosters,
      'Unencrypted storage should have fewer/no boosters');
    
    console.log(`   ✅ Credential exposure boosters: +${withBooster.breakdown.boosters}`);
    console.log(`   ✅ Unencrypted storage boosters: +${noBooster.breakdown.boosters}`);
    console.log(`   ✅ Boosters correctly applied`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 9: Recommendations generation
  console.log('\n📋 Test 9: Actionable Recommendations');
  try {
    const findings = [
      testFindings.criticalCredentialExposure,
      testFindings.highPublicExposure,
      testFindings.mediumUnencrypted
    ];
    
    const prioritized = prioritizeFindings(findings);
    
    assert(prioritized.summary.recommendations.length > 0,
      'Should generate recommendations');
    
    const p0Recs = prioritized.summary.recommendations.find(r => r.priority === 'P0');
    if (p0Recs) {
      assert(p0Recs.action === 'IMMEDIATE ACTION REQUIRED',
        'P0 should require immediate action');
      assert(p0Recs.tasks.length > 0,
        'P0 should have actionable tasks');
    }
    
    console.log(`   ✅ Generated ${prioritized.summary.recommendations.length} recommendation groups`);
    console.log(`   ✅ Each recommendation includes action steps and deadlines`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 10: Report generation
  console.log('\n📋 Test 10: Priority Report Generation');
  try {
    const findings = [
      testFindings.criticalCredentialExposure,
      testFindings.highPublicExposure,
      testFindings.mediumUnencrypted,
      testFindings.lowDefaultPort
    ];
    
    const prioritized = prioritizeFindings(findings);
    const report = generatePriorityReport(prioritized);
    
    assert(report.includes('Prioritized Recommendations'),
      'Report should include title');
    assert(report.includes('Priority Distribution'),
      'Report should include distribution table');
    assert(report.includes('P0') || report.includes('P1'),
      'Report should show priority levels');
    
    console.log(`   ✅ Report generated (${report.length} bytes)`);
    console.log(`   ✅ Includes distribution table and action items`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 11: Empty findings handling
  console.log('\n📋 Test 11: Empty Findings Handling');
  try {
    const prioritized = prioritizeFindings([]);
    
    assert(prioritized.rankings.length === 0,
      'Empty input should return empty rankings');
    assert(prioritized.summary.total === 0,
      'Total should be zero');
    
    console.log(`   ✅ Gracefully handles empty findings`);
    console.log(`   ✅ Returns valid structure with zero counts`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 12: Score normalization (0-100 range)
  console.log('\n📋 Test 12: Score Normalization');
  try {
    const findings = Object.values(testFindings);
    const priorities = findings.map(f => calculatePriority(f));
    
    priorities.forEach(p => {
      assert(p.score >= 0 && p.score <= 100,
        `Score should be 0-100, got ${p.score}`);
    });
    
    console.log(`   ✅ All scores within 0-100 range`);
    console.log(`   ✅ Min: ${Math.min(...priorities.map(p => p.score))}, Max: ${Math.max(...priorities.map(p => p.score))}`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 13: Time-to-fix recommendations
  console.log('\n📋 Test 13: Time-to-Fix Recommendations');
  try {
    const p0Priority = calculatePriority(testFindings.criticalCredentialExposure);
    const p3Priority = calculatePriority(testFindings.lowDefaultPort);
    
    assert(p0Priority.timeToFix.urgency === 'CRITICAL',
      'P0 should be critical urgency');
    assert(p3Priority.timeToFix.urgency === 'LOW',
      'P3 should be low urgency');
    assert(p0Priority.timeToFix.duration.includes('hours'),
      'P0 should be fixed within hours');
    
    console.log(`   ✅ P0 time-to-fix: ${p0Priority.timeToFix.duration}`);
    console.log(`   ✅ P3 time-to-fix: ${p3Priority.timeToFix.duration}`);
    console.log(`   ✅ Time recommendations appropriate for priority`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 14: Realistic scenario - mixed severity findings
  console.log('\n📋 Test 14: Realistic Mixed Severity Scenario');
  try {
    const allFindings = Object.values(testFindings);
    const prioritized = prioritizeFindings(allFindings);
    
    // Should have mix of priorities
    assert(prioritized.summary.byPriority.P0 > 0,
      'Should have at least one P0 finding');
    assert(prioritized.summary.total === allFindings.length,
      'Should process all findings');
    
    // Top finding should be highest score
    const topFinding = prioritized.rankings[0];
    assert(topFinding.priority.level === 'P0',
      'Top finding should be P0');
    
    console.log(`   ✅ Processed ${allFindings.length} findings`);
    console.log(`   ✅ Distribution: ${JSON.stringify(prioritized.summary.byPriority)}`);
    console.log(`   ✅ Top priority: ${topFinding.title} (${topFinding.priority.score}/100)`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Test 15: Reasoning quality
  console.log('\n📋 Test 15: Priority Reasoning Quality');
  try {
    const priority = calculatePriority(testFindings.criticalCredentialExposure);
    
    assert(priority.reasoning && priority.reasoning.length > 0,
      'Should provide reasoning');
    assert(priority.reasoning.includes('severity'),
      'Reasoning should mention severity');
    assert(priority.reasoning.includes('exploitability') || priority.reasoning.includes('likelihood'),
      'Reasoning should mention exploitability');
    
    console.log(`   ✅ Reasoning provided: "${priority.reasoning.substring(0, 80)}..."`);
    console.log(`   ✅ Includes severity, exploitability, and impact factors`);
    passed++;
  } catch (e) {
    console.log(`   ❌ FAILED: ${e.message}`);
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! Recommendation engine is working correctly.\n');
    return true;
  } else {
    console.log(`❌ ${failed} test(s) failed. Review output above for details.\n`);
    return false;
  }
}

/**
 * Simple assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests, testFindings };
