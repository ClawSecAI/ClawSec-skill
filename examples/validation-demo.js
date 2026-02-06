#!/usr/bin/env node
/**
 * JSON Validation Demo
 * 
 * Demonstrates the ClawSec validation system with examples of:
 * - Valid reports
 * - Invalid reports with common errors
 * - Error message formatting
 */

const {
  validateScanReport,
  validateScanInputData,
  validateSingleFinding
} = require('../server/lib/validator');

console.log('🔍 ClawSec JSON Validation Demo\n');
console.log('=' .repeat(60));

// ===== Example 1: Valid Report =====
console.log('\n📝 Example 1: Valid Report');
console.log('-'.repeat(60));

const validReport = {
  scan_id: 'clawsec-1234567890-abc123',
  timestamp: '2026-02-06T20:00:00.000Z',
  report: '# Security Report\n\nNo critical issues found.',
  findings_count: 1,
  risk_level: 'MEDIUM',
  findings: [
    {
      threat_id: 'T001',
      severity: 'MEDIUM',
      title: 'Weak Gateway Token',
      description: 'Token could be stronger',
      impact: 'Potential security risk',
      likelihood: 'LOW',
      evidence: { token_length: 16 },
      remediation: {
        immediate: ['Generate stronger token'],
        short_term: ['Implement rotation policy'],
        long_term: ['Add monitoring']
      }
    }
  ]
};

const result1 = validateScanReport(validReport);
console.log('Result:', result1.valid ? '✅ VALID' : '❌ INVALID');
if (!result1.valid) {
  console.log('Errors:', JSON.stringify(result1.errors, null, 2));
}

// ===== Example 2: Missing Required Field =====
console.log('\n📝 Example 2: Missing Required Field');
console.log('-'.repeat(60));

const missingFieldReport = {
  scan_id: 'clawsec-1234567890-xyz789',
  // Missing timestamp
  report: 'Report content',
  findings_count: 0,
  risk_level: 'LOW'
};

const result2 = validateScanReport(missingFieldReport);
console.log('Result:', result2.valid ? '✅ VALID' : '❌ INVALID');
if (!result2.valid) {
  console.log('Errors:');
  result2.errors.forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
}

// ===== Example 3: Invalid Enum Value =====
console.log('\n📝 Example 3: Invalid Enum Value');
console.log('-'.repeat(60));

const invalidEnumReport = {
  scan_id: 'clawsec-1234567890-def456',
  timestamp: '2026-02-06T20:00:00.000Z',
  report: 'Report',
  findings_count: 0,
  risk_level: 'EXTREME' // Invalid - should be CRITICAL/HIGH/MEDIUM/LOW
};

const result3 = validateScanReport(invalidEnumReport);
console.log('Result:', result3.valid ? '✅ VALID' : '❌ INVALID');
if (!result3.valid) {
  console.log('Errors:');
  result3.errors.forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
}

// ===== Example 4: Invalid Pattern =====
console.log('\n📝 Example 4: Invalid Scan ID Pattern');
console.log('-'.repeat(60));

const invalidPatternReport = {
  scan_id: 'wrong-format-id', // Should be clawsec-TIMESTAMP-RANDOM
  timestamp: '2026-02-06T20:00:00.000Z',
  report: 'Report',
  findings_count: 0,
  risk_level: 'LOW'
};

const result4 = validateScanReport(invalidPatternReport);
console.log('Result:', result4.valid ? '✅ VALID' : '❌ INVALID');
if (!result4.valid) {
  console.log('Errors:');
  result4.errors.forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
}

// ===== Example 5: Mismatched Findings Count =====
console.log('\n📝 Example 5: Mismatched Findings Count');
console.log('-'.repeat(60));

const mismatchedReport = {
  scan_id: 'clawsec-1234567890-ghi789',
  timestamp: '2026-02-06T20:00:00.000Z',
  report: 'Report',
  findings_count: 5, // Says 5
  risk_level: 'HIGH',
  findings: [ // But only 2 in array
    {
      threat_id: 'T001',
      severity: 'HIGH',
      title: 'Issue 1',
      description: 'Description',
      impact: 'Impact',
      likelihood: 'HIGH'
    },
    {
      threat_id: 'T002',
      severity: 'MEDIUM',
      title: 'Issue 2',
      description: 'Description',
      impact: 'Impact',
      likelihood: 'LOW'
    }
  ]
};

const result5 = validateScanReport(mismatchedReport);
console.log('Result:', result5.valid ? '✅ VALID' : '❌ INVALID');
if (!result5.valid) {
  console.log('Errors:');
  result5.errors.forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
}

// ===== Example 6: Invalid Finding =====
console.log('\n📝 Example 6: Invalid Finding Structure');
console.log('-'.repeat(60));

const invalidFinding = {
  threat_id: 'INVALID', // Wrong pattern
  severity: 'EXTREME', // Wrong enum
  title: 'A'.repeat(250), // Too long
  // Missing description, impact, likelihood
};

const result6 = validateSingleFinding(invalidFinding);
console.log('Result:', result6.valid ? '✅ VALID' : '❌ INVALID');
if (!result6.valid) {
  console.log(`Errors (${result6.errors.length} total):`);
  result6.errors.slice(0, 5).forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
  if (result6.errors.length > 5) {
    console.log(`  ... and ${result6.errors.length - 5} more errors`);
  }
}

// ===== Example 7: Valid Scan Input =====
console.log('\n📝 Example 7: Valid Scan Input');
console.log('-'.repeat(60));

const validInput = {
  gateway: {
    token: 'secure-token-here',
    bind: '127.0.0.1',
    port: 2024
  },
  tools: {
    exec: {
      policy: 'allowlist'
    }
  }
};

const result7 = validateScanInputData(validInput);
console.log('Result:', result7.valid ? '✅ VALID' : '❌ INVALID');

// ===== Example 8: Empty Scan Input =====
console.log('\n📝 Example 8: Empty Scan Input');
console.log('-'.repeat(60));

const emptyInput = {};

const result8 = validateScanInputData(emptyInput);
console.log('Result:', result8.valid ? '✅ VALID' : '❌ INVALID');
if (!result8.valid) {
  console.log('Errors:');
  result8.errors.forEach(err => {
    console.log(`  - ${err.field}: ${err.message}`);
  });
}

// ===== Summary =====
console.log('\n' + '='.repeat(60));
console.log('✅ Demo complete!');
console.log('');
console.log('Key Takeaways:');
console.log('- Validation catches errors before they reach API consumers');
console.log('- Error messages are clear and actionable');
console.log('- Both input and output validation supported');
console.log('- Nested object validation works correctly');
console.log('- Cross-field validation ensures data consistency');
console.log('');
console.log('See docs/validation.md for full documentation.');
console.log('=' .repeat(60));
