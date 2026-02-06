/**
 * X402 Payment Integration for ClawSec
 * 
 * Handles payment verification and management using X402 protocol
 * Network: Base Sepolia (testnet) / Base (mainnet)
 * Token: USDC
 */

const { x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Payment configuration
const NETWORK_TESTNET = 'eip155:84532'; // Base Sepolia
const NETWORK_MAINNET = 'eip155:8453';  // Base
const FACILITATOR_TESTNET = 'https://www.x402.org/facilitator';
const FACILITATOR_MAINNET = 'https://api.cdp.coinbase.com/platform/v2/x402';

// Pricing tiers (in USD)
const PRICING = {
  BASIC: '$0.01',    // Haiku model - fast basic scan
  THOROUGH: '$0.03'  // Sonnet model - comprehensive scan
};

/**
 * Initialize X402 payment server
 */
function initializePaymentServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const network = isProduction ? NETWORK_MAINNET : NETWORK_TESTNET;
  const facilitatorUrl = isProduction ? FACILITATOR_MAINNET : FACILITATOR_TESTNET;
  
  // Get wallet address from env
  const payTo = process.env.WALLET_ADDRESS || '0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8';
  
  // ⚠️ CRITICAL SECURITY CHECK: Prevent testnet wallet on mainnet
  if (isProduction && payTo === '0x3e6C025206fcefFCd1637d46ff0534C8783dE3a8') {
    throw new Error('SECURITY ERROR: Testnet wallet detected in production! Set a mainnet wallet in WALLET_ADDRESS');
  }
  
  if (!payTo || payTo === '0x0000000000000000000000000000000000000000') {
    console.warn('⚠️  Warning: Using default wallet address. Set WALLET_ADDRESS in .env');
  }
  
  // Log network configuration for verification
  console.log(`🔒 Security Check: ${isProduction ? 'PRODUCTION' : 'TESTNET'} mode`);
  console.log(`   Network: ${network}`);
  if (!isProduction) {
    console.log('   ⚠️  TESTNET MODE - Using test wallets only');
  }
  
  // Create facilitator client
  const facilitatorClient = new HTTPFacilitatorClient({
    url: facilitatorUrl,
    // CDP API keys (only needed for mainnet)
    ...(isProduction && {
      apiKey: process.env.CDP_CLIENT_API_KEY,
      apiSecret: process.env.CDP_SECRET_API_KEY
    })
  });
  
  // Create X402 resource server and register EVM scheme
  const server = new x402ResourceServer(facilitatorClient)
    .register(network, new ExactEvmScheme());
  
  console.log('💰 X402 Payment Server initialized');
  console.log(`   Network: ${network}`);
  console.log(`   Facilitator: ${facilitatorUrl}`);
  console.log(`   Receiving wallet: ${payTo.substring(0, 10)}...${payTo.substring(payTo.length - 8)}`);
  console.log(`   Pricing: Basic ${PRICING.BASIC}, Thorough ${PRICING.THOROUGH}`);
  
  return { server, payTo, network };
}

/**
 * Get payment configuration for routes
 */
function getPaymentConfig(payTo, network) {
  return {
    'POST /api/v1/scan': {
      accepts: [
        {
          scheme: 'exact',
          price: PRICING.BASIC,
          network: network,
          payTo: payTo,
        }
      ],
      description: 'AI-powered security audit for OpenClaw configurations',
      mimeType: 'application/json',
      extensions: {
        bazaar: {
          discoverable: true,
          category: 'security',
          tags: ['security-audit', 'openclaw', 'vulnerability-scan', 'ai-security']
        }
      }
    }
  };
}

/**
 * Verify payment manually (fallback method)
 */
async function verifyPayment(paymentSignature, facilitatorClient, network) {
  try {
    // Parse payment signature header
    const paymentPayload = JSON.parse(Buffer.from(paymentSignature, 'base64').toString('utf-8'));
    
    // Verify with facilitator
    const verification = await facilitatorClient.verify(paymentPayload, network);
    
    return {
      valid: verification.valid,
      transactionHash: verification.transactionHash,
      amount: verification.amount,
      from: verification.from,
      to: verification.to
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Create payment request response (402 Payment Required)
 */
function createPaymentRequiredResponse(payTo, network, price = PRICING.BASIC) {
  const paymentRequired = {
    accepts: [
      {
        scheme: 'exact',
        price: price,
        network: network,
        payTo: payTo
      }
    ],
    description: 'ClawSec Security Audit',
    mimeType: 'application/json'
  };
  
  return {
    statusCode: 402,
    headers: {
      'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(paymentRequired)).toString('base64')
    },
    body: {
      error: 'Payment Required',
      protocol: 'X402',
      price: price,
      network: network,
      instructions: 'Include PAYMENT-SIGNATURE header with signed payment payload'
    }
  };
}

/**
 * Track payment status
 */
class PaymentTracker {
  constructor() {
    this.payments = new Map();
  }
  
  /**
   * Record payment
   */
  record(scanId, paymentData) {
    this.payments.set(scanId, {
      ...paymentData,
      timestamp: Date.now(),
      status: 'completed'
    });
  }
  
  /**
   * Get payment status
   */
  getStatus(scanId) {
    return this.payments.get(scanId) || { status: 'not_found' };
  }
  
  /**
   * Clear old payments (older than 24 hours)
   */
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    for (const [scanId, payment] of this.payments.entries()) {
      if (payment.timestamp < cutoff) {
        this.payments.delete(scanId);
      }
    }
  }
}

const paymentTracker = new PaymentTracker();

// Cleanup old payments every hour
setInterval(() => paymentTracker.cleanup(), 60 * 60 * 1000);

module.exports = {
  initializePaymentServer,
  getPaymentConfig,
  verifyPayment,
  createPaymentRequiredResponse,
  paymentTracker,
  PRICING,
  NETWORK_TESTNET,
  NETWORK_MAINNET
};
