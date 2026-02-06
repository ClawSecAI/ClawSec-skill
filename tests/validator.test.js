/**
 * Test suite for JSON schema validation
 * 
 * Tests comprehensive validation of:
 * - Report outputs
 * - Scan inputs
 * - Finding objects
 * - Error messages
 */

const {
  validateScanReport,
  validateScanInputData,
  validateSingleFinding,
  validateOrThrow
} = require('../server/lib/validator');

describe('ClawSec JSON Validator', () => {
  
  // ===== REPORT VALIDATION TESTS =====
  
  describe('validateScanReport', () => {
    
    test('should validate a complete valid report', () => {
      const validReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: '# Security Report\n\nFindings...',
        findings_count: 2,
        risk_level: 'HIGH',
        findings: [
          {
            threat_id: 'T001',
            severity: 'CRITICAL',
            title: 'Weak Gateway Token',
            description: 'Token is too weak',
            impact: 'System compromise',
            likelihood: 'HIGH',
            evidence: { token_length: 8 },
            remediation: {
              immediate: ['Generate strong token'],
              short_term: ['Implement rotation'],
              long_term: ['Add monitoring']
            }
          },
          {
            threat_id: 'T002',
            severity: 'HIGH',
            title: 'Public Exposure',
            description: 'Gateway exposed publicly',
            impact: 'Remote attacks possible',
            likelihood: 'MEDIUM'
          }
        ]
      };
      
      const result = validateScanReport(validReport);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should validate minimal valid report without findings array', () => {
      const minimalReport = {
        scan_id: 'clawsec-1234567890-xyz789',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'No issues found.',
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(minimalReport);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject report with missing required fields', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        // Missing timestamp
        report: '# Report',
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('timestamp')
        })
      );
    });
    
    test('should reject report with invalid scan_id pattern', () => {
      const invalidReport = {
        scan_id: 'invalid-id-format', // Wrong pattern
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report',
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('scan_id');
    });
    
    test('should reject report with invalid risk_level enum', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report',
        findings_count: 0,
        risk_level: 'EXTREME' // Invalid enum value
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('CRITICAL, HIGH, MEDIUM, LOW');
    });
    
    test('should reject report with negative findings_count', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report',
        findings_count: -1,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
    });
    
    test('should reject report with empty report string', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: '', // Empty string
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
    });
    
    test('should reject report with mismatched findings_count', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report',
        findings_count: 5, // Says 5 findings
        risk_level: 'HIGH',
        findings: [ // But only has 2
          {
            threat_id: 'T001',
            severity: 'HIGH',
            title: 'Finding 1',
            description: 'Description',
            impact: 'Impact',
            likelihood: 'HIGH'
          },
          {
            threat_id: 'T002',
            severity: 'MEDIUM',
            title: 'Finding 2',
            description: 'Description',
            impact: 'Impact',
            likelihood: 'LOW'
          }
        ]
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('does not match');
    });
    
    test('should reject report with invalid timestamp format', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06 20:00:00', // Not ISO 8601
        report: 'Report',
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
    });
    
  });
  
  // ===== FINDING VALIDATION TESTS =====
  
  describe('validateSingleFinding', () => {
    
    test('should validate a complete valid finding', () => {
      const validFinding = {
        threat_id: 'T001',
        severity: 'CRITICAL',
        title: 'Weak Gateway Token',
        description: 'The gateway token is weak and easily guessable',
        impact: 'Complete system compromise possible',
        likelihood: 'HIGH',
        evidence: {
          token_length: 8,
          token_pattern: 'weak'
        },
        remediation: {
          immediate: ['Generate strong token: openssl rand -hex 32'],
          short_term: ['Implement token rotation'],
          long_term: ['Add auth monitoring']
        }
      };
      
      const result = validateSingleFinding(validFinding);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should validate minimal finding without optional fields', () => {
      const minimalFinding = {
        threat_id: 'T010',
        severity: 'LOW',
        title: 'Minor Issue',
        description: 'Low priority issue',
        impact: 'Minimal impact',
        likelihood: 'LOW'
      };
      
      const result = validateSingleFinding(minimalFinding);
      expect(result.valid).toBe(true);
    });
    
    test('should reject finding with invalid threat_id pattern', () => {
      const invalidFinding = {
        threat_id: 'THREAT-001', // Wrong pattern
        severity: 'HIGH',
        title: 'Finding',
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH'
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('threat_id');
    });
    
    test('should reject finding with invalid severity', () => {
      const invalidFinding = {
        threat_id: 'T001',
        severity: 'EXTREME', // Invalid enum
        title: 'Finding',
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH'
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
    });
    
    test('should reject finding with title too long', () => {
      const invalidFinding = {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'A'.repeat(201), // Max is 200
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH'
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
    });
    
    test('should reject finding with missing required fields', () => {
      const invalidFinding = {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'Finding'
        // Missing description, impact, likelihood
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('should reject finding with invalid remediation structure', () => {
      const invalidFinding = {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'Finding',
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH',
        remediation: {
          immediate: ['Fix now'],
          invalid_key: ['Should not be allowed'] // Additional property
        }
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Additional property');
    });
    
    test('should reject finding with non-array remediation values', () => {
      const invalidFinding = {
        threat_id: 'T001',
        severity: 'HIGH',
        title: 'Finding',
        description: 'Description',
        impact: 'Impact',
        likelihood: 'HIGH',
        remediation: {
          immediate: 'Fix now' // Should be array
        }
      };
      
      const result = validateSingleFinding(invalidFinding);
      expect(result.valid).toBe(false);
    });
    
  });
  
  // ===== SCAN INPUT VALIDATION TESTS =====
  
  describe('validateScanInputData', () => {
    
    test('should validate valid OpenClaw config', () => {
      const validInput = {
        gateway: {
          token: 'super-secret-token-here',
          bind: '127.0.0.1',
          port: 2024
        },
        sessions: {
          encryption: {
            enabled: true,
            key: 'encryption-key'
          }
        },
        tools: {
          exec: {
            policy: 'allowlist'
          }
        }
      };
      
      const result = validateScanInputData(validInput);
      expect(result.valid).toBe(true);
    });
    
    test('should validate minimal config', () => {
      const minimalInput = {
        gateway: {
          token: 'token'
        }
      };
      
      const result = validateScanInputData(minimalInput);
      expect(result.valid).toBe(true);
    });
    
    test('should reject empty config', () => {
      const emptyInput = {};
      
      const result = validateScanInputData(emptyInput);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('empty');
    });
    
    test('should reject invalid port number', () => {
      const invalidInput = {
        gateway: {
          port: 99999 // Out of valid range
        }
      };
      
      const result = validateScanInputData(invalidInput);
      expect(result.valid).toBe(false);
    });
    
    test('should reject invalid exec policy', () => {
      const invalidInput = {
        tools: {
          exec: {
            policy: 'invalid-policy'
          }
        }
      };
      
      const result = validateScanInputData(invalidInput);
      expect(result.valid).toBe(false);
    });
    
  });
  
  // ===== ERROR FORMATTING TESTS =====
  
  describe('Error formatting', () => {
    
    test('should provide clear error messages', () => {
      const invalidReport = {
        scan_id: 'wrong-format',
        // Missing other fields
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that error messages are human-readable
      result.errors.forEach(error => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      });
    });
    
    test('should include helpful context in errors', () => {
      const invalidReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report',
        findings_count: 0,
        risk_level: 'UNKNOWN'
      };
      
      const result = validateScanReport(invalidReport);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('CRITICAL');
      expect(result.errors[0].message).toContain('HIGH');
      expect(result.errors[0].message).toContain('MEDIUM');
      expect(result.errors[0].message).toContain('LOW');
    });
    
  });
  
  // ===== VALIDATEORTHROW TESTS =====
  
  describe('validateOrThrow', () => {
    
    test('should not throw for valid report', () => {
      const validReport = {
        scan_id: 'clawsec-1234567890-abc123',
        timestamp: '2026-02-06T20:00:00.000Z',
        report: 'Report content',
        findings_count: 0,
        risk_level: 'LOW'
      };
      
      expect(() => {
        validateOrThrow(validReport, 'report');
      }).not.toThrow();
    });
    
    test('should throw for invalid report', () => {
      const invalidReport = {
        scan_id: 'wrong',
        // Missing fields
      };
      
      expect(() => {
        validateOrThrow(invalidReport, 'report');
      }).toThrow(/Validation failed/);
    });
    
    test('should throw for invalid type', () => {
      expect(() => {
        validateOrThrow({}, 'unknown-type');
      }).toThrow(/Unknown validation type/);
    });
    
  });
  
});
