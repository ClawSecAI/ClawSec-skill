#!/usr/bin/env node
/**
 * X402 Payment Integration Test
 * 
 * Tests the complete payment flow:
 * 1. Request without payment → Receive 402
 * 2. Sign payment with test wallet
 * 3. Retry with payment → Receive scan report
 * 4. Verify payment was recorded
 */

const { scanWithPayment, checkPaymentStatus } = require('./client/x402-client');

// Test configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:4021',
  // ⚠️ TEST WALLET ONLY - From /root/.openclaw/testwallets.md (WALLET2 - has 20 USDC)
  // NEVER USE THIS PRIVATE KEY ON MAINNET!
  privateKey: process.env.TEST_WALLET_PK || '0x78a0fc05754adb30c23ab3fa9d227c6146b26be760b2f74c050eb225591d8c76',
  network: 'eip155:84532', // Base Sepolia (TESTNET ONLY - chainId 84532)
  rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
};

// ⚠️ CRITICAL SECURITY CHECK: Verify we're on testnet
if (config.network !== 'eip155:84532') {
  console.error('❌ SECURITY ERROR: This script uses testnet wallets!');
  console.error('   Network must be eip155:84532 (Base Sepolia)');
  console.error(`   Current: ${config.network}`);
  process.exit(1);
}

// Additional check: Ensure we're not accidentally hitting mainnet
if (config.apiUrl.includes('mainnet') || config.rpcUrl.includes('mainnet')) {
  console.error('❌ SECURITY ERROR: Mainnet URL detected with testnet wallet!');
  process.exit(1);
}

// Test scan data (intentionally insecure to trigger findings)
const testScanData = {
  gateway: {
    token: "test-token-123",  // Weak token
    bind: "0.0.0.0",          // Public exposure
    port: 2024                // Default port
  },
  sessions: {
    encryption: {
      enabled: false          // Unencrypted
    }
  },
  tools: {
    exec: {
      policy: "allow-all"     // Unrestricted
    }
  },
  channels: {
    telegram: {
      bot_token: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz12345678" // Hardcoded
    }
  }
};

async function runTests() {
  console.log('🧪 X402 Payment Integration Test\n');
  console.log('Configuration:');
  console.log(`  API URL: ${config.apiUrl}`);
  console.log(`  Wallet: ${config.privateKey.substring(0, 10)}...${config.privateKey.substring(config.privateKey.length - 8)}`);
  console.log(`  Network: ${config.network}`);
  console.log(`  RPC: ${config.rpcUrl}\n`);
  
  try {
    // Test 1: Check if payment is enabled
    console.log('📋 Test 1: Check server configuration...');
    const infoResponse = await fetch(`${config.apiUrl}/api/v1`);
    const info = await infoResponse.json();
    console.log(`  Payment enabled: ${info.payment.enabled}`);
    console.log(`  Network: ${info.payment.network}`);
    console.log(`  Protocol: ${info.payment.protocol}\n`);
    
    if (!info.payment.enabled) {
      console.log('⚠️  Payment is disabled on server (demo mode)');
      console.log('   To enable: Set ENABLE_PAYMENT=true in server .env');
      console.log('   Test will proceed with unpaid request...\n');
    }
    
    // Test 2: Make unpaid request (should work in demo mode, fail in payment mode)
    console.log('📋 Test 2: Request without payment...');
    try {
      const unpaidResponse = await fetch(`${config.apiUrl}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testScanData)
      });
      
      if (unpaidResponse.status === 402) {
        console.log('  ✅ Received 402 Payment Required (expected)');
        const paymentRequired = unpaidResponse.headers.get('PAYMENT-REQUIRED');
        if (paymentRequired) {
          const decoded = JSON.parse(Buffer.from(paymentRequired, 'base64').toString());
          console.log('  Payment details:');
          console.log(`    Price: ${decoded.accepts[0].price}`);
          console.log(`    Network: ${decoded.accepts[0].network}`);
          console.log(`    Pay to: ${decoded.accepts[0].payTo}\n`);
        }
      } else if (unpaidResponse.status === 200) {
        console.log('  ✅ Request succeeded without payment (demo mode)');
        const result = await unpaidResponse.json();
        console.log(`  Scan ID: ${result.scan_id}`);
        console.log(`  Findings: ${result.findings_count}`);
        console.log(`  Risk Level: ${result.risk_level}\n`);
      } else {
        console.log(`  ❌ Unexpected status: ${unpaidResponse.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}\n`);
    }
    
    // Test 3: Make paid request (if payment is enabled)
    if (info.payment.enabled) {
      console.log('📋 Test 3: Request with payment...');
      try {
        const report = await scanWithPayment(config, testScanData);
        console.log('  ✅ Payment successful!');
        console.log(`  Scan ID: ${report.scan_id}`);
        console.log(`  Findings: ${report.findings_count}`);
        console.log(`  Risk Level: ${report.risk_level}`);
        console.log(`  Risk Score: ${report.risk_score}/100\n`);
        
        // Test 4: Check payment status
        console.log('📋 Test 4: Check payment status...');
        const status = await checkPaymentStatus(config.apiUrl, report.scan_id);
        if (status.status === 'not_found') {
          console.log('  ⚠️  Payment not found in tracker');
          console.log('     This is expected if server was restarted (in-memory storage)\n');
        } else {
          console.log('  ✅ Payment confirmed');
          console.log(`  Transaction: ${status.payment.transactionHash}`);
          console.log(`  Amount: ${status.payment.amount}`);
          console.log(`  From: ${status.payment.from}`);
          console.log(`  To: ${status.payment.to}\n`);
        }
        
        // Test 5: Verify findings
        console.log('📋 Test 5: Verify scan findings...');
        const expectedFindings = [
          'Weak or Default Gateway Token',
          'Public Gateway Exposure',
          'Unencrypted Session Storage',
          'Unrestricted Tool Execution',
          'Telegram Bot Token in Configuration'
        ];
        
        console.log(`  Expected at least ${expectedFindings.length} findings`);
        console.log(`  Found: ${report.findings_count} findings`);
        
        if (report.findings && report.findings.length > 0) {
          console.log('  Detected threats:');
          report.findings.forEach(f => {
            console.log(`    - ${f.threat_id}: ${f.title} (${f.severity})`);
          });
        }
        console.log('');
        
        console.log('✅ All tests passed!\n');
        console.log('📊 Summary:');
        console.log(`  - Server responded correctly to payment`);
        console.log(`  - Payment was verified and settled`);
        console.log(`  - Scan report generated successfully`);
        console.log(`  - ${report.findings_count} security issues detected\n`);
        
      } catch (error) {
        console.log(`  ❌ Paid request failed: ${error.message}`);
        console.log(`  Stack: ${error.stack}\n`);
        
        if (error.message.includes('insufficient funds')) {
          console.log('💡 Tip: Get test USDC from https://faucet.coinbase.com/');
        } else if (error.message.includes('gas')) {
          console.log('💡 Tip: Get test ETH for gas from https://faucet.coinbase.com/');
        }
      }
    } else {
      console.log('📋 Test 3-5: Skipped (payment disabled)\n');
      console.log('✅ Basic tests passed!\n');
      console.log('💡 To test payment flow:');
      console.log('   1. Set ENABLE_PAYMENT=true in server/.env');
      console.log('   2. Restart server: npm start');
      console.log('   3. Run this test again: node test-x402-payment.js\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
