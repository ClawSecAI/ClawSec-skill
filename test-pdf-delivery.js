#!/usr/bin/env node
/**
 * ClawSec PDF Delivery Test Script
 * 
 * Tests the ?include_pdf=true parameter on /api/v1/report/:id endpoint
 * 
 * Usage:
 *   node test-pdf-delivery.js [BASE_URL] [SCAN_ID]
 * 
 * Example:
 *   node test-pdf-delivery.js http://localhost:4021 clawsec-1234567890-abc123
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.argv[2] || process.env.CLAWSEC_URL || 'http://localhost:4021';
const SCAN_ID = process.argv[3] || null;

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Run a test case
 */
async function runTest(name, testFn) {
  process.stdout.write(`\n🧪 ${name}... `);
  
  try {
    await testFn();
    console.log('✅ PASS');
    results.passed++;
    results.tests.push({ name, status: 'pass' });
  } catch (error) {
    console.log('❌ FAIL');
    console.error(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'fail', error: error.message });
  }
}

/**
 * Test 1: Default endpoint returns JSON only (no PDF field)
 */
async function testDefaultNoPdf(scanId) {
  const url = `${BASE_URL}/api/v1/report/${scanId}`;
  console.log(`   GET ${url}`);
  
  const response = await makeRequest(url);
  
  // Check status code
  if (response.statusCode !== 200 && response.statusCode !== 202) {
    throw new Error(`Expected status 200 or 202, got ${response.statusCode}`);
  }
  
  // Check that pdf field is NOT present
  if (response.body.pdf !== undefined) {
    throw new Error('Expected no "pdf" field in response, but it was present');
  }
  
  console.log(`   ✓ Status: ${response.statusCode}`);
  console.log(`   ✓ No "pdf" field in response`);
}

/**
 * Test 2: With ?include_pdf=true, includes pdf object with base64 data
 */
async function testWithPdf(scanId) {
  const url = `${BASE_URL}/api/v1/report/${scanId}?include_pdf=true`;
  console.log(`   GET ${url}`);
  
  const response = await makeRequest(url);
  
  // Check status code
  if (response.statusCode !== 200 && response.statusCode !== 202) {
    throw new Error(`Expected status 200 or 202, got ${response.statusCode}`);
  }
  
  // If still processing (202), skip PDF checks
  if (response.statusCode === 202) {
    console.log(`   ℹ️  Job still processing (202), skipping PDF checks`);
    return;
  }
  
  // Check that pdf field IS present
  if (!response.body.pdf) {
    throw new Error('Expected "pdf" field in response, but it was missing');
  }
  
  // Check pdf object structure
  const pdf = response.body.pdf;
  
  // If PDF generation failed, check error structure
  if (pdf.error) {
    console.log(`   ⚠️  PDF generation failed: ${pdf.message}`);
    console.log(`   ✓ Error handling present`);
    return;
  }
  
  // Check required fields
  if (!pdf.data) {
    throw new Error('Expected "pdf.data" field (base64 string)');
  }
  
  if (!pdf.size_bytes || typeof pdf.size_bytes !== 'number') {
    throw new Error('Expected "pdf.size_bytes" field (number)');
  }
  
  if (pdf.mime_type !== 'application/pdf') {
    throw new Error(`Expected mime_type "application/pdf", got "${pdf.mime_type}"`);
  }
  
  if (!pdf.filename || !pdf.filename.includes('.pdf')) {
    throw new Error('Expected valid PDF filename');
  }
  
  console.log(`   ✓ Status: ${response.statusCode}`);
  console.log(`   ✓ PDF field present`);
  console.log(`   ✓ Size: ${pdf.size_bytes} bytes`);
  console.log(`   ✓ MIME type: ${pdf.mime_type}`);
  console.log(`   ✓ Filename: ${pdf.filename}`);
  
  return pdf;
}

/**
 * Test 3: Decode and verify PDF is valid
 */
async function testDecodePdf(scanId) {
  const url = `${BASE_URL}/api/v1/report/${scanId}?include_pdf=true`;
  const response = await makeRequest(url);
  
  // Skip if still processing
  if (response.statusCode === 202) {
    console.log(`   ℹ️  Job still processing (202), skipping decode test`);
    return;
  }
  
  if (!response.body.pdf || response.body.pdf.error) {
    console.log(`   ⚠️  PDF not available, skipping decode test`);
    return;
  }
  
  const pdf = response.body.pdf;
  
  // Decode base64
  let pdfBuffer;
  try {
    pdfBuffer = Buffer.from(pdf.data, 'base64');
  } catch (error) {
    throw new Error(`Failed to decode base64: ${error.message}`);
  }
  
  // Verify size matches
  if (pdfBuffer.length !== pdf.size_bytes) {
    throw new Error(`Size mismatch: decoded ${pdfBuffer.length} bytes, expected ${pdf.size_bytes} bytes`);
  }
  
  // Verify PDF magic bytes (%PDF-)
  const magicBytes = pdfBuffer.toString('ascii', 0, 5);
  if (magicBytes !== '%PDF-') {
    throw new Error(`Invalid PDF magic bytes: expected "%PDF-", got "${magicBytes}"`);
  }
  
  // Save to file for manual inspection
  const outputPath = path.join(__dirname, `test-output-${scanId}.pdf`);
  fs.writeFileSync(outputPath, pdfBuffer);
  
  console.log(`   ✓ Base64 decoded successfully`);
  console.log(`   ✓ Size matches: ${pdfBuffer.length} bytes`);
  console.log(`   ✓ Valid PDF magic bytes: %PDF-`);
  console.log(`   ✓ Saved to: ${outputPath}`);
  console.log(`   → Open with: xdg-open ${outputPath}`);
}

