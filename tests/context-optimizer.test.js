/**
 * Context Optimizer Tests
 * 
 * Validates intelligent threat selection and prioritization
 */

const path = require('path');
const {
  buildOptimizedContext,
  buildMinimalContext,
  detectRelevantCategories,
  prioritizeCategories,
  scoreThreat,
  compareEfficiency,
  getOptimizationRecommendations,
  loadThreatIndex
} = require('../server/lib/context-optimizer');

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
  console.log(`✅ ${message}`);
}

function testGroup(name, testFn) {
  console.log(`\n📦 ${name}`);
  try {
    testFn();
  } catch (error) {
    console.error(`❌ Test group failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Sample configurations
const basicConfig = {
  gateway: {
    token: 'test-token',
    bind: '0.0.0.0',
    port: 2024
  }
};

const telegramConfig = {
  gateway: {
    token: 'secure-token-1234567890',
    bind: '127.0.0.1',
    port: 8443
  },
  channels: {
    telegram: {
      bot_token: '123456789:ABCdefGHI',
      allowed_chats: [123456789]
    }
  }
};

const complexConfig = {
  gateway: {
    token: 'my-token',
    bind: '0.0.0.0',
    port: 2024,
    rate_limit: {
      enabled: false
    }
  },
  channels: {
    telegram: {
      bot_token: '123456789:ABCdef',
      allowed_chats: []
    },
    discord: {
      webhook_url: 'https://discord.com/api/webhooks/123/abc'
    }
  },
  tools: {
    exec: {
      policy: 'allow-all'
    }
  },
  sessions: {
    encryption: {
      enabled: false
    }
  }
};

const threatsDir = path.join(__dirname, '..', 'threats');

// Run tests
console.log('🧪 Context Optimizer Test Suite\n');

testGroup('Threat Index Loading', () => {
  const index = loadThreatIndex(threatsDir);
  
  assert(index !== null, 'Threat index loaded successfully');
  assert(index.version, 'Index has version');
  assert(index.threat_count > 0, 'Index has threats');
  assert(Object.keys(index.categories).length > 0, 'Index has categories');
  assert(index.categories.core, 'Core category exists');
  
  console.log(`  ℹ️  Loaded ${index.threat_count} threats across ${Object.keys(index.categories).length} categories`);
});

testGroup('Category Detection', () => {
  // Basic config should detect core + gateway
  const basicCategories = detectRelevantCategories(basicConfig);
  assert(basicCategories.has('core'), 'Core always detected');
  assert(basicCategories.has('gateway'), 'Gateway detected from config');
  
  // Telegram config should detect channels
  const telegramCategories = detectRelevantCategories(telegramConfig);
  assert(telegramCategories.has('telegram'), 'Telegram detected');
  assert(telegramCategories.has('channels'), 'Channels detected');
  
  // Complex config should detect multiple
  const complexCategories = detectRelevantCategories(complexConfig);
  assert(complexCategories.has('telegram'), 'Telegram detected in complex');
  assert(complexCategories.has('discord'), 'Discord detected in complex');
  assert(complexCategories.has('tools'), 'Tools detected in complex');
  assert(complexCategories.has('sessions'), 'Sessions detected in complex');
  
  console.log(`  ℹ️  Basic: ${Array.from(basicCategories).join(', ')}`);
  console.log(`  ℹ️  Telegram: ${Array.from(telegramCategories).join(', ')}`);
  console.log(`  ℹ️  Complex: ${Array.from(complexCategories).join(', ')}`);
});

testGroup('Threat Scoring', () => {
  const criticalThreat = { id: 'T001', severity: 'CRITICAL' };
  const highThreat = { id: 'T002', severity: 'HIGH' };
  const mediumThreat = { id: 'T004', severity: 'MEDIUM' };
  const lowThreat = { id: 'T008', severity: 'LOW' };
  
  const relevantCategories = new Set(['core', 'gateway']);
  
  const criticalScore = scoreThreat(criticalThreat, relevantCategories);
  const highScore = scoreThreat(highThreat, relevantCategories);
  const mediumScore = scoreThreat(mediumThreat, relevantCategories);
  const lowScore = scoreThreat(lowThreat, relevantCategories);
  
  assert(criticalScore > highScore, 'Critical scored higher than high');
  assert(highScore > mediumScore, 'High scored higher than medium');
  assert(mediumScore > lowScore, 'Medium scored higher than low');
  
  // Test detected threat boost
  const detectedScore = scoreThreat(criticalThreat, relevantCategories, ['T001']);
  assert(detectedScore > criticalScore, 'Detected threats get priority boost');
  
  console.log(`  ℹ️  Scores: CRITICAL=${criticalScore}, HIGH=${highScore}, MEDIUM=${mediumScore}, LOW=${lowScore}`);
  console.log(`  ℹ️  Detected boost: ${criticalScore} → ${detectedScore}`);
});

testGroup('Category Prioritization', () => {
  const index = loadThreatIndex(threatsDir);
  const categories = new Set(['core', 'gateway', 'channels']);
  
  const prioritized = prioritizeCategories(index, categories);
  
  assert(prioritized.length > 0, 'Categories prioritized');
  assert(prioritized[0].name === 'core', 'Core is highest priority');
  assert(prioritized.every(c => c.score > 0), 'All categories have scores');
  assert(prioritized[0].score >= prioritized[prioritized.length - 1].score, 'Sorted by score descending');
  
  console.log(`  ℹ️  Priority order: ${prioritized.map(c => `${c.name}(${c.score})`).join(' > ')}`);
});

testGroup('Optimized Context Building - Basic', () => {
  const result = buildOptimizedContext({
    scanConfig: basicConfig,
    threatsDir,
    modelName: 'claude-3-5-haiku-20241022',
    maxContextPercent: 40
  });
  
  assert(result.content.length > 0, 'Context content generated');
  assert(result.categories.length > 0, 'Categories loaded');
  assert(result.stats.categoriesLoaded > 0, 'Statistics tracked');
  assert(result.stats.scanTokens > 0, 'Scan tokens counted');
  assert(result.stats.contextTokens > 0, 'Context tokens counted');
  assert(result.stats.budgetUsedPercent <= 100, 'Budget percent reasonable');
  
  console.log(`  ℹ️  Stats:`);
  console.log(`      Scan: ${result.stats.scanTokens} tokens`);
  console.log(`      Context: ${result.stats.contextTokens} tokens`);
  console.log(`      Total: ${result.stats.totalTokens} tokens`);
  console.log(`      Budget used: ${result.stats.budgetUsedPercent}%`);
  console.log(`      Categories: ${result.stats.categoriesLoaded} loaded, ${result.stats.categoriesSkipped} skipped`);
});

testGroup('Optimized Context Building - Complex', () => {
  const result = buildOptimizedContext({
    scanConfig: complexConfig,
    detectedThreats: ['T001', 'T003', 'T005'], // Pre-detected threats
    threatsDir,
    modelName: 'claude-3-5-sonnet-20241022',
    maxContextPercent: 40
  });
  
  assert(result.content.length > 0, 'Context generated for complex config');
  assert(result.categories.length > 0, 'Multiple categories loaded');
  assert(result.stats.detectedThreatsCount === 3, 'Detected threats tracked');
  assert(result.stats.relevantCategories.length >= 3, 'Multiple relevant categories detected');
  
  // Check that core threats are included
  assert(result.content.includes('T001'), 'Core threat T001 included');
  
  console.log(`  ℹ️  Complex scan results:`);
  console.log(`      Relevant categories: ${result.stats.relevantCategories.join(', ')}`);
  console.log(`      Detected threats: ${result.stats.detectedThreatsCount}`);
  console.log(`      Loaded: ${result.categories.map(c => c.name).join(', ')}`);
  console.log(`      Context: ${result.stats.contextTokens} tokens (${result.stats.budgetUsedPercent}% of budget)`);
});

testGroup('Token Budget Constraints', () => {
  // Test with tight budget (10% instead of 40%)
  const tightBudget = buildOptimizedContext({
    scanConfig: complexConfig,
    threatsDir,
    modelName: 'gpt-3.5-turbo', // Smaller context window
    maxContextPercent: 10
  });
  
  // Test with generous budget
  const generousBudget = buildOptimizedContext({
    scanConfig: complexConfig,
    threatsDir,
    modelName: 'claude-3-5-sonnet-20241022',
    maxContextPercent: 60
  });
  
  assert(tightBudget.categories.length <= generousBudget.categories.length, 
    'Tight budget loads fewer categories');
  assert(tightBudget.stats.contextTokens < generousBudget.stats.contextTokens,
    'Tight budget uses fewer tokens');
  
  console.log(`  ℹ️  Tight budget (10%): ${tightBudget.categories.length} categories, ${tightBudget.stats.contextTokens} tokens`);
  console.log(`  ℹ️  Generous budget (60%): ${generousBudget.categories.length} categories, ${generousBudget.stats.contextTokens} tokens`);
});

testGroup('Minimal Context Fallback', () => {
  const minimal = buildMinimalContext(threatsDir, 'claude-3-5-haiku-20241022');
  
  assert(minimal.content.length > 0, 'Minimal context has content');
  assert(minimal.categories.length === 1, 'Only one category (core)');
  assert(minimal.categories[0].name === 'core', 'Core category loaded');
  assert(minimal.stats.minimal === true, 'Marked as minimal');
  
  console.log(`  ℹ️  Minimal context: ${minimal.categories[0].threats} threats, ${minimal.categories[0].tokens} tokens`);
});

testGroup('Efficiency Comparison', () => {
  // Simulate "before" (loading all threats) vs "after" (optimized)
  const beforeStats = {
    scanTokens: 500,
    threatsTokens: 8000,
    totalTokens: 8500,
    categoriesLoaded: 3
  };
  
  const afterStats = {
    scanTokens: 500,
    contextTokens: 4500,
    totalTokens: 5000,
    categoriesLoaded: 2,
    relevantCategories: ['core', 'gateway']
  };
  
  const efficiency = compareEfficiency(beforeStats, afterStats);
  
  assert(efficiency.savings.tokens === 3500, 'Correct tokens saved');
  assert(efficiency.savings.percent === 41, 'Correct percent saved');
  assert(efficiency.quality.coreIncluded === true, 'Core quality maintained');
  assert(efficiency.savings.categoriesReduced === 1, 'One category reduced');
  
  console.log(`  ℹ️  Efficiency gains:`);
  console.log(`      Tokens saved: ${efficiency.savings.tokens} (${efficiency.savings.percent}%)`);
  console.log(`      Compression: ${efficiency.compressionRatio}x`);
  console.log(`      Categories reduced: ${efficiency.savings.categoriesReduced}`);
});

testGroup('Optimization Recommendations', () => {
  // Test high usage
  const highUsage = {
    budgetUsedPercent: 95,
    categoriesSkipped: 2,
    scanTokens: 5000
  };
  const highRecs = getOptimizationRecommendations(highUsage);
  assert(highRecs.length > 0, 'Recommendations generated for high usage');
  assert(highRecs.some(r => r.includes('exhausted')), 'Warning about budget exhaustion');
  
  // Test low usage
  const lowUsage = {
    budgetUsedPercent: 30,
    categoriesSkipped: 0,
    scanTokens: 500
  };
  const lowRecs = getOptimizationRecommendations(lowUsage);
  assert(lowRecs.some(r => r.includes('Plenty')), 'Positive feedback for low usage');
  
  console.log(`  ℹ️  High usage recommendations: ${highRecs.length} items`);
  console.log(`  ℹ️  Low usage recommendations: ${lowRecs.length} items`);
});

testGroup('Model Comparison', () => {
  // Compare same config across different models
  const models = [
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'gpt-4-turbo-preview'
  ];
  
  const results = models.map(model => {
    const result = buildOptimizedContext({
      scanConfig: complexConfig,
      threatsDir,
      modelName: model,
      maxContextPercent: 40
    });
    return {
      model,
      tokens: result.stats.contextTokens,
      categories: result.stats.categoriesLoaded
    };
  });
  
  console.log(`  ℹ️  Model comparison for same config:`);
  results.forEach(r => {
    console.log(`      ${r.model}: ${r.tokens} tokens, ${r.categories} categories`);
  });
  
  // Claude models should be more efficient (lower token count for same content)
  const claudeResult = results.find(r => r.model.includes('claude'));
  const gptResult = results.find(r => r.model.includes('gpt'));
  assert(claudeResult.tokens < gptResult.tokens, 'Claude models more token-efficient');
});

testGroup('Real-World Scenario', () => {
  // Simulate a typical ClawSec scan
  const realWorldConfig = {
    gateway: {
      token: 'production-token-abc123def456',
      bind: '0.0.0.0',
      port: 2024
    },
    channels: {
      telegram: {
        bot_token: '987654321:XYZabcDEFghiJKLmno',
        allowed_chats: []
      }
    },
    tools: {
      exec: {
        policy: 'allowlist',
        commands: ['ls', 'cat', 'grep']
      }
    }
  };
  
  const detectedThreats = ['T001', 'T002', 'T012']; // Weak token, public bind, no whitelist
  
  const optimized = buildOptimizedContext({
    scanConfig: realWorldConfig,
    detectedThreats,
    threatsDir,
    modelName: 'claude-3-5-haiku-20241022',
    maxContextPercent: 40
  });
  
  assert(optimized.content.includes('T001'), 'Detected threat T001 included');
  assert(optimized.content.includes('T002'), 'Detected threat T002 included');
  assert(optimized.stats.detectedThreatsCount === 3, 'All detected threats tracked');
  
  const recommendations = getOptimizationRecommendations(optimized.stats);
  
  console.log(`  ℹ️  Real-world scan results:`);
  console.log(`      Model: ${optimized.stats.modelName}`);
  console.log(`      Scan: ${optimized.stats.scanTokens} tokens`);
  console.log(`      Context: ${optimized.stats.contextTokens} tokens`);
  console.log(`      Total: ${optimized.stats.totalTokens} tokens`);
  console.log(`      Detected threats: ${optimized.stats.detectedThreatsCount}`);
  console.log(`      Categories: ${optimized.categories.map(c => c.name).join(', ')}`);
  console.log(`      Budget usage: ${optimized.stats.budgetUsedPercent}%`);
  console.log(`      Recommendations: ${recommendations.length} items`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ All context optimizer tests passed!');
console.log('='.repeat(60));
