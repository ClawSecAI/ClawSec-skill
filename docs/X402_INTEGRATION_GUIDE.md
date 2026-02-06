# X402 Payment Integration Guide

**Status**: 🟡 IN PROGRESS  
**Blocker**: Waiting for CDP credentials and wallet address from Stan  
**Target**: Base Sepolia testnet → Base mainnet  

---

## Overview

X402 is Coinbase's HTTP-native payment protocol that enables:
- ✅ USDC micropayments ($0.01 per scan)
- ✅ Gasless transactions (ERC-3009)
- ✅ Zero blockchain infrastructure needed
- ✅ Simple HTTP middleware integration
- ✅ Base Sepolia (testnet) / Base (mainnet)

**How it works**:
1. Client requests `/api/v1/scan` without payment → Server returns 402 Payment Required
2. Client creates payment signature (using wallet)
3. Client retries request with `PAYMENT-SIGNATURE` header
4. Server verifies payment via X402 facilitator
5. Server processes scan and returns report
6. Payment settles on-chain automatically

---

## Installation

### Step 1: Install X402 SDK

```bash
cd /root/.openclaw/workspace/clawsec
npm install @x402/express @x402/evm @x402/core
```

Or use the provided script:
```bash
bash scripts/install-x402.sh
```

### Step 2: Configure Environment Variables

Add to `.env`:

```env
# Enable X402 payments
ENABLE_PAYMENT=true

# Your wallet address (receives USDC payments)
WALLET_ADDRESS=0xYourBaseSepoliaWalletAddress

# Network configuration
NETWORK=base-sepolia
FACILITATOR_URL=https://www.x402.org/facilitator

# CDP API Keys (for production mainnet)
CDP_CLIENT_API_KEY=your_api_key_here
CDP_SECRET_API_KEY=your_secret_key_here
```

**⚠️ BLOCKER**: Waiting for Stan to provide:
- `WALLET_ADDRESS` - Base Sepolia wallet (Stan creating now)
- `CDP_CLIENT_API_KEY` - From CDP account
- `CDP_SECRET_API_KEY` - From CDP account

### Step 3: Activate X402 Server

**Option A**: Replace existing server
```bash
cp server/index-x402.js server/index.js
```

**Option B**: Test separately
```bash
node server/index-x402.js
```

---

## Configuration Details

### Network Identifiers (CAIP-2 Format)

| Network | CAIP-2 ID | Use Case |
|---------|-----------|----------|
| Base Sepolia (testnet) | `eip155:84532` | Testing |
| Base (mainnet) | `eip155:8453` | Production |

### Pricing Model

| Scan Type | Price | Model | Context Tokens |
|-----------|-------|-------|----------------|
| Basic | $0.01 USDC | Haiku | ~50K |
| Thorough | $0.03 USDC | Sonnet | ~200K |

Current implementation: **$0.01 USDC** per scan (basic analysis)

### Facilitator Endpoints

| Environment | URL | Auth Required |
|-------------|-----|---------------|
| Testnet (Base Sepolia) | `https://www.x402.org/facilitator` | No |
| Mainnet (Base) | `https://api.cdp.coinbase.com/platform/v2/x402` | Yes (CDP API keys) |

---

## Testing Strategy

### Phase 1: Local Testing (No Payment)

```bash
# Set ENABLE_PAYMENT=false in .env
npm start

# Test scan endpoint
curl -X POST http://localhost:4021/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test123"}}'

# Should return 200 OK with scan report (payment disabled)
```

### Phase 2: Payment Flow Testing (402 Response)

```bash
# Set ENABLE_PAYMENT=true in .env
npm start

# Request without payment
curl -X POST http://localhost:4021/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test123"}}'

# Should return:
# - HTTP 402 Payment Required
# - PAYMENT-REQUIRED header with payment instructions
# - Payment details in response body
```

### Phase 3: End-to-End Payment Testing

**Requires**:
- ✅ X402 client SDK (`@x402/client`)
- ✅ MetaMask or WalletConnect integration
- ✅ Base Sepolia testnet USDC (get from faucet)
- ✅ Stan's wallet configured in .env

**Test flow**:
```javascript
// Client-side (to be implemented)
const { X402Client } = require('@x402/client');

const client = new X402Client({
  network: 'eip155:84532', // Base Sepolia
  wallet: yourWallet
});

const response = await client.post('https://clawsec-skill-production.up.railway.app/api/v1/scan', {
  gateway: { token: 'test123' }
});

console.log(response.data); // Scan report
```

### Phase 4: Railway Deployment Testing

```bash
# Push to GitHub
git add .
git commit -m "Add X402 payment integration"
git push origin main

# Railway auto-deploys

# Test production endpoint
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test"}}'
```

---

## Code Structure

### X402 Middleware Setup

