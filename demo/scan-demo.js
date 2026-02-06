#!/usr/bin/env node

/**
 * ClawSec Demo Scanner
 * 
 * Simple script to run security scans for demo purposes.
 * Usage: node scan-demo.js <config-file>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'clawsec-skill-production.up.railway.app';
const SERVER_PORT = 443;
const API_PATH = '/api/v1/scan';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  const width = 80;
  const line = '='.repeat(width);
  const padding = Math.floor((width - title.length - 2) / 2);
  const paddedTitle = ' '.repeat(padding) + title + ' '.repeat(padding);
  
  log('\n' + line, 'cyan');
  log(paddedTitle, 'bright');
  log(line + '\n', 'cyan');
}

function sanitizeConfig(config) {
  // Remove demo-specific fields before sending to API
  const sanitized = JSON.parse(JSON.stringify(config));
  delete sanitized.scenario;
  delete sanitized.description;
  delete sanitized.expected_findings;
  delete sanitized.expected_risk_level;
  return sanitized;
}

function runScan(configFile) {
  return new Promise((resolve, reject) => {
    printHeader('ClawSec Security Scan');
    
    // Read configuration file
    log(`📂 Reading configuration: ${configFile}`, 'blue');
    
    let configPath = configFile;
    if (!path.isAbsolute(configPath)) {
      configPath = path.join(__dirname, configFile);
    }
    
    if (!fs.existsSync(configPath)) {
      reject(new Error(`Configuration file not found: ${configPath}`));
      return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Show scenario info
    if (config.scenario) {
      log(`\n📋 Scenario: ${config.scenario}`, 'yellow');
      log(`   ${config.description}`, 'yellow');
      
      if (config.expected_findings && config.expected_findings.length > 0) {
        log(`\n🎯 Expected Findings (${config.expected_findings.length}):`, 'yellow');
        config.expected_findings.forEach((finding, i) => {
          log(`   ${i + 1}. ${finding}`, 'yellow');
        });
      }
      
      if (config.expected_risk_level) {
        log(`\n⚠️  Expected Risk Level: ${config.expected_risk_level}`, 'yellow');
      }
    }
    
    // Sanitize config
    const scanData = sanitizeConfig(config);
    const payload = JSON.stringify(scanData);
    
    log(`\n🔍 Starting security scan...`, 'blue');
    log(`   Server: ${SERVER_URL}`, 'blue');
    log(`   Payload size: ${payload.length} bytes`, 'blue');
    
    const startTime = Date.now();
    
    // Prepare HTTPS request
    const options = {
      hostname: SERVER_URL,
      port: SERVER_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'ClawSec-Demo/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      log(`\n📡 Response received (${res.statusCode})`, 'green');
      
      res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write('.');
      });
      
      res.on('end', () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(''); // New line after dots
        log(`\n✅ Scan completed in ${duration} seconds`, 'green');
        
        try {
          const result = JSON.parse(data);
          
          // Print summary
          printHeader('Scan Results Summary');
          
          log(`Scan ID: ${result.scan_id || 'N/A'}`, 'cyan');
          log(`Risk Level: ${result.risk_level || 'N/A'}`, 
            result.risk_level === 'CRITICAL' ? 'red' :
            result.risk_level === 'HIGH' ? 'yellow' :
            result.risk_level === 'MEDIUM' ? 'blue' :
            result.risk_level === 'LOW' ? 'green' : 'cyan'
          );
          log(`Risk Score: ${result.risk_score || 'N/A'}/100`, 'cyan');
          log(`Findings Count: ${result.findings_count || 0}`, 'cyan');
          
          if (result.optimization_stats) {
            const stats = result.optimization_stats;
            log(`\n📊 Optimization Stats:`, 'magenta');
            log(`   Model: ${stats.model}`, 'magenta');
            log(`   Context tokens: ${stats.context_tokens}`, 'magenta');
            log(`   Categories: ${stats.categories_used}`, 'magenta');
            log(`   Threats included: ${stats.threats_included}`, 'magenta');
          }
          
          // Print full report
          if (result.report) {
            printHeader('Detailed Security Report');
            console.log(result.report);
          }
          
          // Save report to file
          const reportFilename = path.join(
            __dirname,
            `report-${path.basename(configFile, '.json')}-${Date.now()}.md`
          );
          
          fs.writeFileSync(reportFilename, result.report || JSON.stringify(result, null, 2));
          log(`\n💾 Report saved to: ${reportFilename}`, 'green');
          
          // Compare with expected results
          if (config.expected_risk_level && result.risk_level) {
            log(`\n🎯 Validation:`, 'yellow');
            const match = config.expected_risk_level === result.risk_level;
            log(`   Expected: ${config.expected_risk_level}`, 'yellow');
            log(`   Actual: ${result.risk_level}`, match ? 'green' : 'red');
            log(`   ${match ? '✅ MATCH' : '❌ MISMATCH'}`, match ? 'green' : 'red');
          }
          
          resolve(result);
        } catch (err) {
          log(`\n❌ Error parsing response: ${err.message}`, 'red');
          log(`\nRaw response:\n${data}`, 'red');
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`\n❌ Scan failed after ${duration} seconds`, 'red');
      log(`Error: ${err.message}`, 'red');
      
      // Network troubleshooting
      log(`\n🔧 Troubleshooting:`, 'yellow');
      log(`   1. Check internet connection`, 'yellow');
      log(`   2. Verify server is up: curl https://${SERVER_URL}/health`, 'yellow');
      log(`   3. Check firewall settings (need HTTPS/443)`, 'yellow');
      log(`   4. Try again in a few seconds`, 'yellow');
      
      reject(err);
    });
    
    req.on('timeout', () => {
      log(`\n⏱️  Request timeout - server took too long to respond`, 'red');
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    // Set timeout (60 seconds)
    req.setTimeout(60000);
    
    // Send request
    req.write(payload);
    req.end();
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('❌ Usage: node scan-demo.js <config-file>', 'red');
    log('\nAvailable demo configs:', 'yellow');
    log('  • demo-basic.json      - Basic scan (weak token, public bind)', 'yellow');
    log('  • demo-complex.json    - Complex scan (multiple credentials exposed)', 'yellow');
    log('  • demo-compliance.json - Compliance scan (secure configuration)', 'yellow');
    log('\nExample: node scan-demo.js demo-basic.json', 'green');
    process.exit(1);
  }
  
  const configFile = args[0];
  
  runScan(configFile)
    .then(() => {
      log('\n✅ Demo scan completed successfully', 'green');
      process.exit(0);
    })
    .catch((err) => {
      log(`\n❌ Demo scan failed: ${err.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runScan };
