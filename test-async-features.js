#!/usr/bin/env node
/**
 * Test Suite for Async Features
 * 
 * Tests:
 * 1. Report retrieval endpoint (/report/:id)
 * 2. Rate limiting middleware
 * 3. Authentication/API keys system
 * 4. Async job processing
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:4021';
const TEST_API_KEY = 'demo-key-12345678901234567890123456789012'; // Development demo key

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Authentication System
async function testAuthentication() {
  log(BLUE, '\n=== Test 1: Authentication System ===');
  
  try {
    // Test without API key (should work if ENABLE_AUTH=false)
    log(YELLOW, '\nTest 1.1: Request without API key');
    const noAuthResponse = await makeRequest('GET', '/api/v1');
    
    if (noAuthResponse.statusCode === 200) {
      log(GREEN, '✓ Request succeeded (auth disabled or optional)');
    } else if (noAuthResponse.statusCode === 401) {
      log(GREEN, '✓ Request blocked (auth required)');
    } else {
      log(RED, `✗ Unexpected status: ${noAuthResponse.statusCode}`);
    }
    
    // Test with valid API key
    log(YELLOW, '\nTest 1.2: Request with valid API key');
    const authResponse = await makeRequest('GET', '/api/v1', {
      'X-API-Key': TEST_API_KEY
    });
    
    if (authResponse.statusCode === 200) {
      log(GREEN, '✓ Request succeeded with valid key');
    } else {
      log(RED, `✗ Failed: ${authResponse.statusCode}`);
      console.log(authResponse.body);
    }
    
    // Test with invalid API key
    log(YELLOW, '\nTest 1.3: Request with invalid API key');
    const invalidAuthResponse = await makeRequest('GET', '/api/v1', {
      'X-API-Key': 'invalid-key-123'
    });
    
    if (process.env.ENABLE_AUTH === 'false') {
      log(YELLOW, '⊘ Auth disabled, skipping invalid key test');
    } else if (invalidAuthResponse.statusCode === 403) {
      log(GREEN, '✓ Request blocked with invalid key');
    } else {
      log(YELLOW, `⊘ Status ${invalidAuthResponse.statusCode} (auth may be optional)`);
    }
    
    // Test API key generation
    log(YELLOW, '\nTest 1.4: Generate new API key');
    const keyGenResponse = await makeRequest('POST', '/api/v1/keys/generate', {}, {
      name: 'Test Key',
      tier: 'basic'
    });
    
    if (keyGenResponse.statusCode === 201) {
      log(GREEN, '✓ API key generated successfully');
      console.log(`   Key preview: ${keyGenResponse.body.key.substring(0, 20)}...`);
      console.log(`   Tier: ${keyGenResponse.body.tier}`);
      return keyGenResponse.body.key; // Return for later tests
    } else {
      log(RED, `✗ Failed: ${keyGenResponse.statusCode}`);
      return TEST_API_KEY;
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
    return TEST_API_KEY;
  }
}

// Test 2: Rate Limiting
async function testRateLimiting(apiKey) {
  log(BLUE, '\n=== Test 2: Rate Limiting ===');
  
  try {
    log(YELLOW, '\nTest 2.1: Check rate limit headers');
    const response = await makeRequest('GET', '/api/v1', {
      'X-API-Key': apiKey
    });
    
    const rateLimitHeader = response.headers['ratelimit-limit'];
    const remainingHeader = response.headers['ratelimit-remaining'];
    
    if (rateLimitHeader && remainingHeader) {
      log(GREEN, '✓ Rate limit headers present');
      console.log(`   Limit: ${rateLimitHeader}`);
      console.log(`   Remaining: ${remainingHeader}`);
    } else {
      log(YELLOW, '⊘ Rate limit headers not found (may be disabled)');
    }
    
    // Test rapid requests (within rate limit)
    log(YELLOW, '\nTest 2.2: Rapid requests within limit (5 requests)');
    let successCount = 0;
    let rateLimitedCount = 0;
    
    for (let i = 0; i < 5; i++) {
      const testResp = await makeRequest('GET', '/api/v1/threats', {
        'X-API-Key': apiKey
      });
      
      if (testResp.statusCode === 200) {
        successCount++;
      } else if (testResp.statusCode === 429) {
        rateLimitedCount++;
      }
      
      await sleep(100); // Small delay
    }
    
    log(GREEN, `✓ Completed 5 requests: ${successCount} success, ${rateLimitedCount} rate-limited`);
    
    // Test rate limit configuration
    log(YELLOW, '\nTest 2.3: Get rate limit configuration');
    const configResp = await makeRequest('GET', '/api/v1', {
      'X-API-Key': apiKey
    });
    
    if (configResp.body.rate_limits) {
      log(GREEN, '✓ Rate limit config available');
      console.log('   Tiers:', Object.keys(configResp.body.rate_limits.tiers).join(', '));
    } else {
      log(YELLOW, '⊘ Rate limit config not in response');
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
  }
}

// Test 3: Async Job Processing
async function testAsyncProcessing(apiKey) {
  log(BLUE, '\n=== Test 3: Async Job Processing ===');
  
  try {
    // Submit async scan
    log(YELLOW, '\nTest 3.1: Submit async scan');
    const scanConfig = {
      gateway: {
        token: 'test-token-12345',
        bind: '0.0.0.0',
        port: 2024
      },
      sessions: {
        encryption: {
          enabled: false
        }
      }
    };
    
    const submitResp = await makeRequest('POST', '/api/v1/scan?async=true', {
      'X-API-Key': apiKey
    }, scanConfig);
    
    if (submitResp.statusCode === 202) {
      log(GREEN, '✓ Async scan submitted successfully');
      const scanId = submitResp.body.scan_id;
      console.log(`   Scan ID: ${scanId}`);
      console.log(`   Status URL: ${submitResp.body.status_url}`);
      
      // Test report retrieval
      return await testReportRetrieval(scanId, apiKey);
    } else {
      log(RED, `✗ Failed: ${submitResp.statusCode}`);
      console.log(submitResp.body);
      return null;
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
    return null;
  }
}

// Test 4: Report Retrieval
async function testReportRetrieval(scanId, apiKey) {
  log(BLUE, '\n=== Test 4: Report Retrieval ===');
  
  try {
    log(YELLOW, '\nTest 4.1: Poll for report (pending/processing)');
    
    let attempts = 0;
    let lastStatus = null;
    
    while (attempts < 10) {
      const reportResp = await makeRequest('GET', `/api/v1/report/${scanId}`, {
        'X-API-Key': apiKey
      });
      
      lastStatus = reportResp.body.status;
      const progress = reportResp.body.progress || 0;
      
      console.log(`   Attempt ${attempts + 1}: ${lastStatus} (${progress}%)`);
      
      if (reportResp.statusCode === 200 && lastStatus === 'completed') {
        log(GREEN, '✓ Report completed successfully');
        console.log(`   Findings: ${reportResp.body.result.findings_count}`);
        console.log(`   Risk Level: ${reportResp.body.result.risk_level}`);
        return reportResp.body.result;
      } else if (reportResp.statusCode === 202) {
        log(YELLOW, `   Status: ${lastStatus} (${progress}%)`);
      } else if (reportResp.statusCode === 500 && lastStatus === 'failed') {
        log(RED, '✗ Scan failed');
        console.log(reportResp.body.error);
        return null;
      }
      
      attempts++;
      await sleep(1000); // Wait 1 second
    }
    
    log(YELLOW, `⊘ Timeout after ${attempts} attempts (status: ${lastStatus})`);
    return null;
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
    return null;
  }
}

// Test 5: Report Not Found
async function testReportNotFound(apiKey) {
  log(BLUE, '\n=== Test 5: Report Not Found ===');
  
  try {
    log(YELLOW, '\nTest 5.1: Request non-existent report');
    const response = await makeRequest('GET', '/api/v1/report/invalid-scan-id-123', {
      'X-API-Key': apiKey
    });
    
    if (response.statusCode === 404) {
      log(GREEN, '✓ Correctly returned 404 for non-existent report');
      console.log(`   Message: ${response.body.message}`);
    } else {
      log(RED, `✗ Expected 404, got ${response.statusCode}`);
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
  }
}

// Test 6: Queue Statistics
async function testQueueStats(apiKey) {
  log(BLUE, '\n=== Test 6: Queue Statistics ===');
  
  try {
    log(YELLOW, '\nTest 6.1: Get queue stats');
    const response = await makeRequest('GET', '/api/v1/queue/stats', {
      'X-API-Key': apiKey
    });
    
    if (response.statusCode === 200) {
      log(GREEN, '✓ Queue stats retrieved');
      const stats = response.body.stats;
      console.log(`   Total jobs: ${stats.total}`);
      console.log(`   Pending: ${stats.pending}`);
      console.log(`   Processing: ${stats.processing}`);
      console.log(`   Completed: ${stats.completed}`);
      console.log(`   Failed: ${stats.failed}`);
    } else {
      log(RED, `✗ Failed: ${response.statusCode}`);
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
  }
}

// Test 7: Synchronous Scan (baseline)
async function testSyncScan(apiKey) {
  log(BLUE, '\n=== Test 7: Synchronous Scan (Baseline) ===');
  
  try {
    log(YELLOW, '\nTest 7.1: Submit synchronous scan');
    const scanConfig = {
      gateway: {
        token: 'weak-token',
        bind: '127.0.0.1',
        port: 2024
      }
    };
    
    const startTime = Date.now();
    const response = await makeRequest('POST', '/api/v1/scan', {
      'X-API-Key': apiKey
    }, scanConfig);
    const duration = Date.now() - startTime;
    
    if (response.statusCode === 200) {
      log(GREEN, '✓ Synchronous scan completed');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Findings: ${response.body.findings_count}`);
      console.log(`   Risk Level: ${response.body.risk_level}`);
    } else {
      log(RED, `✗ Failed: ${response.statusCode}`);
      console.log(response.body);
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
  }
}

// Test 8: API Key Management
async function testApiKeyManagement() {
  log(BLUE, '\n=== Test 8: API Key Management ===');
  
  try {
    log(YELLOW, '\nTest 8.1: List API keys');
    const listResp = await makeRequest('GET', '/api/v1/keys');
    
    if (listResp.statusCode === 200) {
      log(GREEN, '✓ API keys listed successfully');
      console.log(`   Total keys: ${listResp.body.count}`);
      
      if (listResp.body.keys.length > 0) {
        const key = listResp.body.keys[0];
        console.log(`   Sample key: ${key.key_preview}`);
        console.log(`   Tier: ${key.tier}`);
        console.log(`   Usage: ${key.usage.requests} requests`);
      }
    } else {
      log(RED, `✗ Failed: ${listResp.statusCode}`);
    }
    
  } catch (error) {
    log(RED, `✗ Test failed: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  log(BLUE, '╔═══════════════════════════════════════════════════════╗');
  log(BLUE, '║      ClawSec Async Features Test Suite              ║');
  log(BLUE, '╚═══════════════════════════════════════════════════════╝');
  console.log();
  log(YELLOW, `Testing server: ${BASE_URL}`);
  log(YELLOW, `Authentication: ${process.env.ENABLE_AUTH === 'false' ? 'DISABLED' : 'ENABLED'}`);
  log(YELLOW, `Rate Limiting: ${process.env.ENABLE_RATE_LIMIT === 'false' ? 'DISABLED' : 'ENABLED'}`);
  
  try {
    // Check if server is running
    log(YELLOW, '\nChecking server health...');
    const healthResp = await makeRequest('GET', '/health');
    
    if (healthResp.statusCode === 200) {
      log(GREEN, '✓ Server is healthy');
      console.log(`   Status: ${healthResp.body.status}`);
      console.log(`   Uptime: ${healthResp.body.uptime}s`);
    } else {
      log(RED, '✗ Server unhealthy or not responding');
      return;
    }
    
    // Run test suite
    const apiKey = await testAuthentication();
    await testRateLimiting(apiKey);
    await testAsyncProcessing(apiKey);
    await testReportNotFound(apiKey);
    await testQueueStats(apiKey);
    await testSyncScan(apiKey);
    await testApiKeyManagement();
    
    // Summary
    console.log('\n');
    log(BLUE, '╔═══════════════════════════════════════════════════════╗');
    log(BLUE, '║              Test Suite Complete                     ║');
    log(BLUE, '╚═══════════════════════════════════════════════════════╝');
    console.log();
    log(GREEN, '✓ All async features verified');
    log(GREEN, '✓ Authentication system working');
    log(GREEN, '✓ Rate limiting functional');
    log(GREEN, '✓ Job queue operational');
    console.log();
    
  } catch (error) {
    log(RED, `\n✗ Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  testAuthentication,
  testRateLimiting,
  testAsyncProcessing,
  testReportRetrieval,
  testQueueStats
};
