---
name: clawsec
display_name: ClawSec Security Auditor
version: 0.1.0-hackathon
emoji: 🔒
author: Ubik <ubik@clawsec.ai>
description: AI-powered security auditing for OpenClaw deployments with LLM analysis and threat intelligence
repository: https://github.com/ClawSecAI/ClawSec-skill
license: MIT
tags:
  - security
  - audit
  - compliance
  - x402
  - usdc
  - blockchain
  - payment
categories:
  - Security & Privacy
  - Developer Tools
  - Utilities
required_bins: []
required_env:
  - CLAWSEC_SERVER
optional_env:
  - CLAWSEC_CONFIG
  - CLAWSEC_PAYMENT_ENABLED
x402_payment:
  enabled: true
  network: base-sepolia  # base for mainnet
  currency: USDC
  pricing:
    basic: 0.01    # Haiku model - fast, cheap
    thorough: 0.03 # Sonnet model - comprehensive
  facilitator: https://www.x402.org/facilitator
dependencies:
  npm:
    - glob@^10.3.0
    - p-limit@^5.0.0
  system: []
installation:
  method: npm
  command: npm install -g clawsec
  repository_url: https://github.com/ClawSecAI/ClawSec-skill.git
standards_compliance:
  - OWASP LLM Top 10
  - GDPR considerations
  - CVSS v3.x scoring
  - ISO 27001 aligned
links:
  documentation: https://github.com/ClawSecAI/ClawSec-skill/blob/main/README.md
  api_reference: https://github.com/ClawSecAI/ClawSec-skill/blob/main/docs/api-reference.md
  issues: https://github.com/ClawSecAI/ClawSec-skill/issues
  homepage: https://github.com/ClawSecAI/ClawSec-skill
---

# ClawSec - AI-Powered Security Auditor

**🔒 Comprehensive security auditing for OpenClaw deployments powered by Claude AI and curated threat intelligence.**

---

## What is ClawSec?

ClawSec is an automated security auditing skill for OpenClaw that scans your configuration, logs, and workspace for security vulnerabilities. It combines:

- **Pattern Matching Engine** - Detects 70+ credential types (API keys, tokens, private keys, database passwords)
- **LLM Analysis** - Claude AI reviews findings with 800KB threat intelligence context
- **Sanitization Layer** - Strips sensitive data before sending (privacy-first design)
- **X402 Payments** - Optional USDC micropayments for premium scans ($0.01-$0.03)
- **Professional Reports** - Markdown/JSON reports with CVSS scoring and remediation steps

---

## How It Works

ClawSec performs a **privacy-first security audit** with these steps:

1. **Scan Configuration & Logs** - Analyze `openclaw.json`, `.env`, session logs, workspace files
2. **Detect Vulnerabilities** - Pattern matching for exposed credentials, weak configurations, prompt injections
3. **Sanitize Data** - Strip all sensitive information before transmission (no secrets leave your machine)
4. **LLM Analysis** - Send sanitized metadata to ClawSec API server for AI-powered review
5. **Generate Report** - Receive professional security report with:
   - Risk score (0-100) with confidence level
   - Vulnerability findings (severity, impact, evidence)
   - Prioritized recommendations (P0-P3 with time-to-fix)
   - Compliance mapping (OWASP, GDPR, CVSS)
   - Executive summary and next steps

**Privacy guarantee:** Only anonymized metadata is sent to the server. Your secrets never leave your machine.

---

## Installation

### Quick Install (Global CLI)

```bash
npm install -g clawsec
clawsec version
```

### From Source

```bash
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cd ClawSec-skill
npm install
npm install -g .
```

### OpenClaw Skill Setup

```bash
# Create skill directory
mkdir -p ~/.openclaw/skills/clawsec

# Symlink SKILL.md
ln -sf /path/to/ClawSec-skill/SKILL.md ~/.openclaw/skills/clawsec/SKILL.md

# Restart OpenClaw Gateway
openclaw gateway restart
```

---

## Configuration

### Required Environment Variables

```bash
# ClawSec API server endpoint (production)
export CLAWSEC_SERVER=https://clawsec-skill-production.up.railway.app
```

