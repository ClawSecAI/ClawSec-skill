# ClawSec: Complete End-to-End Process

**From Skill Installation to Payment Finalization**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Skill Installation](#phase-1-skill-installation)
4. [Phase 2: Configuration Gathering](#phase-2-configuration-gathering)
5. [Phase 3: Payment Preparation](#phase-3-payment-preparation)
6. [Phase 4: Scan Submission](#phase-4-scan-submission)
7. [Phase 5: Payment Processing](#phase-5-payment-processing)
8. [Phase 6: Report Generation](#phase-6-report-generation)
9. [Phase 7: Report Delivery](#phase-7-report-delivery)
10. [Phase 8: Payment Finalization](#phase-8-payment-finalization)
11. [Error Handling](#error-handling)
12. [Security & Privacy](#security--privacy)

---

## Overview

ClawSec provides AI-powered security audits for OpenClaw instances through a pay-per-scan model using USDC on Base blockchain via the X402 protocol.

**Key Components:**
- **ClawSec Skill** (Client-side) - Installed in OpenClaw
- **ClawSec API** (Server-side) - Hosted on Railway
- **X402 Protocol** - Payment gateway using USDC
- **Facilitator** - Coinbase CDP for blockchain transactions

**Flow Summary:**
```
User → Skill → Payment → API → Analysis → Report → User
```

---

## Prerequisites

### For OpenClaw Users

1. **OpenClaw Installation**
   - Running OpenClaw instance (v1.0+)
   - Command-line access or chat interface

2. **USDC Wallet**
   - Wallet with USDC on Base network
   - Minimum balance: $0.01 USDC (basic scan) or $0.03 USDC (thorough scan)
   - Supported wallets: MetaMask, Coinbase Wallet, WalletConnect

3. **Network Access**
   - Internet connection
   - Ability to connect to:
     - ClawSec API: `https://clawsec-skill-production.up.railway.app`
     - Base RPC: `https://mainnet.base.org` (mainnet) or `https://sepolia.base.org` (testnet)
     - X402 Facilitator: `https://www.x402.org/facilitator`

### For ClawSec Operators

1. **Railway Deployment**
   - ClawSec API deployed and running
   - Environment variables configured

2. **Payment Configuration**
   - USDC receiving wallet
   - CDP API keys (mainnet only)
   - X402 facilitator access

---

## Phase 1: Skill Installation

### Step 1.1: Discover the Skill

**Option A: Via OpenClaw Marketplace**
```
User: "Find security audit skills"
OpenClaw: [Lists ClawSec skill]
User: "Install ClawSec"
```

**Option B: Direct Installation**
```bash
openclaw skills install clawsec
```

**Option C: Manual Installation**
```bash
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cp -r ClawSec-skill/skills/clawsec ~/.openclaw/skills/
```

### Step 1.2: Verify Installation

```
User: "List installed skills"
OpenClaw: 
  - clawsec v0.1.0 (AI-powered security audits)
```

### Step 1.3: Skill Activation

The skill is automatically activated upon installation. OpenClaw loads the `SKILL.md` and makes the skill available.

**Behind the scenes:**
- OpenClaw reads `skills/clawsec/SKILL.md`
- Parses YAML frontmatter (metadata, dependencies, payment config)
- Registers skill commands and capabilities
- Makes skill available to agent

---

## Phase 2: Configuration Gathering

### Step 2.1: User Initiates Scan

```
User: "Run a security audit on my OpenClaw setup"
```

### Step 2.2: Agent Invokes Skill

OpenClaw agent recognizes the security audit request and activates the ClawSec skill.

**Agent actions:**
1. Checks if ClawSec skill is installed
2. Reads skill instructions from `SKILL.md`
3. Determines what data needs to be collected

### Step 2.3: Data Collection

The agent gathers configuration data from the OpenClaw instance:

**1. Gateway Configuration**
```javascript
// From: ~/.openclaw/config/openclaw.json
{
  "gateway": {
    "token": "abc123...",
    "bind": "0.0.0.0",
    "port": 2024
  }
}
```

**2. Session Configuration**
```javascript
{
  "sessions": {
    "encryption": {
      "enabled": true,
      "key": "..."
    }
  }
}
```

**3. Tool Policies**
```javascript
{
  "tools": {
    "exec": {
      "policy": "allowlist",
      "allowed": ["/usr/bin/git"]
    }
  }
}
```

**4. Channel Configurations**
```javascript
{
  "channels": {
    "telegram": {
      "bot_token": "123456:ABC...",
      "allowed_users": [123456789]
    }
  }
}
```

**5. Workspace Files**
- Scans `memory/` directory for exposed secrets
- Checks custom scripts for hardcoded credentials
- Reviews `.env` files for sensitive data

### Step 2.4: Sanitization (Privacy Protection)

**Before sending to API, the skill sanitizes sensitive data:**

1. **API Keys & Tokens**
   - Strips: OpenAI keys, Anthropic keys, AWS credentials
   - Redacts: Bot tokens, OAuth tokens
   - Hashes: Session tokens (for detection, not transmission)

2. **Personal Information**
   - Removes: Email addresses
   - Anonymizes: IP addresses (192.168.1.100 → [REDACTED_IP_1])
   - Strips: Phone numbers

3. **File Paths**
   - Anonymizes: `/home/user/projects/` → `/[USER_HOME]/projects/`
   - Preserves structure for vulnerability analysis

4. **Credential Patterns**
   - Detects: 70+ credential types
   - Records: Type, location, severity
   - Removes: Actual secret values

**Result:**
```javascript
{
  "scan_data": { /* sanitized config */ },
  "detected_secrets": [
    {
      "type": "openai_api_key",
      "location": "config.json",
      "severity": "CRITICAL",
      "value": "[REDACTED]"
    }
  ]
}
```

---

## Phase 3: Payment Preparation

### Step 3.1: Display Pricing

Agent shows user the pricing options:

```
Agent: "ClawSec Security Audit Pricing:
  • Basic Scan (Haiku): $0.01 USDC - Fast analysis
  • Thorough Scan (Sonnet): $0.03 USDC - Comprehensive analysis
  
Which scan would you like?"

User: "Basic scan"
```

### Step 3.2: Wallet Check

Agent verifies user has a compatible wallet:

```
Agent: "To pay, I'll need your wallet address or 
you can connect via WalletConnect.

Do you have a wallet with USDC on Base?"

User: "Yes, 0xABC123..."
```

**Or, for integrated wallets:**

The skill can prompt for wallet connection via WalletConnect if the OpenClaw instance supports it.

### Step 3.3: Payment Authorization

**The agent explains what will happen:**

```
Agent: "I'll now submit your scan request. 
The ClawSec API will respond with payment details.
You'll need to sign a USDC transaction for $0.01.

Ready to proceed?"

User: "Yes"
```

---

## Phase 4: Scan Submission

### Step 4.1: API Request (Without Payment)

The skill makes an HTTP POST request to the ClawSec API:

```http
POST https://clawsec-skill-production.up.railway.app/api/v1/scan
Content-Type: application/json

{
  "gateway": {
    "token": "[REDACTED]",
    "bind": "0.0.0.0",
    "port": 2024
  },
  "sessions": {
    "encryption": {
      "enabled": false
    }
  },
  "tools": {
    "exec": {
      "policy": "allow-all"
    }
  },
  "detected_secrets": [...]
}
```

### Step 4.2: Server Receives Request

**ClawSec API server processes the request:**

1. **Express.js receives POST**
   - Route: `POST /api/v1/scan`
   - Middleware stack activated

2. **Rate Limiting Check**
   ```javascript
   // server/rate-limit.js
   if (requests_per_15min > limit) {
     return 429 Too Many Requests
   }
   ```

3. **Authentication Check** (Optional)
   ```javascript
   // server/auth.js
   if (ENABLE_AUTH && !valid_api_key) {
     return 401 Unauthorized
   }
   ```

4. **X402 Payment Middleware**
   ```javascript
   // @x402/express middleware
   if (ENABLE_PAYMENT && !payment_signature) {
     return 402 Payment Required
   }
   ```

### Step 4.3: 402 Payment Required Response

**Server returns payment instructions:**

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6MiwiYWNjZXB0cy...

{
  "error": "Payment Required",
  "protocol": "X402",
  "price": "$0.01 USDC",
  "network": "base-mainnet"
}
```

**The `PAYMENT-REQUIRED` header contains (Base64-encoded JSON):**

```javascript
{
  "x402Version": 2,
  "resource": {
    "url": "https://clawsec-skill-production.up.railway.app/api/v1/scan",
    "description": "AI-powered security audit for OpenClaw configurations",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",  // Base mainnet
      "amount": "10000",          // 0.01 USDC (6 decimals)
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC contract
      "payTo": "0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8",    // ClawSec wallet
      "maxTimeoutSeconds": 300
    }
  ]
}
```

---

## Phase 5: Payment Processing

### Step 5.1: Client Parses Payment Requirements

**The X402 client (in the skill) decodes the payment header:**

```javascript
// client/x402-client.js
const paymentRequired = response.headers.get('PAYMENT-REQUIRED');
const decoded = JSON.parse(atob(paymentRequired));

// Extract payment details
const payment = decoded.accepts[0];
const amount = payment.amount;      // "10000" (0.01 USDC)
const recipient = payment.payTo;    // ClawSec wallet
const network = payment.network;    // "eip155:8453"
```

### Step 5.2: User Wallet Interaction

**Option A: Programmatic Signing (If Private Key Available)**

```javascript
// Using @x402/fetch with viem
import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';
import { privateKeyToAccount } from 'viem/accounts';
import { ExactEvmScheme } from '@x402/evm';

const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [
    {
      network: 'eip155:8453',
      client: new ExactEvmScheme(account)
    }
  ]
});

// This automatically handles payment
const response = await fetchWithPayment(
  'https://clawsec-skill-production.up.railway.app/api/v1/scan',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scanData)
  }
);
```

**Behind the scenes:**
1. Client constructs USDC transfer transaction
2. Signs transaction with private key
3. Creates payment signature payload
4. Retries request with payment signature

**Option B: Manual Wallet Approval (User-Facing)**

```
Agent: "Please approve the payment in your wallet:
  Amount: 0.01 USDC
  To: 0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8
  Network: Base
  
Waiting for approval..."
```

User opens MetaMask/Coinbase Wallet and approves the transaction.

### Step 5.3: Payment Signature Creation

**The X402 client creates a payment payload:**

```javascript
{
  "version": 2,
  "scheme": "exact",
  "network": "eip155:8453",
  "paymentData": {
    "transactionHash": "0xabcdef...",  // Signed transaction hash
    "from": "0xUSER_WALLET",
    "to": "0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8",
    "amount": "10000",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "signature": "0x1234...",  // EIP-712 signature
    "nonce": "unique_nonce",
    "timestamp": 1707318000
  }
}
```

This payload is Base64-encoded and added to the retry request.

### Step 5.4: Retry with Payment Signature

**Client retries the API request with payment:**

```http
POST https://clawsec-skill-production.up.railway.app/api/v1/scan
Content-Type: application/json
PAYMENT-SIGNATURE: eyJ2ZXJzaW9uIjoyLCJzY2hlbWUiOi...

{
  "gateway": { ... },
  "sessions": { ... }
}
```

### Step 5.5: Server Verifies Payment

**X402 Middleware verifies with facilitator:**

1. **Decode Payment Signature**
   ```javascript
   const paymentSignature = req.headers['payment-signature'];
   const payload = JSON.parse(atob(paymentSignature));
   ```

2. **Send to Facilitator for Verification**
   ```javascript
   POST https://api.cdp.coinbase.com/platform/v2/x402/verify
   Authorization: Bearer CDP_API_KEY
   
   {
     "network": "eip155:8453",
     "paymentData": { ... }
   }
   ```

3. **Facilitator Checks:**
   - ✅ Signature is valid (EIP-712)
   - ✅ Transaction hasn't been used before
   - ✅ Amount matches requirement ($0.01 USDC)
   - ✅ Recipient is correct (ClawSec wallet)
   - ✅ Asset is USDC contract

4. **Facilitator Responds:**
   ```javascript
   {
     "valid": true,
     "transactionId": "x402_tx_123456"
   }
   ```

5. **Middleware Updates Request:**
   ```javascript
   req.x402 = {
     payment: {
       verified: true,
       transactionHash: "0xabcdef...",
       amount: "10000",
       from: "0xUSER_WALLET"
     }
   };
   next(); // Allow request to proceed
   ```

---

## Phase 6: Report Generation

### Step 6.1: Request Reaches Scan Handler

**Now that payment is verified, the scan handler processes the request:**

```javascript
// server/index.js - POST /api/v1/scan
app.post('/api/v1/scan', async (req, res) => {
  // Payment already verified by X402 middleware
  const paymentVerified = req.x402?.payment?.verified || false;
  
  if (paymentVerified) {
    console.log('✅ Payment verified');
  }
  
  const scanInput = req.body;
  
  // Generate scan ID
  const scanId = `clawsec-${Date.now()}-${randomId()}`;
  
  // ... proceed with analysis
});
```

### Step 6.2: Threat Detection

**1. Pattern Matching**

The server loads 70+ credential patterns and scans the configuration:

```javascript
// server/patterns.js
const findings = findExposedSecrets(scanInput);

// Returns array like:
[
  {
    threat_id: "T001",
    title: "Weak or Default Gateway Token",
    severity: "CRITICAL",
    confidence: "high",
    location: "gateway.token",
    evidence: "Token length: 8 characters (minimum: 32)"
  },
  {
    threat_id: "T004",
    title: "Unencrypted Session Storage",
    severity: "MEDIUM",
    confidence: "high",
    location: "sessions.encryption.enabled",
    evidence: "Encryption disabled"
  }
]
```

**2. Threat Database Lookup**

For each finding, the server loads detailed threat intelligence:

```javascript
// threats/authentication/T001.json
{
  "id": "T001",
  "title": "Weak or Default Gateway Token",
  "severity": "CRITICAL",
  "description": "Gateway token is weak or using default value...",
  "impact": "Unauthorized access to OpenClaw instance...",
  "remediation": [
    "Generate strong token: openssl rand -hex 32",
    "Update gateway.token in config",
    "Restart gateway"
  ],
  "references": [
    "https://docs.openclaw.ai/security/gateway-token"
  ]
}
```

**3. Context Optimization**

To fit within Claude's context window, the server intelligently selects relevant threats:

```javascript
// server/lib/context-optimizer.js
const optimizedContext = buildOptimizedContext({
  scanConfig: scanInput,
  detectedThreats: findings.map(f => f.threat_id),
  threatsDir: './threats',
  modelName: 'claude-sonnet-4',
  maxContextPercent: 40  // Use 40% of context for threat intel
});

// Returns: Prioritized threats that fit in token budget
```

### Step 6.3: Risk Scoring

**The server calculates a 0-100 risk score:**

```javascript
// server/lib/score-calculator.js
const scoreResult = calculateRiskScore(findings, {
  scanType: 'config'
});

// Returns:
{
  score: 85,           // 0-100 normalized score
  level: "CRITICAL",   // LOW/MEDIUM/HIGH/CRITICAL
  confidence: "high",
  breakdown: {
    baseline: 40,      // From severity distribution
    modifiers: 45      // Exploitability, impact, coverage
  }
}
```

**Scoring Algorithm:**

1. **Baseline Score** (from severity distribution)
   - CRITICAL findings: +40 points each
   - HIGH findings: +30 points each
   - MEDIUM findings: +20 points each
   - LOW findings: +10 points each

2. **Modifiers**
   - High exploitability: +10-20 points
   - Wide attack surface: +5-15 points
   - Multiple critical findings: +10-25 points

3. **Normalization**
   - Cap at 100
   - Round to nearest integer

### Step 6.4: Priority Ranking

**Findings are prioritized for remediation:**

```javascript
// server/lib/recommendation-engine.js
const prioritized = prioritizeFindings(findings, {
  scanType: 'config'
});

// Returns:
{
  recommendations: [
    {
      priority: "P0",
      action: "IMMEDIATE ACTION REQUIRED",
      tasks: [
        {
          order: 1,
          title: "Weak or Default Gateway Token",
          deadline: "Within hours",
          steps: ["Generate strong token", "Update config", "Restart"],
          reasoning: "CRITICAL severity + High exploitability = P0"
        }
      ]
    },
    {
      priority: "P1",
      action: "URGENT REMEDIATION",
      tasks: [ ... ]
    }
  ]
}
```

### Step 6.5: OWASP LLM Top 10 Mapping

**Findings are mapped to OWASP categories:**

```javascript
// server/owasp-mapper.js
const owaspCompliance = generateOWASPCompliance(findings);

// Returns:
{
  version: "OWASP LLM Top 10 2025",
  overall_compliance: "NON-COMPLIANT",
  compliant_categories: 7,
  total_categories: 10,
  overall_risk: "HIGH",
  categories: [
    {
      id: "LLM01",
      name: "Prompt Injection",
      status: "COMPLIANT",
      findings_count: 0,
      risk_level: "LOW"
    },
    {
      id: "LLM03",
      name: "Supply Chain Vulnerabilities",
      status: "NON-COMPLIANT",
      findings_count: 2,
      risk_level: "CRITICAL",
      findings: ["T001", "T002"]
    }
  ]
}
```

### Step 6.6: LLM Analysis (Optional)

**If `ANTHROPIC_API_KEY` is set, the server can enhance the report with LLM analysis:**

```javascript
if (process.env.ANTHROPIC_API_KEY) {
  const llmAnalysis = await analyzeScanWithLLM({
    findings,
    threatsContext: optimizedContext,
    scanConfig: scanInput
  });
  
  report.ai_insights = llmAnalysis;
}
```

**LLM prompt includes:**
- Detected findings with context
- Threat intelligence excerpts
- Configuration patterns
- Request: Explain impact, suggest remediation priority

**LLM response enriches the report with:**
- Natural language explanations
- Context-specific recommendations
- Priority justifications

### Step 6.7: Report Assembly

**The server compiles all components into a comprehensive report:**

```javascript
const report = {
  scan_id: scanId,
  timestamp: new Date().toISOString(),
  risk_score: scoreResult.score,
  risk_level: scoreResult.level,
  findings_count: findings.length,
  
  findings: findings.map(f => ({
    threat_id: f.threat_id,
    title: f.title,
    severity: f.severity,
    confidence: f.confidence,
    location: f.location,
    evidence: f.evidence,
    description: threatDatabase[f.threat_id].description,
    impact: threatDatabase[f.threat_id].impact,
    remediation: threatDatabase[f.threat_id].remediation,
    references: threatDatabase[f.threat_id].references
  })),
  
  prioritized_recommendations: prioritized,
  
  owasp_compliance: owaspCompliance,
  
  executive_summary: {
    total_findings: findings.length,
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length,
    top_risks: [...],
    immediate_actions: [...]
  },
  
  metadata: {
    scan_duration_ms: scanDuration,
    model_used: modelName,
    token_usage: tokenStats,
    version: "0.1.0-hackathon"
  }
};
```

---

## Phase 7: Report Delivery

### Step 7.1: Cache Storage

**Before returning, the server caches the report:**

```javascript
// server/report-cache.js
await reportCache.set(scanId, report, {
  ttl: 24 * 60 * 60 * 1000  // 24 hours
});
```

This allows users to retrieve the report later via:
```
GET /api/v1/report/:scanId
```

### Step 7.2: HTTP Response

**Server sends the report to the client:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
PAYMENT-RESPONSE: eyJzZXR0bGVkIjp0cnVlLCJ0cmFuc2FjdGlvbklkIjoi...

{
  "scan_id": "clawsec-1707318123456-a1b2c3",
  "timestamp": "2026-02-07T14:30:00.000Z",
  "risk_score": 85,
  "risk_level": "CRITICAL",
  "findings_count": 7,
  "findings": [ ... ],
  "prioritized_recommendations": { ... },
  "owasp_compliance": { ... },
  "executive_summary": { ... },
  "metadata": { ... }
}
```

**The `PAYMENT-RESPONSE` header contains settlement confirmation:**

```javascript
{
  "settled": true,
  "transactionId": "x402_tx_123456",
  "transactionHash": "0xabcdef...",
  "blockNumber": 12345678,
  "timestamp": 1707318123
}
```

### Step 7.3: Client Receives Report

**The X402 client receives the successful response:**

```javascript
// client/x402-client.js
const response = await fetchWithPayment(url, options);

if (response.ok) {
  const report = await response.json();
  
  // Extract payment confirmation
  const paymentResponse = response.headers.get('PAYMENT-RESPONSE');
  if (paymentResponse) {
    const settlement = JSON.parse(atob(paymentResponse));
    console.log('Payment settled:', settlement.transactionHash);
  }
  
  return report;
}
```

### Step 7.4: Skill Processes Report

**The ClawSec skill receives the report and processes it for presentation:**

```javascript
// Process findings
const criticalFindings = report.findings.filter(f => 
  f.severity === 'CRITICAL'
);

const immediateActions = report.prioritized_recommendations
  .recommendations
  .filter(r => r.priority === 'P0');
```

### Step 7.5: Report Presentation

**Agent presents the report to the user:**

```
Agent: "Security Audit Complete! 🔒

Risk Level: CRITICAL (Score: 85/100)
Findings: 7 issues detected

⚠️ CRITICAL Issues (Immediate Action Required):
  1. Weak or Default Gateway Token
     • Location: gateway.token
     • Impact: Unauthorized access to entire OpenClaw instance
     • Fix: Generate strong token with openssl rand -hex 32
  
  2. Public Gateway Exposure
     • Location: gateway.bind = 0.0.0.0
     • Impact: Internet-accessible without authentication
     • Fix: Bind to 127.0.0.1 or use firewall

⚠️ HIGH Issues (Urgent):
  3. Unrestricted Tool Execution
     • Location: tools.exec.policy = allow-all
     • Impact: Any command can be executed
     • Fix: Use allowlist policy

📊 OWASP LLM Top 10 Compliance:
  • 3/10 categories non-compliant
  • LLM03: Supply Chain Vulnerabilities (CRITICAL)
  • LLM08: Vector and Embedding Weaknesses (HIGH)

Full report saved to: memory/security-audit-2026-02-07.json
Transaction: 0xabcdef... (confirmed on Base)

Would you like me to help fix these issues?"
```

**User can also export in different formats:**

```
User: "Export as PDF"
Agent: [Generates PDF] "Report.pdf saved to workspace/"

User: "Show me just the P0 tasks"
Agent: [Displays filtered priority list]
```

---

## Phase 8: Payment Finalization

### Step 8.1: Facilitator Settles Transaction

**After the scan completes, the facilitator submits the transaction to Base blockchain:**

1. **Transaction Broadcast**
   ```
   Facilitator → Base RPC → Mempool → Block
   ```

2. **On-Chain Execution**
   - USDC contract executes transfer
   - From: User wallet (0xUSER...)
   - To: ClawSec wallet (0x3e6C...)
   - Amount: 10,000 micro-USDC (0.01 USDC)

3. **Block Confirmation**
   - Transaction included in block
   - Block mined and confirmed
   - Settlement finalized

### Step 8.2: Payment Tracking (Server-Side)

**ClawSec server tracks the payment:**

```javascript
// server/payment.js - PaymentTracker class
paymentTracker.recordPayment({
  scanId: scanId,
  transactionHash: '0xabcdef...',
  from: '0xUSER_WALLET',
  to: '0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8',
  amount: '10000',
  asset: 'USDC',
  network: 'eip155:8453',
  timestamp: Date.now(),
  status: 'settled'
});
```

**Payment status can be queried:**

```
GET /api/payment/status/:scanId

Response:
{
  "scan_id": "clawsec-1707318123456-a1b2c3",
  "status": "settled",
  "payment": {
    "transactionHash": "0xabcdef...",
    "from": "0xUSER_WALLET",
    "to": "0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8",
    "amount": "10000",
    "timestamp": 1707318123,
    "blockNumber": 12345678
  }
}
```

### Step 8.3: Revenue Recognition

**ClawSec operator can track revenue:**

1. **Check Base Block Explorer**
   - View transaction: `https://basescan.org/tx/0xabcdef...`
   - Confirm USDC received in wallet

2. **Query Wallet Balance**
   ```javascript
   // Check USDC balance on Base
   const balance = await usdcContract.balanceOf(CLAWSEC_WALLET);
   console.log('Balance:', balance / 1e6, 'USDC');
   ```

3. **Analytics Dashboard** (Future)
   - Total scans processed
   - Revenue generated
   - Payment success rate
   - Popular scan types

### Step 8.4: User Receipt

**User receives confirmation of payment:**

```
Agent: "Payment Confirmed! ✅

Transaction: 0xabcdef1234567890abcdef1234567890abcdef12
Network: Base (eip155:8453)
Amount: 0.01 USDC
Recipient: 0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8
Block: 12,345,678
Status: Settled

View on Block Explorer:
https://basescan.org/tx/0xabcdef...

Your security audit report is ready!"
```

---

## Error Handling

### Common Errors and Resolution

#### 1. Insufficient Balance

**Error:**
```
Payment failed: Insufficient USDC balance
Required: 0.01 USDC
Available: 0.005 USDC
```

**Resolution:**
- User needs to add more USDC to wallet
- Can purchase USDC on Coinbase or other exchanges
- Transfer USDC to Base network

#### 2. Network Mismatch

**Error:**
```
Payment failed: Wallet on wrong network
Required: Base (eip155:8453)
Current: Ethereum Mainnet (eip155:1)
```

**Resolution:**
- Switch wallet to Base network
- Most wallets support network switching
- Base RPC: https://mainnet.base.org

#### 3. Transaction Timeout

**Error:**
```
Payment verification timeout
Transaction not confirmed within 5 minutes
```

**Resolution:**
- Check if transaction is pending in wallet
- Wait for blockchain confirmation
- Retry if transaction failed
- Contact support if funds were deducted

#### 4. Payment Already Used

**Error:**
```
Payment failed: Transaction already used
Transaction: 0xabcdef...
```

**Resolution:**
- Transaction was already submitted for another scan
- Create a new transaction
- Each scan requires a unique payment

#### 5. API Rate Limit

**Error:**
```
429 Too Many Requests
Rate limit: 5 requests per 15 minutes
Retry after: 600 seconds
```

**Resolution:**
- Wait for rate limit window to reset
- Upgrade to premium tier for higher limits
- Batch multiple scans together

#### 6. Server Unavailable

**Error:**
```
503 Service Unavailable
The ClawSec API is temporarily unavailable
```

**Resolution:**
- Check Railway status: https://status.railway.app
- Wait a few minutes and retry
- Check ClawSec status page (future)

#### 7. Invalid Configuration

**Error:**
```
400 Bad Request
Invalid scan input: Missing required field 'gateway'
```

**Resolution:**
- Ensure OpenClaw config is properly formatted
- Check that all required fields are present
- Verify JSON is valid

---

## Security & Privacy

### Data Protection

**What Gets Sent:**
- ✅ Configuration structure (anonymized)
- ✅ Policy settings
- ✅ Detected credential types (not values)
- ✅ File structure (anonymized paths)

**What NEVER Gets Sent:**
- ❌ Actual API keys or tokens
- ❌ Personal email addresses
- ❌ Private keys or passwords
- ❌ Session content or chat history
- ❌ User-identifiable information

### Sanitization Process

**1. Credential Detection**
```javascript
// Detects 70+ credential types
const patterns = [
  { type: 'openai_api_key', pattern: /sk-[A-Za-z0-9]{48}/ },
  { type: 'anthropic_api_key', pattern: /sk-ant-api03-[A-Za-z0-9-]{95}/ },
  // ... 68 more patterns
];
```

**2. Value Redaction**
```javascript
// Before: "api_key": "sk-abc123xyz789..."
// After:  "api_key": "[REDACTED_OPENAI_API_KEY]"
```

**3. Path Anonymization**
```javascript
// Before: "/home/alice/projects/openclaw/config.json"
// After:  "/[USER_HOME]/projects/openclaw/config.json"
```

**4. IP Anonymization**
```javascript
// Before: "bind": "192.168.1.100"
// After:  "bind": "[REDACTED_IP_1]"
```

### Payment Security

**1. Private Keys**
- User's private key NEVER sent to ClawSec API
- Payment signed locally on user's device
- Only transaction signature sent

**2. Transaction Security**
- EIP-712 typed signatures prevent manipulation
- Nonce prevents replay attacks
- Amount and recipient encoded in signature

**3. Facilitator Trust**
- Coinbase CDP facilitator is non-custodial
- Cannot access user funds
- Only verifies and submits pre-signed transactions

**4. Smart Contract Risks**
- USDC is a widely-audited stablecoin
- Base network is secured by Ethereum (via Optimism rollup)
- No custom smart contracts deployed by ClawSec

### Privacy Guarantees

**Data Retention:**
- Reports cached for 24 hours (configurable)
- Payment records stored only for accounting
- No user tracking or analytics without consent

**Third-Party Access:**
- No data shared with third parties
- Facilitator only sees payment metadata
- Anthropic (if LLM enabled) only sees sanitized data

**Data Deletion:**
- Users can request scan deletion
- Cached reports auto-expire after TTL
- Payment records retained for compliance only

---

## Appendices

### A. Network & Contract Details

**Base Mainnet (Production):**
- Network ID: `eip155:8453`
- RPC: `https://mainnet.base.org`
- USDC Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Block Explorer: `https://basescan.org`

**Base Sepolia (Testnet):**
- Network ID: `eip155:84532`
- RPC: `https://sepolia.base.org`
- USDC Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Block Explorer: `https://sepolia.basescan.org`
- Faucet: `https://faucet.coinbase.com`

### B. API Reference

**Base URL:**
```
Production: https://clawsec-skill-production.up.railway.app
Testnet: https://clawsec-skill-production.up.railway.app (with testnet config)
```

**Endpoints:**

1. **GET /health**
   - Health check
   - Returns: `{ status: "healthy" }`

2. **GET /api/v1**
   - API information
   - Returns: Capabilities, payment status, version

3. **POST /api/v1/scan**
   - Submit security scan
   - Requires: Payment (X402)
   - Returns: Scan report

4. **GET /api/v1/report/:scanId**
   - Retrieve cached report
   - Optional: `?model=` to specify analysis model

5. **GET /api/v1/threats**
   - Get threat database index
   - Returns: List of all threat IDs

6. **GET /api/payment/status/:scanId**
   - Check payment status
   - Returns: Payment confirmation details

### C. Troubleshooting Commands

**Check ClawSec API Status:**
```bash
curl https://clawsec-skill-production.up.railway.app/health
```

**Verify Payment Configuration:**
```bash
curl https://clawsec-skill-production.up.railway.app/api/v1 | jq '.payment'
```

**Check USDC Balance (Base):**
```bash
cast balance --rpc-url https://mainnet.base.org \
  --erc20 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  YOUR_WALLET_ADDRESS
```

**View Transaction on Block Explorer:**
```
https://basescan.org/tx/YOUR_TRANSACTION_HASH
```

**Test Scan (Without Payment - Testnet Only):**
```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test123","bind":"0.0.0.0"}}'
```

### D. Pricing & Billing

**Scan Pricing:**
- **Basic Scan:** $0.01 USDC (Claude Haiku)
  - Fast analysis (~30 seconds)
  - Pattern matching + basic recommendations
  
- **Thorough Scan:** $0.03 USDC (Claude Sonnet)
  - Comprehensive analysis (~60 seconds)
  - LLM-enhanced insights + detailed remediation

**Transaction Fees:**
- **Base Network Gas:** ~$0.001 (paid by user)
- **X402 Facilitator:** Free tier (1,000 tx/month)
- **USDC Transfer:** No additional fees

**Rate Limits:**
- **Free Tier:** 5 scans per 15 minutes
- **Premium:** Contact for enterprise pricing

---

## Summary Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: SKILL INSTALLATION                                     │
│ User installs ClawSec skill → OpenClaw loads SKILL.md          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: CONFIGURATION GATHERING                                │
│ User: "Run security audit"                                      │
│ Agent collects: gateway config, sessions, tools, channels       │
│ Sanitizes: API keys, emails, IPs, file paths                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: PAYMENT PREPARATION                                    │
│ Agent displays pricing ($0.01 basic / $0.03 thorough)          │
│ User confirms wallet and payment readiness                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: SCAN SUBMISSION (WITHOUT PAYMENT)                      │
│ Skill → POST /api/v1/scan [sanitized config]                   │
│ Server checks: rate limit, auth, payment                        │
│ Server returns: 402 Payment Required + PAYMENT-REQUIRED header  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: PAYMENT PROCESSING                                     │
│ X402 Client parses payment requirements                         │
│ User signs USDC transaction in wallet                           │
│ Client creates payment signature payload                        │
│ Client → POST /api/v1/scan + PAYMENT-SIGNATURE header          │
│ Server → Facilitator: Verify payment                           │
│ Facilitator: ✅ Payment verified                                │
│ Request proceeds to scan handler                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: REPORT GENERATION                                      │
│ Pattern matching (70+ credential types)                         │
│ Threat database lookup (detailed intel)                         │
│ Risk scoring (0-100 scale)                                      │
│ Priority ranking (P0/P1/P2/P3)                                  │
│ OWASP LLM Top 10 mapping                                        │
│ Optional: LLM analysis (if API key set)                        │
│ Report assembly (JSON)                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: REPORT DELIVERY                                        │
│ Server caches report (24h TTL)                                  │
│ Server → Client: 200 OK + Report JSON + PAYMENT-RESPONSE       │
│ Skill processes and formats report                              │
│ Agent presents findings to user                                 │
│ User can export (PDF/JSON), filter, or request fixes           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: PAYMENT FINALIZATION                                   │
│ Facilitator submits transaction to Base blockchain              │
│ USDC transferred: User wallet → ClawSec wallet                 │
│ Block confirmed, settlement finalized                            │
│ Server tracks payment for accounting                            │
│ User receives transaction confirmation                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                       ✅ PROCESS COMPLETE
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Author:** Ubik (@ClawSecAI)  
**License:** MIT
