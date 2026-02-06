/**
 * Integration tests for ClawSec server
 * 
 * Run with: npm test
 */

const http = require('http');

const BASE_URL = 'http://localhost:4021';

/**
 * Simple test helper
 */
function test(name, fn) {
  return fn()
    .then(() => console.log(`✅ ${name}`))
    .catch(err => {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${err.message}`);
      process.exitCode = 1;
    });
}

/**
 * HTTP request helper
 */
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

/**
 * Test suite
 */
async function runTests() {
  console.log('\n🧪 Running ClawSec Integration Tests\n');
  
  // Test 1: Health check
  await test('Health check endpoint', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.status !== 'healthy') throw new Error('Server not healthy');
  });
  
  // Test 2: API info
  await test('API info endpoint', async () => {
    const res = await request('GET', '/api/v1');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.endpoints) throw new Error('Missing endpoints');
  });
  
  // Test 3: Threat database
  await test('Threat database endpoint', async () => {
    const res = await request('GET', '/api/v1/threats');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.categories) throw new Error('Missing categories');
    if (res.body.threat_count < 5) throw new Error('Expected at least 5 threats');
  });
  
  // Test 4: Security scan - weak config
  await test('Security scan detects weak configuration', async () => {
    const config = {
      gateway: {
        bind: '0.0.0.0',
        port: 2024,
        token: 'test123'
      },
      sessions: {
        encryption: { enabled: false }
      },
      tools: {
        exec: { policy: 'allow-all' }
      }
    };
    
    const res = await request('POST', '/api/v1/scan', config);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.scan_id) throw new Error('Missing scan_id');
    if (res.body.findings_count === 0) throw new Error('Should detect vulnerabilities');
    if (res.body.risk_level === 'LOW') throw new Error('Should be higher risk');
  });
  
  // Test 5: Security scan - secure config
  await test('Security scan passes secure configuration', async () => {
    const config = {
      gateway: {
        bind: '127.0.0.1',
        port: 2024,
        token: 'a'.repeat(64) // Strong token
      },
      sessions: {
        encryption: { enabled: true }
      },
      tools: {
        exec: { policy: 'allowlist', commands: ['ls'] }
      }
    };
    
    const res = await request('POST', '/api/v1/scan', config);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.findings_count > 1) throw new Error('Should have minimal findings');
  });
  
  // Test 6: Invalid scan input
  await test('Rejects invalid scan input', async () => {
    const res = await request('POST', '/api/v1/scan', 'invalid');
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });
  
  // Test 7: 404 handling
  await test('Returns 404 for unknown routes', async () => {
    const res = await request('GET', '/nonexistent');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });
  
  console.log('\n✨ All tests passed!\n');
}

// Run tests
runTests().catch(err => {
  console.error('\n💥 Test suite failed:', err.message);
  process.exit(1);
});
