# ClawSec Configuration Guide

Complete guide to configuring ClawSec client and server with environment variables and configuration files.

---

## 📂 Configuration Files

### Client Configuration: `client/config.json`

Controls how the ClawSec client connects to the server and handles requests.

**Default configuration:**

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

**Configuration options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `server.url` | String | Production URL | ClawSec API server endpoint |
| `timeout.connection` | Integer | 30000 | Connection timeout (ms) |
| `timeout.request` | Integer | 60000 | Request timeout (ms) |
| `retry.enabled` | Boolean | true | Enable automatic retries |
| `retry.maxAttempts` | Integer | 3 | Maximum retry attempts |
| `retry.backoffMultiplier` | Integer | 2 | Exponential backoff multiplier |
| `retry.initialDelay` | Integer | 1000 | Initial delay before retry (ms) |

**Create custom configuration:**

```bash
# Copy default config
cp client/config.json client/config.local.json

# Edit custom config
nano client/config.local.json

# Use custom config with CLI
CLAWSEC_CONFIG=client/config.local.json clawsec scan config.json
```

### Server Configuration: `.env`

Controls server behavior, API keys, payment settings, and monitoring.

**Create from template:**

```bash
cp .env.example .env
nano .env
```

---

## 🔐 Environment Variables (Server)

### Required Variables

These environment variables are **REQUIRED** for the server to function:

#### `ANTHROPIC_API_KEY` (Required)

**Description:** API key for Claude AI models (Haiku/Sonnet)  
**Required:** ✅ Yes  
**Default:** None  
**Example:** `sk-ant-api03-...`

**How to obtain:**
1. Create account at https://console.anthropic.com/
2. Navigate to "API Keys" section
3. Generate new API key
4. Copy and paste into `.env`

```bash
ANTHROPIC_API_KEY=sk-ant-api03-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

**⚠️ Security warning:** Never commit API keys to Git. Keep `.env` out of version control.

---

### Core Server Settings

#### `NODE_ENV`

**Description:** Application environment mode  
**Required:** No  
**Default:** `development`  
**Options:** `development`, `production`, `test`

```bash
NODE_ENV=production
```

**Effects:**
- `development`: Verbose logging, hot reload, no minification
- `production`: Optimized performance, minimal logging, error tracking
- `test`: Test mode with mock services

#### `PORT`

**Description:** HTTP server port  
**Required:** No  
**Default:** `4021`  
**Valid range:** 1024-65535

```bash
PORT=4021
```

**Note:** Railway auto-assigns port via `process.env.PORT` (overrides this value in production).

---

### AI/LLM Configuration

#### `LLM_MODEL`

**Description:** Override default Claude model  
**Required:** No  
**Default:** `claude-3-5-haiku-20241022` (optimized for cost/performance)  
**Options:**
- `claude-3-5-haiku-20241022` - Fast, cheap ($0.01/scan)
- `claude-3-5-sonnet-20241022` - Higher quality ($0.03/scan)
- `claude-3-opus-20240229` - Deep analysis ($0.10+/scan)

```bash
LLM_MODEL=claude-3-5-sonnet-20241022
```

**Cost comparison:**
- Haiku: ~$0.007/scan (recommended for MVP)
- Sonnet: ~$0.20/scan (premium tier)
- Opus: ~$0.50-1.00/scan (enterprise tier)

---

### X402 Payment Configuration

Configure USDC micropayments on Base blockchain using X402 protocol.

#### `ENABLE_PAYMENT`

**Description:** Enable/disable payment processing  
**Required:** No  
**Default:** `false` (free demo mode)  
**Options:** `true`, `false`

```bash
# Disable payments for testing/demo
ENABLE_PAYMENT=false

# Enable payments for production
ENABLE_PAYMENT=true
```

**When disabled:** Server accepts all requests without payment (free tier for testing).

#### `NETWORK`

**Description:** Blockchain network for payments  
**Required:** No (if payment enabled)  
**Default:** `base-sepolia`  
**Options:**
- `base-sepolia` - Testnet (free test USDC)
- `base` - Mainnet (real USDC)

```bash
# Testnet for development
NETWORK=base-sepolia

