#!/usr/bin/env node
/**
 * Quick verification test before running full LLM comparison
 */

const https = require('https');

console.log('🔍 Quick Environment Check\n');

// Check environment variables
console.log('Environment Variables:');
console.log(`✓ ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Set (' + process.env.ANTHROPIC_API_KEY.length + ' chars)' : '❌ Not set'}`);
console.log(`✓ TRELLO_API_KEY: ${process.env.TRELLO_API_KEY ? 'Set' : '❌ Not set'}`);
console.log(`✓ TRELLO_TOKEN: ${process.env.TRELLO_TOKEN ? 'Set' : '❌ Not set'}`);
console.log(`✓ Node.js version: ${process.version}\n`);

// Test ClawSec API connectivity
console.log('🌐 Testing ClawSec API...');

https.get('https://clawsec-skill-production.up.railway.app/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log(`✅ API Status: ${health.status}`);
      console.log(`✅ Service: ${health.service} v${health.version}\n`);
      
      // Test a simple scan
      console.log('🧪 Testing simple scan...');
      const testConfig = {
        gateway: {
          token: "test-123",
          bind: "0.0.0.0"
        }
      };
      
      const postData = JSON.stringify(testConfig);
      const options = {
        hostname: 'clawsec-skill-production.up.railway.app',
        port: 443,
        path: '/api/v1/scan',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            console.log(`✅ Scan successful: ${result.findings_count} findings`);
            console.log(`✅ Risk level: ${result.risk_level}\n`);
            
            console.log('🎉 All checks passed! Ready to run full LLM comparison.\n');
            console.log('Run: node test-llm-comparison.js');
          } catch (e) {
            console.error(`❌ Failed to parse scan response: ${e.message}`);
          }
        });
      });
      
      req.on('error', (e) => {
        console.error(`❌ Scan request failed: ${e.message}`);
      });
      
      req.write(postData);
      req.end();
      
    } catch (e) {
      console.error(`❌ Failed to parse health response: ${e.message}`);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Health check failed: ${e.message}`);
});
