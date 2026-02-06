# X402 Payment Integration

**Status**: 🟡 Code Complete - Awaiting Credentials  
**Protocol**: [X402 by Coinbase](https://www.x402.org/)  
**Network**: Base Sepolia (testnet) → Base (mainnet)  
**Token**: USDC  

---

## Quick Start

### Prerequisites

1. **CDP Account** (Coinbase Developer Platform)
   - Sign up: https://cdp.coinbase.com
   - Create API keys
   - Add to `.env`: `CDP_CLIENT_API_KEY`, `CDP_SECRET_API_KEY`

2. **Base Wallet**
   - Testnet: Base Sepolia wallet with USDC (get from faucet)
   - Mainnet: Base wallet with USDC
   - Add to `.env`: `WALLET_ADDRESS=0x...`

### Installation

```bash
# Install X402 SDK
bash scripts/install-x402.sh

# Or manually:
npm install @x402/express @x402/evm @x402/core
```

### Configuration

Add to `.env`:

```env
# Enable payments
ENABLE_PAYMENT=true

# Your wallet (receives payments)
WALLET_ADDRESS=0xYourBaseWalletAddress

# Network
NETWORK=base-sepolia  # or 'base' for mainnet

# Facilitator
FACILITATOR_URL=https://www.x402.org/facilitator

# CDP API Keys (for mainnet)
CDP_CLIENT_API_KEY=your_key_here
CDP_SECRET_API_KEY=your_secret_here
```

### Activate X402 Server

```bash
# Replace main server with X402 version
cp server/index-x402.js server/index.js

# Or test separately
node server/index-x402.js
```

---

## How It Works

### Payment Flow

1. **Client requests scan without payment**
   ```bash
   curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
     -H "Content-Type: application/json" \
     -d '{"gateway":{"token":"test"}}'
   ```

2. **Server responds with 402 Payment Required**
   ```json
   {
     "status": 402,
     "headers": {
       "PAYMENT-REQUIRED": "base64-encoded-payment-instructions"
     },
     "body": {
       "error": "Payment Required",
       "protocol": "X402",
       "price": "$0.01 USDC",
       "network": "eip155:84532"
     }
   }
   ```

3. **Client creates payment signature**
   - Uses wallet (MetaMask, WalletConnect, etc.)
   - Signs payment payload (ERC-3009 gasless transfer)
   - No gas fees for user!

4. **Client retries with payment**
   ```bash
   curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
     -H "Content-Type: application/json" \
     -H "PAYMENT-SIGNATURE: base64-encoded-signature" \
     -d '{"gateway":{"token":"test"}}'
   ```

5. **Server verifies payment**
   - X402 middleware validates signature
   - Facilitator confirms payment
   - Payment settles on-chain

6. **Server returns scan report**
   ```json
   {
     "scan_id": "clawsec-...",
     "report": "# OpenClaw Security Audit Report\n...",
     "risk_score": 75,
     "payment": {
       "protocol": "X402",
       "amount": "$0.01 USDC",
       "status": "verified"
     }
   }
   ```

---

## Architecture

### X402 Middleware

```javascript
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://www.x402.org/facilitator'
});

// Register EVM scheme
const x402Server = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme());

// Apply middleware to endpoint
app.use(
  paymentMiddleware({
    'POST /api/v1/scan': {
      accepts: [{
        scheme: 'exact',
        price: '$0.01',
        network: 'eip155:84532',
        payTo: process.env.WALLET_ADDRESS
      }],
      description: 'AI-powered security audit',
      mimeType: 'application/json'
    }
  }, x402Server)
);
```

### What X402 Middleware Does

✅ **Automatic 402 response generation**  
✅ **Payment signature verification**  
✅ **Facilitator communication**  
✅ **On-chain settlement**  
✅ **Request forwarding after payment**  

**No manual payment logic needed!**

---

## Testing

### Phase 1: Payment Disabled (Local Testing)

```bash
# Set ENABLE_PAYMENT=false in .env
npm start

# Test scan (should work without payment)
curl -X POST http://localhost:4021/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test"}}'
```

### Phase 2: 402 Response (Payment Flow)

```bash
# Set ENABLE_PAYMENT=true in .env
npm start

# Request without payment (should get 402)
curl -X POST http://localhost:4021/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test"}}'

# Check for:
# - HTTP 402 status code
# - PAYMENT-REQUIRED header
# - Payment instructions in body
```

### Phase 3: End-to-End Payment

**Requires client SDK** (see Client Integration below)

---

## Client Integration

### Installation

```bash
npm install @x402/client @x402/evm
```

### Usage

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

// Make paid request (handles payment automatically)
const response = await client.post(
  'https://clawsec-skill-production.up.railway.app/api/v1/scan',
  { gateway: { token: 'test' } }
);

console.log(response.data); // Scan report
```

---

## Networks

### CAIP-2 Network Identifiers

| Network | CAIP-2 ID | Purpose |
|---------|-----------|---------|
| Base Sepolia | `eip155:84532` | Testing |
| Base | `eip155:8453` | Production |

### Facilitator Endpoints

| Environment | URL | Auth |
|-------------|-----|------|
| Testnet | `https://www.x402.org/facilitator` | None |
| Mainnet | `https://api.cdp.coinbase.com/platform/v2/x402` | CDP API keys |

---

## Pricing

| Scan Type | Price | Model | Context |
|-----------|-------|-------|---------|
| Basic | $0.01 USDC | Haiku | ~50K tokens |
| Thorough | $0.03 USDC | Sonnet | ~200K tokens |

Current implementation: **$0.01 USDC** per scan

---

## Mainnet Migration

### Switch from Testnet to Mainnet

1. **Update .env**:
   ```env
   NETWORK=base
   FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
   WALLET_ADDRESS=0xYourMainnetWallet
   ```

2. **Update server code** (if hardcoded):
   ```javascript
   const networkId = 'eip155:8453'; // Base mainnet
   ```

3. **Test with small amounts first!**

4. **Monitor wallet for payments**:
   - https://basescan.org/address/0xYourWallet

---

## Monitoring

### Health Check

```bash
curl https://clawsec-skill-production.up.railway.app/health
```

**Check**:
- `dependencies.x402`: "enabled"
- `dependencies.wallet`: "configured"

### Logs

```json
{
  "type": "scan_complete",
  "scan_id": "clawsec-...",
  "payment_verified": true,
  "scan_duration_ms": 1234
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `WALLET_ADDRESS not set` | Add wallet address to .env |
| `X402 initialization failed` | Run `npm install @x402/express @x402/evm @x402/core` |
| `402 Payment Required` (normal) | Client should retry with payment |
| `Payment verification failed` | Check wallet balance, signature format |

---

## Security

### Best Practices

✅ **Never commit private keys to git**  
✅ **Use separate wallets for testnet/mainnet**  
✅ **Monitor wallet for unexpected activity**  
✅ **Rotate CDP API keys quarterly**  
✅ **Test on testnet before mainnet**  

### Wallet Security

- Store private keys securely (hardware wallet, key management service)
- Use Railway environment variables for secrets (encrypted)
- Never log payment signatures or private keys
- Set up alerts for large transactions

---

## Resources

- **X402 Documentation**: https://docs.cdp.coinbase.com/x402/welcome
- **Seller Quickstart**: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers
- **GitHub Repo**: https://github.com/coinbase/x402
- **CDP Console**: https://cdp.coinbase.com
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Explorer**: https://basescan.org

---

## Files

| File | Purpose |
|------|---------|
| `server/index-x402.js` | X402-integrated server |
| `scripts/install-x402.sh` | SDK installation script |
| `docs/X402_INTEGRATION_GUIDE.md` | Detailed integration guide |
| `IMPLEMENTATION_NOTES.md` | Technical notes |
| `X402_STATUS_SUMMARY.md` | Current status |

---

## Support

**Questions?** Check:
1. `docs/X402_INTEGRATION_GUIDE.md` - Comprehensive guide
2. `IMPLEMENTATION_NOTES.md` - Technical details
3. Trello card: https://trello.com/c/lFio4o8T
4. X402 Discord: https://discord.gg/cdp

---

**Last Updated**: 2026-02-06 22:42 UTC  
**Status**: Code complete, awaiting credentials  
**Next**: Install SDK → Configure → Deploy → Test
