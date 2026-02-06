/**
 * ClawSec JSON Schema Validator Tests
 * 
 * Comprehensive test suite for report and scan input validation
 * 
 * Run with: npm test tests/validator.test.js
 */

const { 
  validateScanReport,
  validateScanInputData,
  validateSingleFinding,
  validateOrThrow,
  validationMiddleware
} = require('../server/lib/validator');

// Test utilities
function expectValid(result) {
  if (!result.valid) {
    console.error('Expected valid, got errors:', JSON.stringify(result.errors, null, 2));
    throw new Error('Validation failed unexpectedly');
  }
}

function expectInvalid(result, expectedErrorCount = null) {
  if (result.valid) {
    throw new Error('Expected invalid, but validation passed');
  }
  if (expectedErrorCount !== null && result.errors.length !== expectedErrorCount) {
    console.error('Errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(`Expected ${expectedErrorCount} errors, got ${result.errors.length}`);
  }
}

function expectErrorContains(result, fieldName, messageFragment) {
  const error = result.errors.find(e => 
    e.field === fieldName && e.message.includes(messageFragment)
  );
  if (!error) {
    console.error('All errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(`Expected error for field '${fieldName}' containing '${messageFragment}'`);
  }
}

// Test counter
let passedTests = 0;
let failedTests = 0;
const failedTestNames = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failedTests++;
    failedTestNames.push(name);
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

console.log('\n🧪 ClawSec Validator Test Suite\n');
console.log('=' .repeat(80));

// =============================================================================
// SECTION 1: Report Validation - Valid Cases
// =============================================================================

console.log('\n📋 SECTION 1: Report Validation - Valid Cases\n');

test('Valid minimal report', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc123',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: '# Security Report\n\nNo issues found.',
    findings_count: 0,
    risk_level: 'LOW'
  };
  expectValid(validateScanReport(report));
});

test('Valid report with findings array', () => {
  const report = {
    scan_id: 'clawsec-1234567890-xyz789',
    timestamp: '2026-02-06T20:30:00.000Z',
    report: '# Security Report\n\nFound 2 issues.',
    findings_count: 2,
    risk_level: 'HIGH',
    findings: [
      {
        threat_id: 'T001',
        severity: 'CRITICAL',
        title: 'Weak Gateway Token',
        description: 'Token is too weak',
        impact: 'System compromise',
        likelihood: 'HIGH'
      },
      {
        threat_id: 'T002',
        severity: 'HIGH',
        title: 'Public Exposure',
        description: 'Gateway publicly accessible',
        impact: 'Remote access',
        likelihood: 'MEDIUM'
      }
    ]
  };
  expectValid(validateScanReport(report));
});

test('Valid report with complete findings (all optional fields)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-full',
    timestamp: '2026-02-06T21:00:00.000Z',
    report: '# Complete Report',
    findings_count: 1,
    risk_level: 'CRITICAL',
    findings: [
      {
        threat_id: 'T005',
        severity: 'CRITICAL',
        title: 'Exposed Secrets',
        description: 'API keys found in config',
        impact: 'Data breach possible',
        likelihood: 'HIGH',
        evidence: {
          exposed_secrets: ['openai_key', 'github_token'],
          total_count: 2,
          credential_risk: 0.95
        },
        remediation: {
          immediate: ['Move secrets to .env file'],
          short_term: ['Rotate all credentials'],
          long_term: ['Implement secrets manager']
        }
      }
    ]
  };
  expectValid(validateScanReport(report));
});

test('Valid report with all risk levels', () => {
  const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  levels.forEach(level => {
    const report = {
      scan_id: `clawsec-9999999999-${level.toLowerCase()}`,
      timestamp: '2026-02-06T22:00:00.000Z',
      report: `Risk level: ${level}`,
      findings_count: 0,
      risk_level: level
    };
    expectValid(validateScanReport(report));
  });
});

// =============================================================================
// SECTION 2: Report Validation - Required Fields
// =============================================================================

console.log('\n📋 SECTION 2: Report Validation - Required Fields\n');

test('Missing scan_id', () => {
  const report = {
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'scan_id');
});

test('Missing timestamp', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'timestamp');
});

test('Missing report field', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'report');
});

test('Missing findings_count', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'findings_count');
});

test('Missing risk_level', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'risk_level');
});

// =============================================================================
// SECTION 3: Report Validation - Type Checking
// =============================================================================

console.log('\n📋 SECTION 3: Report Validation - Type Checking\n');

