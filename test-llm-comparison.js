#!/usr/bin/env node
/**
 * LLM Comparison Test - Haiku vs Sonnet for ClawSec Reports
 * 
 * This script tests both models for report generation quality
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';
const SONNET_MODEL = 'claude-3-5-sonnet-20241022';

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

// Load test configurations
function loadTestConfig(name) {
  const configPath = path.join(__dirname, 'test-configs', `${name}.json`);
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Call ClawSec API to get rule-based findings
async function scanConfiguration(config) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(config);
    
    const options = {
      hostname: 'clawsec-skill-production.up.railway.app',
      port: 443,
      path: '/api/v1/scan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

// Call Anthropic API to enhance report with LLM
async function enhanceReportWithLLM(model, scanResult, threatContext) {
  return new Promise((resolve, reject) => {
    const prompt = buildPrompt(scanResult, threatContext);
    
    const data = JSON.stringify({
      model: model,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            reject(new Error(`API error: ${response.error.message}`));
            return;
          }
          
          resolve({
            content: response.content[0].text,
            usage: response.usage,
            duration: duration,
            model: model
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nBody: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('LLM request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

// Build prompt for LLM enhancement
function buildPrompt(scanResult, threatContext) {
  return `You are a security expert analyzing an OpenClaw configuration audit. Your task is to enhance the security report with deeper insights, prioritization, and actionable recommendations.

**Context:**
You are analyzing a security scan of an OpenClaw instance (an AI agent platform). The rule-based scanner has identified ${scanResult.findings_count} security issues with an overall risk level of ${scanResult.risk_level}.

**Threat Intelligence Context:**
${threatContext}

**Scan Results:**
${JSON.stringify(scanResult, null, 2)}

**Your Task:**
Generate an enhanced security audit report that includes:

1. **Executive Summary** (2-3 paragraphs)
   - Overview of security posture
   - Critical risk factors
   - Business impact assessment

2. **Prioritized Action Plan**
   - Group findings by urgency and impact
   - Provide clear, step-by-step remediation
   - Estimate implementation effort (hours/days)

3. **Deep Analysis**
   - Explain attack scenarios for each finding
   - Assess likelihood of exploitation
   - Identify cascading vulnerabilities (how issues compound)

4. **Security Roadmap**
   - Immediate fixes (today)
   - Short-term improvements (this week)
   - Long-term security hardening

5. **Compliance & Best Practices**
   - Map findings to OWASP LLM Top 10
   - GDPR/privacy considerations
   - Industry best practices

**Output Format:**
Provide a professional, markdown-formatted security report that is:
- Actionable and specific
- Easy to understand for non-technical stakeholders
- Technically accurate for security engineers
- Prioritized by risk and impact

**Important:**
- Be concise but thorough
- Use concrete examples
- Provide code snippets for fixes where applicable
- Highlight quick wins vs. complex fixes`;
}

// Load threat intelligence context
function loadThreatContext() {
  try {
    const corePath = path.join(__dirname, 'threats', 'core.md');
    if (fs.existsSync(corePath)) {
      return fs.readFileSync(corePath, 'utf8').slice(0, 10000); // Limit context size
    }
    return 'Generic security best practices for AI agent platforms.';
  } catch (e) {
    return 'Generic security best practices for AI agent platforms.';
  }
}

// Calculate cost based on token usage
function calculateCost(usage, model) {
  // Pricing per million tokens (as of Feb 2025)
  const pricing = {
    [HAIKU_MODEL]: {
      input: 1.00,  // $1.00 per MTok
      output: 5.00  // $5.00 per MTok
    },
    [SONNET_MODEL]: {
      input: 3.00,  // $3.00 per MTok
      output: 15.00 // $15.00 per MTok
    }
  };
  
  const rates = pricing[model];
  const inputCost = (usage.input_tokens / 1000000) * rates.input;
  const outputCost = (usage.output_tokens / 1000000) * rates.output;
  
  return {
    input_cost: inputCost,
    output_cost: outputCost,
    total_cost: inputCost + outputCost,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens
  };
}

// Run comparison test
async function runComparison(testName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${testName}`);
  console.log('='.repeat(80));
  
  const testConfig = loadTestConfig(testName);
  console.log(`\n📋 Description: ${testConfig.description}`);
  console.log(`📊 Expected issues: ${testConfig.expected_issues.length}`);
  
  // Step 1: Get rule-based scan results
  console.log('\n⏳ Running baseline scan...');
  const scanResult = await scanConfiguration(testConfig.config);
  console.log(`✅ Scan complete: ${scanResult.findings_count} findings, risk level: ${scanResult.risk_level}`);
  
  // Step 2: Load threat context
  const threatContext = loadThreatContext();
  
  // Step 3: Test Haiku
  console.log('\n⏳ Testing Haiku model...');
  const haikuStart = Date.now();
  const haikuResult = await enhanceReportWithLLM(HAIKU_MODEL, scanResult, threatContext);
  const haikuDuration = Date.now() - haikuStart;
  const haikuCost = calculateCost(haikuResult.usage, HAIKU_MODEL);
  
  console.log(`✅ Haiku complete:`);
  console.log(`   ⏱️  Duration: ${haikuDuration}ms`);
  console.log(`   💰 Cost: $${haikuCost.total_cost.toFixed(4)}`);
  console.log(`   📝 Tokens: ${haikuResult.usage.input_tokens} in, ${haikuResult.usage.output_tokens} out`);
  
  // Step 4: Test Sonnet
  console.log('\n⏳ Testing Sonnet model...');
  const sonnetStart = Date.now();
  const sonnetResult = await enhanceReportWithLLM(SONNET_MODEL, scanResult, threatContext);
  const sonnetDuration = Date.now() - sonnetStart;
  const sonnetCost = calculateCost(sonnetResult.usage, SONNET_MODEL);
  
  console.log(`✅ Sonnet complete:`);
  console.log(`   ⏱️  Duration: ${sonnetDuration}ms`);
  console.log(`   💰 Cost: $${sonnetCost.total_cost.toFixed(4)}`);
  console.log(`   📝 Tokens: ${sonnetResult.usage.input_tokens} in, ${sonnetResult.usage.output_tokens} out`);
  
  // Step 5: Compare results
  const comparison = {
    test_name: testName,
    test_config: testConfig,
    scan_result: scanResult,
    haiku: {
      model: HAIKU_MODEL,
      report: haikuResult.content,
      duration_ms: haikuDuration,
      cost: haikuCost,
      tokens: haikuResult.usage
    },
    sonnet: {
      model: SONNET_MODEL,
      report: sonnetResult.content,
      duration_ms: sonnetDuration,
      cost: sonnetCost,
      tokens: sonnetResult.usage
    },
    comparison: {
      speed_difference: `Haiku ${(sonnetDuration / haikuDuration).toFixed(2)}x faster`,
      cost_difference: `Sonnet ${(sonnetCost.total_cost / haikuCost.total_cost).toFixed(2)}x more expensive`,
      haiku_report_length: haikuResult.content.length,
      sonnet_report_length: sonnetResult.content.length
    }
  };
  
  return comparison;
}

// Main execution
async function main() {
  console.log('🔒 ClawSec LLM Comparison Test');
  console.log('Testing Haiku vs Sonnet for security audit report generation\n');
  
  const testCases = ['basic-scan', 'complex-scan', 'edge-case-scan'];
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await runComparison(testCase);
      results.push(result);
      
      // Save individual result
      const outputPath = path.join(__dirname, 'test-results', `${testCase}-comparison.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Results saved to: ${outputPath}`);
      
      // Add delay between tests to avoid rate limiting
      if (testCase !== testCases[testCases.length - 1]) {
        console.log('\n⏸️  Waiting 5 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`\n❌ Error testing ${testCase}:`, error.message);
      results.push({
        test_name: testCase,
        error: error.message
      });
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  const summary = {
    total_tests: testCases.length,
    successful_tests: results.filter(r => !r.error).length,
    failed_tests: results.filter(r => r.error).length,
    results: results
  };
  
  const summaryPath = path.join(__dirname, 'test-results', 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n✅ Test complete! Summary saved to: ${summaryPath}`);
  
  // Print quick stats
  if (summary.successful_tests > 0) {
    const avgHaikuCost = results.filter(r => !r.error).reduce((sum, r) => sum + r.haiku.cost.total_cost, 0) / summary.successful_tests;
    const avgSonnetCost = results.filter(r => !r.error).reduce((sum, r) => sum + r.sonnet.cost.total_cost, 0) / summary.successful_tests;
    const avgHaikuTime = results.filter(r => !r.error).reduce((sum, r) => sum + r.haiku.duration_ms, 0) / summary.successful_tests;
    const avgSonnetTime = results.filter(r => !r.error).reduce((sum, r) => sum + r.sonnet.duration_ms, 0) / summary.successful_tests;
    
    console.log(`\n💰 Average Cost per Scan:`);
    console.log(`   Haiku:  $${avgHaikuCost.toFixed(4)}`);
    console.log(`   Sonnet: $${avgSonnetCost.toFixed(4)}`);
    console.log(`   Difference: ${(avgSonnetCost / avgHaikuCost).toFixed(2)}x`);
    
    console.log(`\n⏱️  Average Duration:`);
    console.log(`   Haiku:  ${(avgHaikuTime / 1000).toFixed(2)}s`);
    console.log(`   Sonnet: ${(avgSonnetTime / 1000).toFixed(2)}s`);
    console.log(`   Difference: ${(avgSonnetTime / avgHaikuTime).toFixed(2)}x`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runComparison, enhanceReportWithLLM };
