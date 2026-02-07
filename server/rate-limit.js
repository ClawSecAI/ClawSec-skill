/**
 * Rate Limiting Middleware
 * 
 * Provides configurable rate limiting for ClawSec API endpoints.
 * Uses express-rate-limit with in-memory store (use Redis in production).
 */

const rateLimit = require('express-rate-limit');

/**
 * Create rate limiter for scan endpoints
 * 
 * Tier-based limits:
 * - Basic: 10 requests per 15 minutes
 * - Premium: 50 requests per 15 minutes
 * - Enterprise: 200 requests per 15 minutes
 */
function createScanRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: async (req) => {
      // Check API key tier for custom limits
      if (req.apiKey) {
        const limits = {
          basic: 10,
          premium: 50,
          enterprise: 200
        };
        return limits[req.apiKey.tier] || 10;
      }
      
      // Default limit for unauthenticated requests
      return 5;
    },
    message: async (req) => {
      const limit = req.rateLimit.limit;
      const remaining = req.rateLimit.remaining;
      const resetTime = new Date(req.rateLimit.resetTime);
      
      return {
        error: 'Rate Limit Exceeded',
        message: `You have exceeded the rate limit. Please try again later.`,
        limit: limit,
        remaining: remaining,
        reset: resetTime.toISOString(),
        tier: req.apiKey?.tier || 'unauthenticated',
        docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#rate-limits'
      };
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    
    // Key generator - use API key or IP address
    keyGenerator: (req) => {
      if (req.apiKey && req.apiKey.key) {
        return `apikey:${req.apiKey.key}`;
      }
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    
    // Skip rate limiting for health checks
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/v1';
    },
    
    // Handler for when rate limit is exceeded
    handler: (req, res) => {
      const limit = req.rateLimit.limit;
      const resetTime = new Date(req.rateLimit.resetTime);
      
      res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `You have exceeded the rate limit of ${limit} requests per 15 minutes.`,
        limit: limit,
        remaining: 0,
        reset: resetTime.toISOString(),
        tier: req.apiKey?.tier || 'unauthenticated',
        upgrade_info: req.apiKey ? null : 'Upgrade to a paid tier for higher limits',
        docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#rate-limits'
      });
    }
  });
}

/**
 * Create rate limiter for report retrieval
 * More permissive since it's just data retrieval
 */
function createReportRateLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 requests per 5 minutes
    message: {
      error: 'Rate Limit Exceeded',
      message: 'Too many report requests. Please try again later.',
      docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#rate-limits'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.apiKey && req.apiKey.key) {
        return `apikey:${req.apiKey.key}`;
      }
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });
}

/**
 * Create global rate limiter for all endpoints
 * Protects against DDoS and abuse
 */
function createGlobalRateLimiter() {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
      error: 'Too Many Requests',
      message: 'You are sending too many requests. Please slow down.',
      docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#rate-limits'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/health';
    }
  });
}

/**
 * Get rate limit configuration for different tiers
 */
function getRateLimitConfig() {
  return {
    tiers: {
      basic: {
        scan_limit: 10,
        window: '15 minutes',
        description: 'Free tier with basic limits'
      },
      premium: {
        scan_limit: 50,
        window: '15 minutes',
        description: 'Paid tier with increased limits'
      },
      enterprise: {
        scan_limit: 200,
        window: '15 minutes',
        description: 'Enterprise tier with highest limits'
      }
    },
    global: {
      limit: 100,
      window: '1 minute',
      description: 'Global rate limit for all endpoints'
    },
    report_retrieval: {
      limit: 50,
      window: '5 minutes',
      description: 'Rate limit for report retrieval'
    }
  };
}

module.exports = {
  createScanRateLimiter,
  createReportRateLimiter,
  createGlobalRateLimiter,
  getRateLimitConfig
};