test('scan_id wrong type (number instead of string)', () => {
  const report = {
    scan_id: 123456,
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'scan_id', 'type');
});

test('findings_count wrong type (string instead of integer)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: '5',
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'findings_count', 'type');
});

test('report wrong type (number instead of string)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 12345,
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'report', 'type');
});

// =============================================================================
// SECTION 4: Report Validation - Format Validation
// =============================================================================

console.log('\n📋 SECTION 4: Report Validation - Format Validation\n');

test('Invalid scan_id pattern (missing prefix)', () => {
  const report = {
    scan_id: '1234567890-abc123',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'scan_id', 'pattern');
});

test('Invalid scan_id pattern (wrong format)', () => {
  const report = {
    scan_id: 'clawsec_invalid_format',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'scan_id', 'pattern');
});

test('Invalid timestamp format (not ISO 8601)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06 20:00:00',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'timestamp', 'format');
});

test('Empty report string', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: '',
    findings_count: 0,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'report', 'minLength');
});

// =============================================================================
// SECTION 5: Report Validation - Enum Validation
// =============================================================================

console.log('\n📋 SECTION 5: Report Validation - Enum Validation\n');

test('Invalid risk_level (lowercase)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'low'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'risk_level', 'enum');
});

test('Invalid risk_level (unknown value)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'SUPER_CRITICAL'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'risk_level', 'enum');
});

// =============================================================================
// SECTION 6: Report Validation - Range Validation
// =============================================================================

console.log('\n📋 SECTION 6: Report Validation - Range Validation\n');

test('Negative findings_count', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: -5,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'findings_count', 'minimum');
});

// =============================================================================
// SECTION 7: Report Validation - Cross-field Validation
// =============================================================================

console.log('\n📋 SECTION 7: Report Validation - Cross-field Validation\n');

test('findings_count mismatch (count > array length)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 5,
    risk_level: 'HIGH',
    findings: [
      {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'Issue',
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH'
      }
    ]
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'findings_count', 'does not match');
});

test('findings_count mismatch (count < array length)', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 1,
    risk_level: 'HIGH',
    findings: [
      {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'Issue 1',
        description: 'Desc 1',
        impact: 'Impact 1',
        likelihood: 'HIGH'
      },
      {
        threat_id: 'T002',
        severity: 'MEDIUM',
        title: 'Issue 2',
        description: 'Desc 2',
        impact: 'Impact 2',
        likelihood: 'MEDIUM'
      }
    ]
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'findings_count', 'does not match');
});

// =============================================================================
// SECTION 8: Finding Validation
// =============================================================================

console.log('\n📋 SECTION 8: Finding Validation\n');

test('Valid finding (minimal)', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'CRITICAL',
    title: 'Test Finding',
    description: 'Test description',
    impact: 'Test impact',
    likelihood: 'HIGH'
  };
  expectValid(validateSingleFinding(finding));
});

test('Valid finding (with optional fields)', () => {
  const finding = {
    threat_id: 'T005',
    severity: 'HIGH',
    title: 'Test Finding',
    description: 'Test description',
    impact: 'Test impact',
    likelihood: 'MEDIUM',
    evidence: { test: 'data' },
    remediation: {
      immediate: ['Step 1', 'Step 2'],
      short_term: ['Step 3'],
      long_term: ['Step 4']
    }
  };
  expectValid(validateSingleFinding(finding));
});

test('Finding missing required field (threat_id)', () => {
  const finding = {
    severity: 'CRITICAL',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  const result = validateSingleFinding(finding);
  expectInvalid(result);
  expectErrorContains(result, 'root', 'threat_id');
});

test('Invalid threat_id pattern', () => {
  const finding = {
    threat_id: 'THREAT001',
    severity: 'CRITICAL',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  const result = validateSingleFinding(finding);
  expectInvalid(result);
  expectErrorContains(result, 'threat_id', 'pattern');
});

test('Invalid severity enum', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'SUPER_HIGH',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  const result = validateSingleFinding(finding);
  expectInvalid(result);
  expectErrorContains(result, 'severity', 'enum');
});

test('Title too long (> 200 chars)', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'A'.repeat(201),
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  const result = validateSingleFinding(finding);
  expectInvalid(result);
  expectErrorContains(result, 'title', 'maxLength');
});

test('Empty description string', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'Test',
    description: '',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  const result = validateScanReport(finding);
  expectInvalid(result);
});

// =============================================================================
// SECTION 9: Scan Input Validation
// =============================================================================