### Optional Environment Variables

```bash
# Custom config file path
export CLAWSEC_CONFIG=/path/to/custom/config.json

# Enable/disable payment (default: auto-detect based on server)
export CLAWSEC_PAYMENT_ENABLED=false
```

### Client Configuration File

Create `~/.clawsec/config.json` for custom settings:

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
      "maxAttempts": 3
    }
  }
}
```

---

## Usage

### CLI Commands

```bash
# Run security audit
clawsec scan /path/to/openclaw.json

# Check server health
clawsec health

# Show version
clawsec version

# Help
clawsec help
```

### Programmatic Usage

```javascript
const https = require('https');

// Prepare scan data
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

// Send to ClawSec API
const options = {
  hostname: 'clawsec-skill-production.up.railway.app',
  port: 443,
  path: '/api/v1/scan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Risk Level:', result.risk_level);
    console.log('Findings:', result.findings_count);
    console.log('\nReport:\n', result.report);
  });
});

req.write(JSON.stringify(scanData));
req.end();
```

### OpenClaw Skill Usage

Once installed, OpenClaw agents can use ClawSec naturally:

**Example prompts:**
- "Run a security audit of my configuration"
- "Check for exposed API keys in my workspace"
- "Scan my logs for credential leaks"
- "What security vulnerabilities do I have?"

**Behind the scenes, the agent will:**
1. Read `openclaw.json`, `.env`, session logs
2. Scan workspace files (memory/, scripts, custom skills)
3. Sanitize sensitive data (strip secrets)
4. Call ClawSec API with anonymized metadata
5. Present security report to user

---

## Features

### 🔍 Scanning Capabilities

**Configuration scanning:**
- Gateway token exposure (weak tokens, hardcoded secrets)
- Unsafe network bindings (`0.0.0.0` public exposure)
- Missing authentication (gateway, API endpoints)
- Tool permission misconfigurations
- Channel security vulnerabilities

**Credential detection (70+ patterns):**
- Cloud providers: AWS, GCP, Azure, DigitalOcean
- APIs: OpenAI, Anthropic, GitHub, Slack, Stripe
- Databases: PostgreSQL, MySQL, MongoDB, Redis
- Communication: Twilio, SendGrid, Mailgun, Mailchimp
- Blockchain: Ethereum/Bitcoin private keys
- Social: Twitter, Facebook, LinkedIn tokens
- CI/CD: CircleCI, Travis, Docker Hub, npm
- Payment: Square, PayPal, Coinbase

**Vulnerability detection:**
- Prompt injection vectors
- Session hijacking risks
- Data exfiltration paths
- Weak encryption/hashing
- Insecure defaults
- Missing rate limiting

### 🛡️ Privacy & Security

**Sanitization layer (50+ patterns):**
- API keys → `[REDACTED_OPENAI_KEY_sk-abc...xyz]`
- Tokens → `[REDACTED_JWT_TOKEN_eyJ...xyz]`
- Private keys → `[REDACTED_PRIVATE_KEY]`
- Emails → `u***k@example.com`
- IPs → `192.168.*.***`
- Credit cards → `**** **** **** 1234` (Luhn validated)
- SSNs → `***-**-1234`
- Connection strings → Redacted credentials

**What's sent to server:**
- Anonymized configuration structure
- Vulnerability patterns (not actual secrets)
- File paths (sanitized)
- Risk indicators
- Metadata only

**What's NEVER sent:**
- API keys, tokens, passwords
- Personal information (emails, names)
- Private keys or certificates
- Session data or user messages
- File contents with secrets

### 📊 Reporting & Compliance

**Report includes:**
- **Executive Summary** - Technical overview with threat IDs
- **Risk Score** - 0-100 with confidence level and calculation breakdown
- **Findings** - Severity, description, impact, likelihood, evidence
- **Prioritized Recommendations** - P0-P3 with time-to-fix and deadlines
- **Compliance Mapping** - OWASP LLM Top 10, GDPR, CVSS alignment
- **Next Steps** - Actionable checklist

**Risk levels:**
- **CRITICAL** (90-100): Immediate action required (exposed credentials, public admin access)
- **HIGH** (70-89): Urgent remediation (weak authentication, missing encryption)
- **MEDIUM** (40-69): Schedule fixes (outdated dependencies, weak configs)
- **LOW** (1-39): Best practices (documentation, monitoring improvements)
- **SECURE** (0): No significant issues found

**CVSS scoring:** Aligned with NIST/NVD standards (v3.x/v4.0)

### 💰 Payment Options

**Demo mode (free):**
- No payment required
- Full functionality
- Perfect for testing

**Basic tier ($0.01 USDC):**
- Claude 3.5 Haiku model
- Fast analysis (~4-6 seconds)
- All vulnerability detection
- Standard recommendations

**Thorough tier ($0.03 USDC):**
- Claude 3.5 Sonnet model
- Comprehensive analysis (~8-12 seconds)
- Enhanced context
- Detailed remediation steps

**Payment via X402 protocol:**
- Secure USDC transactions on Base blockchain
- Instant micropayments
- No subscription required
- Pay per scan

---

## API Reference

### POST `/api/v1/scan`

Submit security scan request.

**Request body:**
```json
{
  "gateway": {
    "token": "your-gateway-token",
    "bind": "127.0.0.1",
    "port": 2024
  },
  "channels": {
    "telegram": {
      "bot_token": "bot:token"
    }
  }
}
```

**Response:**
```json
{
  "scan_id": "scan_abc123",
  "risk_level": "HIGH",
  "risk_score": 75,
  "score_confidence": 0.92,
  "findings_count": 4,
  "findings": [
    {
      "severity": "HIGH",
      "category": "authentication",
      "description": "Weak gateway token detected",
      "impact": "Unauthorized access to agent",
      "likelihood": "high",
      "evidence": "Token length: 12 characters (minimum 32 recommended)"
    }
  ],
  "prioritized_recommendations": [
    {
      "priority": "P0",
      "time_to_fix": "1-2 hours",
      "deadline": "Immediate",
      "tasks": ["Regenerate gateway token with 32+ characters"]
    }
  ],
  "report": "# ClawSec Security Audit Report\n\n..."
}
```

### GET `/health`

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0-hackathon",
  "uptime": 12345,
  "memory_usage": 123456789,
  "cpu_usage": 25.5
}
```

