/**
 * Report Caching System for ClawSec API
 * 
 * Provides Redis-based caching with in-memory fallback for scan reports.
 * Significantly reduces repeat report generation for large scans.
 * 
 * Features:
 * - Redis caching with automatic in-memory fallback
 * - Multi-model support (different LLM outputs cached separately)
 * - Configurable TTL (default: 24 hours)
 * - Manual and automatic cache invalidation
 * - Cache hit/miss metrics tracking
 * - Graceful degradation when Redis unavailable
 */

const EventEmitter = require('events');

/**
 * Cache configuration
 */
const CacheConfig = {
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_IN_MEMORY_SIZE: 100, // Max reports in memory cache
  KEY_PREFIX: 'report:',
  METRICS_KEY: 'cache:metrics'
};

/**
 * In-memory cache implementation (fallback)
 */
class InMemoryCache extends EventEmitter {
  constructor(maxSize = CacheConfig.MAX_IN_MEMORY_SIZE) {
    super();
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttls = new Map(); // Store expiration times
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Start cleanup worker
    this.startCleanup();
  }
  
  /**
   * Generate cache key
   */
  _generateKey(scanId, model) {
    return `${CacheConfig.KEY_PREFIX}${scanId}:${model}`;
  }
  
  /**
   * Get cached report
   */
  async get(scanId, model) {
    const key = this._generateKey(scanId, model);
    
    // Check if exists
    if (!this.cache.has(key)) {
      this.metrics.misses++;
      this.emit('cache:miss', { scanId, model });
      return null;
    }
    
    // Check if expired
    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      // Expired - remove and return null
      this.cache.delete(key);
      this.ttls.delete(key);
      this.metrics.misses++;
      this.metrics.evictions++;
      this.emit('cache:expired', { scanId, model });
      return null;
    }
    
