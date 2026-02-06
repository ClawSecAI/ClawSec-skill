#!/usr/bin/env node
/**
 * ClawSec Server - AI-powered security audits for OpenClaw
 * 
 * USDC Hackathon Submission
 * Built by Ubik (@ClawSecAI)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4021;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ClawSec',
    version: '0.1.0-hackathon',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'ClawSec API',
    version: '0.1.0-hackathon',
    description: 'AI-powered security audits for OpenClaw',
    endpoints: {
      health: 'GET /health',
      scan: 'POST /api/v1/scan',
      threats: 'GET /api/v1/threats'
    },
    payment: {
      enabled: process.env.ENABLE_PAYMENT === 'true',
      protocol: 'X402',
      network: process.env.NETWORK || 'base-sepolia'
    },
    docs: 'https://github.com/ClawSecAI/ClawSec-skill'
  });
});

// Load threat database
app.get('/api/v1/threats', (req, res) => {
  try {
    const indexPath = path.join(__dirname, '..', 'threats', 'index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(index);
  } catch (error) {
    console.error('Error loading threat database:', error);
    res.status(500).json({ error: 'Failed to load threat database' });
  }
});

// Main scan endpoint
app.post('/api/v1/scan', async (req, res) => {
  try {
    const scanInput = req.body;
    
    // Validate input
    if (!scanInput || typeof scanInput !== 'object' || Array.isArray(scanInput)) {
      return res.status(400).json({ 
        error: 'Invalid scan input',
        expected: 'JSON object with OpenClaw configuration'
      });
    }
    
    console.log('Received scan request:', JSON.stringify(scanInput, null, 2));
    
    // Check payment (if enabled)
    if (process.env.ENABLE_PAYMENT === 'true') {
      const paymentHeader = req.headers['x-payment'];
      if (!paymentHeader) {
        return res.status(402).json({
          error: 'Payment Required',
          protocol: 'X402',
          price: '0.01 USDC',
          network: 'base-sepolia',
          instructions: 'Include X-PAYMENT header with signed payment payload'
        });
      }
      
      // TODO: Verify payment with X402 facilitator
      // For hackathon demo, accept any payment header
      console.log('Payment received (demo mode):', paymentHeader.substring(0, 20) + '...');
    }
    
    // Load threat database
    const indexPath = path.join(__dirname, '..', 'threats', 'index.json');
    const threatsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    const coreThreatPath = path.join(__dirname, '..', 'threats', 'core.md');
    const coreThreats = fs.readFileSync(coreThreatPath, 'utf8');
    
    // Generate scan ID
    const scanId = `clawsec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Analyze scan (simplified for hackathon MVP)
    const findings = analyzeConfiguration(scanInput, threatsIndex);
    
    // Generate report
    const report = generateReport(scanId, scanInput, findings, threatsIndex);
    
    // Return report
    res.json({
      scan_id: scanId,
      timestamp: new Date().toISOString(),
      report: report,
      findings_count: findings.length,
      risk_level: calculateRiskLevel(findings)
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed', message: error.message });
  }
});

/**
 * Analyze OpenClaw configuration for security issues
 */
