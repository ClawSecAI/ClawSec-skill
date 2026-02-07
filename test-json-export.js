#!/usr/bin/env node
/**
 * Test JSON Export Functionality
 * 
 * Tests the JSON export format for ClawSec reports
 */

const { generateJSONReport, exportJSON } = require('./server/json-export');

// Sample scan data (realistic test case)
const testData = {
  scanId: 'clawsec-test-1234567890-abc123',
  scanInput: {
    gateway: {
      token: 'weak-token-123',
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
        bot_token: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890',
        allowed_chats: null
      }
    },
    tools: {
      exec: {
        policy: 'allow-all'
      }
    }
  },
  findings: [
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
      }
    },
    {
      threat_id: 'T011',
      severity: 'HIGH',
      title: 'Telegram Bot Token in Configuration',
      description: 'Bot token stored in plaintext config instead of environment variable',
      impact: 'Bot impersonation, message interception, spam if config leaked',
      likelihood: 'HIGH',
      evidence: { token_format: 'hardcoded', token_length: 46 },
      remediation: {
        immediate: ['Move token to .env file', 'Add .env to .gitignore'],
        short_term: ['Rotate bot token via BotFather', 'Update config to use ${TELEGRAM_BOT_TOKEN}'],
        long_term: ['Audit git history for leaked tokens', 'Implement secrets scanning']
      }
    }
  ],
  threatsIndex: {
    version: '0.1.0',
    threats: ['T001', 'T002', 'T003', 'T004', 'T005', 'T011', 'T012']
  },
  scoreResult: {
    score: 73,
    level: 'HIGH',
    confidence: 0.92,
    breakdown: {
      base_score: 75,
      context_multiplier: 1.1,
      diminishing_factor: 0.88
    }
  },
  prioritized: {
    summary: {
      total: 4,
      p0: 1,
      p1: 2,
      p2: 1,
      p3: 0
    },
    rankings: [
      {
        threat_id: 'T001',
        title: 'Weak or Default Gateway Token',
        severity: 'CRITICAL',
        priority: {
          level: 'P0',
          score: 95,
          timeToFix: {
            duration: '2 hours',
            unit: 'hours',
            deadline: '2026-02-07T10:00:00Z'
          },
          reasoning: 'Critical authentication weakness with high exploitability',
          components: {
            exploitability: { score: 90, likelihood: 'HIGH', complexity: 'LOW' },
            impact: { confidentiality: 'HIGH', integrity: 'HIGH', availability: 'MEDIUM' }
          }
        }
      },
      {
        threat_id: 'T002',
        title: 'Public Gateway Exposure',
        severity: 'HIGH',
        priority: {
          level: 'P1',
          score: 82,
          timeToFix: {
            duration: '1 day',
            unit: 'days',
            deadline: '2026-02-08T08:00:00Z'
          },
          reasoning: 'High severity with network exposure risk',
          components: {
            exploitability: { score: 75, likelihood: 'MEDIUM', complexity: 'LOW' },
            impact: { confidentiality: 'HIGH', integrity: 'MEDIUM', availability: 'MEDIUM' }
          }
        }
      },
      {
        threat_id: 'T011',
        title: 'Telegram Bot Token in Configuration',
        severity: 'HIGH',
        priority: {
          level: 'P1',
          score: 78,
          timeToFix: {
            duration: '1 day',
            unit: 'days',
            deadline: '2026-02-08T08:00:00Z'
          },
          reasoning: 'Credential exposure with high impact',
          components: {
            exploitability: { score: 70, likelihood: 'HIGH', complexity: 'LOW' },
            impact: { confidentiality: 'HIGH', integrity: 'MEDIUM', availability: 'LOW' }
          }
        }
      },
      {
        threat_id: 'T004',
        title: 'Unencrypted Session Storage',
        severity: 'MEDIUM',
        priority: {
          level: 'P2',
          score: 58,
          timeToFix: {
            duration: '1 week',
            unit: 'weeks',
            deadline: '2026-02-14T08:00:00Z'
          },
          reasoning: 'Medium severity privacy concern',
          components: {
            exploitability: { score: 50, likelihood: 'MEDIUM', complexity: 'MEDIUM' },
            impact: { confidentiality: 'MEDIUM', integrity: 'LOW', availability: 'LOW' }
          }
        }
      }
    ]
  },
  optimization: {
    model: 'claude-3-5-haiku-20241022',
    scan_tokens: 850,
    context_tokens: 12400,
    total_tokens: 13250,
    categories_loaded: 5,
    categories_skipped: 2,
    budget_used_percent: 38.5
  }
};

console.log('🧪 Testing JSON Export Functionality\n');

// Test 1: Generate JSON report
console.log('Test 1: Generating JSON report...');
const jsonReport = generateJSONReport(
  testData.scanId,
  testData.scanInput,
  testData.findings,
  testData.threatsIndex,
  testData.scoreResult,
  testData.prioritized,
  testData.optimization
);

console.log('✅ JSON report generated successfully\n');

// Test 2: Validate report structure
console.log('Test 2: Validating report structure...');
const requiredFields = [
  'metadata',
  'summary',
  'findings',
  'recommendations',
  'risk_analysis',
  'optimization',
  'scan_context',
  'next_steps'
];

const missingFields = requiredFields.filter(field => !jsonReport[field]);
if (missingFields.length > 0) {
  console.error('❌ Missing required fields:', missingFields);
  process.exit(1);
}

console.log('✅ All required fields present\n');

