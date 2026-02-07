#!/usr/bin/env node
/**
 * ClawSec PDF Export Test Suite
 * 
 * Tests PDF generation functionality with various report scenarios.
 * 
 * Usage: node test-pdf-export.js
 */

const fs = require('fs');
const path = require('path');
const { generatePDFFromScan, generateHTMLReport, generatePDFReport } = require('./server/pdf-export');
const { generateJSONReport } = require('./server/json-export');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}▶ ${testName}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`  ${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`  ${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`  ${colors.yellow}ℹ ${message}${colors.reset}`);
}

// Sample scan data (realistic ClawSec finding)
const sampleScanInput = {
  gateway: {
    token: 'test-token-123',
    bind: '0.0.0.0',
    port: 2024
  },
  sessions: {
    encryption: {
      enabled: false
    }
  },
  channels: {
    telegram: {
      bot_token: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567',
      allowed_chats: []
    }
  },
  tools: {
    exec: {
      policy: 'unrestricted'
    }
  }
};

const sampleFindings = [
  {
    threat_id: 'T001',
    severity: 'CRITICAL',
    title: 'Weak or Default Gateway Token',
    description: 'Gateway token is weak or matches common patterns',
    impact: 'Complete system compromise possible',
    likelihood: 'HIGH',
    evidence: { token_length: 16, token_pattern: 'weak' },
    remediation: {
      immediate: ['Generate strong token: openssl rand -hex 32', 'Update gateway.token in config', 'Restart gateway'],
      short_term: ['Implement token rotation policy'],
      long_term: ['Add monitoring for failed auth attempts']
    },
    priority: {
      level: 'P0',
      score: 95,
      timeToFix: {
        duration: '2 hours',
        unit: 'hours',
        deadline: new Date(Date.now() + 7200000).toISOString()
      },
      reasoning: 'Critical authentication weakness with high exploitability'
    }
  },
  {
    threat_id: 'T002',
    severity: 'HIGH',
    title: 'Public Gateway Exposure',
    description: 'Gateway bound to public interface',
    impact: 'Remote exploitation attempts possible',
    likelihood: 'MEDIUM',
    evidence: { bind_address: '0.0.0.0' },
    remediation: {
      immediate: ['Change bind to 127.0.0.1', 'Restart gateway'],
      short_term: ['Configure firewall rules', 'Set up SSH tunneling if remote access needed'],
      long_term: ['Implement IDS/IPS monitoring']
    },
    priority: {
      level: 'P1',
      score: 75,
      timeToFix: {
        duration: '4 hours',
        unit: 'hours',
        deadline: new Date(Date.now() + 14400000).toISOString()
      },
      reasoning: 'High severity issue with moderate exploitability'
    }
  },
  {
    threat_id: 'T004',
    severity: 'MEDIUM',
    title: 'Unencrypted Session Storage',
    description: 'Conversation history stored in plaintext',
    impact: 'Privacy breach if file system compromised',
    likelihood: 'MEDIUM',
    evidence: { encryption_enabled: false },
    remediation: {
      immediate: ['Generate encryption key: openssl rand -base64 32'],
      short_term: ['Enable session encryption in config', 'Restart gateway'],
      long_term: ['Implement key rotation schedule']
    },
    priority: {
      level: 'P2',
      score: 50,
      timeToFix: {
        duration: '1 day',
        unit: 'days',
        deadline: new Date(Date.now() + 86400000).toISOString()
      },
      reasoning: 'Medium severity with moderate impact on privacy'
    }
  }
];

const sampleThreatsIndex = {
  version: '0.1.0',
  count: 3,
  categories: ['authentication', 'network', 'encryption']
};

const sampleScoreResult = {
  score: 73,
  level: 'HIGH',
  confidence: 'high',
  breakdown: {
    baseScore: 75,
    contextMultiplier: 1.1,
    diminishingFactor: 0.88,
    appliedFactors: [
      {
        name: 'weak_authentication',
        multiplier: 1.2,
        description: 'Weak authentication mechanisms detected'
      },
      {
        name: 'public_exposure',
        multiplier: 1.1,
        description: 'Services exposed to public network'
      }
    ]
  }
};

