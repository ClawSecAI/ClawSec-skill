#!/usr/bin/env node
/**
 * ClawSec Server - AI-powered security audits for OpenClaw
 * 
 * USDC Hackathon Submission
 * Built by Ubik (@ClawSecAI)
 */

require('dotenv').config();

// X402 Payment Integration
const { paymentMiddleware } = require('@x402/express');
const { 
  initializePaymentServer, 
  getPaymentConfig,
  paymentTracker,
  PRICING
} = require('./payment');

// Authentication & Rate Limiting
const { requireApiKey, optionalApiKey, apiKeyStore, generateApiKey } = require('./auth');
const { 
  createScanRateLimiter, 
  createReportRateLimiter, 
  createGlobalRateLimiter,
  getRateLimitConfig 
} = require('./rate-limit');

// Job Queue for Async Processing
const { jobQueue, JobStatus, processScanJob } = require('./job-queue');

// JSON Export Module
const { generateJSONReport, exportJSON } = require('./json-export');

// PDF Export Module
const { generatePDFFromScan } = require('./pdf-export');

// OWASP LLM Top 10 Mapper
const { 
  generateOWASPCompliance, 
  generateOWASPChecklistMarkdown 
} = require('./owasp-mapper');

// Report Caching System
const { getReportCache } = require('./report-cache');

// LLM-Enhanced Analysis (Premium Tier)
const { 
  analyzePremiumTier, 
  enhanceReportWithLLM, 
  enhanceMarkdownWithLLM 
} = require('./llm-analyzer');

// Sentry Error Tracking (Optional - requires SENTRY_DSN env var)
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
      tracesSampleRate: 0.1, // Sample 10% of transactions for performance monitoring
      profilesSampleRate: 0.1,
    });
    
    console.log('✅ Sentry error tracking enabled');
  } catch (error) {
    console.warn('⚠️  Sentry SDK not installed. Run: npm install @sentry/node @sentry/profiling-node');
    Sentry = null;
  }
} else {
  console.log('ℹ️  Sentry disabled (set SENTRY_DSN to enable error tracking)');
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

// Initialize X402 payment server (if enabled)
let paymentServer = null;
let paymentConfig = null;
let payTo = null;
let network = null;

if (process.env.ENABLE_PAYMENT === 'true') {
  try {
    const paymentInit = initializePaymentServer();
    paymentServer = paymentInit.server;
    payTo = paymentInit.payTo;
    network = paymentInit.network;
    paymentConfig = getPaymentConfig(payTo, network);
    console.log('✅ X402 payment enabled');
  } catch (error) {
    console.error('❌ Failed to initialize X402 payment:', error.message);
    console.log('   Continuing in demo mode (payments disabled)');
  }
} else {
  console.log('ℹ️  X402 payment disabled (demo mode)');
}

// Initialize report cache
const reportCache = getReportCache({
  ttl: parseInt(process.env.CACHE_TTL) || 24 * 60 * 60 * 1000, // 24 hours default
  enableMetrics: true
});

// Sentry request handler (must be first middleware)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Apply global rate limiting (if enabled)
if (process.env.ENABLE_RATE_LIMIT !== 'false') {
  app.use(createGlobalRateLimiter());
  console.log('✅ Global rate limiting enabled');
} else {
  console.log('ℹ️  Global rate limiting disabled');
}

// Enhanced request logging with performance metrics
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log request start
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
    
    // Structured log for Railway/Sentry parsing
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logLevel,
      type: 'request_complete',
      request_id: requestId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      response_time_ms: duration,
      client_ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      // Add business metrics if available
      ...(req.scanMetrics || {})
    }));
    
    // Log slow requests to Sentry
    if (Sentry && duration > 10000) { // > 10 seconds
      Sentry.captureMessage(`Slow request: ${req.method} ${req.path} (${duration}ms)`, {
        level: 'warning',
        tags: {
          endpoint: req.path,
          method: req.method
        },
        extra: {
          duration_ms: duration,
          status_code: res.statusCode
        }
      });
    }
  });
  
  next();
});

// Health check - Enhanced with system metrics
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  const usedMem = totalMem - freeMem;
  
  // Check critical dependencies
  const dependencies = {
    filesystem: checkFilesystem(),
    anthropic: checkAnthropicKey(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Overall health status
  const allHealthy = Object.values(dependencies).every(status => 
    status === 'ok' || status === 'configured' || status === 'development'
  );
  
  const statusCode = allHealthy ? 200 : 503;
  
  res.status(statusCode).json({
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
      },
      cpu: {
        load: require('os').loadavg().map(l => Math.round(l * 100) / 100)
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    },
    dependencies
  });
});