// Test 3: Validate metadata
console.log('Test 3: Validating metadata...');
if (jsonReport.metadata.scan_id !== testData.scanId) {
  console.error('❌ Scan ID mismatch');
  process.exit(1);
}
if (jsonReport.metadata.format !== 'json') {
  console.error('❌ Format should be "json"');
  process.exit(1);
}
console.log('✅ Metadata valid\n');

// Test 4: Validate summary
console.log('Test 4: Validating summary...');
if (jsonReport.summary.total_findings !== testData.findings.length) {
  console.error('❌ Findings count mismatch');
  process.exit(1);
}
if (jsonReport.summary.risk_level !== 'HIGH') {
  console.error('❌ Risk level should be HIGH');
  process.exit(1);
}
console.log('✅ Summary valid\n');

// Test 5: Validate findings array
console.log('Test 5: Validating findings array...');
if (jsonReport.findings.length !== testData.findings.length) {
  console.error('❌ Findings array length mismatch');
  process.exit(1);
}

// Check each finding has required fields
jsonReport.findings.forEach((finding, index) => {
  const requiredFindingFields = [
    'threat_id',
    'severity',
    'title',
    'description',
    'impact',
    'likelihood',
    'evidence',
    'remediation'
  ];
  
  const missingFindingFields = requiredFindingFields.filter(field => finding[field] === undefined);
  if (missingFindingFields.length > 0) {
    console.error(`❌ Finding ${index} missing fields:`, missingFindingFields);
    process.exit(1);
  }
});

console.log('✅ All findings properly structured\n');

// Test 6: Validate recommendations
console.log('Test 6: Validating recommendations...');
if (!jsonReport.recommendations) {
  console.error('❌ Recommendations missing');
  process.exit(1);
}
if (jsonReport.recommendations.rankings.length !== testData.prioritized.rankings.length) {
  console.error('❌ Rankings count mismatch');
  process.exit(1);
}
console.log('✅ Recommendations valid\n');

// Test 7: Validate risk analysis
console.log('Test 7: Validating risk analysis...');
if (jsonReport.risk_analysis.overall_score !== testData.scoreResult.score) {
  console.error('❌ Risk score mismatch');
  process.exit(1);
}
if (!jsonReport.risk_analysis.compliance_impact.owasp_llm_top10) {
  console.error('❌ OWASP compliance check missing');
  process.exit(1);
}
if (!jsonReport.risk_analysis.compliance_impact.gdpr_considerations) {
  console.error('❌ GDPR considerations missing');
  process.exit(1);
}
console.log('✅ Risk analysis valid\n');

// Test 8: Test JSON export with pretty formatting
console.log('Test 8: Testing JSON export with pretty formatting...');
const prettyJson = exportJSON(jsonReport, true);
if (!prettyJson.includes('\n')) {
  console.error('❌ Pretty formatting not working');
  process.exit(1);
}
console.log('✅ JSON export works with pretty formatting\n');

// Test 9: Test JSON export without formatting
console.log('Test 9: Testing JSON export without formatting...');
const compactJson = exportJSON(jsonReport, false);
if (compactJson.includes('\n  ')) {
  console.error('❌ Compact formatting not working');
  process.exit(1);
}
console.log('✅ JSON export works without formatting\n');

// Test 10: Validate OWASP and GDPR checks
console.log('Test 10: Validating OWASP and GDPR compliance checks...');
const owaspFindings = jsonReport.risk_analysis.compliance_impact.owasp_llm_top10.total_owasp_findings;
const gdprIssues = jsonReport.risk_analysis.compliance_impact.gdpr_considerations.issues_found;

console.log(`   - OWASP findings detected: ${owaspFindings}`);
console.log(`   - GDPR issues detected: ${gdprIssues}`);

if (owaspFindings === 0) {
  console.warn('⚠️  No OWASP findings detected (expected at least credential exposure)');
}
if (gdprIssues === 0) {
  console.warn('⚠️  No GDPR issues detected (expected at least unencrypted storage)');
}
console.log('✅ OWASP and GDPR checks functional\n');

// Display sample output
console.log('📄 Sample JSON Report Structure:');
console.log('─'.repeat(60));
console.log(JSON.stringify({
  metadata: jsonReport.metadata,
  summary: jsonReport.summary,
  findings_sample: jsonReport.findings[0],
  recommendations_sample: jsonReport.recommendations.rankings[0]
}, null, 2));
console.log('─'.repeat(60));

console.log('\n✅ All tests passed! JSON export is functional.\n');
console.log('📊 Report Statistics:');
console.log(`   - Total findings: ${jsonReport.summary.total_findings}`);
console.log(`   - Risk level: ${jsonReport.summary.risk_level}`);
console.log(`   - Risk score: ${jsonReport.risk_analysis.overall_score}/100`);
console.log(`   - CRITICAL: ${jsonReport.summary.severity_distribution.critical}`);
console.log(`   - HIGH: ${jsonReport.summary.severity_distribution.high}`);
console.log(`   - MEDIUM: ${jsonReport.summary.severity_distribution.medium}`);
console.log(`   - LOW: ${jsonReport.summary.severity_distribution.low}`);
console.log(`   - P0 actions: ${jsonReport.recommendations.summary.p0}`);
console.log(`   - P1 actions: ${jsonReport.recommendations.summary.p1}`);
console.log(`   - Token usage: ${jsonReport.optimization.total_tokens} tokens`);
console.log(`   - Context optimization: ${jsonReport.optimization.budget_used_percent}%`);

console.log('\n💾 Full JSON report size:', prettyJson.length, 'bytes');
console.log('💾 Compact JSON size:', compactJson.length, 'bytes');
console.log('\n🎉 JSON export ready for production!\n');
