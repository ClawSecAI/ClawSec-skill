#!/usr/bin/env node
/**
 * Premium Tier LLM Analysis Test Suite
 * 
 * Tests:
 * 1. Basic tier ($1) - pattern matching only, no LLM
 * 2. Premium tier ($3) - with LLM analysis (requires ANTHROPIC_API_KEY)
 * 3. Premium tier fallback - graceful degradation without API key
 * 4. Response structure validation
 * 
 * Usage:
 *   node test-premium-tier.js
 * 
 * Requirements:
 *   - Server running on localhost:4021
 *   - ANTHROPIC_API_KEY set for premium tier tests
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4021';
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;

// Test scan configuration (vulnerable OpenClaw config)
const testConfig = {
  gateway: {
    token: 'test123',  // Weak token (T001)
    bind: '0.0.0.0',   // Public exposure (T002)
    port: 2024
  },
  sessions: {
    encryption: {
      enabled: false    // Unencrypted sessions (T004)
    }
  },
  tools: {
    exec: {
      policy: 'allow-all'  // Unrestricted execution (T003)
    }
  },
  channels: {
    telegram: {
      bot_token: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567'  // Hardcoded token (T011)
    }
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Run a single test
 */
async function runTest(name, testFn) {
  console.log(`\n🧪 Test: ${name}`);
  console.log('─'.repeat(60));
  
  try {
    const result = await testFn();
    
    if (result.skip) {
      console.log(`⏭️  SKIPPED: ${result.reason}`);
      results.skipped++;
      results.tests.push({ name, status: 'skipped', reason: result.reason });
    } else if (result.success) {
      console.log(`✅ PASSED`);
      results.passed++;
      results.tests.push({ name, status: 'passed', details: result.details });
    } else {
      console.log(`❌ FAILED: ${result.error}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: result.error });
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

/**
 * Test 1: Basic Tier - Pattern Matching Only
 */
async function testBasicTier() {
  console.log('Testing basic tier (no LLM analysis)...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/scan?tier=basic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.scan_id || !data.findings || !data.report) {
      return { 
        success: false, 
        error: 'Missing required fields in response' 
      };
    }
    
    // Verify NO premium tier data
    if (data.premium_tier && data.premium_tier.llm_analysis) {
      return { 
        success: false, 
        error: 'Basic tier should NOT include LLM analysis' 
      };
    }
    
    // Verify findings were detected (pattern matching works)
    if (data.findings.length === 0) {
      return { 
        success: false, 
        error: 'Pattern matching failed - no findings detected' 
      };
    }
    
    console.log(`   Findings: ${data.findings.length}`);
    console.log(`   Risk Score: ${data.risk_score}/100 (${data.risk_level})`);
    console.log(`   Premium Tier: ${data.premium_tier ? 'Yes (ERROR!)' : 'No (✓)'}`);
    
    return { 
      success: true, 
      details: {
        findings_count: data.findings.length,
        risk_score: data.risk_score,
        premium_tier: false
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Premium Tier - With LLM Analysis
 */
async function testPremiumTierWithLLM() {
  if (!HAS_API_KEY) {
    return { 
      skip: true, 
      reason: 'ANTHROPIC_API_KEY not set. Set in .env to test premium tier.' 
    };
  }
  
  console.log('Testing premium tier with LLM analysis...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/scan?tier=premium`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tier': 'premium'
      },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.scan_id || !data.findings || !data.report) {
      return { 
        success: false, 
        error: 'Missing required fields in response' 
      };
    }
    
    // Verify premium tier data exists
    if (!data.premium_tier) {
      return { 
        success: false, 
        error: 'Premium tier data missing from response' 
      };
    }
    
    // Verify LLM analysis was performed
    if (!data.premium_tier.llm_analysis) {
      return { 
        success: false, 
        error: `LLM analysis not available: ${data.premium_tier.reason}` 
      };
    }
    
    // Validate LLM analysis structure
    const requiredFields = [
      'executive_summary',
      'attack_chains',
      'contextualized_priorities',
      'recommendations'
    ];
    
    for (const field of requiredFields) {
      if (!data.premium_tier[field]) {
        return { 
          success: false, 
          error: `Missing LLM field: ${field}` 
        };
      }
    }
    
    console.log(`   Findings: ${data.findings.length}`);
    console.log(`   Risk Score: ${data.risk_score}/100 (${data.risk_level})`);
    console.log(`   Premium Tier: Yes (✓)`);
    console.log(`   LLM Analysis: Yes (✓)`);
    console.log(`   Attack Chains: ${data.premium_tier.attack_chains.length}`);
    console.log(`   Priorities: ${data.premium_tier.contextualized_priorities.length}`);
    console.log(`   Recommendations: ${data.premium_tier.recommendations.length}`);
    console.log(`   Executive Summary: ${data.premium_tier.executive_summary.substring(0, 100)}...`);
    
    if (data.premium_tier.metadata) {
      console.log(`   LLM Tokens: ${data.premium_tier.metadata.tokens_used}`);
      console.log(`   LLM Duration: ${data.premium_tier.metadata.duration_ms}ms`);
    }
    
    return { 
      success: true, 
      details: {
        findings_count: data.findings.length,
        risk_score: data.risk_score,
        premium_tier: true,
        llm_analysis: true,
        attack_chains: data.premium_tier.attack_chains.length,
        priorities: data.premium_tier.contextualized_priorities.length,
        recommendations: data.premium_tier.recommendations.length,
        tokens_used: data.premium_tier.metadata?.tokens_used || 0
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Premium Tier Fallback - Graceful Degradation
 */
async function testPremiumTierFallback() {
  if (HAS_API_KEY) {
    return { 
      skip: true, 
      reason: 'ANTHROPIC_API_KEY is set. Unset to test fallback behavior.' 
    };
  }
  
  console.log('Testing premium tier fallback (no API key)...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/scan?tier=premium`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tier': 'premium'
      },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    
    // Should still work with pattern matching
    if (!data.scan_id || !data.findings || !data.report) {
      return { 
        success: false, 
        error: 'Fallback failed - missing required fields' 
      };
    }
    
    // Premium tier should be indicated but with llm_analysis = false
    if (!data.premium_tier) {
      return { 
        success: false, 
        error: 'Premium tier indicator missing from response' 
      };
    }
    
    if (data.premium_tier.llm_analysis) {
      return { 
        success: false, 
        error: 'LLM analysis should not be available without API key' 
      };
    }
    
    // Should have a reason for why LLM is unavailable
    if (!data.premium_tier.reason) {
      return { 
        success: false, 
        error: 'Missing reason for LLM unavailability' 
      };
    }
    
    console.log(`   Findings: ${data.findings.length}`);
    console.log(`   Risk Score: ${data.risk_score}/100 (${data.risk_level})`);
    console.log(`   Premium Tier: Requested`);
    console.log(`   LLM Analysis: Unavailable (fallback working ✓)`);
    console.log(`   Reason: ${data.premium_tier.reason}`);
    
    return { 
      success: true, 
      details: {
        findings_count: data.findings.length,
        risk_score: data.risk_score,
        premium_tier_requested: true,
        llm_analysis: false,
        fallback: true,
        reason: data.premium_tier.reason
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Response Structure Validation
 */
async function testResponseStructure() {
  console.log('Testing response structure consistency...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/scan?tier=basic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    
    // Check required fields
    const requiredFields = [
      'scan_id',
      'timestamp',
      'report',
      'findings_count',
      'risk_level',
      'risk_score',
      'findings',
      'optimization'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }
    
    // Validate types
    if (typeof data.scan_id !== 'string') {
      return { success: false, error: 'scan_id should be string' };
    }
    
    if (typeof data.findings_count !== 'number') {
      return { success: false, error: 'findings_count should be number' };
    }
    
    if (typeof data.risk_score !== 'number') {
      return { success: false, error: 'risk_score should be number' };
    }
    
    if (!Array.isArray(data.findings)) {
      return { success: false, error: 'findings should be array' };
    }
    
    console.log(`   ✓ All required fields present`);
    console.log(`   ✓ Field types correct`);
    console.log(`   ✓ Response structure valid`);
    
    return { success: true, details: { valid: true } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ClawSec Premium Tier LLM Analysis Test Suite            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nServer: ${SERVER_URL}`);
  console.log(`ANTHROPIC_API_KEY: ${HAS_API_KEY ? 'Set (✓)' : 'Not set (⚠️)'}`);
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${SERVER_URL}/health`);
    if (!healthCheck.ok) {
      console.error('\n❌ Server health check failed');
      process.exit(1);
    }
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('\n❌ Cannot connect to server. Make sure it is running:');
    console.error('   npm start');
    process.exit(1);
  }
  
  // Run tests
  await runTest('Test 1: Basic Tier (Pattern Matching Only)', testBasicTier);
  await runTest('Test 2: Premium Tier (With LLM Analysis)', testPremiumTierWithLLM);
  await runTest('Test 3: Premium Tier Fallback (Graceful Degradation)', testPremiumTierFallback);
  await runTest('Test 4: Response Structure Validation', testResponseStructure);
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}`);
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else if (results.passed === 0 && results.skipped > 0) {
    console.log('\n⚠️  All tests skipped (set ANTHROPIC_API_KEY to run premium tier tests)');
    process.exit(0);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
main().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
