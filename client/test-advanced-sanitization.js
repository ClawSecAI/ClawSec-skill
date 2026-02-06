#!/usr/bin/env node
/**
 * ClawSec Advanced Sanitization Test Suite
 * 
 * Tests for credit cards, SSNs, private keys, and additional credential types
 */

const { advancedSanitize, ADVANCED_PATTERNS } = require('./advanced-sanitizer');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test runner
function runTest(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n🛡️  ClawSec Advanced Sanitization Test Suite\n');

// Test 1: Credit Card Redaction
console.log('🧪 Test 1: Credit Card Redaction');

runTest('Visa card (spaces)', () => {
  const input = 'Card: 4532 1234 5678 9010';
  const output = advancedSanitize(input);
  assert(!output.text.includes('4532 1234'), 'Full card number should be redacted');
  assert(output.text.includes('[REDACTED-CREDIT-CARD-'), 'Should contain redacted marker');
  assert(output.text.includes('9010]'), 'Should preserve last 4 digits');
  assert(output.sanitizationCount === 1, 'Should count sanitization');
});

runTest('Mastercard (no spaces)', () => {
  const input = 'Payment: 5555555555554444';
  const output = advancedSanitize(input);
  assert(!output.text.includes('5555555555'), 'Full card number should be redacted');
  assert(output.text.includes('4444]'), 'Should preserve last 4 digits');
});

runTest('Amex card', () => {
  const input = 'Amex: 378282246310005';
  const output = advancedSanitize(input);
  assert(!output.text.includes('378282246'), 'Full card number should be redacted');
  assert(output.text.includes('0005]'), 'Should preserve last 4 digits');
});

runTest('Discover card (dashes)', () => {
  const input = 'Discover: 6011-1111-1111-1117';
  const output = advancedSanitize(input);
  assert(!output.text.includes('6011-1111'), 'Full card number should be redacted');
  assert(output.text.includes('1117]'), 'Should preserve last 4 digits');
});

runTest('Multiple cards in text', () => {
  const input = 'Cards: 4532123456789010 and 5555555555554444';
  const output = advancedSanitize(input);
  assert(output.sanitizationCount === 2, 'Should redact both cards');
  assert(!output.text.includes('4532123456789010'), 'First card should be redacted');
  assert(!output.text.includes('5555555555554444'), 'Second card should be redacted');
});

// Test 2: Social Security Number Redaction
console.log('\n🧪 Test 2: Social Security Number Redaction');

runTest('SSN with dashes', () => {
  const input = 'SSN: 123-45-6789';
  const output = advancedSanitize(input);
  assert(!output.text.includes('123-45-6789'), 'Full SSN should be redacted');
  assert(output.text.includes('[REDACTED-SSN-'), 'Should contain redacted marker');
});

runTest('SSN without dashes', () => {
  const input = 'Social Security: 987654321';
  const output = advancedSanitize(input);
  assert(!output.text.includes('987654321'), 'Full SSN should be redacted');
  assert(output.text.includes('[REDACTED-SSN-'), 'Should contain redacted marker');
});

runTest('SSN with spaces', () => {
  const input = 'SSN: 123 45 6789';
  const output = advancedSanitize(input);
  assert(!output.text.includes('123 45 6789'), 'Full SSN should be redacted');
});

runTest('Multiple SSNs', () => {
  const input = 'SSNs: 123-45-6789 and 987-65-4321';
  const output = advancedSanitize(input);
  assert(output.sanitizationCount === 2, 'Should redact both SSNs');
});

// Test 3: RSA Private Key Redaction
console.log('\n🧪 Test 3: RSA Private Key Redaction');

runTest('RSA private key (traditional format)', () => {
  const input = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAw7Zxq8dXnHhNYCjKSXNuPgPzMk5z7xmQ4dGJlMGFwMzN5Ymp
z2K7Y4Jmq1xHzR3vT8Lm9N4Pq6S2Wk3Jl9K8M1Np7Q5Ym4Zk6Xr2Lm8Pq5Nm9Kl
-----END RSA PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('MIIEpAIBAAKCAQEAw7Z'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-RSA-PRIVATE-KEY]'), 'Should contain redacted marker');
});

runTest('RSA private key (PKCS#8 format)', () => {
  const input = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDtnGrx1eceE1g
-----END PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('MIIEvQIBADANBgkqhkiG9w0'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-RSA-PRIVATE-KEY]'), 'Should contain redacted marker');
});

// Test 4: EC Private Key Redaction
console.log('\n🧪 Test 4: EC (Elliptic Curve) Private Key Redaction');

runTest('EC private key', () => {
  const input = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIIGlRW4SJwlwgxVsYPIB3Ng/w14P9k4qK1Hh1rXmHCc1oAoGCCqGSM49
AwEHoUQDQgAE8vMHvfqJl3qYb8Vf9nYpfYyW2tKxLp1F9t4XqGJqLtm5jHLz7Q
-----END EC PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('MHcCAQEEIIGlRW4SJwlwgxVsYPIB'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-EC-PRIVATE-KEY]'), 'Should contain redacted marker');
});

runTest('EC private key (SEC1 format)', () => {
  const input = `-----BEGIN EC PARAMETERS-----
BggqhkjOPQMBBw==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEILm3zKxN0YJQnqLpQwK8BZZ4KVVN8jI+xqPGQD3VC9OPoAoGCCqGSM49
-----END EC PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(output.text.includes('[REDACTED-EC-PRIVATE-KEY]'), 'Should redact EC key');
  assert(output.sanitizationCount >= 1, 'Should count sanitization');
});

// Test 5: OpenSSH Private Key Redaction
console.log('\n🧪 Test 5: OpenSSH Private Key Redaction');

runTest('OpenSSH private key format', () => {
  const input = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAw7Zxq8dXnHhNYCjKSXNuPgPzMk5z7xmQ4dGJlMGFwMzN5Ympz
-----END OPENSSH PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('b3BlbnNzaC1rZXktdjEAAAAA'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-OPENSSH-PRIVATE-KEY]'), 'Should contain redacted marker');
});

// Test 6: DSA Private Key Redaction
console.log('\n🧪 Test 6: DSA Private Key Redaction');

runTest('DSA private key', () => {
  const input = `-----BEGIN DSA PRIVATE KEY-----
MIIBugIBAAKBgQD9f1OBHXUSKVLfSpwu7OTn9hG3UjzvRADDHj+AtlEmaUVdQCJR
-----END DSA PRIVATE KEY-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('MIIBugIBAAKBgQD9f1OBH'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-DSA-PRIVATE-KEY]'), 'Should contain redacted marker');
});

// Test 7: PGP Private Key Redaction
console.log('\n🧪 Test 7: PGP Private Key Redaction');

runTest('PGP private key block', () => {
  const input = `-----BEGIN PGP PRIVATE KEY BLOCK-----
lQOYBGPkxq8BCADVp1mD9I2f4WxP6RQJLQ0fz7cT4bNp0BdDPXLwEpKQJ8Xtf7Ah
mI4kF7R2KgPm5yTqLXwQz6vN3gI8Jx0cY5LmHqTp9Rf8Zj4Kl7Nn2Qw3Fk8Tt
-----END PGP PRIVATE KEY BLOCK-----`;
  const output = advancedSanitize(input);
  assert(!output.text.includes('lQOYBGPkxq8BCADVp1mD9I2f'), 'Key material should be redacted');
  assert(output.text.includes('[REDACTED-PGP-PRIVATE-KEY]'), 'Should contain redacted marker');
});

// Test 8: Additional Credential Types
console.log('\n🧪 Test 8: Additional Credential Types');

runTest('Stripe secret key', () => {
  const input = 'Stripe: sk_live_51HqK2XL9I8m4vN7K2fP8rH';
  const output = advancedSanitize(input);
  assert(!output.text.includes('sk_live_51HqK2XL9I8m4vN7K2fP8rH'), 'Full key should be redacted');
  assert(output.text.includes('[REDACTED-STRIPE-KEY'), 'Should contain redacted marker');
});

runTest('Twilio auth token', () => {
  const input = 'Twilio: AC7e2f7f7a2b4c5d6e8f9a0b1c2d3e4f5';
  const output = advancedSanitize(input);
  assert(!output.text.includes('AC7e2f7f7a2b4c5d6e8f9a0b1c2d3e4f5'), 'Full token should be redacted');
  assert(output.text.includes('[REDACTED-TWILIO-TOKEN'), 'Should contain redacted marker');
});

runTest('SendGrid API key', () => {
  const input = 'SendGrid: SG.1234567890abcdefghijklmnopqrstuvwxyz';
  const output = advancedSanitize(input);
  assert(!output.text.includes('SG.1234567890abcdefghijklmnopqrstuvwxyz'), 'Full key should be redacted');
  assert(output.text.includes('[REDACTED-SENDGRID-KEY'), 'Should contain redacted marker');
});

runTest('Mailgun API key', () => {
  const input = 'Mailgun: key-1234567890abcdef1234567890abcdef';
  const output = advancedSanitize(input);
  assert(!output.text.includes('key-1234567890abcdef1234567890abcdef'), 'Full key should be redacted');
  assert(output.text.includes('[REDACTED-MAILGUN-KEY'), 'Should contain redacted marker');
});

runTest('Square access token', () => {
  const input = 'Square: sq0atp-1234567890abcdefghijklmnopqrst';
  const output = advancedSanitize(input);
  assert(!output.text.includes('sq0atp-1234567890abcdefghijklmnopqrst'), 'Full token should be redacted');
  assert(output.text.includes('[REDACTED-SQUARE-TOKEN'), 'Should contain redacted marker');
});

runTest('Azure storage key', () => {
  const input = 'Azure: DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789+ABCDEFGHIJKLMNOPQRSTUVWXYZ==;EndpointSuffix=core.windows.net';
  const output = advancedSanitize(input);
  assert(!output.text.includes('AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'), 'Account key should be redacted');
  assert(output.text.includes('[REDACTED-AZURE-KEY'), 'Should contain redacted marker');
});

runTest('Google Cloud service account key', () => {
  const input = 'GCP: "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\\n-----END PRIVATE KEY-----\\n"';
  const output = advancedSanitize(input);
  assert(output.text.includes('[REDACTED-'), 'Should contain redacted marker');
});

runTest('Docker Hub token', () => {
  const input = 'Docker: dckr_pat_AbCdEfGhIjKlMnOpQrStUvWxYz012345';
  const output = advancedSanitize(input);
  assert(!output.text.includes('dckr_pat_AbCdEfGhIjKlMnOpQrStUvWxYz012345'), 'Full token should be redacted');
  assert(output.text.includes('[REDACTED-DOCKER-TOKEN'), 'Should contain redacted marker');
});

runTest('npm access token', () => {
  const input = 'npm: npm_AbCdEfGhIjKlMnOpQrStUvWxYz012345678901234567890';
  const output = advancedSanitize(input);
  assert(!output.text.includes('npm_AbCdEfGhIjKlMnOpQrStUvWxYz012345678901234567890'), 'Full token should be redacted');
  assert(output.text.includes('[REDACTED-NPM-TOKEN'), 'Should contain redacted marker');
});

// Test 9: Canadian SIN Redaction
console.log('\n🧪 Test 9: Canadian SIN Redaction');

runTest('Canadian SIN with dashes', () => {
  const input = 'SIN: 123-456-789';
  const output = advancedSanitize(input);
  assert(!output.text.includes('123-456-789'), 'Full SIN should be redacted');
  assert(output.text.includes('[REDACTED-SIN-'), 'Should contain redacted marker');
});

runTest('Canadian SIN with spaces', () => {
  const input = 'SIN: 123 456 789';
  const output = advancedSanitize(input);
  assert(!output.text.includes('123 456 789'), 'Full SIN should be redacted');
});

// Test 10: Integration - Multiple Types
console.log('\n🧪 Test 10: Integration - Multiple Sensitive Data Types');

runTest('Mixed sensitive data in config', () => {
  const input = `
{
  "user": {
    "ssn": "123-45-6789",
    "email": "user@example.com",
    "card": "4532 1234 5678 9010"
  },
  "credentials": {
    "stripe_key": "sk_live_51HqK2XL9I8m4vN7K2fP8rH",
    "rsa_key": "-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEAw7Zxq8dXnHhNYCjKSXNuPgPzMk5z7xmQ4dGJlMGFwMzN5Ymp\\n-----END RSA PRIVATE KEY-----"
  }
}`;
  const output = advancedSanitize(input);
  
  // Verify all types are redacted
  assert(!output.text.includes('123-45-6789'), 'SSN should be redacted');
  assert(!output.text.includes('4532 1234 5678 9010'), 'Card should be redacted');
  assert(!output.text.includes('sk_live_51HqK2XL9I8m4vN7K2fP8rH'), 'Stripe key should be redacted');
  assert(!output.text.includes('MIIEpAIBAAKCAQEAw7Z'), 'RSA key should be redacted');
  
  // Verify counts
  assert(output.sanitizationCount >= 4, `Should redact at least 4 items, got ${output.sanitizationCount}`);
});

// Test 11: Pattern Specificity
console.log('\n🧪 Test 11: Pattern Specificity (Avoid False Positives)');

runTest('Normal numbers not redacted', () => {
  const input = 'Phone: 1234567890, Amount: 123456.78';
  const output = advancedSanitize(input);
  // These should NOT be redacted (no proper card/SSN context)
  assert(output.text.includes('1234567890'), 'Normal 10-digit number should not be redacted');
});

runTest('Partial card numbers preserved in text', () => {
  const input = 'Last 4 digits: 1234';
  const output = advancedSanitize(input);
  assert(output.text.includes('1234'), 'Last 4 digits alone should not be redacted');
});

runTest('Date not confused with card', () => {
  const input = 'Date: 2024-01-15';
  const output = advancedSanitize(input);
  assert(output.text.includes('2024-01-15'), 'Date should not be redacted');
});

// Results summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Results Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}/${results.passed + results.failed}`);
console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
console.log(`📈 Success Rate: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%`);
console.log('='.repeat(60));

// Detailed results
if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests.filter(t => t.status === 'FAILED').forEach(test => {
    console.log(`  - ${test.name}: ${test.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