function analyzeConfiguration(config, threatsIndex) {
  const findings = [];
  
  // Check for weak gateway token (T001)
  if (config.gateway && config.gateway.token) {
    const token = config.gateway.token;
    const isWeak = token.length < 32 || 
                   ['test', 'admin', 'password', 'token', 'secret', 'your-token-here'].some(w => token.toLowerCase().includes(w));
    
    if (isWeak) {
      findings.push({
        threat_id: 'T001',
        severity: 'CRITICAL',
        title: 'Weak or Default Gateway Token',
        description: 'Gateway token is weak or matches common patterns',
        impact: 'Complete system compromise possible',
        likelihood: 'HIGH',
        evidence: { token_length: token.length, token_pattern: 'weak' },
        remediation: {
          immediate: ['Generate strong token: openssl rand -hex 32', 'Update gateway.token in config', 'Restart gateway'],
          short_term: ['Implement token rotation policy'],
          long_term: ['Add monitoring for failed auth attempts']
        }
      });
    }
  }
  
  // Check for public gateway exposure (T002)
  if (config.gateway && config.gateway.bind) {
    const bind = config.gateway.bind;
    if (bind === '0.0.0.0' || bind.includes('.') && !bind.startsWith('127.')) {
      findings.push({
        threat_id: 'T002',
        severity: 'HIGH',
        title: 'Public Gateway Exposure',
        description: 'Gateway bound to public interface',
        impact: 'Remote exploitation attempts possible',
        likelihood: 'MEDIUM',
        evidence: { bind_address: bind },
        remediation: {
          immediate: ['Change bind to 127.0.0.1', 'Restart gateway'],
          short_term: ['Configure firewall rules', 'Set up SSH tunneling if remote access needed'],
          long_term: ['Implement IDS/IPS monitoring']
        }
      });
    }
  }
  
  // Check for unencrypted sessions (T004)
  if (!config.sessions || !config.sessions.encryption || !config.sessions.encryption.enabled) {
    findings.push({
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
    });
  }
  
  // Check for exposed secrets (T005)
  const secrets = findExposedSecrets(config);
  if (secrets.length > 0) {
    findings.push({
      threat_id: 'T005',
      severity: 'HIGH',
      title: 'Exposed Secrets in Configuration',
      description: 'API keys or tokens found in configuration',
      impact: 'Credential leakage, unauthorized service access',
      likelihood: 'HIGH',
      evidence: { exposed_keys: secrets },
      remediation: {
        immediate: ['Move all secrets to .env file', 'Add .env to .gitignore'],
        short_term: ['Rotate all exposed credentials', 'Update config to use environment variables'],
        long_term: ['Implement secrets management (Vault, etc.)']
      }
    });
  }
  
  // Check for tool policy issues (T003)
  if (config.tools && config.tools.exec) {
    if (!config.tools.exec.policy || config.tools.exec.policy === 'allow-all') {
      findings.push({
        threat_id: 'T003',
        severity: 'HIGH',
        title: 'Unrestricted Tool Execution',
        description: 'Exec tool has no restrictions configured',
        impact: 'Command injection, arbitrary code execution',
        likelihood: 'HIGH',
        evidence: { exec_policy: config.tools.exec.policy || 'none' },
        remediation: {
          immediate: ['Set exec.policy to "allowlist"', 'Define allowed commands'],
          short_term: ['Enable command approval for sensitive operations'],
          long_term: ['Implement input sanitization and validation']
        }
      });
    }
  }
  
  // Check for Telegram bot token in config (T011)
  if (config.channels?.telegram?.bot_token) {
    const token = config.channels.telegram.bot_token;
    const isHardcoded = /^\d{8,10}:[A-Za-z0-9_-]{35}$/.test(token);
    if (isHardcoded) {
      findings.push({
        threat_id: 'T011',
        severity: 'HIGH',
        title: 'Telegram Bot Token in Configuration',
        description: 'Bot token stored in plaintext config instead of environment variable',
        impact: 'Bot impersonation, message interception, spam if config leaked',
        likelihood: 'HIGH',
        evidence: { token_format: 'hardcoded', token_length: token.length },
        remediation: {
          immediate: ['Move token to .env file', 'Add .env to .gitignore'],
          short_term: ['Rotate bot token via BotFather', 'Update config to use ${TELEGRAM_BOT_TOKEN}'],
          long_term: ['Audit git history for leaked tokens', 'Implement secrets scanning']
        }
      });
    }
  }
  
  // Check for Telegram chat ID whitelist (T012)
  if (config.channels?.telegram && !config.channels.telegram.allowed_chats) {
    findings.push({
      threat_id: 'T012',
      severity: 'MEDIUM',
      title: 'No Telegram Chat ID Whitelist',
        description: 'Bot accepts messages from any user/chat',
        impact: 'Unauthorized access, resource abuse, information disclosure',
        likelihood: 'MEDIUM',
        evidence: { whitelist_configured: false },
        remediation: {
          immediate: ['Add allowed_chats list to telegram config'],
          short_term: ['Test with your chat ID only'],
          long_term: ['Implement authentication for new users']
        }
      });
  }
  
  // Check for default port (T008)
  if (config.gateway?.port === 2024) {
    findings.push({
      threat_id: 'T008',
      severity: 'LOW',
      title: 'Default Port Usage',
      description: 'Using default OpenClaw port makes system easier to discover',
      impact: 'Easier reconnaissance for attackers',
      likelihood: 'LOW',
      evidence: { port: 2024 },
      remediation: {
        immediate: [],
        short_term: ['Change to non-standard port (e.g., 8443)'],
        long_term: ['Use reverse proxy with standard HTTPS port']
      }
    });
  }
  
  // Check for rate limiting (T006)
  if (config.gateway && !config.gateway.rate_limit) {
    findings.push({
      threat_id: 'T006',
      severity: 'MEDIUM',
      title: 'No Rate Limiting',
      description: 'Gateway has no rate limiting configured',
      impact: 'Brute force attacks, API abuse, resource exhaustion',
      likelihood: 'MEDIUM',
      evidence: { rate_limit_configured: false },
      remediation: {
        immediate: [],
        short_term: ['Configure gateway rate limiting', 'Set max_requests per window'],
        long_term: ['Implement IP-based rate limiting', 'Add CAPTCHA for suspicious traffic']
      }
    });
  }
  
  return findings;
}

/**
 * Find exposed secrets in configuration
 */
function findExposedSecrets(config) {
  const secrets = [];
  const secretPatterns = [
    { name: 'API Key', pattern: /[a-zA-Z0-9]{32,}/ },
    { name: 'Bot Token', pattern: /\d{8,10}:[A-Za-z0-9_-]{35}/ },
    { name: 'Anthropic Key', pattern: /sk-ant-[a-zA-Z0-9-_]{32,}/ }
  ];
  
  const configStr = JSON.stringify(config);
  
  secretPatterns.forEach(({ name, pattern }) => {
    const matches = configStr.match(pattern);
    if (matches) {
      secrets.push({ type: name, found: true });
    }
  });
  
  return secrets;
}