# Mainnet for production
NETWORK=base
```

**Network details:**
- **Base Sepolia** (Testnet)
  - Chain ID: 84532
  - RPC: `https://sepolia.base.org`
  - Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
  - Facilitator: `https://www.x402.org/facilitator`

- **Base** (Mainnet)
  - Chain ID: 8453
  - RPC: `https://mainnet.base.org`
  - USDC Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - Facilitator: `https://www.x402.org/facilitator`

#### `PAYMENT_PRIVATE_KEY`

**Description:** Ethereum private key for receiving payments  
**Required:** Yes (if payment enabled)  
**Default:** None  
**Format:** 64-character hex string (with or without `0x` prefix)

```bash
PAYMENT_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**⚠️ CRITICAL SECURITY WARNINGS:**

1. **TESTNET ONLY in development:**
   - Use dedicated testnet wallet (see `/root/.openclaw/testwallets.md`)
   - Never use mainnet private keys in `.env` files
   - Never commit private keys to Git (even testnet keys in production)

2. **Production deployment:**
   - Set private key via Railway environment variables (not `.env` file)
   - Use wallet specifically created for ClawSec payments
   - Keep private key in secure secrets manager
   - Rotate keys periodically

3. **Safe practices:**
   - Generate new wallet for ClawSec: `openssl rand -hex 32`
   - Store backup in password manager (1Password, Bitwarden)
   - Never share private keys via Slack/Discord/email
   - Use hardware wallet for high-value mainnet deployments

**Test wallet setup:**

```bash
# For testnet development, use test wallets from testwallets.md
# Wallet 1 (Server): 0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8
PAYMENT_PRIVATE_KEY=0x[see testwallets.md]

# Get test USDC from Base Sepolia faucet
# Then fund wallet via https://www.coinbase.com/faucets/
```

#### `X402_FACILITATOR`

**Description:** X402 payment facilitator URL  
**Required:** No  
**Default:** X402 default facilitator  
**Example:** `https://facilitator.x402.org`

```bash
X402_FACILITATOR=https://www.x402.org/facilitator
```

**Note:** Only override if using custom facilitator service. Default works for 99% of deployments.

---

### Monitoring & Error Tracking

#### `SENTRY_DSN`

**Description:** Sentry error tracking endpoint  
**Required:** No (optional for production)  
**Default:** None  
**Format:** `https://<key>@o<org-id>.ingest.sentry.io/<project-id>`

```bash
SENTRY_DSN=https://abc123def456@o789012.ingest.sentry.io/3456789
```

**How to set up:**

1. Create free Sentry account at https://sentry.io/signup/
2. Create new project (Node.js/Express)
3. Copy DSN from project settings
4. Paste into `.env`

**When enabled:**
- Automatic error capture and stack traces
- Performance monitoring (10% sample rate)
- Release tracking and source maps
- User feedback integration
- Slack/Discord alerts on errors

**When disabled:** Errors logged to console only (development mode).

#### `RAILWAY_GIT_COMMIT_SHA`

**Description:** Git commit SHA for release tracking  
**Required:** No  
**Default:** None (auto-set by Railway)  
**Format:** 40-character Git SHA

```bash
RAILWAY_GIT_COMMIT_SHA=abc123def456...
```

**Note:** Automatically set by Railway during deployment. Used by Sentry to link errors to code versions.

#### `RAILWAY_ENVIRONMENT`

**Description:** Railway deployment environment  
**Required:** No  
**Default:** `production` (auto-set by Railway)  
**Options:** `production`, `staging`, `development`

```bash
RAILWAY_ENVIRONMENT=production
```

**Note:** Auto-managed by Railway. Used for environment-specific logging and monitoring.

---

### Security Configuration

#### `RATE_LIMIT_MAX`

