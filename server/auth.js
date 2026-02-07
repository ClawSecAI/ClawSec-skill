/**
 * API Key Authentication System
 * 
 * Provides simple API key authentication for ClawSec endpoints.
 * Keys are stored in environment variables or a configuration file.
 */

const crypto = require('crypto');

/**
 * In-memory API key store
 * In production, use a database like Redis or PostgreSQL
 */
class ApiKeyStore {
  constructor() {
    this.keys = new Map();
    this.usage = new Map(); // Track usage stats per key
    
    // Load keys from environment
    this.loadKeysFromEnv();
  }
  
  /**
   * Load API keys from environment variables
   * Format: CLAWSEC_API_KEY_1=key:name:tier
   */
  loadKeysFromEnv() {
    const envVars = Object.keys(process.env).filter(k => k.startsWith('CLAWSEC_API_KEY_'));
    
    envVars.forEach(envVar => {
      const value = process.env[envVar];
      const [key, name = 'unknown', tier = 'basic'] = value.split(':');
      
      if (key && key.length >= 32) {
        this.addKey(key, {
          name,
          tier, // basic, premium, enterprise
          createdAt: new Date().toISOString()
        });
      }
    });
    
    // If no keys configured, create a demo key (development only)
    if (this.keys.size === 0 && process.env.NODE_ENV === 'development') {
      const demoKey = 'demo-key-12345678901234567890123456789012';
      this.addKey(demoKey, {
        name: 'Demo Key',
        tier: 'basic',
        createdAt: new Date().toISOString()
      });
      console.log('⚠️  Using demo API key (development mode)');
      console.log(`   X-API-Key: ${demoKey}`);
    }
    
    console.log(`✅ Loaded ${this.keys.size} API key(s)`);
  }
  
  /**
   * Add an API key
   */
  addKey(key, metadata = {}) {
    this.keys.set(key, {
      ...metadata,
      enabled: true,
      lastUsed: null
    });
    this.usage.set(key, {
      requests: 0,
      lastRequest: null
    });
  }
  
  /**
   * Validate an API key
   */
  validate(key) {
    if (!key) return null;
    
    const keyData = this.keys.get(key);
    if (!keyData || !keyData.enabled) return null;
    
    // Update usage stats
    const usage = this.usage.get(key);
    usage.requests++;
    usage.lastRequest = new Date().toISOString();
    keyData.lastUsed = usage.lastRequest;
    
    return keyData;
  }
  
  /**
   * Disable an API key
   */
  disable(key) {
    const keyData = this.keys.get(key);
    if (keyData) {
      keyData.enabled = false;
      return true;
    }
    return false;
  }
  
  /**
   * Get usage stats for a key
   */
  getUsage(key) {
    return this.usage.get(key) || { requests: 0, lastRequest: null };
  }
  
  /**
   * List all keys (without exposing full key)
   */
  list() {
    const keys = [];
    for (const [key, data] of this.keys.entries()) {
      keys.push({
        key_preview: `${key.substring(0, 8)}...${key.substring(key.length - 4)}`,
        name: data.name,
        tier: data.tier,
        enabled: data.enabled,
        lastUsed: data.lastUsed,
        usage: this.usage.get(key)
      });
    }
    return keys;
  }
}

// Global key store instance
const apiKeyStore = new ApiKeyStore();

/**
 * Express middleware for API key authentication
 * 
 * Usage:
 *   app.use('/api/v1', requireApiKey);
 *   app.post('/api/v1/scan', requireApiKey, handler);
 */
function requireApiKey(req, res, next) {
  // Skip auth if disabled
  if (process.env.ENABLE_AUTH === 'false') {
    return next();
  }
  
  // Extract API key from header or query param
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Missing API key. Include X-API-Key header or api_key query parameter.',
      docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#authentication'
    });
  }
  
  // Validate key
  const keyData = apiKeyStore.validate(apiKey);
  
  if (!keyData) {
    return res.status(403).json({
      error: 'Invalid API Key',
      message: 'The provided API key is invalid or has been disabled.',
      docs: 'https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md#authentication'
    });
  }
  
  // Attach key metadata to request
  req.apiKey = {
    key: apiKey,
    name: keyData.name,
    tier: keyData.tier
  };
  
  next();
}

/**
 * Optional authentication middleware
 * Validates key if provided, but doesn't require it
 */
function optionalApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (apiKey) {
    const keyData = apiKeyStore.validate(apiKey);
    if (keyData) {
      req.apiKey = {
        key: apiKey,
        name: keyData.name,
        tier: keyData.tier
      };
    }
  }
  
  next();
}

/**
 * Generate a new API key
 */
function generateApiKey() {
  return 'clawsec-' + crypto.randomBytes(32).toString('hex');
}

module.exports = {
  apiKeyStore,
  requireApiKey,
  optionalApiKey,
  generateApiKey
};