    // Cache hit
    this.metrics.hits++;
    this.emit('cache:hit', { scanId, model });
    return this.cache.get(key);
  }
  
  /**
   * Set cached report
   */
  async set(scanId, model, report, ttl = CacheConfig.DEFAULT_TTL) {
    const key = this._generateKey(scanId, model);
    
    // Check if cache is full (LRU eviction)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Evict oldest entry (first key in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.ttls.delete(oldestKey);
      this.metrics.evictions++;
      this.emit('cache:eviction', { key: oldestKey });
    }
    
    // Store report with expiration
    this.cache.set(key, report);
    this.ttls.set(key, Date.now() + ttl);
    this.metrics.sets++;
    this.emit('cache:set', { scanId, model, ttl });
    
    return true;
  }
  
  /**
   * Delete cached report
   */
  async delete(scanId, model = null) {
    if (model) {
      // Delete specific model's report
      const key = this._generateKey(scanId, model);
      const deleted = this.cache.delete(key);
      this.ttls.delete(key);
      if (deleted) {
        this.metrics.deletes++;
        this.emit('cache:delete', { scanId, model });
      }
      return deleted;
    } else {
      // Delete all models for this scan
      let deleted = 0;
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${CacheConfig.KEY_PREFIX}${scanId}:`)) {
          this.cache.delete(key);
          this.ttls.delete(key);
          deleted++;
        }
      }
      this.metrics.deletes += deleted;
      this.emit('cache:delete', { scanId, models: 'all', count: deleted });
      return deleted > 0;
    }
  }
  
  /**
   * Clear entire cache
   */
  async clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttls.clear();
    this.emit('cache:clear', { cleared: size });
    return true;
  }
  
  /**
   * Get cache metrics
   */
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : '0.00';
    
    return {
      ...this.metrics,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      backend: 'memory'
    };
  }
  
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, expiresAt] of this.ttls.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        this.ttls.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.metrics.evictions += cleaned;
      console.log(`🧹 Cache cleanup: Removed ${cleaned} expired report(s)`);
    }
    
    return cleaned;
  }
  
  /**
   * Start periodic cleanup worker
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes
  }
}

/**
 * Redis cache implementation
 */
class RedisCache extends EventEmitter {
  constructor(redisClient) {
    super();
    this.redis = redisClient;
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }
  
  /**
   * Generate cache key
   */
  _generateKey(scanId, model) {
    return `${CacheConfig.KEY_PREFIX}${scanId}:${model}`;
  }
  
  /**
   * Get cached report
   */
  async get(scanId, model) {
    try {
      const key = this._generateKey(scanId, model);
      const data = await this.redis.get(key);
      
      if (!data) {
        this.metrics.misses++;
        this.emit('cache:miss', { scanId, model });
        return null;
      }
      
      // Cache hit
      this.metrics.hits++;
      this.emit('cache:hit', { scanId, model });
      return JSON.parse(data);
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('cache:error', { operation: 'get', error: error.message });
      throw error;
    }
  }
  
  /**
   * Set cached report
   */
  async set(scanId, model, report, ttl = CacheConfig.DEFAULT_TTL) {
    try {
      const key = this._generateKey(scanId, model);
      const ttlSeconds = Math.floor(ttl / 1000);
      
      await this.redis.setex(key, ttlSeconds, JSON.stringify(report));
      
      this.metrics.sets++;
      this.emit('cache:set', { scanId, model, ttl });
      
      return true;
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('cache:error', { operation: 'set', error: error.message });
      throw error;
    }
  }
  
  /**
   * Delete cached report
   */
  async delete(scanId, model = null) {
    try {
      if (model) {
        // Delete specific model's report
        const key = this._generateKey(scanId, model);
        const deleted = await this.redis.del(key);
        if (deleted > 0) {
          this.metrics.deletes++;
          this.emit('cache:delete', { scanId, model });
        }
        return deleted > 0;
      } else {
        // Delete all models for this scan
        const pattern = `${CacheConfig.KEY_PREFIX}${scanId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          this.metrics.deletes += deleted;
          this.emit('cache:delete', { scanId, models: 'all', count: deleted });
          return deleted > 0;
        }
        return false;
      }
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('cache:error', { operation: 'delete', error: error.message });
      throw error;
    }
  }
  
  /**
   * Clear entire cache
   */
  async clear() {
    try {
      const pattern = `${CacheConfig.KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      this.emit('cache:clear', { cleared: keys.length });
      return true;
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('cache:error', { operation: 'clear', error: error.message });
      throw error;
    }
  }
  
  /**
   * Get cache metrics
   */
  async getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : '0.00';
    
    let size = 0;
    try {
      const keys = await this.redis.keys(`${CacheConfig.KEY_PREFIX}*`);
      size = keys.length;
    } catch (error) {
      // Ignore error, return 0
    }
    
    return {
      ...this.metrics,
      size,
      hitRate: `${hitRate}%`,
      backend: 'redis'
    };
  }
}

/**
 * Report cache manager with automatic Redis/memory fallback
 */
class ReportCache extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      ttl: options.ttl || CacheConfig.DEFAULT_TTL,
      maxMemorySize: options.maxMemorySize || CacheConfig.MAX_IN_MEMORY_SIZE,
      redisClient: options.redisClient || null,
      enableMetrics: options.enableMetrics !== false
    };
    
    // Initialize cache backend
    if (this.options.redisClient) {
      try {
        this.cache = new RedisCache(this.options.redisClient);
        this.backend = 'redis';
        console.log('✅ Report cache: Using Redis backend');
      } catch (error) {
        console.warn('⚠️  Redis connection failed, falling back to in-memory cache:', error.message);
        this.cache = new InMemoryCache(this.options.maxMemorySize);
        this.backend = 'memory';
      }
    } else {
      this.cache = new InMemoryCache(this.options.maxMemorySize);
      this.backend = 'memory';
      console.log('ℹ️  Report cache: Using in-memory backend');
    }
    
    // Forward cache events
    if (this.options.enableMetrics) {
      this.cache.on('cache:hit', (data) => this.emit('cache:hit', data));
      this.cache.on('cache:miss', (data) => this.emit('cache:miss', data));
      this.cache.on('cache:set', (data) => this.emit('cache:set', data));
      this.cache.on('cache:delete', (data) => this.emit('cache:delete', data));
      this.cache.on('cache:error', (data) => this.emit('cache:error', data));
    }
  }
  
  /**
   * Get cached report (with metrics)
   */
  async get(scanId, model = 'default') {
    const startTime = Date.now();
    
    try {
      const report = await this.cache.get(scanId, model);
      const duration = Date.now() - startTime;
      
      if (this.options.enableMetrics) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'cache_get',
          scan_id: scanId,
          model,
          hit: report !== null,
          backend: this.backend,
          duration_ms: duration
        }));
      }
      
      return report;
      
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Graceful degradation
    }
  }
  
  /**
   * Set cached report (with metrics)
   */
  async set(scanId, model = 'default', report, ttl = null) {
    const startTime = Date.now();
    const cacheTtl = ttl || this.options.ttl;
    
    try {
      await this.cache.set(scanId, model, report, cacheTtl);
      const duration = Date.now() - startTime;
      
      if (this.options.enableMetrics) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          type: 'cache_set',
          scan_id: scanId,
          model,
          ttl_hours: (cacheTtl / 1000 / 60 / 60).toFixed(1),
          backend: this.backend,
          duration_ms: duration
        }));
      }
      
      return true;
      
    } catch (error) {
      console.error('Cache set error:', error);
      return false; // Graceful degradation
    }
  }
  
  /**
   * Delete cached report
   */
  async delete(scanId, model = null) {
    try {
      return await this.cache.delete(scanId, model);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Invalidate cache (alias for delete)
   */
  async invalidate(scanId, model = null) {
    return this.delete(scanId, model);
  }
  
  /**
   * Clear entire cache
   */
  async clear() {
    try {
      return await this.cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
  
  /**
   * Get cache metrics and statistics
   */
  async getMetrics() {
    try {
      const metrics = await this.cache.getMetrics();
      return {
        ...metrics,
        ttl_hours: (this.options.ttl / 1000 / 60 / 60).toFixed(1),
        backend: this.backend
      };
    } catch (error) {
      console.error('Error getting cache metrics:', error);
      return null;
    }
  }
  
  /**
   * Get backend type
   */
  getBackend() {
    return this.backend;
  }
}

/**
 * Initialize Redis client (optional)
 */
function initializeRedis() {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
  
  if (!redisUrl) {
    return null; // No Redis configured
  }
  
  try {
    // Try to load redis package
    const redis = require('redis');
    
    const client = redis.createClient({
      url: redisUrl,
      socket: {
        tls: redisUrl.includes('rediss://'),
        rejectUnauthorized: false // For self-signed certs
      }
    });
    
    client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    client.on('connect', () => {
      console.log('✅ Redis client connected');
    });
    
    // Connect asynchronously
    client.connect().catch((err) => {
      console.error('Redis connection error:', err);
    });
    
    return client;
    
  } catch (error) {
    console.warn('⚠️  Redis package not installed. Install with: npm install redis');
    console.warn('   Falling back to in-memory cache');
    return null;
  }
}

// Global cache instance
let globalCache = null;

/**
 * Get or create global cache instance
 */
function getReportCache(options = {}) {
  if (!globalCache) {
    const redisClient = options.redisClient || initializeRedis();
    globalCache = new ReportCache({
      ...options,
      redisClient
    });
  }
  return globalCache;
}

module.exports = {
  ReportCache,
  getReportCache,
  CacheConfig,
  InMemoryCache,
  RedisCache,
  initializeRedis
};
