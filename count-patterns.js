#!/usr/bin/env node
/**
 * Quick script to count credential patterns
 */

const { CREDENTIAL_PATTERNS } = require('./server/patterns');

console.log('\n🔢 Pattern Count Report');
console.log('======================\n');
console.log(`Total Patterns: ${CREDENTIAL_PATTERNS.length}`);
console.log('\nPattern Categories:\n');

// Group by severity
const bySeverity = {};
CREDENTIAL_PATTERNS.forEach(p => {
  bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
});

console.log('By Severity:');
Object.keys(bySeverity).sort().forEach(severity => {
  console.log(`  ${severity}: ${bySeverity[severity]}`);
});

// Group by confidence
const byConfidence = {};
CREDENTIAL_PATTERNS.forEach(p => {
  byConfidence[p.confidence] = (byConfidence[p.confidence] || 0) + 1;
});

console.log('\nBy Confidence:');
Object.keys(byConfidence).sort().forEach(confidence => {
  console.log(`  ${confidence}: ${byConfidence[confidence]}`);
});

console.log('\nAll Pattern Names:');
CREDENTIAL_PATTERNS.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} (${p.severity}, ${p.confidence})`);
});

console.log('');
