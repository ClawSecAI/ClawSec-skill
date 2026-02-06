/**
 * Context Optimizer - Intelligent threat data selection for token efficiency
 * 
 * Prioritizes threat data based on:
 * 1. Severity (CRITICAL > HIGH > MEDIUM > LOW)
 * 2. Relevance to scan findings (detected issues get priority)
 * 3. Category matching (e.g., Telegram config → load channel threats)
 * 4. Token budget constraints
 * 
 * Ensures LLM receives most relevant context within token limits.
 */

const fs = require('fs');
const path = require('path');
const { countTokens, countTokensInObject, getContextBudget, truncateToTokenLimit } = require('./token-counter');

// Severity priority weights (higher = more important)
const SEVERITY_WEIGHTS = {
  'CRITICAL': 100,
  'HIGH': 50,
  'MEDIUM': 20,
  'LOW': 5
};

// Category detection patterns
const CATEGORY_PATTERNS = {
  'telegram': ['telegram', 'bot_token', 'chat_id'],
  'discord': ['discord', 'webhook', 'guild'],
  'gateway': ['gateway', 'bind', 'port', 'token'],
  'tools': ['tools', 'exec', 'policy', 'allowlist'],
  'channels': ['channels', 'messaging', 'chat'],
  'sessions': ['sessions', 'encryption', 'storage']
};

/**
 * Load threat database index
 * @param {string} threatsDir - Path to threats directory
 * @returns {Object} Threat database index
 */
function loadThreatIndex(threatsDir) {
  try {
    const indexPath = path.join(threatsDir, 'index.json');
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    console.error('Error loading threat index:', error);
    return null;
  }
}

/**
 * Load threat markdown file
 * @param {string} threatsDir - Path to threats directory
 * @param {string} filename - Threat file name
 * @returns {string} Threat content
 */