// Helper: Check if threats directory exists
function checkFilesystem() {
  try {
    const threatsPath = path.join(__dirname, '..', 'threats');
    return fs.existsSync(threatsPath) ? 'ok' : 'missing';
  } catch (error) {
    return 'error';
  }
}

// Helper: Check if Anthropic API key is configured
function checkAnthropicKey() {
  return process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';
}

// API info
app.get('/api/v1', async (req, res) => {
  const cacheMetrics = await reportCache.getMetrics();
  
  res.json({
    name: 'ClawSec API',
    version: '0.1.0-hackathon',
    description: 'AI-powered security audits for OpenClaw',
    endpoints: {
      health: 'GET /health',
      info: 'GET /api/v1',
      scan: 'POST /api/v1/scan',
      report: 'GET /api/v1/report/:id',
      threats: 'GET /api/v1/threats',
      queue_stats: 'GET /api/v1/queue/stats',
      cache_stats: 'GET /api/v1/cache/stats',
      cache_invalidate: 'DELETE /api/v1/cache/:id',
      cache_clear: 'DELETE /api/v1/cache',
      payment_status: 'GET /api/payment/status/:id'
    },
    features: {
      async_processing: true,
      report_caching: true,
      rate_limiting: process.env.ENABLE_RATE_LIMIT !== 'false',
      authentication: process.env.ENABLE_AUTH !== 'false',
      payment: process.env.ENABLE_PAYMENT === 'true'
    },
    cache: {
      backend: reportCache.getBackend(),
      ttl_hours: parseFloat(cacheMetrics.ttl_hours),
      hit_rate: cacheMetrics.hitRate
    },
    payment: {
      enabled: process.env.ENABLE_PAYMENT === 'true',
      protocol: 'X402',
      network: process.env.NETWORK || 'base-sepolia'
    },
    rate_limits: getRateLimitConfig(),
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

// Apply X402 payment middleware (if enabled)
if (paymentServer && paymentConfig) {
  app.use(paymentMiddleware(paymentConfig, paymentServer));
}

// Report retrieval endpoint (async job results with caching)
app.get('/api/v1/report/:id', 
  createReportRateLimiter(), 
  optionalApiKey,
  async (req, res) => {
    try {
      const scanId = req.params.id;
      const model = req.query.model || 'default'; // Support different model outputs
      const includePdf = req.query.include_pdf === 'true'; // NEW: PDF delivery parameter
      
      // Try cache first
      const cachedReport = await reportCache.get(scanId, model);
      if (cachedReport) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'cache_hit',
          scan_id: scanId,
          model,
          source: 'cache',
          include_pdf: includePdf
        }));
        
        // Build response from cached data
        const response = {
          ...cachedReport,
          cached: true,
          cache_backend: reportCache.getBackend()
        };
        
        // NEW: Optionally include PDF in response
        if (includePdf) {
          try {
            // Extract data needed for PDF generation from cached report
            const pdfData = {
              scanId: scanId,
              findings: cachedReport.findings || [],
              riskScore: cachedReport.risk_score,
              riskLevel: cachedReport.risk_level,
              scoreResult: {
                score: cachedReport.risk_score,
                level: cachedReport.risk_level,
                confidence: cachedReport.score_confidence || 'medium',
                breakdown: {
                  baseScore: cachedReport.risk_score,
                  contextMultiplier: 1.0,
                  appliedFactors: []
                }
              },
              prioritized: cachedReport.prioritized_recommendations || null,
              optimization: cachedReport.optimization || {}
            };
            
            // Generate PDF from cached data
            const pdfBuffer = await generatePDFFromScan(
              pdfData.scanId,
              {}, // scanInput not stored in cache, use empty object
              pdfData.findings,
              {}, // threatsIndex not needed for PDF generation
              pdfData.scoreResult,
              pdfData.prioritized,
              pdfData.optimization
            );
            
            response.pdf = {
              data: pdfBuffer.toString('base64'),
              size_bytes: pdfBuffer.length,
              mime_type: 'application/pdf',
              filename: `clawsec-report-${scanId}.pdf`,
              encoding: 'base64'
            };
            
            console.log(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              type: 'pdf_generated',
              scan_id: scanId,
              pdf_size_bytes: pdfBuffer.length,
              source: 'cache'
            }));
            
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            
            // Graceful error handling - include error in response but don't fail request
            response.pdf = {
              error: 'PDF generation failed',
              message: pdfError.message,
              fallback: 'Download PDF using ?format=pdf endpoint instead'
            };
            
            // Capture in Sentry if available
            if (Sentry) {
              Sentry.captureException(pdfError, {
                tags: {
                  endpoint: '/api/v1/report/:id',
                  feature: 'pdf_delivery',
                  error_type: 'pdf_generation_failed'
                },
                extra: {
                  scan_id: scanId,
                  include_pdf: true
                }
              });
            }
          }
        }
        
        return res.status(200).json(response);
      }
      
      // Cache miss - check job queue
      const job = jobQueue.getJob(scanId);
      
      if (!job) {
        return res.status(404).json({
          error: 'Report Not Found',
          message: `No report found with ID: ${scanId}`,
          scan_id: scanId,
          note: 'Reports are kept for 1 hour in job queue after completion',
          cache_checked: true
        });
      }
      
      // Return job status and result
      const response = {
        scan_id: scanId,
        status: job.status,
        progress: job.progress,
        created_at: job.createdAt,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        expires_at: job.expiresAt,
        cached: false
      };
      
      // Include result if completed
      if (job.status === JobStatus.COMPLETED && job.result) {
        response.result = job.result;
        
        // NEW: Optionally include PDF for completed jobs
        if (includePdf && job.result.findings) {
          try {
            // Extract data from job result
            const pdfData = {
              scanId: scanId,
              findings: job.result.findings || [],
              riskScore: job.result.risk_score,
              riskLevel: job.result.risk_level,
              scoreResult: {
                score: job.result.risk_score,
                level: job.result.risk_level,
                confidence: job.result.score_confidence || 'medium',
                breakdown: {
                  baseScore: job.result.risk_score,
                  contextMultiplier: 1.0,
                  appliedFactors: []
                }
              },
              prioritized: job.result.prioritized_recommendations || null,
              optimization: job.result.optimization || {}
            };
            
            // Generate PDF
            const pdfBuffer = await generatePDFFromScan(
              pdfData.scanId,
              {},
              pdfData.findings,
              {},
              pdfData.scoreResult,
              pdfData.prioritized,
              pdfData.optimization
            );
            
            response.pdf = {
              data: pdfBuffer.toString('base64'),
              size_bytes: pdfBuffer.length,
              mime_type: 'application/pdf',
              filename: `clawsec-report-${scanId}.pdf`,
              encoding: 'base64'
            };
            
            console.log(JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              type: 'pdf_generated',
              scan_id: scanId,
              pdf_size_bytes: pdfBuffer.length,
              source: 'job_queue'
            }));
            
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            response.pdf = {
              error: 'PDF generation failed',
              message: pdfError.message
            };
          }
        }
        
        // Cache the completed result (asynchronously - don't wait)
        reportCache.set(scanId, model, response).catch(err => {
          console.error('Failed to cache report:', err);
        });
      }
      
      // Include error if failed
      if (job.status === JobStatus.FAILED && job.error) {
        response.error = job.error;
      }
      
      // Set appropriate status code
      let statusCode = 200;
      if (job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING) {
        statusCode = 202; // Accepted (still processing)
      } else if (job.status === JobStatus.FAILED) {
        statusCode = 500; // Internal error
      }
      
      res.status(statusCode).json(response);
      
    } catch (error) {
      console.error('Report retrieval error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve report', 
        message: error.message 
      });
    }
  }
);

