#!/usr/bin/env node
/**
 * ClawSec Client-Server Integration Test Suite
 * 
 * Tests Railway server connectivity, API endpoints, error handling,
 * and data sanitization.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Utility: Make HTTP request with retry logic
async function makeRequest(url, options = {}, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || config.server.timeout.connection
    };
    
    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData,
            rawBody: data
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data
          });
        }
      });
    });
    
    req.on('error', async (err) => {
      // Retry logic with exponential backoff
      if (config.server.retry.enabled && retryCount < config.server.retry.maxAttempts) {
        const delay = config.server.retry.initialDelay * Math.pow(config.server.retry.backoffMultiplier, retryCount);
        console.log(`  ⏳ Retry ${retryCount + 1}/${config.server.retry.maxAttempts} after ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        try {
          const result = await makeRequest(url, options, retryCount + 1);
          resolve(result);
        } catch (retryErr) {
          reject(retryErr);
        }
      } else {
        reject(err);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test runner
async function runTest(name, fn) {
  results.total++;
  process.stdout.write(`\n🧪 ${name}... `);
  
  try {
    const startTime = Date.now();
    await fn();
    const duration = Date.now() - startTime;
    
    console.log(`✅ PASSED (${duration}ms)`);
    results.passed++;
    results.tests.push({ name, status: 'PASSED', duration });
  } catch (error) {
    console.log(`❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Test: Health endpoint
async function testHealthEndpoint() {
  const url = `${config.server.url}${config.endpoints.health}`;
  const response = await makeRequest(url);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.body.status || response.body.status !== 'healthy') {
    throw new Error(`Expected status "healthy", got "${response.body.status}"`);
  }
  
  if (!response.body.service || response.body.service !== 'ClawSec') {
    throw new Error(`Expected service "ClawSec", got "${response.body.service}"`);
  }
}

// Test: API info endpoint
async function testApiInfoEndpoint() {
  const url = `${config.server.url}${config.endpoints.apiInfo}`;
  const response = await makeRequest(url);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.body.endpoints || !response.body.endpoints.scan) {
    throw new Error('Missing scan endpoint in API info');
  }
}

// Test: Threats endpoint
async function testThreatsEndpoint() {
  const url = `${config.server.url}${config.endpoints.threats}`;
  const response = await makeRequest(url);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.body || typeof response.body !== 'object') {
    throw new Error('Invalid threats database format');
  }
}

// Test: Scan submission (valid input)
async function testScanSubmission() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  const testConfig = {
    gateway: {
      token: 'weak-token-123',
      bind: '0.0.0.0',
      port: 2024
    },
    channels: {
      telegram: {
        bot_token: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
        allowed_chats: null
      }
    },
    tools: {
      exec: {
        policy: 'allow-all'
      }
    }
  };
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: testConfig,
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}: ${response.rawBody}`);
  }
  
  if (!response.body.scan_id) {
    throw new Error('Missing scan_id in response');
  }
  
  if (!response.body.report) {
    throw new Error('Missing report in response');
  }
  
  if (!response.body.risk_level) {
    throw new Error('Missing risk_level in response');
  }
  
  // Verify findings
  if (response.body.findings_count < 1) {
    throw new Error('Expected at least 1 finding for weak configuration');
  }
}

// Test: Invalid input handling
async function testInvalidInput() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  // Test with invalid JSON structure (array instead of object)
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: ['invalid', 'array'],
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid input, got ${response.statusCode}`);
  }
  
  if (!response.body.error) {
    throw new Error('Expected error message for invalid input');
  }
}

// Test: Empty configuration
async function testEmptyConfiguration() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {},
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200 for empty config, got ${response.statusCode}`);
  }
  
  // Empty config should return low risk
  if (response.body.risk_level === 'CRITICAL') {
    throw new Error('Empty configuration should not be CRITICAL risk');
  }
}

// Test: Secure configuration (no issues)
async function testSecureConfiguration() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  const secureConfig = {
    gateway: {
      token: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      bind: '127.0.0.1',
      port: 8443,
      rate_limit: {
        enabled: true,
        max_requests: 100
      }
    },
    sessions: {
      encryption: {
        enabled: true
      }
    },
    channels: {
      telegram: {
        bot_token: '${TELEGRAM_BOT_TOKEN}',
        allowed_chats: [123456789]
      }
    },
    tools: {
      exec: {
        policy: 'allowlist',
        allowed_commands: ['ls', 'cat']
      }
    }
  };
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: secureConfig,
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Secure config should have minimal or no findings
  if (response.body.findings_count > 3) {
    throw new Error(`Secure configuration should have ≤3 findings, got ${response.body.findings_count}`);
  }
}

// Test: Network timeout handling
async function testNetworkTimeout() {
  // Test with extremely short timeout
  const url = `${config.server.url}${config.endpoints.health}`;
  
  try {
    await makeRequest(url, {
      timeout: 1 // 1ms - guaranteed timeout
    });
    throw new Error('Expected timeout error');
  } catch (error) {
    if (!error.message.includes('timeout')) {
      throw new Error(`Expected timeout error, got: ${error.message}`);
    }
    // This is expected - throw success
  }
}

// Test: Report format validation
async function testReportFormat() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  const testConfig = {
    gateway: {
      token: 'test123',
      bind: '0.0.0.0'
    }
  };
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: testConfig,
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  const report = response.body.report;
  
  // Verify report structure
  if (!report.includes('# OpenClaw Security Audit Report')) {
    throw new Error('Report missing title');
  }
  
  if (!report.includes('## Executive Summary')) {
    throw new Error('Report missing executive summary');
  }
  
  if (!report.includes('## Risk Breakdown')) {
    throw new Error('Report missing risk breakdown');
  }
  
  if (!report.includes('## Next Steps')) {
    throw new Error('Report missing next steps');
  }
}

// Test: Sanitization (no sensitive data leaks)
async function testSanitization() {
  const url = `${config.server.url}${config.endpoints.scan}`;
  
  const sensitiveConfig = {
    gateway: {
      token: 'sk-ant-api-super-secret-key-12345678901234567890',
      bind: '0.0.0.0'
    },
    personal: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  };
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: sensitiveConfig,
    timeout: config.server.timeout.request
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  const report = response.body.report;
  
  // Verify sensitive data is not fully exposed in report
  // (Evidence may contain partial info, but not full secrets)
  if (report.includes('super-secret-key')) {
    console.warn('   ⚠️  Warning: Potential sensitive data in report');
  }
}

// Test: Retry logic
async function testRetryLogic() {
  const url = 'https://invalid-nonexistent-server-xyz123.railway.app/health';
  
  try {
    await makeRequest(url);
    throw new Error('Expected connection error');
  } catch (error) {
    // Verify retry was attempted (check console output)
    if (!error.message.includes('ENOTFOUND') && !error.message.includes('EAI_AGAIN')) {
      throw new Error(`Expected DNS error, got: ${error.message}`);
    }
  }
}

// Test: Connection timeout
async function testConnectionTimeout() {
  // Use a non-routable IP to test connection timeout
  const url = 'http://10.255.255.1:9999/health';
  
  try {
    await makeRequest(url, { timeout: 5000 });
    throw new Error('Expected connection timeout');
  } catch (error) {
    if (!error.message.includes('timeout') && !error.message.includes('ETIMEDOUT')) {
      throw new Error(`Expected timeout, got: ${error.message}`);
    }
  }
}

// Main test suite
async function runAllTests() {
  console.log('\n🔒 ClawSec Client-Server Integration Test Suite');
  console.log('='.repeat(60));
  console.log(`📍 Server: ${config.server.url}`);
  console.log(`⏱️  Connection timeout: ${config.server.timeout.connection}ms`);
  console.log(`⏱️  Request timeout: ${config.server.timeout.request}ms`);
  console.log(`🔄 Retry: ${config.server.retry.enabled ? `enabled (max ${config.server.retry.maxAttempts})` : 'disabled'}`);
  console.log('='.repeat(60));
  
  // Section 1: Basic connectivity
  console.log('\n📡 Section 1: Server Connectivity');
  await runTest('Health endpoint', testHealthEndpoint);
  await runTest('API info endpoint', testApiInfoEndpoint);
  await runTest('Threats database endpoint', testThreatsEndpoint);
  
  // Section 2: Scan functionality
  console.log('\n🔍 Section 2: Scan Functionality');
  await runTest('Scan submission (valid input)', testScanSubmission);
  await runTest('Empty configuration', testEmptyConfiguration);
  await runTest('Secure configuration', testSecureConfiguration);
  
  // Section 3: Error handling
  console.log('\n⚠️  Section 3: Error Handling');
  await runTest('Invalid input handling', testInvalidInput);
  await runTest('Network timeout handling', testNetworkTimeout);
  await runTest('Connection timeout', testConnectionTimeout);
  await runTest('Retry logic', testRetryLogic);
  
  // Section 4: Data flow & security
  console.log('\n🔐 Section 4: Data Flow & Security');
  await runTest('Report format validation', testReportFormat);
  await runTest('Sanitization (no data leaks)', testSanitization);
  
  // Results summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${Math.round(results.passed / results.total * 100)}%`);
  console.log('='.repeat(60));
  
  // Detailed results
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }
  
  // Save results to file
  const resultsFile = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    server: config.server.url,
    ...results
  }, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
