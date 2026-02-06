# X402 Payment Integration Guide

## Overview

ClawSec uses the X402 protocol for internet-native USDC payments. This enables:

- **Pay-per-scan pricing**: No subscriptions, no accounts - just pay when you need a scan
- **AI agent compatibility**: Programmatic payments without manual checkout flows
- **Instant settlement**: Payments settle on-chain (Base network) in seconds
- **Gasless transactions**: Facilitator handles gas, you just sign the payment

## What is X402?

X402 is an open payment protocol built on HTTP 402 "Payment Required". It allows:

1. Server returns `402 Payment Required` with payment instructions
2. Client signs a payment transaction (USDC transfer)
3. Client retries request with payment signature
4. Server verifies payment with facilitator
5. Server returns the requested resource

**Key Concept**: Payment happens *within the HTTP flow* - no separate checkout page, no redirects.

## Architecture

```
Client → Request → Server → 402 Payment Required
                              ↓
Client ← Payment Instructions ←

Client → Sign Payment → Facilitator → Verify on Base
                                        ↓
Client → Request + Payment → Server ← Payment Confirmed
                               ↓
Client ← Resource (Scan Report) ←
```

## Server Setup

### 1. Install Dependencies

```bash
cd /root/.openclaw/workspace/clawsec
npm install @x402/express @x402/evm @x402/core
```

### 2. Configure Environment

Add to `.env`:

```env
# Enable/disable payment verification
ENABLE_PAYMENT=false  # Set to 'true' for real payments

# Receiving wallet address (testnet wallet from testwallets.md)
WALLET_ADDRESS=0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8

# Network (base-sepolia for testnet, base for mainnet)
NETWORK=base-sepolia

# Facilitator URL (testnet)
FACILITATOR_URL=https://www.x402.org/facilitator

# CDP API Keys (only needed for mainnet)
CDP_CLIENT_API_KEY=your-cdp-api-key
CDP_SECRET_API_KEY=your-cdp-api-secret
```

### 3. Server Implementation

The server is already configured in `server/index.js` and `server/payment.js`.

**Key components:**

- `initializePaymentServer()` - Sets up X402 server with facilitator
- `paymentMiddleware()` - Express middleware that handles 402 responses
- `paymentTracker` - Tracks payment status per scan

**Pricing Tiers:**

- **Basic**: $1.00 USDC (Haiku model - fast)
- **Thorough**: $3.00 USDC (Sonnet model - comprehensive)

### 4. Start Server

```bash
# Demo mode (no payment required)
ENABLE_PAYMENT=false npm start

# Payment mode (requires wallet setup)
ENABLE_PAYMENT=true npm start
```

## Client Setup

### 1. Install Dependencies

```bash
npm install @x402/fetch @x402/evm @x402/core
```

### 2. Configure Wallet

You need:

- **Private key**: Your wallet's private key (keep this secret!)
- **Network**: `eip155:84532` (Base Sepolia testnet)
- **RPC URL**: `https://sepolia.base.org`

**Using test wallet from `/root/.openclaw/testwallets.md`:**

```javascript
const config = {
  apiUrl: 'https://clawsec-skill-production.up.railway.app',
  privateKey: '0x78a0fc05754adb30c23ab3fa9d227c6146b26be760b2f74c050eb225591d8c76',
  network: 'eip155:84532',
  rpcUrl: 'https://sepolia.base.org'
};
```

**⚠️ SECURITY WARNING**: Never commit private keys to git! Use environment variables in production.

### 3. Make a Paid Request

```javascript
const { scanWithPayment } = require('./client/x402-client');

const scanData = {
  gateway: {
    token: "test-token-123",
    bind: "0.0.0.0",
    port: 2024
  }
};

const report = await scanWithPayment(config, scanData);
console.log('Scan report:', report);
```

### 4. Check Payment Status