// Job queue status endpoint (admin/debugging) with cache metrics
app.get('/api/v1/queue/stats', 
  optionalApiKey,
  async (req, res) => {
    try {
      const stats = jobQueue.getStats();
      const cacheMetrics = await reportCache.getMetrics();
      
      res.json({
        queue: 'ClawSec Job Queue',
        timestamp: new Date().toISOString(),
        stats: stats,
        cache: cacheMetrics,
        rate_limits: getRateLimitConfig()
      });
    } catch (error) {
      console.error('Queue stats error:', error);
      res.status(500).json({ error: 'Failed to get queue stats' });
    }
  }
);

// Cache management endpoints
app.get('/api/v1/cache/stats',
  optionalApiKey,
  async (req, res) => {
    try {
      const metrics = await reportCache.getMetrics();
      res.json({
        cache: 'ClawSec Report Cache',
        timestamp: new Date().toISOString(),
        metrics
      });
    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({ error: 'Failed to get cache stats' });
    }
  }
);

// Manual cache invalidation endpoint
app.delete('/api/v1/cache/:id',
  optionalApiKey,
  async (req, res) => {
    try {
      const scanId = req.params.id;
      const model = req.query.model || null;
      
      const deleted = await reportCache.invalidate(scanId, model);
      
      if (deleted) {
        res.json({
          message: 'Cache invalidated',
          scan_id: scanId,
          model: model || 'all models',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          error: 'Cache entry not found',
          scan_id: scanId
        });
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  }
);

// Clear entire cache endpoint (admin only in production)
app.delete('/api/v1/cache',
  optionalApiKey,
  async (req, res) => {
    try {
      await reportCache.clear();
      res.json({
        message: 'Cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }
);

// Main scan endpoint
app.post('/api/v1/scan', 
  createScanRateLimiter(), // Rate limiting
  optionalApiKey,          // Optional authentication
  async (req, res) => {
  const scanStartTime = Date.now();
  
  try {
    // Check if payment was verified (X402 middleware sets this)
    const paymentVerified = req.x402?.payment?.verified || false;
    const paymentData = req.x402?.payment || null;
    
    // If payment is enabled but not verified, this should not be reached
    // (X402 middleware handles 402 response automatically)
    if (process.env.ENABLE_PAYMENT === 'true' && !paymentVerified) {
      console.warn('⚠️  Payment enabled but not verified - middleware may be misconfigured');
    }
    
    const scanInput = req.body;
    
    // Validate input
    if (!scanInput || typeof scanInput !== 'object' || Array.isArray(scanInput)) {
      return res.status(400).json({ 
        error: 'Invalid scan input',
        expected: 'JSON object with OpenClaw configuration'
      });
    }
    
    console.log('Received scan request:', JSON.stringify(scanInput, null, 2));
    
    // Check if async mode requested
    const asyncMode = req.query.async === 'true' || req.headers['x-async-processing'] === 'true';
    
    // If async mode, create job and return immediately
    if (asyncMode) {
      const scanId = `clawsec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Create job in queue
      jobQueue.createJob(scanId, {
        scanInput,
        apiKey: req.apiKey,
        paymentVerified: req.x402?.payment?.verified || false
      });
      
      // Process job asynchronously (don't await)
      processScanJob(
        jobQueue, 
        scanId, 
        scanInput, 
        analyzeConfiguration, 
        generateReport
      ).catch(err => {
        console.error(`Async job ${scanId} failed:`, err);
      });
      
      // Return 202 Accepted with job ID
      return res.status(202).json({
        message: 'Scan request accepted',
        scan_id: scanId,
        status: 'pending',
        status_url: `/api/v1/report/${scanId}`,
        estimated_completion: '30-60 seconds',
        instructions: `Poll ${req.protocol}://${req.get('host')}/api/v1/report/${scanId} to get results`
      });
    }
    
    // Payment verification is handled automatically by X402 middleware (line 313)
    // If payment is enabled and required, middleware will:
    // 1. Return 402 with PAYMENT-REQUIRED header (if no payment provided)
    // 2. Verify payment with facilitator (if payment signature provided)
    // 3. Set req.x402.payment.verified = true (on successful payment)
    // This route only executes if payment was verified or payment is disabled
    
    if (paymentVerified) {
      console.log('✅ Payment verified by X402 middleware');
      if (paymentData) {
        console.log(`   Transaction: ${paymentData.transactionHash || 'pending'}`);
      }
    }
    
    // Load threat database index
    const indexPath = path.join(__dirname, '..', 'threats', 'index.json');
    const threatsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    // Generate scan ID
    const scanId = `clawsec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Analyze scan (simplified for hackathon MVP)
    const findings = analyzeConfiguration(scanInput, threatsIndex);
    
    // Build optimized threat context based on scan configuration
    // This intelligently selects relevant threats and fits within token budget
    const modelName = process.env.LLM_MODEL || 'claude-3-5-haiku-20241022';
    const threatsDir = path.join(__dirname, '..', 'threats');
    
    const optimizedContext = buildOptimizedContext({
      scanConfig: scanInput,
      detectedThreats: findings.map(f => f.threat_id),
      threatsDir,
      modelName,
      maxContextPercent: 40 // Use 40% of context window for threat intel
    });
    
    // Log optimization stats
    console.log(`Context optimization: ${optimizedContext.stats.contextTokens} tokens (${optimizedContext.stats.budgetUsedPercent}% of budget)`);
    console.log(`Categories loaded: ${optimizedContext.categories.map(c => c.name).join(', ')}`);
    if (optimizedContext.skipped.length > 0) {
      console.log(`Categories skipped: ${optimizedContext.skipped.map(s => s.name).join(', ')}`);
    }
    
    // Calculate risk score using new 0-100 scale
    const scoreResult = calculateRiskScore(findings, {
      scanType: 'config'
    });
    
    // Prioritize findings using recommendation engine
    const prioritized = prioritizeFindings(findings, {
      scanType: 'config'
    });
    
    // Generate OWASP LLM Top 10 compliance summary
    const owaspCompliance = generateOWASPCompliance(findings);
    
    // ============================================================================
    // PREMIUM TIER: LLM-Enhanced Analysis (Claude Sonnet)
    // ============================================================================
    // Detect if premium tier based on:
    // 1. Payment amount ($3) OR
    // 2. Query parameter tier=premium (for testing without payment)
    // 3. X-Tier header (for API clients)
    
    let isPremiumTier = false;
    let llmAnalysis = null;
    
    // Check query parameter (for testing)
    if (req.query.tier === 'premium') {
      isPremiumTier = true;
      console.log('✨ Premium tier detected (query parameter)');
    }
    
    // Check X-Tier header
    if (req.headers['x-tier'] === 'premium') {
      isPremiumTier = true;
      console.log('✨ Premium tier detected (X-Tier header)');
    }
    
    // Check payment amount ($3 = premium, $1 = basic)
    if (paymentVerified && paymentData) {
      // X402 payment data includes amount (e.g., "$3" or "$1")
      const paymentAmount = paymentData.amount || '';
      if (paymentAmount.includes('3')) {
        isPremiumTier = true;
        console.log('✨ Premium tier detected (payment: $3)');
      } else if (paymentAmount.includes('1')) {
        isPremiumTier = false;
        console.log('💎 Basic tier detected (payment: $1)');
      }
    }
    
    // Call LLM analysis for premium tier ONLY
    if (isPremiumTier) {
      console.log('🧠 Initiating premium tier LLM analysis...');
      try {
        llmAnalysis = await analyzePremiumTier(
          findings,
          optimizedContext,
          scoreResult,
          scanInput
        );
        
        if (llmAnalysis.available) {
          console.log(`✅ LLM analysis complete:`, {
            attack_chains: llmAnalysis.attack_chains?.length || 0,
            priorities: llmAnalysis.contextualized_priorities?.length || 0,
            recommendations: llmAnalysis.recommendations?.length || 0,
            tokens: llmAnalysis.metadata?.tokens_used || 0
          });
        } else {
          console.warn('⚠️  LLM analysis unavailable:', llmAnalysis.reason || llmAnalysis.error);
        }
      } catch (error) {
        console.error('❌ LLM analysis failed:', error.message);
        // Graceful fallback - continue with basic report
        llmAnalysis = {
          available: false,
          error: error.message,
          fallback: true
        };
      }
    } else {
      console.log('💎 Basic tier - using pattern matching only (no LLM analysis)');
    }
    
    // Generate report with prioritized recommendations and OWASP compliance
    let report = generateReport(scanId, scanInput, findings, threatsIndex, scoreResult, prioritized, owaspCompliance);
    
    // Enhance report with LLM insights if premium tier
    if (isPremiumTier && llmAnalysis) {
      report = enhanceMarkdownWithLLM(report, llmAnalysis);
    }
    
    // Build response object
    const response = {
      scan_id: scanId,
      timestamp: new Date().toISOString(),
      report: report,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score, // NEW: 0-100 normalized score
      score_confidence: scoreResult.confidence,
      findings: findings, // Include findings for validation and API consumers
      owasp_compliance: owaspCompliance ? {
        version: owaspCompliance.version,
        overall_compliance: owaspCompliance.overall_compliance,
        compliant_categories: owaspCompliance.compliant_categories,
        total_categories: owaspCompliance.total_categories,
        overall_risk: owaspCompliance.overall_risk,
        categories: owaspCompliance.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          status: cat.status,
          findings_count: cat.findings_count,
          severity_breakdown: cat.severity_breakdown
        }))
      } : null,
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
      optimization: { // Token optimization statistics
        model: optimizedContext.stats.modelName,
        scan_tokens: optimizedContext.stats.scanTokens,
        context_tokens: optimizedContext.stats.contextTokens,
        total_tokens: optimizedContext.stats.totalTokens,
        categories_loaded: optimizedContext.stats.categoriesLoaded,
        categories_skipped: optimizedContext.stats.categoriesSkipped,
        budget_used_percent: optimizedContext.stats.budgetUsedPercent
      },
      // Premium tier LLM analysis (only included if premium tier)
      ...(isPremiumTier && llmAnalysis && llmAnalysis.available ? {
        premium_tier: {
          llm_analysis: true,
          executive_summary: llmAnalysis.executive_summary,
          attack_chains: llmAnalysis.attack_chains,
          contextualized_priorities: llmAnalysis.contextualized_priorities,
          recommendations: llmAnalysis.recommendations,
          risk_factors: llmAnalysis.risk_factors,
          metadata: llmAnalysis.metadata
        }
      } : isPremiumTier ? {
        premium_tier: {
          llm_analysis: false,
          reason: llmAnalysis?.reason || llmAnalysis?.error || 'LLM analysis unavailable'
        }
      } : {})
    };
    
    // Validate response before sending
    const validation = validateScanReport(response);
    if (!validation.valid) {
      console.error('Report validation failed:', validation.errors);
      // Log error but don't fail the request in production
      // In development, you might want to throw an error
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          error: 'Report validation failed',
          details: validation.errors
        });
      }
    }
    
    // Capture business metrics for logging
    const scanDuration = Date.now() - scanStartTime;
    req.scanMetrics = {
      scan_id: scanId,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      scan_duration_ms: scanDuration,
      context_tokens: optimizedContext.stats.contextTokens,
      payment_verified: paymentVerified,
      premium_tier: isPremiumTier,
      llm_analysis: isPremiumTier && llmAnalysis?.available
    };
    
    // Record payment if verified
    if (paymentVerified && paymentData) {
      paymentTracker.record(scanId, {
        transactionHash: paymentData.transactionHash,
        amount: paymentData.amount,
        from: paymentData.from,
        to: paymentData.to,
        network: network
      });
    }
    
    // Log scan completion with business metrics
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
      context_tokens: optimizedContext.stats.contextTokens,
      model: optimizedContext.stats.modelName,
      payment_verified: paymentVerified,
      premium_tier: isPremiumTier,
      llm_analysis: isPremiumTier && llmAnalysis?.available,
      llm_tokens: llmAnalysis?.metadata?.tokens_used || 0
    }));
    
    // Check output format (default: markdown, optional: json, pdf)
    const format = req.query.format || 'markdown';
    
    if (format === 'json') {
      // Generate pure JSON report (machine-readable format)
      const jsonReport = generateJSONReport(
        scanId,
        scanInput,
        findings,
        threatsIndex,
        scoreResult,
        prioritized,
        {
          model: optimizedContext.stats.modelName,
          scan_tokens: optimizedContext.stats.scanTokens,
          context_tokens: optimizedContext.stats.contextTokens,
          total_tokens: optimizedContext.stats.totalTokens,
          categories_loaded: optimizedContext.stats.categoriesLoaded,
          categories_skipped: optimizedContext.stats.categoriesSkipped,
          budget_used_percent: optimizedContext.stats.budgetUsedPercent
        }
      );
      
      return res.json(jsonReport);
    }
    
    if (format === 'pdf') {
      // Generate PDF report (professional document format)
      try {
        const pdfBuffer = await generatePDFFromScan(
          scanId,
          scanInput,
          findings,
          threatsIndex,
          scoreResult,
          prioritized,
          {
            model: optimizedContext.stats.modelName,
            scan_tokens: optimizedContext.stats.scanTokens,
            context_tokens: optimizedContext.stats.contextTokens,
            total_tokens: optimizedContext.stats.totalTokens,
            categories_loaded: optimizedContext.stats.categoriesLoaded,
            categories_skipped: optimizedContext.stats.categoriesSkipped,
            budget_used_percent: optimizedContext.stats.budgetUsedPercent
          },
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
        
        // Set PDF response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="clawsec-report-${scanId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Log PDF generation
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'pdf_generated',
          scan_id: scanId,
          pdf_size_bytes: pdfBuffer.length,
          request_id: req.requestId
        }));
        
        return res.send(pdfBuffer);
        
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        
        // Capture PDF generation error in Sentry
        if (Sentry) {
          Sentry.captureException(pdfError, {
            tags: {
              endpoint: '/api/v1/scan',
              format: 'pdf',
              error_type: 'pdf_generation_failed'
            },
            extra: {
              scan_id: scanId,
              request_id: req.requestId
            }
          });
        }
        
        // Fallback to JSON format on PDF generation failure
        return res.status(500).json({
          error: 'PDF generation failed',
          message: pdfError.message,
          fallback: 'Try ?format=json or ?format=markdown instead'
        });
      }
    }
    
    // Default: Return standard response with markdown report
    res.json(response);
    
  } catch (error) {
    console.error('Scan error:', error);
    
    // Capture exception in Sentry with context
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
  
  // Check for exposed secrets (T005) - Enhanced detection
  const secrets = findExposedSecrets(config);
  if (secrets.length > 0) {
    // Group by severity for better reporting
    const criticalSecrets = secrets.filter(s => s.severity === 'CRITICAL');
    const highSecrets = secrets.filter(s => s.severity === 'HIGH');
    
    const overallSeverity = criticalSecrets.length > 0 ? 'CRITICAL' : 
                            highSecrets.length > 0 ? 'HIGH' : 'MEDIUM';
    
    const secretTypes = secrets.map(s => `${s.type} (${s.count}x)`).join(', ');
    
    findings.push({
      threat_id: 'T005',
      severity: overallSeverity,
      title: 'Exposed Secrets in Configuration',
      description: `Found ${secrets.length} types of hardcoded credentials: ${secretTypes}`,
      impact: 'Credential leakage, unauthorized service access, account compromise',
      likelihood: 'HIGH',
      evidence: { 
        exposed_secrets: secrets.map(s => ({
          type: s.type,
          severity: s.severity,
          count: s.count,
          sample: s.sample,
          impact: s.impact
        })),
        total_count: secrets.reduce((sum, s) => sum + s.count, 0),
        credential_risk: calculateCredentialRisk(secrets)
      },
      remediation: {
        immediate: [
          'CRITICAL: Move all secrets to .env file immediately',
          'Add .env to .gitignore',
          'Remove hardcoded credentials from config files',
          `Rotate ${secrets.filter(s => s.severity === 'CRITICAL' || s.severity === 'HIGH').length} critical/high-risk credentials`
        ],
        short_term: [
          'Update config to use environment variables (${VAR_NAME} syntax)',
          'Audit git history for leaked credentials (git log -p | grep -i "key\\|token\\|password")',
          'Revoke and rotate all exposed credentials',
          'Enable secret scanning in CI/CD pipeline'
        ],
        long_term: [
          'Implement secrets management solution (HashiCorp Vault, AWS Secrets Manager)',
          'Add pre-commit hooks to prevent credential commits (git-secrets, detect-secrets)',
          'Regular security audits and credential rotation policy',
          'Implement credential encryption at rest'
        ]
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

// findExposedSecrets now imported from patterns.js module

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
 * Generate security report with prioritized recommendations and OWASP compliance
 */
function generateReport(scanId, config, findings, threatsIndex, scoreResult, prioritized = null, owaspCompliance = null) {
  const timestamp = new Date().toISOString();
  const riskLevel = scoreResult.level;
  const riskScore = scoreResult.score;
  
  let report = `# OpenClaw Security Audit Report\n\n`;
  report += `**Generated**: ${timestamp}\n`;
  report += `**Scan ID**: ${scanId}\n`;
  report += `**ClawSec Version**: 0.1.0-hackathon\n\n`;
  report += `---\n\n`;
  
  // Executive Summary - Business-Friendly
  const executiveSummary = generateExecutiveSummary(findings, scoreResult, {
    maxBullets: 5,
    includeRecommendations: true,
    focusOnCritical: true
  });
  
  report += formatExecutiveSummaryMarkdown(executiveSummary);
  report += `**Risk Score**: **${riskScore}/100** | **Overall Risk**: ${getRiskEmoji(riskLevel)} **${riskLevel}** (${scoreResult.confidence} confidence)\n\n`;
  report += `---\n\n`;
  
  // Risk Breakdown
  const counts = {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length
  };
  counts.total = findings.length || 1; // Avoid division by zero
  
  report += `## Risk Breakdown\n\n`;
  
  // Add score details
  report += `### Risk Score Analysis\n\n`;
  report += `- **Final Score**: ${riskScore}/100\n`;
  report += `- **Base Score**: ${scoreResult.breakdown.baseScore}\n`;
  report += `- **Context Multiplier**: ${scoreResult.breakdown.contextMultiplier}x\n`;
  report += `- **Risk Level**: ${riskLevel}\n`;
  report += `- **Confidence**: ${scoreResult.confidence.toUpperCase()}\n\n`;
  
  if (scoreResult.breakdown.appliedFactors && scoreResult.breakdown.appliedFactors.length > 0) {
    report += `**Risk Factors Applied**:\n`;
    scoreResult.breakdown.appliedFactors.forEach(factor => {
      report += `- ${factor.name} (${factor.multiplier}x): ${factor.description}\n`;
    });
    report += `\n`;
  }
  
  report += `### Severity Distribution\n\n`;
  report += `| Severity | Count | Percentage |\n`;
  report += `|----------|-------|------------|\n`;
  report += `| 🔴 Critical | ${counts.critical} | ${Math.round(counts.critical / counts.total * 100)}% |\n`;
  report += `| 🟠 High     | ${counts.high} | ${Math.round(counts.high / counts.total * 100)}% |\n`;
  report += `| 🟡 Medium   | ${counts.medium} | ${Math.round(counts.medium / counts.total * 100)}% |\n`;
  report += `| 🟢 Low      | ${counts.low} | ${Math.round(counts.low / counts.total * 100)}% |\n`;
  report += `| **Total**   | **${findings.length}** | **100%** |\n\n`;
  report += `---\n\n`;
  
  // Prioritized Recommendations (if available)
  if (prioritized && findings.length > 0) {
    report += generatePriorityReport(prioritized);
  }
  
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
  
  // OWASP LLM Top 10 Compliance (if available)
  if (owaspCompliance) {
    report += generateOWASPChecklistMarkdown(owaspCompliance);
    report += `---\n\n`;
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

// Payment status endpoint
app.get('/api/payment/status/:id', (req, res) => {
  const scanId = req.params.id;
  const status = paymentTracker.getStatus(scanId);
  
  if (status.status === 'not_found') {
    return res.status(404).json({
      error: 'Payment not found',
      scan_id: scanId
    });
  }
  
  res.json({
    scan_id: scanId,
    payment: status
  });
});

// API key management endpoints (admin only in production)
app.get('/api/v1/keys', (req, res) => {
  // In production, require admin authentication
  const keys = apiKeyStore.list();
  res.json({
    keys: keys,
    count: keys.length
  });
});

app.post('/api/v1/keys/generate', (req, res) => {
  // In production, require admin authentication
  const { name = 'New API Key', tier = 'basic' } = req.body;
  
  const newKey = generateApiKey();
  apiKeyStore.addKey(newKey, { name, tier });
  
  res.status(201).json({
    message: 'API key created successfully',
    key: newKey,
    name: name,
    tier: tier,
    warning: 'Save this key securely. It will not be shown again.',
    usage: `Include in requests as: X-API-Key: ${newKey}`
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Sentry error handler (must be before other error handlers)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Capture error in Sentry if available
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔒 ClawSec Server v0.1.0-hackathon`);
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🔍 API info: http://0.0.0.0:${PORT}/api/v1`);
    console.log(`\n📋 Features:`);
    console.log(`   💡 Payment: ${process.env.ENABLE_PAYMENT === 'true' ? 'ENABLED' : 'DISABLED (demo mode)'}`);
    console.log(`   🌐 Network: ${process.env.NETWORK || 'base-sepolia'}`);
    console.log(`   🔐 Authentication: ${process.env.ENABLE_AUTH !== 'false' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⏱️  Rate Limiting: ${process.env.ENABLE_RATE_LIMIT !== 'false' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   ⚡ Async Processing: ENABLED`);
    console.log(`\n📝 Endpoints:`);
    console.log(`   POST /api/v1/scan - Submit security scan`);
    console.log(`   POST /api/v1/scan?async=true - Async scan (returns job ID)`);
    console.log(`   GET  /api/v1/report/:id - Retrieve scan results\n`);
  });
}

module.exports = app;
