#!/usr/bin/env node
/**
 * ClawSec Server with X402 Payment Integration
 * 
 * USDC Hackathon Submission
 * Built by Ubik (@ClawSecAI)
 * 
 * This is the X402-integrated version. To activate:
 * 1. Install X402 SDK: npm install @x402/express @x402/evm @x402/core
 * 2. Add to .env: WALLET_ADDRESS, CDP_CLIENT_API_KEY, CDP_SECRET_API_KEY
 * 3. Replace server/index.js with this file (or merge X402 code)
 * 4. Set ENABLE_PAYMENT=true in .env
 */

require('dotenv').config();

// X402 Payment Integration
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Sentry Error Tracking (Optional)
let Sentry;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.RAILWAY_GIT_COMMIT_SHA || 'dev',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
    });
    
    console.log('✅ Sentry error tracking enabled');
  } catch (error) {
    console.warn('⚠️  Sentry SDK not installed');
    Sentry = null;
  }
} else {
  console.log('ℹ️  Sentry disabled (set SENTRY_DSN to enable)');
}

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { findExposedSecrets, calculateCredentialRisk } = require('./patterns');
const { validateScanReport, validateOrThrow } = require('./lib/validator');
const { calculateRiskScore, generateScoreSummary } = require('./lib/score-calculator');
const { buildOptimizedContext } = require('./lib/context-optimizer');
const { prioritizeFindings, generatePriorityReport } = require('./lib/recommendation-engine');
const { generateExecutiveSummary, formatExecutiveSummaryMarkdown } = require('./lib/executive-summary');

const app = express();
const PORT = process.env.PORT || 4021;

// Sentry request handler
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  req.requestId = requestId;
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'request_start',
    request_id: requestId,
    method: req.method,
    path: req.path,
    client_ip: req.ip || req.connection.remoteAddress,
    user_agent: req.get('user-agent')
  }));
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logLevel,
      type: 'request_complete',
      request_id: requestId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      response_time_ms: duration,
      ...(req.scanMetrics || {})
    }));
    
    if (Sentry && duration > 10000) {
      Sentry.captureMessage(`Slow request: ${req.method} ${req.path} (${duration}ms)`, {
        level: 'warning',
        tags: { endpoint: req.path, method: req.method },
        extra: { duration_ms: duration, status_code: res.statusCode }
      });
    }
  });
  
  next();
});

// X402 Payment Setup
const PAYMENT_ENABLED = process.env.ENABLE_PAYMENT === 'true';
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const NETWORK = process.env.NETWORK || 'base-sepolia';

// Validate X402 configuration
if (PAYMENT_ENABLED) {
  if (!WALLET_ADDRESS) {
    console.error('❌ ENABLE_PAYMENT=true but WALLET_ADDRESS not set in .env');
    console.error('   Add your Base Sepolia wallet address to .env');
    process.exit(1);
  }
  
  console.log('💰 X402 Payment Configuration:');
  console.log(`   Network: ${NETWORK}`);
  console.log(`   Wallet: ${WALLET_ADDRESS}`);
  console.log(`   Facilitator: ${process.env.FACILITATOR_URL || 'https://www.x402.org/facilitator'}`);
}

// Create X402 facilitator client and resource server
let facilitatorClient, x402Server;

if (PAYMENT_ENABLED) {
  try {
    facilitatorClient = new HTTPFacilitatorClient({
      url: process.env.FACILITATOR_URL || 'https://www.x402.org/facilitator'
    });
    
    // Determine network identifier (CAIP-2 format)
    const networkId = NETWORK === 'base-sepolia' ? 'eip155:84532' : 
                      NETWORK === 'base' ? 'eip155:8453' : 
                      'eip155:84532'; // Default to testnet
    
    x402Server = new x402ResourceServer(facilitatorClient)
      .register(networkId, new ExactEvmScheme());
    
    console.log(`✅ X402 server initialized for network: ${networkId}`);
  } catch (error) {
    console.error('❌ Failed to initialize X402:', error.message);
    console.error('   Ensure @x402/express, @x402/evm, @x402/core are installed');
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  const usedMem = totalMem - freeMem;
  
  const dependencies = {
    filesystem: checkFilesystem(),
    anthropic: checkAnthropicKey(),
    x402: PAYMENT_ENABLED ? 'enabled' : 'disabled',
    wallet: WALLET_ADDRESS ? 'configured' : 'not_configured',
    environment: process.env.NODE_ENV || 'development'
  };
  
  const allHealthy = Object.values(dependencies).every(status => 
    status === 'ok' || status === 'configured' || status === 'development' || status === 'disabled' || status === 'enabled'
  );
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'ClawSec',
    version: '0.1.0-hackathon',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    system: {
      memory: {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percentage: Math.round((usedMem / totalMem) * 100),
        heap: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024)
        }
      }
    },
    dependencies
  });
});

function checkFilesystem() {
  try {
    const threatsPath = path.join(__dirname, '..', 'threats');
    return fs.existsSync(threatsPath) ? 'ok' : 'missing';
  } catch (error) {
    return 'error';
  }
}

function checkAnthropicKey() {
  return process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';
}

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
      enabled: PAYMENT_ENABLED,
      protocol: 'X402',
      network: NETWORK,
      wallet: WALLET_ADDRESS || 'not_configured',
      pricing: {
        basic_scan: '$1.00 USDC',
        thorough_scan: '$3.00 USDC'
      }
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

