/**
 * Token Counter - Estimate token usage for LLM context management
 * 
 * Uses heuristic-based estimation for cross-model compatibility:
 * - GPT models: ~4 chars per token (GPT-3.5, GPT-4)
 * - Claude models: ~3.5 chars per token (slightly more efficient)
 * - Adds safety margin for JSON formatting overhead
 */

/**
 * Model token limits and their configurations
 */
const MODEL_LIMITS = {
  // Claude models
  'claude-3-5-sonnet-20241022': {
    maxTokens: 200000,
    outputBuffer: 4096,  // Reserve for response
    charsPerToken: 3.5,
    name: 'Claude 3.5 Sonnet'
  },
  'claude-3-opus-20240229': {
    maxTokens: 200000,
    outputBuffer: 4096,
    charsPerToken: 3.5,
    name: 'Claude 3 Opus'
  },
  'claude-3-5-haiku-20241022': {
    maxTokens: 200000,
    outputBuffer: 4096,
    charsPerToken: 3.5,
    name: 'Claude 3.5 Haiku'
  },
  
  // GPT models
  'gpt-4-turbo-preview': {
    maxTokens: 128000,
    outputBuffer: 4096,
    charsPerToken: 4.0,
    name: 'GPT-4 Turbo'
  },
  'gpt-4': {
    maxTokens: 8192,
    outputBuffer: 1024,
    charsPerToken: 4.0,
    name: 'GPT-4'
  },
  'gpt-3.5-turbo': {
    maxTokens: 16384,
    outputBuffer: 1024,
    charsPerToken: 4.0,
    name: 'GPT-3.5 Turbo'
  },
  
  // Default fallback
  'default': {
    maxTokens: 100000,
    outputBuffer: 4096,
    charsPerToken: 4.0,
    name: 'Default Model'
  }
};

/**
 * Get model configuration
 * @param {string} modelName - Model identifier
 * @returns {Object} Model configuration
 */
function getModelConfig(modelName = 'default') {
  return MODEL_LIMITS[modelName] || MODEL_LIMITS['default'];
}

/**
 * Estimate token count from text
 * @param {string} text - Text to count tokens for
 * @param {string} modelName - Model identifier for accurate estimation
 * @returns {number} Estimated token count
 */
function countTokens(text, modelName = 'default') {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  const config = getModelConfig(modelName);
  const baseTokens = Math.ceil(text.length / config.charsPerToken);
  
  // Add overhead for JSON structure, markdown formatting, etc.
  const overhead = Math.ceil(baseTokens * 0.1); // 10% overhead
  
  return baseTokens + overhead;
}

/**
 * Count tokens in JSON object (serializes first)
 * @param {Object} obj - Object to count tokens for
 * @param {string} modelName - Model identifier
 * @returns {number} Estimated token count
 */
function countTokensInObject(obj, modelName = 'default') {
  if (!obj) {
    return 0;
  }
  
  try {
    const json = JSON.stringify(obj, null, 2);
    return countTokens(json, modelName);
  } catch (error) {
    console.error('Error counting tokens in object:', error);
    return 0;
  }
}

/**
 * Calculate available context budget
 * @param {string} modelName - Model identifier
 * @param {number} usedTokens - Already used tokens
 * @returns {Object} Token budget information
 */
function getContextBudget(modelName = 'default', usedTokens = 0) {
  const config = getModelConfig(modelName);
  const maxContext = config.maxTokens - config.outputBuffer;
  const available = maxContext - usedTokens;
  
  return {
    maxTokens: config.maxTokens,
    maxContext,
    outputBuffer: config.outputBuffer,
    usedTokens,
    available,
    percentUsed: Math.round((usedTokens / maxContext) * 100),
    hasRoom: available > 0
  };
}

/**
 * Check if content fits within token budget
 * @param {string|Object} content - Content to check
 * @param {number} budget - Maximum allowed tokens
 * @param {string} modelName - Model identifier
 * @returns {Object} Fit check result
 */
function fitsInBudget(content, budget, modelName = 'default') {
  const tokens = typeof content === 'string' 
    ? countTokens(content, modelName)
    : countTokensInObject(content, modelName);
  
  return {
    tokens,
    budget,
    fits: tokens <= budget,
    overflow: Math.max(0, tokens - budget),
    percentUsed: Math.round((tokens / budget) * 100)
  };
}

/**
 * Truncate text to fit within token budget
 * @param {string} text - Text to truncate
 * @param {number} maxTokens - Maximum allowed tokens
 * @param {string} modelName - Model identifier
 * @returns {Object} Truncation result
 */
function truncateToTokenLimit(text, maxTokens, modelName = 'default') {
  if (!text || typeof text !== 'string') {
    return { text: '', tokens: 0, truncated: false };
  }
  
  const currentTokens = countTokens(text, modelName);
  
  if (currentTokens <= maxTokens) {
    return { text, tokens: currentTokens, truncated: false };
  }
  
  // Estimate character limit (with 20% buffer for safety)
  const config = getModelConfig(modelName);
  const maxChars = Math.floor(maxTokens * config.charsPerToken * 0.8);
  
  // Truncate and add ellipsis
  const truncated = text.substring(0, maxChars) + '\n\n[... truncated to fit token budget ...]';
  const finalTokens = countTokens(truncated, modelName);
  
  return {
    text: truncated,
    tokens: finalTokens,
    truncated: true,
    originalTokens: currentTokens,
    saved: currentTokens - finalTokens
  };
}

/**
 * Calculate token efficiency (tokens saved vs quality maintained)
 * @param {number} originalTokens - Original token count
 * @param {number} optimizedTokens - Optimized token count
 * @returns {Object} Efficiency metrics
 */
function calculateEfficiency(originalTokens, optimizedTokens) {
  const saved = originalTokens - optimizedTokens;
  const percentSaved = Math.round((saved / originalTokens) * 100);
  const compressionRatio = (originalTokens / optimizedTokens).toFixed(2);
  
  return {
    originalTokens,
    optimizedTokens,
    saved,
    percentSaved,
    compressionRatio,
    efficient: percentSaved >= 20 // Good if saved 20%+
  };
}

/**
 * Get all available models and their limits
 * @returns {Array} Array of model configurations
 */
function getAvailableModels() {
  return Object.entries(MODEL_LIMITS)
    .filter(([key]) => key !== 'default')
    .map(([key, config]) => ({
      id: key,
      name: config.name,
      maxTokens: config.maxTokens,
      maxContext: config.maxTokens - config.outputBuffer,
      outputBuffer: config.outputBuffer
    }));
}

module.exports = {
  MODEL_LIMITS,
  getModelConfig,
  countTokens,
  countTokensInObject,
  getContextBudget,
  fitsInBudget,
  truncateToTokenLimit,
  calculateEfficiency,
  getAvailableModels
};
