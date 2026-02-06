#!/usr/bin/env node
/**
 * Quick verification that P3 threshold fix works
 */

const {
  calculatePriority,
  prioritizeFindings,
  PRIORITY_THRESHOLDS
} = require('./server/lib/recommendation-engine');

// Test data: Low severity finding
const lowDefaultPort = {
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
};

console.log('🔍 Verifying P3 Threshold Fix\n');
console.log('=' .repeat(70));

// Test the fix
const priority = calculatePriority(lowDefaultPort);

console.log('\n📊 Priority Calculation Results:');
console.log(`   Score: ${priority.score}/100`);
console.log(`   Level: ${priority.level}`);
console.log(`   Expected: P3 (< ${PRIORITY_THRESHOLDS.P2})`);
console.log(`   Time to Fix: ${priority.timeToFix.duration}`);
console.log(`   Urgency: ${priority.timeToFix.urgency}`);

console.log('\n🧮 Score Breakdown:');
console.log(`   Severity: ${priority.breakdown.severity}`);
console.log(`   Exploitability: ${priority.breakdown.exploitability}`);
console.log(`   Impact: ${priority.breakdown.impact}`);
console.log(`   Boosters: ${priority.breakdown.boosters}`);
console.log(`   Total (raw): ${priority.breakdown.total}`);
console.log(`   Normalized: ${priority.breakdown.normalized}`);

console.log('\n' + '=' .repeat(70));

// Verify the fix
if (priority.level === 'P3' && priority.score < PRIORITY_THRESHOLDS.P2) {
  console.log('\n✅ FIX VERIFIED: Low severity correctly classified as P3');
  console.log(`✅ Score (${priority.score}) is below P2 threshold (${PRIORITY_THRESHOLDS.P2})`);
  console.log('✅ Test 4 and Test 13 should now pass\n');
  process.exit(0);
} else {
  console.log('\n❌ FIX FAILED: Priority still incorrect');
  console.log(`❌ Expected: P3 (score < ${PRIORITY_THRESHOLDS.P2})`);
  console.log(`❌ Got: ${priority.level} (score ${priority.score})\n`);
  process.exit(1);
}
