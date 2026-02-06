#!/usr/bin/env node
/**
 * ClawSec Advanced Sanitization - Usage Examples
 * 
 * Demonstrates how to use the advanced sanitization engine
 */

const { advancedSanitize, getPatternStats } = require('./advanced-sanitizer');

console.log('🛡️  ClawSec Advanced Sanitization - Usage Examples\n');

// Example 1: Credit Card Redaction
console.log('Example 1: Credit Card Redaction');
console.log('='.repeat(50));
const cardInput = "Customer payment: 4532 1234 5678 9010";
const cardResult = advancedSanitize(cardInput);
console.log('Input: ', cardInput);
console.log('Output:', cardResult.text);
console.log('Count: ', cardResult.sanitizationCount);
console.log('');

// Example 2: SSN Redaction
console.log('Example 2: Social Security Number');
console.log('='.repeat(50));
const ssnInput = "Employee SSN: 123-45-6789";
const ssnResult = advancedSanitize(ssnInput);
console.log('Input: ', ssnInput);
console.log('Output:', ssnResult.text);
console.log('Count: ', ssnResult.sanitizationCount);
console.log('');

// Example 3: Private Key Redaction
console.log('Example 3: RSA Private Key');
console.log('='.repeat(50));
const keyInput = `Server key:
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAw7Zxq8dXnHhNYCjKSXNuPgPzMk5z7xmQ4dGJlMGFwMzN5Ymp
-----END RSA PRIVATE KEY-----`;
const keyResult = advancedSanitize(keyInput);
console.log('Input: ', keyInput.substring(0, 60) + '...');
console.log('Output:', keyResult.text);
console.log('Count: ', keyResult.sanitizationCount);
console.log('');

// Example 4: Payment Gateway Credentials
console.log('Example 4: Payment Gateway Keys');
console.log('='.repeat(50));
const paymentInput = {
  stripe_key: "sk_live_51HqK2XL9I8m4vN7K2fP8rH",
  square_token: "sq0atp-AbCdEfGhIjKlMnOpQrSt",
  sendgrid_key: "SG.1234567890abcdefghijklmnopqrstuvwxyz"
};
const paymentResult = advancedSanitize(paymentInput);
console.log('Input: ', JSON.stringify(paymentInput, null, 2));
console.log('Output:', JSON.stringify(paymentResult.text, null, 2));
console.log('Count: ', paymentResult.sanitizationCount);
console.log('');

// Example 5: Database Connection String
console.log('Example 5: Database Connection');
console.log('='.repeat(50));
const dbInput = "DB_URL=postgres://admin:secret123@db.example.com:5432/mydb";
const dbResult = advancedSanitize(dbInput);
console.log('Input: ', dbInput);
console.log('Output:', dbResult.text);
console.log('Count: ', dbResult.sanitizationCount);
console.log('');

// Example 6: Multiple Types in One Object
console.log('Example 6: Complex Configuration');
console.log('='.repeat(50));
const complexInput = {
  user: {
    ssn: "123-45-6789",
    email: "john@example.com",
    card: "4532 1234 5678 9010"
  },
  services: {
    stripe: "sk_live_51HqK2XL9I8m4vN7K2fP8rH",
    database: "postgres://admin:password@db.host/production",
    slack_webhook: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
  },
  keys: {
    aws_key: "AKIAIOSFODNN7EXAMPLE",
    telegram_bot: "1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
  }
};
const complexResult = advancedSanitize(complexInput);
console.log('Input: ', JSON.stringify(complexInput, null, 2));
console.log('Output:', JSON.stringify(complexResult.text, null, 2));
console.log('Count: ', complexResult.sanitizationCount, 'items redacted');
console.log('');

// Example 7: Pattern Statistics
console.log('Example 7: Pattern Statistics');
console.log('='.repeat(50));
const stats = getPatternStats();
console.log('Total patterns:', stats.total);
console.log('Categories:');
Object.entries(stats.categories).forEach(([category, count]) => {
  console.log(`  - ${category}: ${count} patterns`);
});
console.log('');

// Example 8: Real-World Scan Scenario
console.log('Example 8: Security Audit Scenario');
console.log('='.repeat(50));
const auditData = {
  config: {
    gateway_token: "sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz",
    database: "mongodb://dbuser:dbpass123@cluster.mongodb.net/production",
    stripe_secret: "sk_live_51HqK2XL9I8m4vN7K2fP8rH"
  },
  logs: [
    "User SSN: 123-45-6789 submitted payment",
    "Credit card 4532-1234-5678-9010 charged successfully",
    "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  ]
};

console.log('Scanning configuration and logs...');
const auditResult = advancedSanitize(auditData);
console.log(`✅ Scan complete: ${auditResult.sanitizationCount} sensitive items redacted`);
console.log('');
console.log('Sanitized data ready for secure transmission or storage');
console.log('');

// Summary
console.log('='.repeat(50));
console.log('🎉 All examples completed successfully!');
console.log('');
console.log('💡 Integration Tips:');
console.log('   1. Always sanitize before logging or transmitting data');
console.log('   2. Check sanitizationCount to track redactions');
console.log('   3. Preserve last 4 digits of cards for reference');
console.log('   4. Use hashed identifiers for tracking SSNs');
console.log('');
console.log('📖 Full documentation: docs/advanced-sanitization.md');
console.log('🧪 Run tests: node test-advanced-sanitization.js');