**Description:** Maximum requests per IP per time window  
**Required:** No  
**Default:** `100`  
**Valid range:** 1-10000

```bash
RATE_LIMIT_MAX=100
```

**Recommended values:**
- Development: `1000` (no limits)
- Production free tier: `100` (prevent abuse)
- Production paid tier: `500-1000` (generous limits)

#### `RATE_LIMIT_WINDOW`

**Description:** Rate limit time window (milliseconds)  
**Required:** No  
**Default:** `60000` (1 minute)  
**Format:** Integer in milliseconds

```bash
RATE_LIMIT_WINDOW=60000  # 1 minute
RATE_LIMIT_WINDOW=900000 # 15 minutes
```

**Combined with `RATE_LIMIT_MAX`:**
- `MAX=100, WINDOW=60000` → 100 requests per minute
- `MAX=10, WINDOW=60000` → 10 requests per minute (strict)

---

### Development/Testing

#### `DEBUG`

**Description:** Enable verbose debug logging  
**Required:** No  
**Default:** `false`  
**Options:** `true`, `false`

```bash
DEBUG=true
```

**When enabled:**
- Detailed request/response logs
- Token usage tracking
- LLM prompt/response logging
- Sanitization debug output
- Performance timing metrics

**⚠️ Warning:** Debug logs may contain sensitive data. Only enable in secure development environments.

#### `BASE_URL`

**Description:** Base URL for webhooks and callbacks  
**Required:** No  
**Default:** `http://localhost:4021`  
**Format:** Full URL with protocol

```bash
# Development
BASE_URL=http://localhost:4021

# Production
BASE_URL=https://clawsec-skill-production.up.railway.app
```

**Used for:**
- X402 payment callbacks
- Webhook registrations
- External integrations

---

## 🧪 Configuration Examples

### Development Setup (Local Testing)

```bash
# .env for local development
NODE_ENV=development
PORT=4021
DEBUG=true

# LLM Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your-test-key-here
LLM_MODEL=claude-3-5-haiku-20241022

# Payment DISABLED for free testing
ENABLE_PAYMENT=false

# Monitoring disabled (console logs only)
# SENTRY_DSN not set

# Rate limits relaxed
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=60000

BASE_URL=http://localhost:4021
```

### Production Setup (Railway Deployment)

```bash
# .env for production (Railway)
NODE_ENV=production
# PORT auto-set by Railway

# LLM Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key-here
LLM_MODEL=claude-3-5-haiku-20241022

# Payment ENABLED with testnet (for hackathon)
ENABLE_PAYMENT=false  # Change to true after testnet validation
NETWORK=base-sepolia
PAYMENT_PRIVATE_KEY=0x[testnet-key-from-testwallets.md]
X402_FACILITATOR=https://www.x402.org/facilitator

# Monitoring enabled
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# RAILWAY_* auto-set by Railway

# Production rate limits
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Debug disabled in production
DEBUG=false

BASE_URL=https://clawsec-skill-production.up.railway.app
```

### Mainnet Production (Post-Hackathon)

```bash
# .env for mainnet production
NODE_ENV=production

# LLM Configuration
ANTHROPIC_API_KEY=sk-ant-api03-production-key
LLM_MODEL=claude-3-5-haiku-20241022

# Payment ENABLED with MAINNET
ENABLE_PAYMENT=true
NETWORK=base
PAYMENT_PRIVATE_KEY=0x[SECURE-MAINNET-KEY-NEVER-COMMIT]

# Full monitoring stack
SENTRY_DSN=https://production-sentry-dsn@sentry.io/project-id

# Strict rate limits
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW=60000

DEBUG=false
BASE_URL=https://clawsec.ai
```

---

## 🔒 Security Best Practices

### Protecting Secrets

**1. Never commit secrets to Git:**