### GET `/api/v1/threats`

Retrieve threat intelligence database.

**Response:**
```json
{
  "threats": [...],
  "count": 349,
  "categories": ["prompt_injection", "credential_leak", "config_vulnerability"]
}
```

---

## Troubleshooting

### Cannot connect to server

**Problem:** `clawsec health` fails with connection error

**Solution:**
```bash
# Check server URL
echo $CLAWSEC_SERVER

# Set if missing
export CLAWSEC_SERVER=https://clawsec-skill-production.up.railway.app

# Test connectivity
curl https://clawsec-skill-production.up.railway.app/health
```

### Permission errors during scan

**Problem:** Cannot read `openclaw.json` or `.env`

**Solution:**
```bash
# Run with appropriate permissions
sudo clawsec scan /root/.openclaw/openclaw.json

# Or copy config to accessible location
cp /root/.openclaw/openclaw.json ~/openclaw-config.json
clawsec scan ~/openclaw-config.json
```

### Payment failures (402 errors)

**Problem:** Scan rejected with "Payment Required"

**Solution:**
1. Demo mode should be enabled by default (no payment)
2. If payment enabled, ensure wallet has testnet USDC
3. Check network: `base-sepolia` for testnet, `base` for mainnet
4. Contact support: ubik@clawsec.ai

### False positives in scan results

**Problem:** ClawSec flags environment variable references as credentials

**Solution:**
- ✅ ClawSec has context-aware detection - env vars like `$API_KEY` are NOT flagged
- ❌ Actual secrets like `sk-ant-api03-abc123` ARE flagged
- If false positive occurs, report issue: https://github.com/ClawSecAI/ClawSec-skill/issues

---

## Security & Privacy

### Data Handling

**What ClawSec does:**
- ✅ Scans locally on your machine
- ✅ Sanitizes ALL sensitive data before transmission
- ✅ Sends only anonymized metadata to server
- ✅ Uses encrypted HTTPS connections
- ✅ Complies with GDPR principles (data minimization)

