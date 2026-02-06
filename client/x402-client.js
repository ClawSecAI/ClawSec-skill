/**
 * X402 Payment Client for ClawSec
 * 
 * Handles payment flow from client side:
 * 1. Request resource → get 402 with payment requirements
 * 2. Sign payment transaction
 * 3. Retry request with payment signature
 * 4. Receive resource
 */

const { X402Client } = require('@x402/fetch');
const { ExactEvmScheme } = require('@x402/evm/exact/client');

/**
 * Create X402 payment client
 * 
 * @param {Object} config - Client configuration
 * @param {string} config.privateKey - Wallet private key (without 0x prefix)
 * @param {string} config.network - Network ID (e.g., 'eip155:84532')
 * @param {string} config.rpcUrl - RPC endpoint for the network
 * @returns {X402Client} Configured X402 client
 */
function createPaymentClient(config) {
  const { privateKey, network, rpcUrl } = config;
  
  if (!privateKey) {
    throw new Error('Private key required for payment client');
  }
  
  if (!network) {
    throw new Error('Network ID required (e.g., eip155:84532)');
  }
  
  if (!rpcUrl) {
    throw new Error('RPC URL required');
  }
  
  // Create EVM scheme client
  const evmScheme = new ExactEvmScheme({
    privateKey: privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey,
    rpcUrl: rpcUrl
  });
  
  // Create X402 client and register scheme
  const client = new X402Client()
    .register(network, evmScheme);
  
  return client;
}

/**
 * Make a paid API request
 * 
 * @param {X402Client} client - X402 client instance
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} Fetch response
 */
async function makePaymentRequest(client, url, options = {}) {
  try {
    const response = await client.fetch(url, options);
    return response;
  } catch (error) {
    console.error('Payment request failed:', error.message);
    throw error;
  }
}

/**
 * Example: Scan with payment
 * 
 * @param {Object} config - Configuration
 * @param {string} config.apiUrl - ClawSec API URL
 * @param {string} config.privateKey - Wallet private key
 * @param {string} config.network - Network ID
 * @param {string} config.rpcUrl - RPC URL
 * @param {Object} scanData - Scan data to submit
 * @returns {Promise<Object>} Scan report
 */
async function scanWithPayment(config, scanData) {
  const { apiUrl, privateKey, network, rpcUrl } = config;
  
  // Create payment client
  const client = createPaymentClient({ privateKey, network, rpcUrl });
  
  // Make paid request
  const response = await makePaymentRequest(
    client,
    `${apiUrl}/api/v1/scan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scanData)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Scan failed: ${response.status} ${response.statusText}`);
  }
  
  const report = await response.json();
  return report;
}

/**
 * Check payment status
 * 
 * @param {string} apiUrl - ClawSec API URL
 * @param {string} scanId - Scan ID
 * @returns {Promise<Object>} Payment status
 */
async function checkPaymentStatus(apiUrl, scanId) {
  const response = await fetch(`${apiUrl}/api/payment/status/${scanId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return { status: 'not_found' };
    }
    throw new Error(`Failed to check payment status: ${response.status}`);
  }
  
  return await response.json();
}

module.exports = {
  createPaymentClient,
  makePaymentRequest,
  scanWithPayment,
  checkPaymentStatus
};
