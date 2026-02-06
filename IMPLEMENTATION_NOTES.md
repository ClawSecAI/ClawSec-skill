# X402 Payment Integration - Implementation Notes

**Date**: 2026-02-06 22:41 UTC  
**Agent**: Ubik (subagent)  
**Card**: X402 - Payment Integration (#21)

## Current Status

### ✅ Completed Assessment

1. **Server Architecture**: Express.js server at `server/index.js`
2. **Target Endpoint**: `POST /api/v1/scan`
3. **Current Payment Logic**: Placeholder 402 check (not integrated with X402)
4. **Environment**: Railway deployment ready

### ⚠️ Blockers Identified

1. **Missing CDP Credentials in .env**:
   - Stan mentioned adding `CDP_CLIENT_API_KEY` and `CDP_SECRET_API_KEY`
   - These are NOT present in `/root/.openclaw/workspace/clawsec/.env`
   - **Action needed**: @stanhaupt1 - Please confirm where you added the CDP credentials. Should I check a different .env file location?

2. **Missing Wallet Address**:
   - Stan is creating USDC wallet in testnet Base
   - Need wallet address to configure `payTo` parameter in X402 middleware
   - **Action needed**: @stanhaupt1 - Please provide the wallet address once created

### 📋 Implementation Plan

#### Phase 1: SDK Installation (Ready to Execute)
```bash
cd /root/.openclaw/workspace/clawsec
npm install @x402/express @x402/evm @x402/core
```

#### Phase 2: Middleware Integration (Waiting for Credentials)

**What needs to be added to `server/index.js`:**

1. Import X402 modules:
```javascript
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');
```

2. Create facilitator client (testnet):
```javascript
const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://www.x402.org/facilitator' // Testnet facilitator
});

const x402Server = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme()); // Base Sepolia
```

3. Apply payment middleware to `/api/v1/scan`:
```javascript
app.use(
  paymentMiddleware(
    {
      'POST /api/v1/scan': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',  // Basic scan price
            network: 'eip155:84532', // Base Sepolia (testnet)
            payTo: process.env.WALLET_ADDRESS, // Stan's wallet
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

#### Phase 3: Environment Configuration

**Update `.env` with:**
```env
# X402 Payment Configuration
WALLET_ADDRESS=<STAN_WALLET_ADDRESS>
CDP_CLIENT_API_KEY=<FROM_STAN>
CDP_SECRET_API_KEY=<FROM_STAN>
NETWORK=base-sepolia
FACILITATOR_URL=https://www.x402.org/facilitator
```

#### Phase 4: Testing Strategy

1. **Without Payment** (verify 402 response):
```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test"}}'
```
Expected: 402 Payment Required + PAYMENT-REQUIRED header

2. **With Payment** (requires client SDK):
- Will need to implement client-side payment flow
- Test on Base Sepolia testnet first
- Verify payment -> scan -> report flow

### 🚧 Next Steps (In Order)

1. **[BLOCKED]** Get CDP credentials location from Stan
2. **[BLOCKED]** Get wallet address from Stan
3. **[READY]** Install X402 SDK packages
4. **[READY]** Implement middleware integration
5. **[READY]** Update environment variables
6. **[READY]** Test on testnet
7. **[LATER]** Client SDK integration (separate task)

### ❓ Questions for Stan

1. Where did you add the CDP credentials? I checked `/root/.openclaw/workspace/clawsec/.env` but they're not there.
2. What's the wallet address for receiving USDC payments? (waiting for wallet creation)
3. Do you want to start with testnet (Base Sepolia) or mainnet (Base)?

### 📊 X402 SDK Documentation

- **Seller Guide**: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers
- **Express Middleware**: `@x402/express` package
- **Network**: Base Sepolia (testnet) = `eip155:84532`
- **Facilitator**: `https://www.x402.org/facilitator` (free testnet)
- **Production Facilitator**: `https://api.cdp.coinbase.com/platform/v2/x402` (requires CDP API keys)

### 💡 Notes

- **No webhook secret needed** - X402 uses HTTP-native payment flow, not webhooks
- **Gasless transactions** - ERC-3009 transfer standard (no gas fees for users)
- **Simple integration** - Just add middleware, X402 handles the complexity
- **Pricing model**: $0.01/scan (basic) - can adjust based on testing

---

**Last Updated**: 2026-02-06 22:41 UTC  
**Blocker**: Waiting for CDP credentials and wallet address from Stan