```javascript
// server/index-x402.js (lines 40-60)
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL || 'https://www.x402.org/facilitator'
});

// Register EVM scheme for Base Sepolia
const x402Server = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme());

// Apply middleware to scan endpoint
app.use(
  paymentMiddleware(
    {
      'POST /api/v1/scan': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',
            network: 'eip155:84532',
            payTo: process.env.WALLET_ADDRESS,
          },
        ],
        description: 'AI-powered security audit for OpenClaw configurations',
        mimeType: 'application/json',
      },
    },
    x402Server
  )
);
```

### Automatic Payment Verification

X402 middleware handles:
- ✅ Payment signature verification
- ✅ Facilitator communication
- ✅ On-chain settlement
- ✅ 402 response generation
- ✅ Request forwarding after payment

**No manual payment logic needed** - middleware does everything!

---

## Client SDK Integration (Next Phase)

**Separate task**: Implement client-side payment flow

### Installation
```bash
npm install @x402/client @x402/evm
```

### Basic Usage
```javascript
import { paymentFetch } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';

// Configure payment client
const client = paymentFetch({
  wallet: yourWallet, // MetaMask, WalletConnect, etc.
  schemes: {
    'eip155:84532': new ExactEvmScheme()
  }
});

// Make paid request
const response = await client.post('/api/v1/scan', {
  gateway: { token: 'test' }
});
```

**Wallet Options**:
- MetaMask (browser)
- WalletConnect (mobile)
- Coinbase Wallet
- CDP Embedded Wallets

---

## Mainnet Migration

### Prerequisites
1. ✅ Successful testnet testing
2. ✅ CDP account with API keys
3. ✅ Mainnet Base wallet with USDC
4. ✅ Production deployment ready

### Changes Needed

**Update `.env`**:
```env
NETWORK=base
FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
WALLET_ADDRESS=0xYourMainnetWalletAddress
CDP_CLIENT_API_KEY=your_production_key
CDP_SECRET_API_KEY=your_production_secret
```

**Update `server/index-x402.js`** (line ~110):
```javascript
const networkId = NETWORK === 'base' ? 'eip155:8453' : 'eip155:84532';
```

**Test with small amounts first!**

---

## Monitoring & Debugging

### Health Check
```bash
curl https://clawsec-skill-production.up.railway.app/health
```

**Check**:
- `dependencies.x402`: Should be "enabled"
- `dependencies.wallet`: Should be "configured"

### Logs to Monitor

```json
{
  "type": "request_complete",
  "path": "/api/v1/scan",
  "status_code": 200,
  "payment_verified": true,
  "scan_duration_ms": 1234
}
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `402 Payment Required` | Normal - payment needed | Client should retry with payment |
| `WALLET_ADDRESS not set` | Missing .env config | Add wallet address to .env |
| `X402 server initialization failed` | Missing SDK packages | Run `npm install @x402/express @x402/evm @x402/core` |
| `Payment verification failed` | Invalid signature or insufficient funds | Check wallet balance, signature format |

---

## Security Considerations

### Wallet Security
- ✅ Store private keys securely (never in .env or git)
- ✅ Use separate wallet for testnet vs mainnet
- ✅ Monitor wallet balance for unexpected withdrawals
- ✅ Set up alerts for large transactions

### API Key Security
- ✅ CDP keys in .env (not committed to git)
- ✅ Rotate keys quarterly
- ✅ Use Railway environment variables (encrypted)
- ✅ Never log API keys

### Payment Validation
- ✅ X402 middleware verifies all payments
- ✅ Facilitator ensures on-chain settlement
- ✅ No manual payment logic reduces attack surface
- ✅ Monitor for payment manipulation attempts

---

## Next Steps (Blocked - Waiting for Stan)

### Immediate (Today)
1. **[BLOCKED]** Get CDP credentials from Stan
2. **[BLOCKED]** Get Base Sepolia wallet address from Stan
3. **[READY]** Install X402 SDK: `bash scripts/install-x402.sh`
4. **[READY]** Update .env with credentials
5. **[READY]** Test locally with `ENABLE_PAYMENT=false`

### Short-term (This Week)
1. **[READY]** Deploy to Railway with `ENABLE_PAYMENT=true`
2. **[READY]** Test 402 payment flow
3. **[TODO]** Implement client SDK integration
4. **[TODO]** End-to-end payment testing on testnet
5. **[TODO]** Document client usage

### Long-term (Before Hackathon Deadline)
1. **[TODO]** Migrate to mainnet (Base)
2. **[TODO]** Production testing with real USDC
3. **[TODO]** Performance optimization
4. **[TODO]** User documentation

---

## Resources

- **X402 Docs**: https://docs.cdp.coinbase.com/x402/welcome
- **Seller Quickstart**: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers
- **GitHub Repo**: https://github.com/coinbase/x402
- **CDP Console**: https://cdp.coinbase.com
- **Network Explorer**: https://sepolia.basescan.org (testnet)

---

**Last Updated**: 2026-02-06 22:41 UTC  
**Status**: Waiting for Stan's CDP credentials and wallet address  
**Contact**: @stanhaupt1 on Trello or Telegram