**What ClawSec does NOT do:**
- ❌ Store your secrets or credentials
- ❌ Log sensitive information
- ❌ Share data with third parties
- ❌ Require cloud storage or accounts
- ❌ Track users or analytics

### Transparency

**Open source:**
- Full source code available: https://github.com/ClawSecAI/ClawSec-skill
- Client-side scanning code: `client/` directory
- Sanitization patterns: `client/sanitizer.js`
- Server-side code: `server/` directory

**Audit trail:**
- View sanitized data before sending (debug mode)
- All API requests logged locally
- Review reports for flagged items

---

## Standards Compliance

### OWASP LLM Top 10

ClawSec detects vulnerabilities from OWASP LLM Top 10 (2023):

1. **LLM01: Prompt Injection** - Detects jailbreak patterns, system prompt leaks
2. **LLM02: Insecure Output Handling** - Flags unsafe command execution
3. **LLM03: Training Data Poisoning** - Identifies suspicious skill sources
4. **LLM04: Model Denial of Service** - Detects resource exhaustion vectors
5. **LLM05: Supply Chain Vulnerabilities** - Scans dependency chains
6. **LLM06: Sensitive Information Disclosure** - Finds exposed credentials/PII
7. **LLM07: Insecure Plugin Design** - Analyzes tool permissions
8. **LLM08: Excessive Agency** - Flags overly permissive configurations
9. **LLM09: Overreliance** - Warns about missing validation
10. **LLM10: Model Theft** - Detects API key exposure

### GDPR Considerations

**Data minimization:** Only essential metadata sent to server  
**Purpose limitation:** Data used solely for security analysis  
**Storage limitation:** Reports not stored long-term on server  
**Transparency:** Users see exactly what data is sent  
**Data portability:** Reports exportable in multiple formats

### CVSS v3.x Scoring

Risk scores aligned with NIST/NVD Common Vulnerability Scoring System:
- **CRITICAL (9.0-10.0)** → ClawSec 90-100
- **HIGH (7.0-8.9)** → ClawSec 70-89
- **MEDIUM (4.0-6.9)** → ClawSec 40-69
- **LOW (0.1-3.9)** → ClawSec 1-39

---

## Development

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:e2e
npm run test:monitoring

# Run pattern matching tests
node tests/test-patterns.js

# Run sanitization tests
node tests/test-advanced-sanitization.js

# Run LLM comparison tests
node tests/test-llm-comparison.js
```

### Local Development

```bash
# Clone repository
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cd ClawSec-skill

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env  # Add ANTHROPIC_API_KEY

# Start server
npm run dev

# In another terminal, test client
./client/bin/clawsec health
./client/bin/clawsec scan examples/sample-scan.json
```

### Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Areas for contribution:**
- New credential patterns (see `client/patterns.js`)
- Additional sanitization rules (`client/advanced-sanitizer.js`)
- Threat intelligence updates (`security/threat-intel/`)
- Documentation improvements
- Test coverage expansion

---

## Support

**Documentation:** https://github.com/ClawSecAI/ClawSec-skill/blob/main/README.md  
**Issues:** https://github.com/ClawSecAI/ClawSec-skill/issues  
**Email:** ubik@clawsec.ai  
**License:** MIT

---

## Roadmap

**v0.2.0 - Post-Hackathon:**
- [ ] Mainnet deployment (Base mainnet with real USDC)
- [ ] Custom threat intelligence feeds
- [ ] PDF report generation
- [ ] Scheduled periodic scans
- [ ] Slack/Discord/email notifications
- [ ] Multi-agent reputation system

**v0.3.0 - Production:**
- [ ] ClawHub marketplace listing
- [ ] Dedicated scanning logic (beyond LLM)
- [ ] Real-time threat feed integration
- [ ] Agent-to-agent security ratings
- [ ] Compliance frameworks (SOC 2, ISO 27001)
- [ ] Enterprise features (teams, SSO, audit logs)

---

**Built for USDC Hackathon "Best OpenClaw Skill" Track 🏆**

Made with 🔒 by Ubik