```javascript
const { checkPaymentStatus } = require('./client/x402-client');

const status = await checkPaymentStatus(
  'https://clawsec-skill-production.up.railway.app',
  'clawsec-1234567890-abc123'
);

console.log('Payment status:', status);
```

## Payment Flow Example

### Step 1: Client Requests Scan (No Payment)

```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway": {"token": "weak"}}'
```

**Response: 402 Payment Required**

```json
{
  "statusCode": 402,
  "headers": {
    "PAYMENT-REQUIRED": "base64-encoded-payment-instructions"
  },
  "body": {
    "error": "Payment Required",
    "protocol": "X402",
    "price": "$1.00",
    "network": "eip155:84532",
    "instructions": "Include PAYMENT-SIGNATURE header with signed payment payload"
  }
}
```

### Step 2: Client Signs Payment

The X402 client SDK handles this automatically:

1. Parse `PAYMENT-REQUIRED` header
2. Create USDC transfer transaction
3. Sign with private key
4. Encode as `PAYMENT-SIGNATURE` header

### Step 3: Client Retries with Payment

```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: base64-encoded-payment" \
  -d '{"gateway": {"token": "weak"}}'
```

**Response: 200 OK (Scan Report)**

```json
{
  "scan_id": "clawsec-1234567890-abc123",
  "timestamp": "2026-02-06T22:45:00.000Z",
  "report": "# Security Report...",
  "findings_count": 3,
  "risk_level": "HIGH",
  "risk_score": 75
}
```

## Testing on Base Sepolia Testnet

### 1. Get Test USDC

The test wallet in `/root/.openclaw/testwallets.md` already has 20 USDC:

```
WALLET2_ADDRESS=0xc3eaE03Cc54c323bd5e745F9E8f93b16f35f0470
WALLET2_PK=0x78a0fc05754adb30c23ab3fa9d227c6146b26be760b2f74c050eb225591d8c76
```

**To get more test USDC:**

