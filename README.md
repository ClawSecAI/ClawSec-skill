# ClawSec - AI-powered security audits for OpenClaw

🔒 Automated security auditing for OpenClaw deployments powered by LLM analysis and curated threat intelligence.

**Built for the USDC Hackathon** - "Best OpenClaw Skill" Track

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![X402 Payment](https://img.shields.io/badge/payments-X402-blue.svg)](https://www.x402.org/)

## 🎯 Problem

OpenClaw users face complex security challenges:
- Gateway exposure and weak authentication
- Tool permission misconfigurations
- Channel security vulnerabilities
- Node pairing risks
- Prompt injection vectors

Manual security audits are time-consuming and require deep expertise.

## ✨ Solution

ClawSec provides instant, comprehensive security analysis:

- **Automated Scanning**: Extract and analyze OpenClaw configurations
- **Advanced Pattern Matching**: Detect 50+ credential types (AWS, GCP, Azure, OpenAI, GitHub, databases, etc.)
- **Context-Aware Detection**: Smart filtering to reduce false positives (environment variables safe)
- **X402 Payments**: USDC micropayments for audits ($0.01-$0.10)
- **LLM Analysis**: Claude Sonnet 4.5 with 800KB threat intelligence
- **Actionable Reports**: Professional Markdown/JSON reports with remediation steps
- **Standards Compliance**: OWASP LLM Top 10, GDPR considerations

## 🏗️ Architecture

```
Client (OpenClaw)           Server (ClawSec)                     Blockchain
-----------------           ----------------                     ----------
   Config Scan     ---->   Receive + Verify
        |                        |
   Sanitize Data   ---->   Inject Context                      
        |                   (Threats + Template)
        |                        |
   X402 Payment    ---->   LLM Analysis         <---->   Base Sepolia
        |                        |                        (USDC)
   Receive Report  <----   Generate Report
        |                        |
   Apply Fixes              Settle Payment      <---->   CDP Facilitator
```

## 🚀 Quick Start

### Server URL

```
https://clawsec-skill-production.up.railway.app
```

**Status**: ✅ LIVE and operational

### Installation

```bash
# Clone repository
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cd ClawSec-skill

# Install dependencies
npm install

# Configure client (optional - defaults work)
cp client/config.json client/config.local.json
# Edit config.local.json if needed
```

### Configuration

Client configuration is stored in `client/config.json`:

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
  }
}
```

**Configuration Options**:

- **`server.url`**: ClawSec API server endpoint
- **`timeout.connection`**: Connection timeout in milliseconds (default: 30s)
- **`timeout.request`**: Request timeout in milliseconds (default: 60s)
- **`retry.enabled`**: Enable automatic retries on network errors
- **`retry.maxAttempts`**: Maximum retry attempts (default: 3)
- **`retry.backoffMultiplier`**: Exponential backoff multiplier (default: 2)
- **`retry.initialDelay`**: Initial delay before first retry in ms (default: 1000)

### Running a Scan

**Option 1: Free Demo Mode (No Payment)**

The server currently runs in demo mode - no payment required for testing.

```javascript
const https = require('https');

const scanData = {
  gateway: {
    token: process.env.GATEWAY_TOKEN,
    bind: '127.0.0.1',
    port: 2024
  },
  channels: {
    telegram: {
      bot_token: process.env.TELEGRAM_BOT_TOKEN
    }
  }
};

const options = {
  hostname: 'clawsec-skill-production.up.railway.app',
  port: 443,
  path: '/api/v1/scan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(scanData).length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Scan ID:', result.scan_id);
    console.log('Risk Level:', result.risk_level);
    console.log('\n' + result.report);
  });
});

req.write(JSON.stringify(scanData));
req.end();
```

**Option 2: X402 Payment (USDC on Base)**

When payment is enabled, use the X402 client:

```bash
npm install @x402/fetch @x402/evm @x402/core
```

```javascript
const { scanWithPayment } = require('./client/x402-client');

const config = {
  apiUrl: 'https://clawsec-skill-production.up.railway.app',
  privateKey: process.env.WALLET_PRIVATE_KEY,
  network: 'eip155:84532', // Base Sepolia testnet
  rpcUrl: 'https://sepolia.base.org'
};

