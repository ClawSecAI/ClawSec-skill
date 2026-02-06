# ClawSec Client

Client library and integration tests for ClawSec API.

## Files

- **`config.json`**: Client configuration (server URL, timeouts, retry logic)
- **`test-integration.js`**: Comprehensive integration test suite
- **`test-results.json`**: Last test run results (generated)

## Configuration

### Default Configuration

```json
{
  "server": {
    "url": "https://clawsec-skill-production.up.railway.app",
    "timeout": {
      "connection": 30000,
      "request": 60000
    },
    "retry": {
      "enabled": true,
      "maxAttempts": 3,
      "backoffMultiplier": 2,
      "initialDelay": 1000
    }
  },
  "endpoints": {
    "health": "/health",
    "apiInfo": "/api/v1",
    "scan": "/api/v1/scan",
    "threats": "/api/v1/threats"
  }
}
```

### Configuration Options

#### Server

- **`url`** (string, required): ClawSec API server base URL
  - Production: `https://clawsec-skill-production.up.railway.app`
  - Local dev: `http://localhost:4021`

#### Timeouts

- **`connection`** (number, milliseconds): Connection timeout
  - Default: 30000 (30 seconds)
  - Recommended: 30000-60000

- **`request`** (number, milliseconds): Request timeout
  - Default: 60000 (60 seconds)
  - Recommended: 60000-120000 (scans can take time)

#### Retry Logic

- **`enabled`** (boolean): Enable automatic retries
  - Default: true
  - Recommended: true (network issues are common)

- **`maxAttempts`** (number): Maximum retry attempts
  - Default: 3
  - Recommended: 3-5

- **`backoffMultiplier`** (number): Exponential backoff multiplier
  - Default: 2 (delays: 1s, 2s, 4s, ...)
  - Recommended: 2

- **`initialDelay`** (number, milliseconds): First retry delay
  - Default: 1000 (1 second)
  - Recommended: 1000-5000

## Running Tests

### Prerequisites

- Node.js 18+ installed
- Network connectivity to Railway server
- No dependencies required (uses Node.js built-ins)

### Execute Tests

```bash
# From project root
cd client
node test-integration.js

# Or with executable permission
chmod +x test-integration.js
./test-integration.js
```

### Test Sections

1. **Server Connectivity** (3 tests)
   - Health endpoint
   - API info endpoint
   - Threats database endpoint

2. **Scan Functionality** (3 tests)
   - Valid scan submission
   - Empty configuration
   - Secure configuration

3. **Error Handling** (4 tests)
   - Invalid input handling
   - Network timeout handling
   - Connection timeout
   - Retry logic

4. **Data Flow & Security** (2 tests)
   - Report format validation
   - Sanitization (no data leaks)

**Total**: 12 comprehensive tests

### Test Output

```
🔒 ClawSec Client-Server Integration Test Suite
============================================================
📍 Server: https://clawsec-skill-production.up.railway.app
⏱️  Connection timeout: 30000ms
⏱️  Request timeout: 60000ms
🔄 Retry: enabled (max 3)
============================================================

📡 Section 1: Server Connectivity

🧪 Health endpoint... ✅ PASSED (123ms)
🧪 API info endpoint... ✅ PASSED (89ms)
🧪 Threats database endpoint... ✅ PASSED (102ms)

🔍 Section 2: Scan Functionality

🧪 Scan submission (valid input)... ✅ PASSED (2345ms)
🧪 Empty configuration... ✅ PASSED (1890ms)
🧪 Secure configuration... ✅ PASSED (2102ms)

⚠️  Section 3: Error Handling

🧪 Invalid input handling... ✅ PASSED (156ms)
🧪 Network timeout handling... ✅ PASSED (1ms)
🧪 Connection timeout... ✅ PASSED (5012ms)
🧪 Retry logic... ✅ PASSED (3045ms)

🔐 Section 4: Data Flow & Security

🧪 Report format validation... ✅ PASSED (2234ms)
🧪 Sanitization (no data leaks)... ✅ PASSED (1987ms)

============================================================
📊 Test Results Summary
============================================================
✅ Passed: 12/12
❌ Failed: 0/12
📈 Success Rate: 100%
============================================================

💾 Results saved to: /path/to/test-results.json
```