console.log('\n📋 SECTION 9: Scan Input Validation\n');

test('Valid scan input (minimal)', () => {
  const input = {
    gateway: {
      token: 'test-token-12345'
    }
  };
  expectValid(validateScanInputData(input));
});

test('Valid scan input (complete)', () => {
  const input = {
    gateway: {
      token: 'secure-token-abc123def456',
      bind: '127.0.0.1',
      port: 2024,
      rate_limit: {
        enabled: true,
        max_requests: 100
      }
    },
    sessions: {
      encryption: {
        enabled: true,
        key: 'encryption-key-xyz'
      }
    },
    tools: {
      exec: {
        policy: 'allowlist'
      }
    },
    channels: {
      telegram: {
        bot_token: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
        allowed_chats: ['user123', 456]
      }
    }
  };
  expectValid(validateScanInputData(input));
});

test('Empty scan input', () => {
  const result = validateScanInputData({});
  expectInvalid(result);
  expectErrorContains(result, 'root', 'empty');
});

test('Invalid port number (too high)', () => {
  const input = {
    gateway: {
      port: 99999
    }
  };
  const result = validateScanInputData(input);
  expectInvalid(result);
  expectErrorContains(result, 'gateway.port', 'maximum');
});

test('Invalid port number (negative)', () => {
  const input = {
    gateway: {
      port: -1
    }
  };
  const result = validateScanInputData(input);
  expectInvalid(result);
  expectErrorContains(result, 'gateway.port', 'minimum');
});

test('Invalid exec policy enum', () => {
  const input = {
    tools: {
      exec: {
        policy: 'allow-everything'
      }
    }
  };
  const result = validateScanInputData(input);
  expectInvalid(result);
  expectErrorContains(result, 'tools.exec.policy', 'enum');
});

// =============================================================================
// SECTION 10: validateOrThrow Function
// =============================================================================

console.log('\n📋 SECTION 10: validateOrThrow Function\n');

test('validateOrThrow success', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  // Should not throw
  validateOrThrow(report, 'report');
});

test('validateOrThrow throws on invalid report', () => {
  const report = {
    scan_id: 'invalid-id',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW'
  };
  let didThrow = false;
  try {
    validateOrThrow(report, 'report');
  } catch (error) {
    didThrow = true;
    if (!error.message.includes('Validation failed')) {
      throw new Error('Wrong error message');
    }
  }
  if (!didThrow) {
    throw new Error('Expected validateOrThrow to throw');
  }
});

test('validateOrThrow with input type', () => {
  const input = {
    gateway: {
      token: 'test-token'
    }
  };
  validateOrThrow(input, 'input');
});

test('validateOrThrow with finding type', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH'
  };
  validateOrThrow(finding, 'finding');
});

// =============================================================================
// SECTION 11: Edge Cases
// =============================================================================

console.log('\n📋 SECTION 11: Edge Cases\n');

test('Report with null values', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 0,
    risk_level: 'LOW',
    findings: null
  };
  const result = validateScanReport(report);
  expectInvalid(result);
});

test('Report with undefined required field', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: undefined,
    risk_level: 'LOW'
  };
  const result = validateScanReport(report);
  expectInvalid(result);
});

test('Finding with empty evidence object', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH',
    evidence: {}
  };
  expectValid(validateSingleFinding(finding));
});

test('Finding with empty remediation arrays', () => {
  const finding = {
    threat_id: 'T001',
    severity: 'HIGH',
    title: 'Test',
    description: 'Desc',
    impact: 'Impact',
    likelihood: 'HIGH',
    remediation: {
      immediate: [],
      short_term: [],
      long_term: []
    }
  };
  expectValid(validateSingleFinding(finding));
});

test('Very large findings_count', () => {
  const report = {
    scan_id: 'clawsec-1234567890-abc',
    timestamp: '2026-02-06T20:00:00.000Z',
    report: 'Report',
    findings_count: 999999,
    risk_level: 'CRITICAL',
    findings: []
  };
  const result = validateScanReport(report);
  expectInvalid(result);
  expectErrorContains(result, 'findings_count', 'does not match');
});

// =============================================================================
// Test Summary
// =============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n📊 Test Summary\n');
console.log(`Total tests: ${passedTests + failedTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n❌ Failed tests:');
  failedTestNames.forEach(name => console.log(`   - ${name}`));
  console.log('\n❌ TEST SUITE FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED\n');
  process.exit(0);
}