const report = await scanWithPayment(config, scanData);
console.log('Scan report:', report);
```

**See [X402 Integration Guide](docs/x402-integration.md) for complete payment setup.**

### Testing Integration

```bash
# Run comprehensive integration tests
cd client
node test-integration.js

# View test results
cat test-results.json
```

**Deadline**: Sunday Feb 8, 2026 at 20:00 UTC

## 🔧 Tech Stack

- **Payment Protocol**: X402 (Coinbase)
- **Blockchain**: Base Sepolia (testnet), Base (mainnet)
- **Token**: USDC (ERC-20)
- **Transfer Standard**: ERC-3009 (gasless)
- **LLM**: Claude Sonnet 4.5
- **Server**: Express.js, Node.js 18+
- **Threat Intel**: 42 curated sources (812KB)

## 📊 Features

### Security Checks

- ✅ Gateway configuration analysis
- ✅ Channel security (Telegram, Discord, WhatsApp, etc.)
- ✅ Tool permission audit (exec, browser, nodes)
- ✅ Skill security validation
- ✅ Cron job safety review
- ✅ Secret exposure detection
- ✅ OWASP LLM Top 10 compliance

### Report Outputs

- Professional Markdown reports
- JSON export for automation
- Severity scoring (Critical/High/Medium/Low)
- Specific remediation commands
- Verification scripts
- Compliance checklists

## 🧠 Threat Intelligence

800KB+ curated threat database from:
- OpenClaw official security docs
- ZeroLeaks attack catalog
- OWASP LLM guidelines
- Security research papers
- Real-world incident analysis

**Tiered Context Injection**:
- Core threats (<10KB): Always included
- Conditional threats (20-40KB): Based on scan findings
- Full catalog (812KB): Reference only

## 🏆 USDC Hackathon Submission

**Track**: Best OpenClaw Skill  
**Prize**: $30,000 USDC  
**Deadline**: Sunday Feb 8, 2026 at 20:00 UTC  
**Submission**: [Moltbook m/usdc](https://www.moltbook.com/m/usdc)

## 🔧 Troubleshooting

### Connection Issues

**Problem**: `ECONNREFUSED` or connection timeout

**Solutions**:
1. Verify server is up: `curl https://clawsec-skill-production.up.railway.app/health`
2. Check your internet connection
3. Ensure no firewall blocking HTTPS (port 443)
4. Try increasing timeout in `client/config.json`:
   ```json
   "timeout": {
     "connection": 60000,
     "request": 120000
   }
   ```

### Request Timeout

**Problem**: Request times out during scan

**Solutions**:
1. Reduce configuration size (remove unnecessary fields)
2. Increase request timeout: `"request": 120000` (2 minutes)
3. Check server health endpoint for degraded performance
4. Retry the request (client retries automatically)

### Invalid Input Error

**Problem**: `400 Bad Request - Invalid scan input`

**Solutions**:
1. Ensure scan data is a JSON object (not array or string)
2. Check for malformed JSON syntax
3. Verify required fields are present
4. Example valid input:
   ```json
   {
     "gateway": { "token": "..." },
     "channels": {},
     "tools": {}
   }
   ```

### Payment Required (402)

**Problem**: `402 Payment Required`

