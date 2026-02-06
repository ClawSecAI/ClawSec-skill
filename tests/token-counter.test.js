/**
 * Token Counter Tests
 * 
 * Validates token counting accuracy and model-specific configurations
 */

const {
  countTokens,
  countTokensInObject,
  getContextBudget,
  fitsInBudget,
  truncateToTokenLimit,
  calculateEfficiency,
  getModelConfig,
  getAvailableModels
} = require('../server/lib/token-counter');

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
    process.exit(1);
  }
}

// Sample texts
const SHORT_TEXT = 'This is a short test string.';
const MEDIUM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
const LONG_TEXT = 'The quick brown fox jumps over the lazy dog. '.repeat(100);

// Run tests
console.log('🧪 Token Counter Test Suite\n');

testGroup('Model Configuration', () => {
  // Test Claude model config
  const claudeConfig = getModelConfig('claude-3-5-sonnet-20241022');
  assert(claudeConfig.maxTokens === 200000, 'Claude Sonnet has 200K token limit');
  assert(claudeConfig.charsPerToken === 3.5, 'Claude uses 3.5 chars/token ratio');
  
  // Test GPT model config
  const gptConfig = getModelConfig('gpt-4-turbo-preview');
  assert(gptConfig.maxTokens === 128000, 'GPT-4 Turbo has 128K token limit');
  assert(gptConfig.charsPerToken === 4.0, 'GPT uses 4.0 chars/token ratio');
  
  // Test default fallback
  const defaultConfig = getModelConfig('unknown-model');
  assert(defaultConfig.maxTokens === 100000, 'Default config has 100K token limit');
  
  // Test available models list
  const models = getAvailableModels();
  assert(models.length >= 6, 'At least 6 models available');
  assert(models.some(m => m.id.includes('claude')), 'Claude models listed');
  assert(models.some(m => m.id.includes('gpt')), 'GPT models listed');
});

testGroup('Basic Token Counting', () => {
  // Test short text
  const shortTokens = countTokens(SHORT_TEXT);
  assert(shortTokens > 0, 'Short text has positive token count');
  assert(shortTokens < 20, 'Short text has reasonable token count');
  
  // Test medium text
  const mediumTokens = countTokens(MEDIUM_TEXT);
  assert(mediumTokens > shortTokens, 'Medium text has more tokens than short');
  assert(mediumTokens > 50 && mediumTokens < 300, 'Medium text token count is reasonable');
  
  // Test long text
  const longTokens = countTokens(LONG_TEXT);
  assert(longTokens > mediumTokens, 'Long text has more tokens than medium');
  assert(longTokens > 500, 'Long text has substantial token count');
  
  // Test empty input
  assert(countTokens('') === 0, 'Empty string has 0 tokens');
  assert(countTokens(null) === 0, 'Null input has 0 tokens');
});

testGroup('Model-Specific Token Counting', () => {
  const text = MEDIUM_TEXT;
  
  // Claude should be more efficient (fewer tokens for same text)
  const claudeTokens = countTokens(text, 'claude-3-5-sonnet-20241022');
  const gptTokens = countTokens(text, 'gpt-4');
  
  assert(claudeTokens > 0, 'Claude token count is positive');
  assert(gptTokens > 0, 'GPT token count is positive');
  assert(claudeTokens < gptTokens, 'Claude is more token-efficient than GPT');
  
  console.log(`  ℹ️  Same text: Claude ${claudeTokens} tokens vs GPT ${gptTokens} tokens`);
});

testGroup('Object Token Counting', () => {
  const simpleObj = { key: 'value', number: 42 };
  const complexObj = {
    gateway: {
      token: 'test-token-12345',
      bind: '0.0.0.0',
      port: 2024
    },
    channels: {
      telegram: {
        bot_token: '123456789:ABCdefGHI',
        allowed_chats: [123, 456]
      }
    },
    tools: {
      exec: { policy: 'allowlist', commands: ['ls', 'cat'] }
    }
  };
  
  const simpleTokens = countTokensInObject(simpleObj);
  const complexTokens = countTokensInObject(complexObj);
  
  assert(simpleTokens > 0, 'Simple object has positive token count');
  assert(complexTokens > simpleTokens, 'Complex object has more tokens');
  assert(complexTokens > 50, 'Complex object has substantial tokens');
  
  console.log(`  ℹ️  Simple: ${simpleTokens} tokens, Complex: ${complexTokens} tokens`);
});

testGroup('Context Budget Calculation', () => {
  const modelName = 'claude-3-5-sonnet-20241022';
  const usedTokens = 50000;
  
  const budget = getContextBudget(modelName, usedTokens);
  
  assert(budget.maxTokens === 200000, 'Max tokens matches model');
  assert(budget.usedTokens === usedTokens, 'Used tokens tracked correctly');
  assert(budget.available === budget.maxContext - usedTokens, 'Available calculated correctly');
  assert(budget.percentUsed > 0, 'Percent used is positive');
  assert(budget.hasRoom === true, 'Has room for more content');
  
  // Test budget exhaustion
  const exhaustedBudget = getContextBudget(modelName, 195000);
  assert(exhaustedBudget.available < 5000, 'Budget nearly exhausted');
  assert(exhaustedBudget.percentUsed > 90, 'High percent usage');
  
  console.log(`  ℹ️  Used: ${budget.usedTokens} tokens, Available: ${budget.available} tokens (${budget.percentUsed}%)`);
});