function loadThreatFile(threatsDir, filename) {
  try {
    const filePath = path.join(threatsDir, filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error loading threat file ${filename}:`, error);
    return '';
  }
}

/**
 * Detect relevant categories from scan configuration
 * @param {Object} scanConfig - Scan configuration object
 * @returns {Set} Set of relevant category names
 */
function detectRelevantCategories(scanConfig) {
  const categories = new Set(['core']); // Always include core threats
  
  const configStr = JSON.stringify(scanConfig).toLowerCase();
  
  Object.entries(CATEGORY_PATTERNS).forEach(([category, patterns]) => {
    if (patterns.some(pattern => configStr.includes(pattern))) {
      categories.add(category);
    }
  });
  
  return categories;
}

/**
 * Score threat based on severity and relevance
 * @param {Object} threat - Threat object from index
 * @param {Set} relevantCategories - Categories relevant to scan
 * @param {Array} detectedThreats - Already detected threat IDs
 * @returns {number} Priority score (higher = more important)
 */
function scoreThreat(threat, relevantCategories, detectedThreats = []) {
  let score = 0;
  
  // Base score from severity
  score += SEVERITY_WEIGHTS[threat.severity] || 0;
  
  // Boost if already detected in scan
  if (detectedThreats.includes(threat.id)) {
    score += 200; // Highest priority - already relevant
  }
  
  // Boost if category is relevant
  const threatCategory = threat.id.startsWith('T0') ? 'core' : 
                         (threat.id.includes('gateway') ? 'gateway' : 'channels');
  if (relevantCategories.has(threatCategory)) {
    score += 30;
  }
  
  return score;
}

/**
 * Select and prioritize threat categories to load
 * @param {Object} threatIndex - Threat database index
 * @param {Set} relevantCategories - Relevant categories
 * @param {Array} detectedThreats - Detected threat IDs
 * @returns {Array} Sorted array of categories with priorities
 */
function prioritizeCategories(threatIndex, relevantCategories, detectedThreats = []) {
  const categoriesWithScores = [];
  
  Object.entries(threatIndex.categories).forEach(([categoryName, categoryData]) => {
    if (!relevantCategories.has(categoryName)) {
      return; // Skip irrelevant categories
    }
    
    // Calculate average severity score for category
    const avgScore = categoryData.threats.reduce((sum, threat) => {
      return sum + scoreThreat(threat, relevantCategories, detectedThreats);
    }, 0) / categoryData.threats.length;
    
    categoriesWithScores.push({
      name: categoryName,
      data: categoryData,
      score: avgScore,
      sizeKb: categoryData.size_kb
    });
  });
  
  // Sort by score (descending)
  return categoriesWithScores.sort((a, b) => b.score - a.score);
}

/**
 * Build optimized context within token budget
 * @param {Object} options - Configuration options
 * @param {Object} options.scanConfig - Scan configuration
 * @param {Array} options.detectedThreats - Already detected threat IDs
 * @param {string} options.threatsDir - Path to threats directory
 * @param {string} options.modelName - LLM model name
 * @param {number} options.maxContextPercent - Max % of context to use for threats (default 40%)
 * @returns {Object} Optimized context with statistics
 */
function buildOptimizedContext(options) {
  const {
    scanConfig,
    detectedThreats = [],
    threatsDir,
    modelName = 'default',
    maxContextPercent = 40
  } = options;
  
  // Load threat index
  const threatIndex = loadThreatIndex(threatsDir);
  if (!threatIndex) {
    return {
      content: '',
      categories: [],
      stats: { error: 'Failed to load threat index' }
    };
  }
  
  // Calculate token budgets
  const scanTokens = countTokensInObject(scanConfig, modelName);
  const budget = getContextBudget(modelName, scanTokens);
  const threatBudget = Math.floor(budget.maxContext * (maxContextPercent / 100));
  
  // Detect relevant categories
  const relevantCategories = detectRelevantCategories(scanConfig);
  
  // Prioritize categories
  const prioritizedCategories = prioritizeCategories(threatIndex, relevantCategories, detectedThreats);
  
  // Load threat content within budget
  let contextContent = '';
  let usedTokens = 0;
  const loadedCategories = [];
  const skippedCategories = [];
  
  for (const category of prioritizedCategories) {
    const content = loadThreatFile(threatsDir, category.data.file.replace('threats/', ''));
    const contentTokens = countTokens(content, modelName);
    
    if (usedTokens + contentTokens <= threatBudget) {
      // Full category fits
      contextContent += content + '\n\n---\n\n';
      usedTokens += contentTokens;
      loadedCategories.push({
        name: category.name,
        threats: category.data.threats.length,
        tokens: contentTokens,
        truncated: false
      });
    } else {
      const remaining = threatBudget - usedTokens;
      
      if (remaining > 500) { // Only truncate if we have meaningful space
        // Truncate to fit
        const truncated = truncateToTokenLimit(content, remaining, modelName);
        contextContent += truncated.text + '\n\n---\n\n';
        usedTokens += truncated.tokens;
        loadedCategories.push({
          name: category.name,
          threats: category.data.threats.length,
          tokens: truncated.tokens,
          truncated: true,
          originalTokens: contentTokens
        });
      } else {
        // Budget exhausted
        skippedCategories.push({
          name: category.name,
          threats: category.data.threats.length,
          reason: 'token_budget_exceeded'
        });
      }
      
      break; // Budget exhausted
    }
  }
  
  // Calculate statistics
  const stats = {
    modelName,
    scanTokens,
    contextTokens: usedTokens,
    totalTokens: scanTokens + usedTokens,
    threatBudget,
    budgetUsedPercent: Math.round((usedTokens / threatBudget) * 100),
    categoriesLoaded: loadedCategories.length,
    categoriesSkipped: skippedCategories.length,
    relevantCategories: Array.from(relevantCategories),
    detectedThreatsCount: detectedThreats.length
  };
  
  return {
    content: contextContent.trim(),
    categories: loadedCategories,
    skipped: skippedCategories,
    stats
  };
}

/**
 * Build minimal context (core threats only) for emergency fallback
 * @param {string} threatsDir - Path to threats directory
 * @param {string} modelName - LLM model name
 * @returns {Object} Minimal context
 */
function buildMinimalContext(threatsDir, modelName = 'default') {
  const coreContent = loadThreatFile(threatsDir, 'core.md');
  const tokens = countTokens(coreContent, modelName);
  
  return {
    content: coreContent,
    categories: [{
      name: 'core',
      threats: 5,
      tokens,
      truncated: false
    }],
    skipped: [],
    stats: {
      modelName,
      contextTokens: tokens,
      categoriesLoaded: 1,
      categoriesSkipped: 0,
      minimal: true
    }
  };
}

/**
 * Compare context optimization efficiency
 * @param {Object} beforeStats - Stats before optimization
 * @param {Object} afterStats - Stats after optimization
 * @returns {Object} Efficiency comparison
 */
function compareEfficiency(beforeStats, afterStats) {
  const tokensSaved = beforeStats.totalTokens - afterStats.totalTokens;
  const percentSaved = Math.round((tokensSaved / beforeStats.totalTokens) * 100);
  
  return {
    before: {
      total: beforeStats.totalTokens,
      scan: beforeStats.scanTokens,
      threats: beforeStats.threatsTokens
    },
    after: {
      total: afterStats.totalTokens,
      scan: afterStats.scanTokens,
      threats: afterStats.contextTokens
    },
    savings: {
      tokens: tokensSaved,
      percent: percentSaved,
      categoriesReduced: beforeStats.categoriesLoaded - afterStats.categoriesLoaded
    },
    quality: {
      coreIncluded: afterStats.relevantCategories.includes('core'),
      relevantCategoriesLoaded: afterStats.categoriesLoaded,
      criticalThreatsIncluded: afterStats.detectedThreatsCount > 0
    }
  };
}

/**
 * Get optimization recommendations
 * @param {Object} stats - Context statistics
 * @returns {Array} Array of recommendation strings
 */
function getOptimizationRecommendations(stats) {
  const recommendations = [];
  
  if (stats.budgetUsedPercent > 90) {
    recommendations.push('⚠️ Context budget nearly exhausted. Consider reducing maxContextPercent or using a model with larger context window.');
  }
  
  if (stats.categoriesSkipped > 0) {
    recommendations.push(`ℹ️ Skipped ${stats.categoriesSkipped} categories due to token limits. Prioritization ensured most relevant threats are included.`);
  }
  
  if (stats.scanTokens > 10000) {
    recommendations.push('💡 Large scan input detected. Consider summarizing scan data before sending to LLM.');
  }
  
  if (stats.budgetUsedPercent < 50) {
    recommendations.push('✅ Plenty of context budget available. Can increase maxContextPercent if needed.');
  }
  
  return recommendations;
}

module.exports = {
  buildOptimizedContext,
  buildMinimalContext,
  detectRelevantCategories,
  prioritizeCategories,
  scoreThreat,
  compareEfficiency,
  getOptimizationRecommendations,
  loadThreatIndex
};