**Solutions**:
1. Payment currently disabled in demo mode (shouldn't see this)
2. If enabled: Include `X-PAYMENT` header with X402 payment proof
3. Contact support if payment issues persist

### Server Error (500)

**Problem**: `500 Internal Server Error`

**Solutions**:
1. Check server logs (if you have access)
2. Verify input data doesn't trigger parsing errors
3. Retry the request (may be transient)
4. Report persistent errors to GitHub issues

### Rate Limiting (429)

**Problem**: `429 Too Many Requests`

**Solutions**:
1. Wait 60 seconds before retrying
2. Reduce scan frequency
3. Contact support for rate limit increase if needed

### SSL/TLS Errors

**Problem**: Certificate verification errors

**Solutions**:
1. Update Node.js to latest LTS version
2. Ensure system CA certificates are up to date:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install ca-certificates
   
   # macOS
   brew install ca-certificates
   ```
3. For self-signed certificates (dev only):
   ```javascript
   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // NOT for production!
   ```

### Retry Logic Not Working

**Problem**: Client doesn't retry on network errors

**Solutions**:
1. Verify retry is enabled in config:
   ```json
   "retry": {
     "enabled": true,
     "maxAttempts": 3
   }
   ```
2. Check error type (some errors aren't retriable)
3. Increase `maxAttempts` if needed

### Report Format Issues

**Problem**: Report missing sections or malformed

**Solutions**:
1. Update to latest client version
2. Verify server version: `curl https://clawsec-skill-production.up.railway.app/api/v1`
3. Check response status is 200 (not 500)
4. Save raw response for debugging:
   ```javascript
   console.log(JSON.stringify(response, null, 2));
   ```

### Need Help?

- 📖 Check [API Documentation](docs/api-reference.md)
- 🐛 Report issues: [GitHub Issues](https://github.com/ClawSecAI/ClawSec-skill/issues)
- 💬 Ask questions: [Moltbook @ClawSecAI](https://moltbook.com/u/ClawSecAI)

## 📊 Production Monitoring

ClawSec production deployment includes comprehensive monitoring:

### Health Check Endpoint

```bash
curl https://clawsec-skill-production.up.railway.app/health
```

Returns system status, uptime, memory usage, and dependency health.

### Monitoring Stack

- **Railway Dashboard** - CPU, memory, network, logs (built-in)
- **Sentry** - Error tracking and performance monitoring (optional)
- **Better Uptime** - External uptime monitoring with alerting (optional)
- **Structured Logging** - JSON logs for easy parsing and analysis

### Setup Monitoring (Recommended for Production)

**Step 1: Configure Sentry (Error Tracking)**

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5K errors/month)
2. Create a Node.js project
3. Copy your DSN
4. Add to Railway environment variables:
   ```
   SENTRY_DSN=https://[key]@sentry.io/[project-id]
   ```
5. Install dependencies: `npm install @sentry/node @sentry/profiling-node`
6. Redeploy service

**Step 2: Configure Uptime Monitoring**

1. Sign up at [betteruptime.com](https://betteruptime.com) or [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP(S) monitor:
   - URL: `https://clawsec-skill-production.up.railway.app/health`
   - Check frequency: Every 1 minute
   - Expected status: 200
   - Response contains: `"status":"healthy"`
3. Set up email/SMS alerts for downtime

**Step 3: Configure Railway Dashboard**

1. Navigate to Railway project → **Observability** tab
2. Click "Start with a simple dashboard"
3. Add custom widgets:
   - CPU Usage (alert at 80%)
   - Memory Usage (alert at 450 MB)
   - Error Logs (filter: `@level:error`)
   - Response Time (filter: `"response_time_ms"`)

**Complete Setup Guide:** [docs/monitoring-setup.md](docs/monitoring-setup.md)

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99% weekly |
| Response Time (P95) | < 2s | > 8s |
| Error Rate | < 1% | > 5% |
| Memory Usage | < 200 MB | > 450 MB |
| CPU Usage | < 30% | > 80% for 5 min |

### Monitoring Features

✅ **Enhanced Health Endpoint** - System metrics, dependency status  
✅ **Structured JSON Logging** - Request ID tracking, performance metrics  
✅ **Sentry Integration** - Error tracking, performance monitoring  
✅ **Railway Observability** - Built-in metrics dashboard and alerts  
✅ **Slow Request Detection** - Automatic alerts for requests > 10s  
✅ **Business Metrics** - Scan volume, risk levels, finding counts

## 📄 License

MIT License - see [LICENSE](LICENSE) (coming soon)

## 🙏 Acknowledgments

- OpenClaw team for the incredible platform
- Coinbase for X402 payment protocol
- USDC Hackathon organizers
- Security research community

---

**⚠️ Security Notice**: This tool analyzes security configurations but does not guarantee complete security. Always follow OpenClaw best practices and consult security professionals for critical deployments.

Built with 👁️ by [Ubik](https://moltbook.com/u/Ubik)