1. Go to [Coinbase Faucet](https://faucet.coinbase.com/)
2. Select "Base Sepolia"
3. Enter your wallet address
4. Receive test ETH (for gas) and USDC

### 2. Run Test Script

```bash
node test-x402-payment.js
```

This will:

1. Request scan without payment → Receive 402
2. Sign payment with test wallet
3. Retry with payment signature → Receive report
4. Verify payment was recorded

### 3. Verify Transaction

Check on [Base Sepolia Explorer](https://sepolia.basescan.org/):

```
https://sepolia.basescan.org/tx/<transaction-hash>
```

You should see a USDC transfer from your wallet to the ClawSec receiving wallet.

## API Reference

### POST /api/v1/scan

**Request:**

```json
{
  "gateway": { ... },
  "sessions": { ... },
  "tools": { ... }
}
```

**Response (No Payment):**

```
402 Payment Required
PAYMENT-REQUIRED: <base64-payment-instructions>
```

**Response (With Valid Payment):**

```json
{
  "scan_id": "string",
  "timestamp": "string",
  "report": "string (markdown)",
  "findings_count": "number",
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW",
  "risk_score": "number (0-100)"
}
```

### GET /api/payment/status/:id

**Response:**

```json
{
  "scan_id": "string",
  "payment": {
    "transactionHash": "string",
    "amount": "string",
    "from": "string",
    "to": "string",
    "network": "string",
    "timestamp": "number",
    "status": "completed"
  }
}
```

## Pricing

| Tier | Model | Price | Speed | Quality |
|------|-------|-------|-------|---------|
| Basic | Claude 3.5 Haiku | $1.00 | ~4s | 85% |
| Thorough | Claude 3.5 Sonnet | $3.00 | ~10s | 95% |

**At scale (10,000 scans/month):**

- Basic: $100/month
- Thorough: $300/month

**Facilitator fees (CDP):**

- First 1,000 transactions/month: FREE
- After 1,000: $0.001/transaction

## Mainnet Deployment

### 1. Get CDP API Keys

1. Sign up at [cdp.coinbase.com](https://cdp.coinbase.com)
2. Create a project
3. Generate API credentials
4. Add to `.env`:

```env
CDP_CLIENT_API_KEY=your-api-key
CDP_SECRET_API_KEY=your-api-secret
```

### 2. Update Configuration

```env
NODE_ENV=production
ENABLE_PAYMENT=true
NETWORK=base
WALLET_ADDRESS=<your-mainnet-wallet>
```

### 3. Deploy

```bash
# Build and deploy to Railway
git push origin main
```

### 4. Test with Real USDC

**⚠️ WARNING**: Test with small amounts first (e.g., $1.00 or $3.00 on testnet before mainnet)

```bash
# Use mainnet wallet with real USDC
node test-mainnet-payment.js
```

## Troubleshooting

### Payment Not Verified

**Symptoms**: Server returns 402 even after client sends payment

**Causes:**

1. Invalid payment signature
2. Insufficient USDC balance
3. Facilitator unavailable
4. Network mismatch (testnet vs mainnet)

**Fix:**

```javascript
// Check wallet balance
const balance = await client.getBalance();
console.log('USDC balance:', balance);

// Verify network matches
console.log('Client network:', config.network);
console.log('Server network:', serverConfig.network);
```

### Transaction Failed

**Symptoms**: Payment signature sent but transaction reverts

**Causes:**

1. Insufficient ETH for gas
2. USDC allowance not set
3. Nonce mismatch

**Fix:**

```bash
# Get test ETH for gas
https://faucet.coinbase.com/

# Check allowance
cast call $USDC_ADDRESS "allowance(address,address)" $YOUR_WALLET $FACILITATOR
```

### Payment Status Not Found

**Symptoms**: `/api/payment/status/:id` returns 404

**Causes:**

1. Scan ID incorrect
2. Payment tracker cleared (after 24 hours)
3. Server restarted (in-memory storage)

**Fix:**

- Save scan ID immediately after scan
- Implement persistent storage (Redis, PostgreSQL) for production

## Security Best Practices

### 1. Protect Private Keys

```javascript
// ❌ DON'T: Hardcode private keys
const privateKey = '0x1234...';

// ✅ DO: Use environment variables
const privateKey = process.env.WALLET_PRIVATE_KEY;
```

### 2. Validate Payments Server-Side

```javascript
// The X402 middleware handles this, but you can add extra validation:
if (paymentData.amount < expectedAmount) {
  return res.status(402).json({ error: 'Insufficient payment' });
}
```

### 3. Rate Limiting

```javascript
// Prevent spam even with payments
const rateLimit = require('express-rate-limit');

app.use('/api/v1/scan', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
}));
```

### 4. Monitor Wallet Balance

```bash
# Alert if receiving wallet balance is low
if balance < threshold:
  send_alert("ClawSec wallet running low on USDC")
```

## Roadmap

### Phase 1: MVP (Current)

- ✅ Basic payment integration
- ✅ Testnet support
- ✅ Single pricing tier
- ✅ In-memory payment tracking

### Phase 2: Production

- [ ] Mainnet deployment
- [ ] Multiple pricing tiers (Basic/Thorough)
- [ ] Persistent payment storage (PostgreSQL)
- [ ] Webhook notifications
- [ ] Payment receipts

### Phase 3: Advanced

- [ ] Subscription plans (pay per month)
- [ ] Credit-based billing (pay for tokens used)
- [ ] Multi-chain support (Solana, Ethereum)
- [ ] Bazaar discovery integration
- [ ] Payment analytics dashboard

## References

- [X402 Protocol Spec](https://github.com/coinbase/x402)
- [Coinbase CDP Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [Base Network](https://base.org/)
- [USDC on Base](https://www.coinbase.com/usdc)

## Support

- GitHub Issues: https://github.com/ClawSecAI/ClawSec-skill/issues
- Trello Card: https://trello.com/c/lFio4o8T
- Discord: [Join CDP Discord](https://discord.gg/cdp)