```bash
# Verify .env is in .gitignore
cat .gitignore | grep .env

# If not present, add it
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

**2. Use environment-specific .env files:**

```bash
.env              # Committed template (no real keys)
.env.development  # Local dev (gitignored)
.env.production   # Production (Railway secrets)
```

**3. Rotate API keys periodically:**
- Anthropic API keys: Every 90 days
- Payment private keys: Every 6-12 months
- Sentry DSNs: When team members leave

**4. Principle of least privilege:**
- Create separate API keys for dev/staging/prod
- Use read-only keys where possible
- Limit payment wallet to minimal funds

### Railway Secrets Management

**Set secrets via Railway CLI (recommended):**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Set secrets (not in .env file)
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set PAYMENT_PRIVATE_KEY=0x...
railway variables set SENTRY_DSN=https://...

# List all variables
railway variables list
```

**Set secrets via Railway dashboard:**

1. Navigate to project → Settings → Variables
2. Click "New Variable"
3. Add key-value pairs
4. Deploy to apply changes

---

## 🧪 Testing Configuration

### Verify Server Configuration

```bash
# Check environment variables (masks secrets)
curl https://clawsec-skill-production.up.railway.app/health

# Test with debug output
DEBUG=true npm start

# Validate payment configuration
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Validate API Keys

```bash
# Test Anthropic API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'

# Should return JSON response (not 401 Unauthorized)
```

### Test Payment Configuration

```bash
# Verify wallet address derivation
node -e "
const { ethers } = require('ethers');
const wallet = new ethers.Wallet('$PAYMENT_PRIVATE_KEY');
console.log('Wallet address:', wallet.address);
"

# Check wallet balance (Base Sepolia)
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["YOUR_WALLET_ADDRESS", "latest"],
    "id": 1
  }'
```

---

## 📚 Configuration Checklist

### Before Deployment:

- [ ] Copy `.env.example` to `.env`
- [ ] Set `ANTHROPIC_API_KEY` (required)
- [ ] Configure payment settings if enabling USDC payments
- [ ] Set up Sentry DSN for error tracking (recommended)
- [ ] Adjust rate limits for expected traffic
- [ ] Set `NODE_ENV=production`
- [ ] Verify all secrets are in Railway/environment (not committed)
- [ ] Test configuration with `npm start`

### After Deployment:

- [ ] Verify health endpoint: `curl /health`
- [ ] Test scan endpoint: `POST /api/v1/scan` with sample data
- [ ] Check Sentry dashboard for error tracking
- [ ] Monitor Railway logs for startup errors
- [ ] Test rate limiting with multiple requests
- [ ] Verify X402 payments (if enabled) with testnet transaction

---

## 🐛 Troubleshooting Configuration

### "Missing ANTHROPIC_API_KEY" error

**Problem:** Server fails to start or LLM requests fail

**Solution:**
```bash
# Check if key is set
echo $ANTHROPIC_API_KEY

# Set in current shell
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Or add to .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Restart server
npm start
```

### Payment transactions failing

**Problem:** X402 payment errors or "402 Payment Required"

**Solution:**
```bash
# Verify payment is enabled
grep ENABLE_PAYMENT .env

# Check wallet has funds (testnet)
# Visit: https://sepolia.basescan.org/address/YOUR_WALLET_ADDRESS

# Verify network matches (base-sepolia for testnet)
grep NETWORK .env

# Test with payment disabled temporarily
ENABLE_PAYMENT=false npm start
```

### Rate limiting too strict

**Problem:** "429 Too Many Requests" errors

**Solution:**
```bash
# Increase limits in .env
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW=60000

# Or disable completely for testing
# Comment out rate limiting in server/index.js temporarily
```

---

## 📖 Related Documentation

- [INSTALLATION.md](./INSTALLATION.md) - Installation guide
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Dependency documentation
- [docs/x402-integration.md](./x402-integration.md) - Payment setup guide
- [docs/MONITORING.md](./MONITORING.md) - Monitoring and observability

---

**Configuration complete! 🎉**

Start the server:
```bash
npm start
```

Test configuration:
```bash
clawsec health
```