const samplePrioritized = {
  summary: {
    total: 3,
    p0_critical: 1,
    p1_high: 1,
    p2_medium: 1,
    p3_low: 0
  },
  rankings: sampleFindings.map(f => ({
    threat_id: f.threat_id,
    title: f.title,
    severity: f.severity,
    priority: f.priority,
    priority_score: f.priority.score
  }))
};

const sampleOptimization = {
  model: 'claude-3-5-haiku-20241022',
  scan_tokens: 850,
  context_tokens: 12400,
  total_tokens: 13250,
  categories_loaded: 3,
  categories_skipped: 0,
  budget_used_percent: 38.5
};

// Test runner
async function runTests() {
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('   ClawSec PDF Export Test Suite', 'blue');
  log('═══════════════════════════════════════════════════\n', 'blue');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Generate JSON report (prerequisite for PDF)
    logTest('Test 1: Generate JSON Report');
    try {
      const scanId = `test-${Date.now()}`;
      const jsonReport = generateJSONReport(
        scanId,
        sampleScanInput,
        sampleFindings,
        sampleThreatsIndex,
        sampleScoreResult,
        samplePrioritized,
        sampleOptimization
      );
      
      if (!jsonReport.metadata) throw new Error('Missing metadata');
      if (!jsonReport.summary) throw new Error('Missing summary');
      if (!jsonReport.findings) throw new Error('Missing findings');
      if (jsonReport.findings.length !== 3) throw new Error('Incorrect findings count');
      
      logSuccess('JSON report generated successfully');
      logInfo(`Scan ID: ${jsonReport.metadata.scan_id}`);
      logInfo(`Findings: ${jsonReport.findings.length}`);
      logInfo(`Risk Score: ${jsonReport.summary.risk_score}/100 (${jsonReport.summary.risk_level})`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      testsFailed++;
      throw error; // Stop if JSON generation fails
    }
    
    // Test 2: Generate HTML from JSON
    logTest('Test 2: Generate HTML Report');
    try {
      const scanId = `test-html-${Date.now()}`;
      const jsonReport = generateJSONReport(
        scanId,
        sampleScanInput,
        sampleFindings,
        sampleThreatsIndex,
        sampleScoreResult,
        samplePrioritized,
        sampleOptimization
      );
      
      const html = generateHTMLReport(jsonReport);
      
      if (!html.includes('<!DOCTYPE html>')) throw new Error('Invalid HTML structure');
      if (!html.includes('ClawSec Security Audit Report')) throw new Error('Missing report title');
      if (!html.includes(scanId)) throw new Error('Missing scan ID');
      if (!html.includes('CRITICAL')) throw new Error('Missing severity badges');
      if (!html.includes('Weak or Default Gateway Token')) throw new Error('Missing finding titles');
      
      // Save HTML for inspection
      const htmlPath = path.join(__dirname, `test-report-${scanId}.html`);
      fs.writeFileSync(htmlPath, html);
      
      logSuccess('HTML report generated successfully');
      logInfo(`HTML size: ${(html.length / 1024).toFixed(2)} KB`);
      logInfo(`Saved to: ${htmlPath}`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 3: Generate PDF (full pipeline)
    logTest('Test 3: Generate PDF Report (Full Pipeline)');
    try {
      const scanId = `test-pdf-${Date.now()}`;
      
      logInfo('Generating PDF (this may take 15-30 seconds)...');
      const startTime = Date.now();
      
      const pdfBuffer = await generatePDFFromScan(
        scanId,
        sampleScanInput,
        sampleFindings,
        sampleThreatsIndex,
        sampleScoreResult,
        samplePrioritized,
        sampleOptimization,
        {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        }
      );
      
      const duration = Date.now() - startTime;
      
      if (!Buffer.isBuffer(pdfBuffer)) throw new Error('PDF is not a buffer');
      if (pdfBuffer.length === 0) throw new Error('PDF buffer is empty');
      if (!pdfBuffer.toString('latin1').startsWith('%PDF')) throw new Error('Invalid PDF format');
      
      // Save PDF for inspection
      const pdfPath = path.join(__dirname, `test-report-${scanId}.pdf`);
      fs.writeFileSync(pdfPath, pdfBuffer);
      
      logSuccess('PDF report generated successfully');
      logInfo(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      logInfo(`Generation time: ${(duration / 1000).toFixed(2)}s`);
      logInfo(`Saved to: ${pdfPath}`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      console.error(error);
      testsFailed++;
    }
    
    // Test 4: PDF with different page sizes
    logTest('Test 4: Generate PDF with Letter Size');
    try {
      const scanId = `test-letter-${Date.now()}`;
      const jsonReport = generateJSONReport(
        scanId,
        sampleScanInput,
        sampleFindings,
        sampleThreatsIndex,
        sampleScoreResult,
        samplePrioritized,
        sampleOptimization
      );
      
      logInfo('Generating Letter-sized PDF...');
      const pdfBuffer = await generatePDFReport(jsonReport, {
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '1in',
          right: '0.75in',
          bottom: '1in',
          left: '0.75in'
        }
      });
      
      if (!Buffer.isBuffer(pdfBuffer)) throw new Error('PDF is not a buffer');
      if (pdfBuffer.length === 0) throw new Error('PDF buffer is empty');
      
      logSuccess('Letter-sized PDF generated successfully');
      logInfo(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 5: Stress test with large report
    logTest('Test 5: Large Report (10 findings)');
    try {
      const scanId = `test-large-${Date.now()}`;
      
      // Generate 10 findings
      const largeFindings = [];
      for (let i = 0; i < 10; i++) {
        largeFindings.push({
          ...sampleFindings[i % 3],
          threat_id: `T${String(i + 1).padStart(3, '0')}`,
          title: `Security Issue #${i + 1}: ${sampleFindings[i % 3].title}`
        });
      }
      
      const jsonReport = generateJSONReport(
        scanId,
        sampleScanInput,
        largeFindings,
        sampleThreatsIndex,
        { ...sampleScoreResult, score: 85, level: 'CRITICAL' },
        { ...samplePrioritized, summary: { ...samplePrioritized.summary, total: 10 } },
        sampleOptimization
      );
      
      logInfo('Generating large PDF (10 findings)...');
      const startTime = Date.now();
      
      const pdfBuffer = await generatePDFReport(jsonReport);
      
      const duration = Date.now() - startTime;
      
      if (pdfBuffer.length === 0) throw new Error('PDF buffer is empty');
      
      logSuccess('Large report generated successfully');
      logInfo(`Findings: ${largeFindings.length}`);
      logInfo(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      logInfo(`Generation time: ${(duration / 1000).toFixed(2)}s`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 6: Edge case - No findings (secure system)
    logTest('Test 6: Edge Case - No Findings (Secure System)');
    try {
      const scanId = `test-secure-${Date.now()}`;
      
      const jsonReport = generateJSONReport(
        scanId,
        sampleScanInput,
        [], // No findings
        sampleThreatsIndex,
        { score: 0, level: 'SECURE', confidence: 'high', breakdown: {} },
        null,
        sampleOptimization
      );
      
      logInfo('Generating PDF for secure system...');
      const pdfBuffer = await generatePDFReport(jsonReport);
      
      if (pdfBuffer.length === 0) throw new Error('PDF buffer is empty');
      
      logSuccess('Secure system PDF generated successfully');
      logInfo(`PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      testsPassed++;
    } catch (error) {
      logError(`Failed: ${error.message}`);
      testsFailed++;
    }
    
  } catch (error) {
    console.error('\n❌ Test suite aborted due to critical failure:', error);
  }
  
  // Summary
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('   Test Results', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  log(`\nTotal Tests: ${testsPassed + testsFailed}`, 'cyan');
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, 'red');
  log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`, 
      testsFailed === 0 ? 'green' : 'yellow');
  
  if (testsFailed === 0) {
    log('✅ All tests passed! PDF export is production-ready.\n', 'green');
    return 0;
  } else {
    log('⚠️  Some tests failed. Review errors above.\n', 'red');
    return 1;
  }
}

// Run tests
if (require.main === module) {
  runTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
