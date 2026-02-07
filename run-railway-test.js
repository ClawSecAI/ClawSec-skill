#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('=================================');
console.log('X402 Railway Testnet Validation');
console.log('=================================\n');

const results = {
  timestamp: new Date().toISOString(),
  serverUrl: 'https://clawsec-skill-production.up.railway.app',
  healthCheck: null,
  apiInfo: null,
  paymentTest: null,
  errors: []
};

try {
  // Step 1: Health check
  console.log('Step 1: Server Health Check');
  console.log('---------------------------');
  try {
    const healthCmd = 'curl -s -o /dev/null -w "%{http_code}" https://clawsec-skill-production.up.railway.app/health';
    const healthCode = execSync(healthCmd, { encoding: 'utf-8' }).trim();
    console.log(`Status: ${healthCode}`);
    
    if (healthCode === '200') {
      console.log('✅ Server is UP\n');
      results.healthCheck = { status: 'success', code: healthCode };
    } else {
      console.log(`❌ Server returned ${healthCode}\n`);
      results.healthCheck = { status: 'failed', code: healthCode };
      throw new Error(`Server health check failed: ${healthCode}`);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    results.errors.push({ step: 'health', error: error.message });
    throw error;
  }

  // Step 2: API Info
  console.log('Step 2: Check API Configuration');
  console.log('--------------------------------');
  try {
    const apiInfo = execSync('curl -s https://clawsec-skill-production.up.railway.app/api/v1', { encoding: 'utf-8' });
    const parsed = JSON.parse(apiInfo);
    console.log('API Info:');
    console.log(`  Version: ${parsed.version}`);
    console.log(`  Payment enabled: ${parsed.payment?.enabled}`);
    console.log(`  Payment network: ${parsed.payment?.network}`);
    console.log(`  Protocol: ${parsed.payment?.protocol}\n`);
    results.apiInfo = parsed;
  } catch (error) {
    console.error('❌ API info check failed:', error.message);
    results.errors.push({ step: 'api-info', error: error.message });
    throw error;
  }

  // Step 3: Run payment test
  console.log('Step 3: X402 Payment Test');
  console.log('-------------------------');
  try {
    process.env.API_URL = 'https://clawsec-skill-production.up.railway.app';
    process.env.TEST_WALLET_PK = '0x78a0fc05754adb30c23ab3fa9d227c6146b26be760b2f74c050eb225591d8c76';
    process.env.BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
    
    const testOutput = execSync('node test-x402-payment.js', { 
      encoding: 'utf-8',
      cwd: '/root/.openclaw/workspace/clawsec'
    });
    
    console.log(testOutput);
    
    // Parse test output for results
    const hasTransaction = testOutput.includes('Transaction:') || testOutput.includes('transactionHash');
    const hasSuccess = testOutput.includes('✅ All tests passed') || testOutput.includes('Payment successful');
    
    results.paymentTest = {
      status: hasSuccess ? 'success' : 'partial',
      hasTransaction,
      output: testOutput
    };
    
    console.log('\n✅ Payment test completed\n');
  } catch (error) {
    console.error('❌ Payment test failed:', error.message);
    if (error.stdout) console.log('Output:', error.stdout.toString());
    if (error.stderr) console.error('Errors:', error.stderr.toString());
    results.paymentTest = {
      status: 'failed',
      error: error.message,
      output: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    };
    results.errors.push({ step: 'payment-test', error: error.message });
  }

  // Save results
  console.log('Saving results to validation-results.json...');
  fs.writeFileSync(
    '/root/.openclaw/workspace/clawsec/validation-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('✅ Validation complete! Results saved.\n');
  
  if (results.errors.length > 0) {
    console.log(`⚠️  Completed with ${results.errors.length} error(s)`);
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Validation failed:', error.message);
  
  // Save partial results
  fs.writeFileSync(
    '/root/.openclaw/workspace/clawsec/validation-results.json',
    JSON.stringify(results, null, 2)
  );
  
  process.exit(1);
}
