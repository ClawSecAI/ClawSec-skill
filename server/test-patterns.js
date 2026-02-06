#!/usr/bin/env node
/**
 * ClawSec Pattern Matching Engine - Test Suite
 * 
 * Tests credential detection accuracy for 50+ credential types
 */

const { 
  CREDENTIAL_PATTERNS, 
  findExposedSecrets, 
  validateCredential,
  isWeakOrPlaceholder,
  calculateCredentialRisk 
} = require('./patterns');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

// Test runner
function test(name, fn) {
  results.total++;
  process.stdout.write(`\n🧪 ${name}... `);
  
  try {
    fn();
    log('✅ PASSED', 'green');
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
  } catch (error) {
    log('❌ FAILED', 'red');
    log(`   Error: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// === Test Suite ===

log('\n🔍 ClawSec Pattern Matching Engine - Test Suite\n', 'cyan');
log('Testing 50+ credential types and detection accuracy\n', 'blue');

// Test 1: AWS Credentials
test('AWS Access Key detection', () => {
  const config = {
    aws: {
      access_key: 'AKIAIOSFODNN7EXAMPLE'
    }
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect AWS access key');
  assert(secrets.some(s => s.type === 'AWS Access Key'), 'Should identify as AWS Access Key');
  assert(secrets[0].severity === 'CRITICAL', 'AWS keys should be CRITICAL');
});

test('AWS Secret Key detection', () => {
  const config = {
    aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect AWS secret key');
  assert(secrets.some(s => s.type === 'AWS Secret Key'), 'Should identify as AWS Secret Key');
});

// Test 2: OpenAI Credentials
test('OpenAI API Key detection (legacy format)', () => {
  const config = {
    openai_key: 'sk-aBcDeFgHiJkLmNoPqRsT3BlbkFJuVwXyZaBcDeFgHiJkLmN'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect OpenAI key');
  assert(secrets.some(s => s.type === 'OpenAI API Key'), 'Should identify as OpenAI key');
  assert(secrets[0].severity === 'HIGH', 'OpenAI keys should be HIGH');
});

test('OpenAI API Key detection (project format)', () => {
  const config = {
    openai_key: 'sk-proj-abcd1234efgh5678ijkl9012mnop3456qrst7890'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect OpenAI project key');
});

// Test 3: Anthropic Credentials
test('Anthropic API Key detection', () => {
  const config = {
    anthropic: {
      api_key: 'sk-ant-api03-aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890aBcDeFgHiJkLmNoP'
    }
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Anthropic key');
  assert(secrets.some(s => s.type === 'Anthropic API Key'), 'Should identify as Anthropic key');
});

// Test 4: GitHub Tokens
test('GitHub Personal Access Token detection', () => {
  const config = {
    github_token: 'ghp_1234567890abcdefghijklmnopqrstuv12'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect GitHub PAT');
  assert(secrets.some(s => s.type === 'GitHub Personal Access Token'), 'Should identify as GitHub PAT');
  assert(secrets[0].severity === 'HIGH', 'GitHub tokens should be HIGH');
});

test('GitHub OAuth Token detection', () => {
  const config = {
    oauth_token: 'gho_1234567890abcdefghijklmnopqrstuv12'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect GitHub OAuth token');
});

// Test 5: Database Connection Strings
test('PostgreSQL connection string detection', () => {
  const config = {
    database_url: 'postgresql://user:password123@localhost:5432/mydb'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect PostgreSQL connection string');
  assert(secrets.some(s => s.type === 'PostgreSQL Connection String'), 'Should identify as PostgreSQL');
  assert(secrets[0].severity === 'CRITICAL', 'Database credentials should be CRITICAL');
});

test('MongoDB connection string detection', () => {
  const config = {
    mongo_uri: 'mongodb://admin:secret123@mongodb.example.com:27017/database'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect MongoDB connection string');
  assert(secrets.some(s => s.type === 'MongoDB Connection String'), 'Should identify as MongoDB');
});

test('MySQL connection string detection', () => {
  const config = {
    db: 'mysql://root:password@localhost:3306/app_db'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect MySQL connection string');
});

// Test 6: Messaging Platform Tokens
test('Telegram Bot Token detection', () => {
  const config = {
    telegram: {
      bot_token: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789'
    }
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Telegram token');
  assert(secrets.some(s => s.type === 'Telegram Bot Token'), 'Should identify as Telegram token');
});

test('Discord Bot Token detection', () => {
  const config = {
    discord_token: 'MTA1MjM0NTY3ODkwMTIzNDU2Nw.GaBcDe.FgHiJkLmNoPqRsTuVwXyZ123456'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Discord token');
  assert(secrets.some(s => s.type === 'Discord Bot Token'), 'Should identify as Discord token');
});

test('Slack Bot Token detection', () => {
  const config = {
    slack_token: 'xoxb-1234567890123-1234567890123-aBcDeFgHiJkLmNoPqRsTuVwX'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Slack token');
  assert(secrets.some(s => s.type === 'Slack Bot Token'), 'Should identify as Slack token');
});

// Test 7: JWT Tokens
test('JWT Token detection', () => {
  const config = {
    auth_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect JWT token');
  assert(secrets.some(s => s.type === 'JWT Token'), 'Should identify as JWT');
  assert(secrets[0].severity === 'HIGH', 'JWT tokens should be HIGH');
});

// Test 8: SSH Keys
test('SSH Private Key detection', () => {
  const config = {
    private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect SSH private key');
  assert(secrets.some(s => s.type === 'SSH Private Key'), 'Should identify as SSH key');
  assert(secrets[0].severity === 'CRITICAL', 'SSH keys should be CRITICAL');
});

// Test 9: Payment Credentials
test('Stripe API Key detection', () => {
  const config = {
    stripe_key: 'sk_live_51AbCdEfGhIjKlMnOpQr'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Stripe key');
  assert(secrets.some(s => s.type === 'Stripe API Key'), 'Should identify as Stripe key');
  assert(secrets[0].severity === 'CRITICAL', 'Stripe keys should be CRITICAL');
});

// Test 10: Google Cloud Credentials
test('Google Cloud API Key detection', () => {
  const config = {
    gcp_key: 'AIzaSyD1234567890abcdefghijklmnopqrstuv'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Google Cloud key');
  assert(secrets.some(s => s.type === 'Google Cloud API Key'), 'Should identify as GCP key');
});

// Test 11: NPM Token detection
test('NPM Access Token detection', () => {
  const config = {
    npm_token: 'npm_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect NPM token');
  assert(secrets.some(s => s.type === 'NPM Access Token'), 'Should identify as NPM token');
});

// Test 12: Environment Variable References (Should NOT detect)
test('Environment variable references should NOT be flagged', () => {
  const config = {
    openai_key: '${OPENAI_API_KEY}',
    telegram_token: '${TELEGRAM_BOT_TOKEN}',
    database_url: '${DATABASE_URL}'
  };
  
  const secrets = findExposedSecrets(config);
  assertEqual(secrets.length, 0, 'Environment variable references should be safe');
});

test('Process.env references should NOT be flagged', () => {
  const config = {
    key: 'process.env.API_KEY'
  };
  
  const secrets = findExposedSecrets(config);
  assertEqual(secrets.length, 0, 'process.env references should be safe');
});

// Test 13: Multiple Secrets Detection
test('Multiple different secret types detection', () => {
  const config = {
    aws_access_key: 'AKIAIOSFODNN7EXAMPLE',
    github_token: 'ghp_1234567890abcdefghijklmnopqrstuv12',
    openai_key: 'sk-proj-abcd1234efgh5678ijkl9012mnop3456qrst7890',
    stripe_key: 'sk_live_51AbCdEfGhIjKlMnOpQr'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length >= 4, `Should detect at least 4 different secret types, found ${secrets.length}`);
});

// Test 14: Weak/Placeholder Detection
test('Weak placeholder values detection', () => {
  assert(isWeakOrPlaceholder('your-api-key-here'), 'Should detect placeholder text');
  assert(isWeakOrPlaceholder('test-token-123'), 'Should detect test values');
  assert(isWeakOrPlaceholder('example_key'), 'Should detect example values');
  assert(!isWeakOrPlaceholder('sk-proj-a1b2c3d4e5f6g7h8i9j0'), 'Real keys should not be flagged as weak');
});

// Test 15: Risk Calculation
test('Credential risk calculation - CRITICAL', () => {
  const secrets = [
    { severity: 'CRITICAL', confidence: 'high' },
    { severity: 'HIGH', confidence: 'high' }
  ];
  
  const risk = calculateCredentialRisk(secrets);
  assertEqual(risk, 'CRITICAL', 'Should calculate CRITICAL risk for critical secrets');
});

test('Credential risk calculation - HIGH', () => {
  const secrets = [
    { severity: 'HIGH', confidence: 'high' },
    { severity: 'HIGH', confidence: 'high' },
    { severity: 'MEDIUM', confidence: 'medium' }
  ];
  
  const risk = calculateCredentialRisk(secrets);
  assertEqual(risk, 'HIGH', 'Should calculate HIGH risk for multiple high secrets');
});

test('Credential risk calculation - LOW', () => {
  const secrets = [
    { severity: 'LOW', confidence: 'low' }
  ];
  
  const risk = calculateCredentialRisk(secrets);
  assertEqual(risk, 'LOW', 'Should calculate LOW risk for low severity secrets');
});

// Test 16: Pattern Coverage
test('Pattern definition completeness', () => {
  assert(CREDENTIAL_PATTERNS.length >= 70, `Should have at least 70 patterns, found ${CREDENTIAL_PATTERNS.length}`);
  
  // Verify all patterns have required fields
  CREDENTIAL_PATTERNS.forEach(pattern => {
    assert(pattern.name, 'Pattern should have name');
    assert(pattern.pattern, 'Pattern should have regex');
    assert(pattern.severity, 'Pattern should have severity');
    assert(pattern.confidence, 'Pattern should have confidence');
    assert(pattern.description, 'Pattern should have description');
    assert(pattern.impact, 'Pattern should have impact');
  });
});

// Test 17: Azure Credentials
test('Azure Storage Account Key detection', () => {
  const config = {
    azure_storage: 'DefaultEndpointsProtocol=https;AccountName=mystorageaccount;AccountKey=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz='
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Azure storage key');
  assert(secrets.some(s => s.type === 'Azure Storage Account Key'), 'Should identify as Azure key');
});

// Test 18: Redis Connection String
test('Redis connection string detection', () => {
  const config = {
    redis_url: 'redis://:mypassword123@redis.example.com:6379'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Redis connection string');
  assert(secrets.some(s => s.type === 'Redis Connection String'), 'Should identify as Redis');
});

// Test 19: Discord Webhook
test('Discord webhook URL detection', () => {
  const config = {
    webhook: 'https://discord.com/api/webhooks/1234567890/aBcDeFgHiJkLmNoPqRsTuVwXyZ'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Discord webhook');
  assert(secrets.some(s => s.type === 'Discord Webhook URL'), 'Should identify as Discord webhook');
});

// Test 20: Hugging Face Token
test('Hugging Face token detection', () => {
  const config = {
    hf_token: 'hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Hugging Face token');
  assert(secrets.some(s => s.type === 'Hugging Face Token'), 'Should identify as HF token');
});

// Test 21: SendGrid API Key
test('SendGrid API key detection', () => {
  const config = {
    sendgrid_key: 'SG.abcdefghijklmnopqrstuv.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect SendGrid key');
  assert(secrets.some(s => s.type === 'SendGrid API Key'), 'Should identify as SendGrid key');
  assert(secrets[0].severity === 'HIGH', 'SendGrid keys should be HIGH');
});

// Test 22: Twilio Credentials
test('Twilio Account SID detection', () => {
  const config = {
    twilio_sid: 'AC0123456789abcdef0123456789abcdef'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Twilio Account SID');
  assert(secrets.some(s => s.type === 'Twilio Account SID & Auth Token'), 'Should identify as Twilio credentials');
  assert(secrets[0].severity === 'HIGH', 'Twilio credentials should be HIGH');
});

// Test 23: Square Payment Token
test('Square access token detection', () => {
  const config = {
    square_token: 'sq0atp-1234567890abcdefghijkl'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Square token');
  assert(secrets.some(s => s.type === 'Square Access Token'), 'Should identify as Square token');
  assert(secrets[0].severity === 'CRITICAL', 'Square tokens should be CRITICAL');
});

// Test 24: PlanetScale Database Token
test('PlanetScale database token detection', () => {
  const config = {
    db_token: 'pscale_tkn_1234567890abcdefghijklmnopqrstuv'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect PlanetScale token');
  assert(secrets.some(s => s.type === 'PlanetScale Database Token'), 'Should identify as PlanetScale token');
  assert(secrets[0].severity === 'CRITICAL', 'PlanetScale tokens should be CRITICAL');
});

// Test 25: Ethereum Private Key
test('Ethereum private key detection', () => {
  const config = {
    eth_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Ethereum private key');
  assert(secrets.some(s => s.type === 'Ethereum Private Key'), 'Should identify as Ethereum key');
  assert(secrets[0].severity === 'CRITICAL', 'Crypto keys should be CRITICAL');
});

// Test 26: CircleCI Token
test('CircleCI token detection', () => {
  const config = {
    circleci_token: '1234567890abcdef1234567890abcdef12345678'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect CircleCI token');
  assert(secrets.some(s => s.type === 'CircleCI Token'), 'Should identify as CircleCI token');
  assert(secrets[0].severity === 'HIGH', 'CI/CD tokens should be HIGH');
});

// Test 27: JFrog Artifactory Token
test('JFrog Artifactory token detection', () => {
  const config = {
    artifactory_token: 'AKC1234567890a'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect JFrog token');
  assert(secrets.some(s => s.type === 'JFrog Artifactory Token'), 'Should identify as JFrog token');
  assert(secrets[0].severity === 'HIGH', 'Artifactory tokens should be HIGH');
});

// Test 28: Sentry DSN
test('Sentry DSN detection', () => {
  const config = {
    sentry_dsn: 'https://1234567890abcdef1234567890abcdef@o123456.ingest.sentry.io/1234567'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Sentry DSN');
  assert(secrets.some(s => s.type === 'Sentry DSN'), 'Should identify as Sentry DSN');
  assert(secrets[0].severity === 'MEDIUM', 'Sentry DSN should be MEDIUM');
});

// Test 29: Facebook Access Token
test('Facebook access token detection', () => {
  const config = {
    fb_token: 'EAAaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Facebook token');
  assert(secrets.some(s => s.type === 'Facebook Access Token'), 'Should identify as Facebook token');
});

// Test 30: Heroku API Key
test('Heroku API key detection', () => {
  const config = {
    heroku_api_key: '12345678-1234-1234-1234-123456789abc'
  };
  
  const secrets = findExposedSecrets(config);
  assert(secrets.length > 0, 'Should detect Heroku API key');
  assert(secrets.some(s => s.type === 'Heroku API Key'), 'Should identify as Heroku key');
  assert(secrets[0].severity === 'HIGH', 'Heroku keys should be HIGH');
});

// === Run Tests ===

log('\n' + '='.repeat(60), 'cyan');
log('Test Results Summary', 'cyan');
log('='.repeat(60), 'cyan');

log(`\nTotal Tests: ${results.total}`);
log(`Passed: ${results.passed}`, 'green');
log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

if (results.failed > 0) {
  log('Failed Tests:', 'red');
  results.tests.filter(t => t.status === 'FAILED').forEach(t => {
    log(`  ❌ ${t.name}`, 'red');
    if (t.error) log(`     ${t.error}`, 'yellow');
  });
  log('');
}

log('='.repeat(60) + '\n', 'cyan');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