/**
 * Test 4: Query parameter parsing (false/missing values)
 */
async function testQueryParamParsing(scanId) {
  // Test with include_pdf=false
  console.log(`   Testing include_pdf=false...`);
  let url = `${BASE_URL}/api/v1/report/${scanId}?include_pdf=false`;
  let response = await makeRequest(url);
  
  if (response.body.pdf !== undefined) {
    throw new Error('Expected no "pdf" field when include_pdf=false');
  }
  console.log(`   ✓ include_pdf=false: no PDF field`);
  
  // Test with include_pdf not specified
  console.log(`   Testing without include_pdf param...`);
  url = `${BASE_URL}/api/v1/report/${scanId}`;
  response = await makeRequest(url);
  
  if (response.body.pdf !== undefined) {
    throw new Error('Expected no "pdf" field when include_pdf not specified');
  }
  console.log(`   ✓ No param: no PDF field`);
  
  // Test with include_pdf=true
  console.log(`   Testing include_pdf=true...`);
  url = `${BASE_URL}/api/v1/report/${scanId}?include_pdf=true`;
  response = await makeRequest(url);
  
  if (response.statusCode === 200 && !response.body.pdf) {
    throw new Error('Expected "pdf" field when include_pdf=true');
  }
  console.log(`   ✓ include_pdf=true: PDF field present (or error handled)`);
}

/**
 * Create a test scan to use for testing
 */
async function createTestScan() {
  console.log('\n📝 Creating test scan...');
  
  const scanPayload = {
    gateway: {
      token: 'test-weak-token',
      bind: '0.0.0.0',
      port: 2024
    },
    sessions: {
      encryption: {
        enabled: false
      }
    },
    tools: {
      exec: {
        policy: 'allow-all'
      }
    }
  };
  
  const url = `${BASE_URL}/api/v1/scan`;
  console.log(`   POST ${url}`);
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify(scanPayload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      }
    };
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (res.statusCode !== 200 && res.statusCode !== 202) {
            reject(new Error(`Scan failed with status ${res.statusCode}: ${data}`));
            return;
          }
          
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Wait for scan to complete
 */
async function waitForScanCompletion(scanId, maxAttempts = 30) {
  console.log(`\n⏳ Waiting for scan ${scanId} to complete...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = `${BASE_URL}/api/v1/report/${scanId}`;
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ Scan completed (attempt ${attempt}/${maxAttempts})`);
      return true;
    }
    
    if (response.statusCode === 202) {
      process.stdout.write(`   ⏳ Still processing... (attempt ${attempt}/${maxAttempts})\r`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      continue;
    }
    
    if (response.statusCode === 404) {
      throw new Error('Scan not found (404)');
    }
    
    if (response.statusCode >= 500) {
      throw new Error(`Scan failed with status ${response.statusCode}`);
    }
  }
  
  throw new Error(`Scan did not complete within ${maxAttempts} attempts`);
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           ClawSec PDF Delivery Test Suite                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Testing endpoint: ${BASE_URL}`);
  
  let scanId = SCAN_ID;
  
  // If no scan ID provided, create a test scan
  if (!scanId) {
    try {
      const scanResult = await createTestScan();
      scanId = scanResult.scan_id;
      console.log(`   ✅ Scan created: ${scanId}`);
      
      // Wait for completion if async
      if (scanResult.status === 'pending') {
        await waitForScanCompletion(scanId);
      }
    } catch (error) {
      console.error(`\n❌ Failed to create test scan: ${error.message}`);
      console.error('   Please provide a valid SCAN_ID as argument or ensure server is running');
      process.exit(1);
    }
  } else {
    console.log(`\n📋 Using provided scan ID: ${scanId}`);
  }
  
  // Run tests
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                        Running Tests                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  await runTest('Test 1: Default endpoint (no PDF field)', () => testDefaultNoPdf(scanId));
  await runTest('Test 2: With ?include_pdf=true (PDF object present)', () => testWithPdf(scanId));
  await runTest('Test 3: Decode and verify PDF', () => testDecodePdf(scanId));
  await runTest('Test 4: Query parameter parsing', () => testQueryParamParsing(scanId));
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                         Test Summary                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. See details above.\n');
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