/**
 * Calculate overall risk level based on findings
 */
function calculateRiskLevel(findings) {
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  
  if (criticalCount > 0) return 'CRITICAL';
  if (highCount >= 3) return 'HIGH';
  if (highCount > 0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate security report
 */
function generateReport(scanId, config, findings, threatsIndex) {
  const timestamp = new Date().toISOString();
  const riskLevel = calculateRiskLevel(findings);
  
  let report = `# OpenClaw Security Audit Report\n\n`;
  report += `**Generated**: ${timestamp}\n`;
  report += `**Scan ID**: ${scanId}\n`;
  report += `**ClawSec Version**: 0.1.0-hackathon\n\n`;
  report += `---\n\n`;
  
  // Executive Summary
  report += `## Executive Summary\n\n`;
  report += `This security audit analyzed your OpenClaw configuration and identified **${findings.length} security issues**.\n\n`;
  report += `**Overall Risk Level**: ${getRiskEmoji(riskLevel)} **${riskLevel}**\n\n`;
  
  if (findings.length > 0) {
    report += `### Key Findings\n`;
    findings.slice(0, 3).forEach(f => {
      report += `- **${f.title}** (${f.severity})\n`;
    });
    report += `\n`;
    
    report += `### Immediate Actions Required\n`;
    findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
      .slice(0, 3)
      .forEach((f, i) => {
        report += `${i + 1}. Fix **${f.title}**\n`;
      });
  } else {
    report += `No critical security issues detected. Your configuration follows security best practices.\n`;
  }
  
  report += `\n---\n\n`;
  
  // Risk Breakdown
  const counts = {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length
  };
  counts.total = findings.length || 1; // Avoid division by zero
  
  report += `## Risk Breakdown\n\n`;
  report += `| Severity | Count | Percentage |\n`;
  report += `|----------|-------|------------|\n`;
  report += `| 🔴 Critical | ${counts.critical} | ${Math.round(counts.critical / counts.total * 100)}% |\n`;
  report += `| 🟠 High     | ${counts.high} | ${Math.round(counts.high / counts.total * 100)}% |\n`;
  report += `| 🟡 Medium   | ${counts.medium} | ${Math.round(counts.medium / counts.total * 100)}% |\n`;
  report += `| 🟢 Low      | ${counts.low} | ${Math.round(counts.low / counts.total * 100)}% |\n`;
  report += `| **Total**   | **${findings.length}** | **100%** |\n\n`;
  report += `---\n\n`;
  
  // Detailed Findings
  if (findings.length > 0) {
    report += `## Detailed Findings\n\n`;
    
    findings.forEach((finding, i) => {
      report += `### ${getSeverityEmoji(finding.severity)} ${finding.severity} - ${finding.title}\n\n`;
      report += `**Threat ID**: ${finding.threat_id}\n`;
      report += `**Description**: ${finding.description}\n`;
      report += `**Impact**: ${finding.impact}\n`;
      report += `**Likelihood**: ${finding.likelihood}\n\n`;
      
      if (finding.evidence) {
        report += `**Evidence**:\n\`\`\`json\n${JSON.stringify(finding.evidence, null, 2)}\n\`\`\`\n\n`;
      }
      
      if (finding.remediation) {
        report += `**Remediation Steps**:\n\n`;
        Object.keys(finding.remediation).forEach(timeframe => {
          report += `**${capitalize(timeframe)}**:\n`;
          finding.remediation[timeframe].forEach(step => {
            report += `- [ ] ${step}\n`;
          });
          report += `\n`;
        });
      }
      
      report += `---\n\n`;
    });
  }
  
  // Next Steps
  report += `## Next Steps\n\n`;
  report += `### Immediate (Today)\n`;
  report += `1. Review and fix all CRITICAL and HIGH severity issues\n`;
  report += `2. Backup current configuration before changes\n`;
  report += `3. Test changes in non-production environment first\n\n`;
  
  report += `### This Week\n`;
  report += `1. Address remaining MEDIUM severity issues\n`;
  report += `2. Implement monitoring and alerting\n`;
  report += `3. Schedule regular security scans\n\n`;
  
  report += `---\n\n`;
  
  // Footer
  report += `*Generated by ClawSec v0.1.0-hackathon | ${timestamp}*\n`;
  report += `*For support: https://github.com/ClawSecAI/ClawSec-skill*\n`;
  
  return report;
}

function getRiskEmoji(level) {
  const map = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
  return map[level] || '⚪';
}

function getSeverityEmoji(severity) {
  return getRiskEmoji(severity);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🔒 ClawSec Server v0.1.0-hackathon`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API info: http://localhost:${PORT}/api/v1`);
    console.log(`\n💡 Payment: ${process.env.ENABLE_PAYMENT === 'true' ? 'ENABLED' : 'DISABLED (demo mode)'}`);
    console.log(`🌐 Network: ${process.env.NETWORK || 'base-sepolia'}\n`);
  });
}

module.exports = app;
