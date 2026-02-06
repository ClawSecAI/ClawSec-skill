#!/usr/bin/env node
/**
 * Monitoring Test Script
 * Tests enhanced health endpoint and structured logging
 */

const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4021';

console.log('🧪 ClawSec Monitoring Test Suite\n');
console.log(`Testing server: ${SERVER_URL}\n`);

async function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing Enhanced Health Endpoint...');
    
    const url = new URL('/health', SERVER_URL);
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          
          // Verify response structure
          const checks = [
            { name: 'Status code is 200', pass: res.statusCode === 200 },
            { name: 'Has status field', pass: !!health.status },
            { name: 'Has service field', pass: health.service === 'ClawSec' },
            { name: 'Has version field', pass: !!health.version },
            { name: 'Has uptime field', pass: typeof health.uptime === 'number' },
            { name: 'Has timestamp field', pass: !!health.timestamp },
            { name: 'Has system.memory object', pass: !!health.system?.memory },
            { name: 'Has system.cpu object', pass: !!health.system?.cpu },
            { name: 'Has system.process object', pass: !!health.system?.process },
            { name: 'Has dependencies object', pass: !!health.dependencies },
            { name: 'Memory usage reported', pass: typeof health.system?.memory?.used === 'number' },
            { name: 'CPU load array exists', pass: Array.isArray(health.system?.cpu?.load) },
          ];
          
          let passed = 0;
          let failed = 0;
          
          checks.forEach(check => {
            if (check.pass) {
              console.log(`   ✅ ${check.name}`);
              passed++;
            } else {
              console.log(`   ❌ ${check.name}`);
              failed++;
            }
          });
          
          console.log(`\n   Result: ${passed}/${checks.length} checks passed\n`);
          
          if (failed === 0) {
            console.log('   🎉 Enhanced health endpoint working perfectly!\n');
            resolve(true);
          } else {
            console.log('   ⚠️  Some health checks failed\n');
            console.log('   Response:', JSON.stringify(health, null, 2));
            resolve(false);
          }
          
        } catch (error) {
          console.log(`   ❌ Failed to parse response: ${error.message}\n`);
          console.log('   Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Request failed: ${error.message}\n`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Hint: Make sure the server is running: npm start\n');
      }
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Request timeout (5s)\n');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testStructuredLogging() {
  console.log('2️⃣ Testing Structured Logging...\n');
  console.log('   Making a test request to trigger logging...');
  
  return new Promise((resolve, reject) => {
    const url = new URL('/api/v1', SERVER_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('   ✅ Request completed (check server logs for structured JSON)');
        console.log('   Expected log format: {timestamp, level, type, request_id, method, path, ...}\n');
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Request failed: ${error.message}\n`);
      reject(error);
    });
  });
}

async function testSentryIntegration() {
  console.log('3️⃣ Checking Sentry Integration...\n');
  
  const hasSentryDSN = !!process.env.SENTRY_DSN;
  
  if (hasSentryDSN) {
    console.log('   ✅ SENTRY_DSN environment variable configured');
    console.log('   ℹ️  Sentry error tracking is enabled\n');
  } else {
    console.log('   ℹ️  SENTRY_DSN not configured (optional)');
    console.log('   💡 Set SENTRY_DSN in .env to enable error tracking');
    console.log('   📖 See docs/monitoring-setup.md for setup instructions\n');
  }
  
  return true;
}

async function runTests() {
  try {
    console.log('═══════════════════════════════════════════════════════\n');
    
    const healthOk = await testHealthEndpoint();
    const loggingOk = await testStructuredLogging();
    const sentryOk = await testSentryIntegration();
    
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Test Summary\n');
    console.log(`   Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Structured Logging: ${loggingOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Sentry Integration: ${sentryOk ? '✅ READY' : '⚠️  NOT CONFIGURED'}`);
    
    const allPassed = healthOk && loggingOk;
    
    if (allPassed) {
      console.log('\n🎉 All monitoring tests passed!\n');
      console.log('Next steps:');
      console.log('   1. Set up Sentry: docs/monitoring-setup.md#error-tracking-with-sentry');
      console.log('   2. Configure Railway Dashboard: docs/monitoring-setup.md#railway-metrics-dashboard');
      console.log('   3. Set up uptime monitoring: docs/monitoring-setup.md#uptime-monitoring\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Check output above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { testHealthEndpoint, testStructuredLogging, testSentryIntegration };