### Test Results File

Results are saved to `test-results.json`:

```json
{
  "timestamp": "2026-02-06T18:45:00.000Z",
  "server": "https://clawsec-skill-production.up.railway.app",
  "passed": 12,
  "failed": 0,
  "total": 12,
  "tests": [
    {
      "name": "Health endpoint",
      "status": "PASSED",
      "duration": 123
    },
    ...
  ]
}
```

## Usage Examples

### Basic Scan

```javascript
const https = require('https');
const config = require('./config.json');

async function scan(configData) {
  const url = new URL(config.endpoints.scan, config.server.url);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: config.server.timeout.connection
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(JSON.stringify(configData));
    req.end();
  });
}

// Usage
const myConfig = {
  gateway: {
    token: process.env.GATEWAY_TOKEN,
    bind: '127.0.0.1'
  }
};

scan(myConfig)
  .then(result => {
    console.log('Risk Level:', result.risk_level);
    console.log('Findings:', result.findings_count);
    console.log('\n' + result.report);
  })
  .catch(err => console.error('Scan failed:', err));
```

### With Retry Logic

```javascript
async function scanWithRetry(configData, attempt = 1) {
  try {
    return await scan(configData);
  } catch (error) {
    if (attempt >= config.server.retry.maxAttempts) {
      throw error;
    }
    
    const delay = config.server.retry.initialDelay * 
                  Math.pow(config.server.retry.backoffMultiplier, attempt - 1);
    
    console.log(`Retry ${attempt}/${config.server.retry.maxAttempts} after ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return scanWithRetry(configData, attempt + 1);
  }
}
```

### Health Check

```javascript
const https = require('https');
const config = require('./config.json');

async function healthCheck() {
  const url = new URL(config.endpoints.health, config.server.url);
  
  return new Promise((resolve, reject) => {
    https.get(url.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const health = JSON.parse(data);
        console.log(`✅ Server ${health.status} (uptime: ${health.uptime}s)`);
        resolve(health);
      });
    }).on('error', reject);
  });
}

healthCheck();
```

## Troubleshooting

### Test Failures

**Connection refused**:
- Verify server URL in config.json
- Check Railway deployment status
- Test with: `curl https://clawsec-skill-production.up.railway.app/health`

**Timeout errors**:
- Increase timeout values in config.json
- Check network connectivity
- Verify no firewall blocking HTTPS

**Invalid input errors**:
- Ensure test data is valid JSON object
- Check server logs for validation errors
- Verify API endpoint paths are correct

**Retry not working**:
- Ensure `retry.enabled: true` in config
- Check retry attempts in console output
- Verify error types are retriable

### Custom Configuration

Create `config.local.json` to override defaults:

```json
{
  "server": {
    "url": "http://localhost:4021",
    "timeout": {
      "connection": 10000,
      "request": 30000
    }
  }
}
```

Update test script to use local config:
```javascript
const config = require('./config.local.json');
```

## Best Practices

1. **Always test against production** before deploying changes
2. **Run tests in CI/CD** pipeline to catch regressions
3. **Monitor test duration** - slow tests indicate performance issues
4. **Check test-results.json** after each run for detailed metrics
5. **Keep config.json in version control** - config.local.json for overrides
6. **Update tests** when adding new API endpoints
7. **Test error scenarios** - don't just test happy paths

## Support

- See main [README](../README.md) for project overview
- See [API Reference](../docs/api-reference.md) for endpoint details
- See [Troubleshooting Guide](../README.md#-troubleshooting) for common issues

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run integration tests
        run: |
          cd client
          node test-integration.js
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: client/test-results.json
```

---

*Part of ClawSec - AI-powered security audits for OpenClaw*
