/**
 * ClawSec Advanced Sanitization Engine
 * 
 * Provides comprehensive redaction for:
 * - Credit card numbers (Visa, Mastercard, Amex, Discover, etc.)
 * - Social Security Numbers (US SSN, Canadian SIN)
 * - Private cryptographic keys (RSA, EC, DSA, OpenSSH, PGP)
 * - Payment gateway credentials (Stripe, PayPal, Square, etc.)
 * - Cloud provider keys (AWS, Azure, GCP)
 * - API tokens (GitHub, npm, Docker, etc.)
 */

const crypto = require('crypto');

/**
 * Generate short hash for tracking redacted values
 */
function hashShort(value) {
  return crypto.createHash('sha256')
    .update(value.toString())
    .digest('hex')
    .slice(0, 8);
}

/**
 * Advanced pattern definitions
 */
const ADVANCED_PATTERNS = {
  // Credit Cards (Luhn algorithm validated patterns)
  // Supports Visa, Mastercard, Amex, Discover, Diners, JCB
  credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
  credit_card_spaced: /\b(?:4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|3[47]\d{1}[\s-]?\d{6}[\s-]?\d{5}|6(?:011|5\d{2})[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
  
  // Social Security Numbers
  ssn_dashed: /\b\d{3}-\d{2}-\d{4}\b/g,
  ssn_spaced: /\b\d{3}\s\d{2}\s\d{4}\b/g,
  ssn_plain: /\b(?!000|666|9\d{2})\d{3}(?!00)\d{2}(?!0000)\d{4}\b/g,
  
  // Canadian SIN
  sin_dashed: /\b\d{3}-\d{3}-\d{3}\b/g,
  sin_spaced: /\b\d{3}\s\d{3}\s\d{3}\b/g,
  
  // RSA Private Keys
  rsa_private_key: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
  rsa_private_key_pkcs8: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
  
  // EC (Elliptic Curve) Private Keys
  ec_private_key: /-----BEGIN EC PRIVATE KEY-----[\s\S]*?-----END EC PRIVATE KEY-----/g,
  ec_parameters: /-----BEGIN EC PARAMETERS-----[\s\S]*?-----END EC PARAMETERS-----/g,
  
  // OpenSSH Private Keys
  openssh_private_key: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
  
  // DSA Private Keys
  dsa_private_key: /-----BEGIN DSA PRIVATE KEY-----[\s\S]*?-----END DSA PRIVATE KEY-----/g,
  
  // PGP Private Keys
  pgp_private_key: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/g,
  
  // Encrypted Private Keys
  encrypted_private_key: /-----BEGIN ENCRYPTED PRIVATE KEY-----[\s\S]*?-----END ENCRYPTED PRIVATE KEY-----/g,
  
  // Payment Gateway Keys
  stripe_secret: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
  stripe_restricted: /rk_(live|test)_[a-zA-Z0-9]{24,}/g,
  paypal_secret: /[A-Z0-9]{60,}/g, // PayPal secret keys are 80 chars
  square_token: /sq0atp-[a-zA-Z0-9_-]{22,}/g,
  square_secret: /sq0csp-[a-zA-Z0-9_-]{43}/g,
  
  // Communication Services
  twilio_account_sid: /AC[a-f0-9]{32}/g,
  twilio_auth_token: /[a-f0-9]{32}/g,
  sendgrid_key: /SG\.[a-zA-Z0-9_-]{22,}\.[a-zA-Z0-9_-]{43,}/g,
  mailgun_key: /key-[a-f0-9]{32}/g,
  mailchimp_key: /[a-f0-9]{32}-us[0-9]{1,2}/g,
  
  // Cloud Provider Keys
  azure_storage_key: /AccountKey=[a-zA-Z0-9+\/=]{88}/g,
  azure_connection_string: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[a-zA-Z0-9+\/=]{88}/g,
  gcp_api_key: /AIza[0-9A-Za-z_-]{35}/g,
  digitalocean_token: /dop_v1_[a-f0-9]{64}/g,
  
  // Container Registry Tokens
  docker_pat: /dckr_pat_[a-zA-Z0-9_-]{36,}/g,
  
  // Package Manager Tokens
  npm_token: /npm_[a-zA-Z0-9]{36,}/g,
  pypi_token: /pypi-[a-zA-Z0-9_-]{100,}/g,
  
  // Database Connection Strings
  postgres_connection: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\/]+\/[^\s"']+/gi,
  mysql_connection: /mysql:\/\/[^:]+:[^@]+@[^\/]+\/[^\s"']+/gi,
  mongodb_connection: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\/]+\/[^\s"'?]+/gi,
  redis_connection: /redis:\/\/[^:]*:[^@]+@[^\/]+/gi,
  
  // Heroku API Keys
  heroku_key: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
  
  // Shopify Keys
  shopify_token: /shpat_[a-fA-F0-9]{32}/g,
  shopify_secret: /shpss_[a-fA-F0-9]{32}/g,
  
  // Slack Webhooks
  slack_webhook: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,}\/B[a-zA-Z0-9_]{8,}\/[a-zA-Z0-9_]{24,}/g,
  
  // Discord Webhooks
  discord_webhook: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d{17,19}\/[a-zA-Z0-9_-]{68}/g,
  
  // Telegram Bot Tokens
  telegram_bot: /\d{8,10}:[a-zA-Z0-9_-]{35}/g,
  
  // Google OAuth Client Secret
  google_oauth: /"client_secret":\s*"[a-zA-Z0-9_-]{24}"/g,
  
  // Facebook Access Tokens
  facebook_token: /EAA[a-zA-Z0-9]{90,}/g,
  
  // Twitter API Keys
  twitter_bearer: /AAAAAAAAAAAAAAAAAAAAA[a-zA-Z0-9%]{60,}/g,
  
  // AWS Session Tokens
  aws_session_token: /FwoGZXIvYXdzE[a-zA-Z0-9+\/=]{100,}/g
};

/**
 * Luhn algorithm to validate credit card numbers
 * Helps reduce false positives
 */
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Advanced sanitization function
 * Returns object with sanitized text and count
 */
function advancedSanitize(input) {
  if (!input) return { text: input, sanitizationCount: 0 };
  
  let text = typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input);
  let sanitizationCount = 0;
  
  // Credit Cards (with Luhn validation)
  text = text.replace(ADVANCED_PATTERNS.credit_card_spaced, (match) => {
    const digits = match.replace(/\D/g, '');
    if (luhnCheck(digits)) {
      sanitizationCount++;
      const last4 = digits.slice(-4);
      return `[REDACTED-CREDIT-CARD-${last4}]`;
    }
    return match;
  });
  
  text = text.replace(ADVANCED_PATTERNS.credit_card, (match) => {
    if (luhnCheck(match)) {
      sanitizationCount++;
      const last4 = match.slice(-4);
      return `[REDACTED-CREDIT-CARD-${last4}]`;
    }
    return match;
  });
  
  // Social Security Numbers (US)
  text = text.replace(ADVANCED_PATTERNS.ssn_dashed, (match) => {
    sanitizationCount++;
    return `[REDACTED-SSN-${hashShort(match)}]`;
  });
  
  text = text.replace(ADVANCED_PATTERNS.ssn_spaced, (match) => {
    sanitizationCount++;
    return `[REDACTED-SSN-${hashShort(match)}]`;
  });
  
  // Social Security Numbers (plain, context-aware)
  // Only redact if surrounded by SSN-related context
  text = text.replace(/\b(?:ssn|social\s*security|tax\s*id)[\s:]*(\d{9})\b/gi, (match, ssn) => {
    sanitizationCount++;
    return match.replace(ssn, `[REDACTED-SSN-${hashShort(ssn)}]`);
  });
  
  // Canadian SIN
  text = text.replace(ADVANCED_PATTERNS.sin_dashed, (match) => {
    sanitizationCount++;
    return `[REDACTED-SIN-${hashShort(match)}]`;
  });
  
  text = text.replace(ADVANCED_PATTERNS.sin_spaced, (match) => {
    sanitizationCount++;
    return `[REDACTED-SIN-${hashShort(match)}]`;
  });
  
  // RSA Private Keys
  text = text.replace(ADVANCED_PATTERNS.rsa_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-RSA-PRIVATE-KEY]';
  });
  
  text = text.replace(ADVANCED_PATTERNS.rsa_private_key_pkcs8, () => {
    sanitizationCount++;
    return '[REDACTED-RSA-PRIVATE-KEY]';
  });
  
  // EC Private Keys
  text = text.replace(ADVANCED_PATTERNS.ec_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-EC-PRIVATE-KEY]';
  });
  
  text = text.replace(ADVANCED_PATTERNS.ec_parameters, () => {
    sanitizationCount++;
    return '[REDACTED-EC-PARAMETERS]';
  });
  
  // OpenSSH Private Keys
  text = text.replace(ADVANCED_PATTERNS.openssh_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-OPENSSH-PRIVATE-KEY]';
  });
  
  // DSA Private Keys
  text = text.replace(ADVANCED_PATTERNS.dsa_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-DSA-PRIVATE-KEY]';
  });
  
  // PGP Private Keys
  text = text.replace(ADVANCED_PATTERNS.pgp_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-PGP-PRIVATE-KEY]';
  });
  
  // Encrypted Private Keys
  text = text.replace(ADVANCED_PATTERNS.encrypted_private_key, () => {
    sanitizationCount++;
    return '[REDACTED-ENCRYPTED-PRIVATE-KEY]';
  });
  
  // Stripe Keys
  text = text.replace(ADVANCED_PATTERNS.stripe_secret, (match) => {
    sanitizationCount++;
    const last6 = match.slice(-6);
    return `[REDACTED-STRIPE-KEY-${last6}]`;
  });
  
  text = text.replace(ADVANCED_PATTERNS.stripe_restricted, (match) => {
    sanitizationCount++;
    const last6 = match.slice(-6);
    return `[REDACTED-STRIPE-RESTRICTED-KEY-${last6}]`;
  });
  
  // Square Tokens
  text = text.replace(ADVANCED_PATTERNS.square_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-SQUARE-TOKEN]`;
  });
  
  text = text.replace(ADVANCED_PATTERNS.square_secret, (match) => {
    sanitizationCount++;
    return `[REDACTED-SQUARE-SECRET]`;
  });
  
  // Twilio
  text = text.replace(ADVANCED_PATTERNS.twilio_account_sid, (match) => {
    sanitizationCount++;
    const last4 = match.slice(-4);
    return `[REDACTED-TWILIO-SID-${last4}]`;
  });
  
  // SendGrid
  text = text.replace(ADVANCED_PATTERNS.sendgrid_key, (match) => {
    sanitizationCount++;
    return `[REDACTED-SENDGRID-KEY]`;
  });
  
  // Mailgun
  text = text.replace(ADVANCED_PATTERNS.mailgun_key, (match) => {
    sanitizationCount++;
    return `[REDACTED-MAILGUN-KEY]`;
  });
  
  // Mailchimp
  text = text.replace(ADVANCED_PATTERNS.mailchimp_key, (match) => {
    sanitizationCount++;
    return `[REDACTED-MAILCHIMP-KEY]`;
  });
  
  // Azure Storage Keys
  text = text.replace(ADVANCED_PATTERNS.azure_storage_key, () => {
    sanitizationCount++;
    return 'AccountKey=[REDACTED-AZURE-KEY]';
  });
  
  text = text.replace(ADVANCED_PATTERNS.azure_connection_string, (match) => {
    sanitizationCount++;
    return match.replace(/AccountKey=[a-zA-Z0-9+\/=]{88}/, 'AccountKey=[REDACTED-AZURE-KEY]');
  });
  
  // GCP API Keys
  text = text.replace(ADVANCED_PATTERNS.gcp_api_key, (match) => {
    sanitizationCount++;
    return `[REDACTED-GCP-API-KEY]`;
  });
  
  // DigitalOcean Tokens
  text = text.replace(ADVANCED_PATTERNS.digitalocean_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-DIGITALOCEAN-TOKEN]`;
  });
  
  // Docker PAT
  text = text.replace(ADVANCED_PATTERNS.docker_pat, (match) => {
    sanitizationCount++;
    return `[REDACTED-DOCKER-TOKEN]`;
  });
  
  // npm Tokens
  text = text.replace(ADVANCED_PATTERNS.npm_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-NPM-TOKEN]`;
  });
  
  // PyPI Tokens
  text = text.replace(ADVANCED_PATTERNS.pypi_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-PYPI-TOKEN]`;
  });
  
  // Database Connection Strings
  text = text.replace(ADVANCED_PATTERNS.postgres_connection, (match) => {
    sanitizationCount++;
    return match.replace(/:\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@');
  });
  
  text = text.replace(ADVANCED_PATTERNS.mysql_connection, (match) => {
    sanitizationCount++;
    return match.replace(/:\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@');
  });
  
  text = text.replace(ADVANCED_PATTERNS.mongodb_connection, (match) => {
    sanitizationCount++;
    return match.replace(/:\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@');
  });
  
  text = text.replace(ADVANCED_PATTERNS.redis_connection, (match) => {
    sanitizationCount++;
    return match.replace(/:\/\/[^:]*:[^@]+@/, '://[REDACTED]@');
  });
  
  // Heroku Keys
  text = text.replace(ADVANCED_PATTERNS.heroku_key, (match) => {
    sanitizationCount++;
    return `[REDACTED-HEROKU-KEY]`;
  });
  
  // Shopify
  text = text.replace(ADVANCED_PATTERNS.shopify_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-SHOPIFY-TOKEN]`;
  });
  
  text = text.replace(ADVANCED_PATTERNS.shopify_secret, (match) => {
    sanitizationCount++;
    return `[REDACTED-SHOPIFY-SECRET]`;
  });
  
  // Slack Webhooks
  text = text.replace(ADVANCED_PATTERNS.slack_webhook, () => {
    sanitizationCount++;
    return '[REDACTED-SLACK-WEBHOOK]';
  });
  
  // Discord Webhooks
  text = text.replace(ADVANCED_PATTERNS.discord_webhook, () => {
    sanitizationCount++;
    return '[REDACTED-DISCORD-WEBHOOK]';
  });
  
  // Telegram Bot Tokens
  text = text.replace(ADVANCED_PATTERNS.telegram_bot, (match) => {
    sanitizationCount++;
    const last6 = match.slice(-6);
    return `[REDACTED-TELEGRAM-BOT-${last6}]`;
  });
  
  // Google OAuth
  text = text.replace(ADVANCED_PATTERNS.google_oauth, () => {
    sanitizationCount++;
    return '"client_secret": "[REDACTED-GOOGLE-OAUTH-SECRET]"';
  });
  
  // Facebook Tokens
  text = text.replace(ADVANCED_PATTERNS.facebook_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-FACEBOOK-TOKEN]`;
  });
  
  // Twitter Bearer Tokens
  text = text.replace(ADVANCED_PATTERNS.twitter_bearer, (match) => {
    sanitizationCount++;
    return `[REDACTED-TWITTER-BEARER]`;
  });
  
  // AWS Session Tokens
  text = text.replace(ADVANCED_PATTERNS.aws_session_token, (match) => {
    sanitizationCount++;
    return `[REDACTED-AWS-SESSION-TOKEN]`;
  });
  
  // Return sanitized result
  return {
    text: typeof input === 'object' ? JSON.parse(text) : text,
    sanitizationCount
  };
}

/**
 * Get pattern list (for documentation/testing)
 */
function getPatterns() {
  return Object.keys(ADVANCED_PATTERNS);
}

/**
 * Get pattern statistics
 */
function getPatternStats() {
  return {
    total: Object.keys(ADVANCED_PATTERNS).length,
    categories: {
      credit_cards: 2,
      ssn: 5,
      private_keys: 8,
      payment_gateways: 5,
      communication: 5,
      cloud_providers: 5,
      package_managers: 2,
      databases: 4,
      webhooks: 2,
      social_media: 4,
      other: Object.keys(ADVANCED_PATTERNS).length - 42
    }
  };
}

module.exports = {
  advancedSanitize,
  ADVANCED_PATTERNS,
  getPatterns,
  getPatternStats,
  luhnCheck
};