testGroup('Budget Fit Checking', () => {
  const text = MEDIUM_TEXT;
  const largeBudget = 1000;
  const smallBudget = 10;
  
  const fits = fitsInBudget(text, largeBudget);
  const doesntFit = fitsInBudget(text, smallBudget);
  
  assert(fits.fits === true, 'Text fits in large budget');
  assert(fits.overflow === 0, 'No overflow in large budget');
  
  assert(doesntFit.fits === false, 'Text does not fit in small budget');
  assert(doesntFit.overflow > 0, 'Overflow calculated for small budget');
  
  console.log(`  ℹ️  Large budget: ${fits.tokens} tokens (${fits.percentUsed}% used)`);
  console.log(`  ℹ️  Small budget: ${doesntFit.tokens} tokens, overflow: ${doesntFit.overflow}`);
});

testGroup('Text Truncation', () => {
  const longText = LONG_TEXT;
  const maxTokens = 100;
  
  const result = truncateToTokenLimit(longText, maxTokens);
  
  assert(result.truncated === true, 'Text was truncated');
  assert(result.tokens <= maxTokens, 'Result fits within budget');
  assert(result.originalTokens > result.tokens, 'Original was larger');
  assert(result.saved > 0, 'Tokens were saved');
  assert(result.text.includes('truncated'), 'Truncation marker present');
  
  console.log(`  ℹ️  Original: ${result.originalTokens} tokens → Truncated: ${result.tokens} tokens (saved ${result.saved})`);
  
  // Test no truncation needed
  const shortResult = truncateToTokenLimit(SHORT_TEXT, 1000);
  assert(shortResult.truncated === false, 'Short text not truncated');
  assert(shortResult.text === SHORT_TEXT, 'Original text preserved');
});

testGroup('Efficiency Calculation', () => {
  const originalTokens = 10000;
  const optimizedTokens = 6000;
  
  const efficiency = calculateEfficiency(originalTokens, optimizedTokens);
  
  assert(efficiency.saved === 4000, 'Saved tokens calculated correctly');
  assert(efficiency.percentSaved === 40, 'Percent saved is 40%');
  assert(efficiency.compressionRatio === '1.67', 'Compression ratio correct');
  assert(efficiency.efficient === true, 'Marked as efficient (>20% saved)');
  
  // Test inefficient optimization
  const inefficient = calculateEfficiency(1000, 900);
  assert(inefficient.efficient === false, 'Small savings not marked efficient');
  
  console.log(`  ℹ️  Saved: ${efficiency.saved} tokens (${efficiency.percentSaved}%), ratio: ${efficiency.compressionRatio}x`);
});

testGroup('Edge Cases', () => {
  // Empty inputs
  assert(countTokens('') === 0, 'Empty string has 0 tokens');
  assert(countTokens(null) === 0, 'Null has 0 tokens');
  assert(countTokensInObject(null) === 0, 'Null object has 0 tokens');
  
  // Very large text
  const hugeText = 'X'.repeat(1000000); // 1MB of text
  const hugeTokens = countTokens(hugeText);
  assert(hugeTokens > 100000, 'Very large text has high token count');
  
  // Special characters and unicode
  const unicodeText = '🔒 Security 安全 безопасность';
  const unicodeTokens = countTokens(unicodeText);
  assert(unicodeTokens > 0, 'Unicode text counted correctly');
  
  console.log(`  ℹ️  1MB text: ${hugeTokens} tokens, Unicode: ${unicodeTokens} tokens`);
});

testGroup('Real-World Scenario', () => {
  // Simulate a real scan with config and threat data
  const scanConfig = {
    gateway: {
      token: 'my-secure-token-12345678901234567890',
      bind: '0.0.0.0',
      port: 2024,
      rate_limit: {
        enabled: true,
        max_requests: 100,
        window_ms: 60000
      }
    },
    channels: {
      telegram: {
        bot_token: '123456789:ABCdefGHIjklMNOpqrSTUvwxyz',
        allowed_chats: [123456789, -987654321]
      }
    },
    tools: {
      exec: {
        policy: 'allowlist',
        commands: ['ls', 'cat', 'grep', 'find']
      }
    },
    sessions: {
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm'
      }
    }
  };
  
  const threatData = `
# OpenClaw Security Threats

## T001 - Weak Gateway Token
**Severity**: CRITICAL
**Description**: Gateway token is weak or uses default values.
**Impact**: Complete system compromise possible.
**Mitigation**: Generate strong token with openssl rand -hex 32.

## T002 - Public Gateway Exposure
**Severity**: HIGH
**Description**: Gateway bound to public interface.
**Impact**: Remote exploitation attempts possible.
**Mitigation**: Bind to 127.0.0.1 only.
  `.repeat(5); // Simulate multiple threat descriptions
  
  const modelName = 'claude-3-5-haiku-20241022';
  
  const configTokens = countTokensInObject(scanConfig, modelName);
  const threatTokens = countTokens(threatData, modelName);
  const totalTokens = configTokens + threatTokens;
  
  const budget = getContextBudget(modelName, totalTokens);
  
  assert(configTokens > 0, 'Config tokens counted');
  assert(threatTokens > 0, 'Threat tokens counted');
  assert(totalTokens < budget.maxContext, 'Total fits in model context');
  
  console.log(`  ℹ️  Real-world scenario for ${modelName}:`);
  console.log(`      Config: ${configTokens} tokens`);
  console.log(`      Threats: ${threatTokens} tokens`);
  console.log(`      Total: ${totalTokens} tokens (${budget.percentUsed}% of ${budget.maxContext})`);
  console.log(`      Available: ${budget.available} tokens remaining`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ All token counter tests passed!');
console.log('='.repeat(60));