// Apply X402 Payment Middleware to /api/v1/scan endpoint
if (PAYMENT_ENABLED && x402Server) {
  const networkId = NETWORK === 'base-sepolia' ? 'eip155:84532' : 
                    NETWORK === 'base' ? 'eip155:8453' : 
                    'eip155:84532';
  
  console.log('🔒 Applying X402 payment middleware to POST /api/v1/scan');
  
  app.use(
    paymentMiddleware(
      {
        'POST /api/v1/scan': {
          accepts: [
            {
              scheme: 'exact',
              price: '$1.00', // Basic scan: $1 USDC
              network: networkId,
              payTo: WALLET_ADDRESS,
            },
          ],
          description: 'AI-powered security audit for OpenClaw configurations',
          mimeType: 'application/json',
          extensions: {
            bazaar: {
              discoverable: true,
              category: 'security',
              tags: ['audit', 'openclaw', 'llm', 'web3']
            }
          }
        },
      },
      x402Server
    )
  );
  
  console.log('✅ X402 payment middleware active');
}

// Main scan endpoint
app.post('/api/v1/scan', async (req, res) => {
  const scanStartTime = Date.now();
  
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
    
    // Note: X402 middleware handles payment verification automatically
    // If we reach this point, payment has been verified (or payment is disabled)
    
    // Load threat database
    const indexPath = path.join(__dirname, '..', 'threats', 'index.json');
    const threatsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    const scanId = `clawsec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Analyze configuration
    const findings = analyzeConfiguration(scanInput, threatsIndex);
    
    // Build optimized threat context
    const modelName = process.env.LLM_MODEL || 'claude-3-5-haiku-20241022';
    const threatsDir = path.join(__dirname, '..', 'threats');
    
    const optimizedContext = buildOptimizedContext({
      scanConfig: scanInput,
      detectedThreats: findings.map(f => f.threat_id),
      threatsDir,
      modelName,
      maxContextPercent: 40
    });
    
    console.log(`Context optimization: ${optimizedContext.stats.contextTokens} tokens (${optimizedContext.stats.budgetUsedPercent}% of budget)`);
    
    // Calculate risk score
    const scoreResult = calculateRiskScore(findings, { scanType: 'config' });
    
    // Prioritize findings
    const prioritized = prioritizeFindings(findings, { scanType: 'config' });
    
    // Generate report
    const report = generateReport(scanId, scanInput, findings, threatsIndex, scoreResult, prioritized);
    
    const response = {
      scan_id: scanId,
      timestamp: new Date().toISOString(),
      report: report,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      score_confidence: scoreResult.confidence,
      findings: findings,
      prioritized_recommendations: prioritized ? {
        summary: prioritized.summary,
        rankings: prioritized.rankings.map(f => ({
          threat_id: f.threat_id,
          title: f.title,
          severity: f.severity,
          priority_level: f.priority.level,
          priority_score: f.priority.score,
          time_to_fix: f.priority.timeToFix.duration,
          reasoning: f.priority.reasoning
        }))
      } : null,
      optimization: {
        model: optimizedContext.stats.modelName,
        scan_tokens: optimizedContext.stats.scanTokens,
        context_tokens: optimizedContext.stats.contextTokens,
        total_tokens: optimizedContext.stats.totalTokens,
        categories_loaded: optimizedContext.stats.categoriesLoaded,
        categories_skipped: optimizedContext.stats.categoriesSkipped,
        budget_used_percent: optimizedContext.stats.budgetUsedPercent
      },
      payment: PAYMENT_ENABLED ? {
        protocol: 'X402',
        network: NETWORK,
        amount: '$1.00 USDC',
        status: 'verified'
      } : {
        protocol: 'X402',
        network: NETWORK,
        status: 'disabled (demo mode)'
      }
    };
    
    // Validate response
    const validation = validateScanReport(response);
    if (!validation.valid) {
      console.error('Report validation failed:', validation.errors);
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          error: 'Report validation failed',
          details: validation.errors
        });
      }
    }
    
    // Capture metrics
    const scanDuration = Date.now() - scanStartTime;
    req.scanMetrics = {
      scan_id: scanId,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      scan_duration_ms: scanDuration,
      context_tokens: optimizedContext.stats.contextTokens,
      payment_enabled: PAYMENT_ENABLED
    };
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      type: 'scan_complete',
      request_id: req.requestId,
      scan_id: scanId,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      scan_duration_ms: scanDuration,
      payment_verified: PAYMENT_ENABLED
    }));
    
    res.json(response);
    
  } catch (error) {
    console.error('Scan error:', error);
    
    if (Sentry) {
      Sentry.captureException(error, {
        tags: {
          endpoint: '/api/v1/scan',
          error_type: error.name
        },
        extra: {
          request_id: req.requestId,
          scan_input_keys: Object.keys(req.body || {})
        }
      });
    }
    
    res.status(500).json({ error: 'Scan failed', message: error.message });
  }
});

// Helper functions (analyzeConfiguration, generateReport, etc.)
// [Same as original server/index.js - imported or duplicated]

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
  
  // (Include all other security checks from original analyzeConfiguration)
  // For brevity, only showing one example - copy rest from server/index.js
  
  return findings;
}

function generateReport(scanId, config, findings, threatsIndex, scoreResult, prioritized) {
  // (Copy from original server/index.js)
  return `# OpenClaw Security Audit Report\n\n...`;
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

// Sentry error handler
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🔒 ClawSec Server v0.1.0-hackathon (X402 Integrated)`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API info: http://localhost:${PORT}/api/v1`);
    console.log(`\n💰 Payment: ${PAYMENT_ENABLED ? 'ENABLED (X402)' : 'DISABLED (demo mode)'}`);
    if (PAYMENT_ENABLED) {
      console.log(`   Network: ${NETWORK}`);
      console.log(`   Wallet: ${WALLET_ADDRESS}`);
      console.log(`   Price: $1.00 USDC (basic) / $3.00 USDC (thorough) per scan`);
    }
    console.log('');
  });
}

module.exports = app;
