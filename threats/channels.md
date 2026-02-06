# Channel Security Threats

Security threats related to messaging channel integrations (Telegram, Discord, WhatsApp, etc.).

## T011 - Telegram Bot Token in Configuration

**Severity**: HIGH  
**Category**: channels  
**Tags**: telegram, bot-token, credentials

**Description**: Telegram bot token stored in plaintext configuration file instead of environment variable.

**Detection Criteria**:
- Bot token pattern found in config: `\d{8,10}:[A-Za-z0-9_-]{35}`
- Token not using environment variable reference

**Impact**: If config is leaked (git commit, backup, etc.), attacker can impersonate bot, read messages, send spam.

**Mitigation**:
```bash
# .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...

# config.yaml
telegram:
  bot_token: ${TELEGRAM_BOT_TOKEN}
```

---

## T012 - No Telegram Chat ID Whitelist

**Severity**: MEDIUM  
**Category**: channels  
**Tags**: telegram, access-control

**Description**: Telegram bot accepts messages from any chat without whitelisting.

**Detection Criteria**:
- No `allowed_chats` or similar restriction
- Bot responds to any user

**Impact**: Anyone who finds the bot can send commands, potentially abuse resources or extract information.

**Mitigation**:
```yaml
telegram:
  allowed_chats:
    - 123456789  # Your chat ID
    - -987654321  # Your group ID
```

---

## T013 - Discord Webhook URL Exposure

**Severity**: MEDIUM  
**Category**: channels  
**Tags**: discord, webhook, exposure

**Description**: Discord webhook URL stored in configuration without protection.

**Detection Criteria**:
- Webhook URL pattern: `https://discord.com/api/webhooks/...`
- Not using environment variable

**Impact**: Anyone with webhook URL can send messages to your Discord channel.

**Mitigation**:
```bash
# .env
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

# config.yaml
discord:
  webhook_url: ${DISCORD_WEBHOOK}
```

---

## T014 - Message Logging Without Encryption

**Severity**: MEDIUM  
**Category**: channels  
**Tags**: privacy, logging, gdpr

**Description**: Channel messages logged to disk without encryption.

**Detection Criteria**:
- Logging enabled for channel messages
- No encryption specified for logs

**Impact**: Sensitive information from conversations exposed if logs are accessed.

**Mitigation**:
```yaml
channels:
  logging:
    enabled: true
    encrypt: true
    encrypt_key: ${LOG_ENCRYPTION_KEY}
```

---

## T015 - No Message Rate Limiting Per User

**Severity**: LOW  
**Category**: channels  
**Tags**: spam, abuse, rate-limiting

**Description**: No per-user rate limiting on channel messages.

**Detection Criteria**:
- No rate limit configuration for channel inputs
- Single user can flood unlimited messages

**Impact**: Spam, resource exhaustion, API quota abuse.

**Mitigation**:
```yaml
channels:
  rate_limit:
    per_user: 10  # messages
    window_sec: 60
```

---

## T016 - Webhook URL in Git History

**Severity**: HIGH  
**Category**: channels  
**Tags**: git, exposure, credentials

**Description**: Webhook URLs or bot tokens found in git commit history.

**Detection Criteria**:
- Scanning git history for credential patterns
- Secrets not in .gitignore from start

**Impact**: Even if removed from current config, historical commits expose credentials.

**Mitigation**:
```bash
# Remove from history (destructive!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config.yaml" \
  --prune-empty --tag-name-filter cat -- --all

# Better: Rotate all exposed credentials immediately
# Add .env to .gitignore from start
```

---

## T017 - Missing Signature Verification

**Severity**: HIGH  
**Category**: channels  
**Tags**: authentication, webhook, tampering

**Description**: Incoming webhook requests not verified for authenticity.

**Detection Criteria**:
- No signature verification for webhooks
- Accepts any POST request to webhook endpoint

**Impact**: Attacker can forge webhook requests, inject fake messages, bypass authentication.

**Mitigation**:
```javascript
// Telegram example
const crypto = require('crypto');

function verifyTelegramWebhook(req) {
  const secret = crypto.createHash('sha256')
    .update(BOT_TOKEN)
    .digest();
  
  const checkString = req.body.id + req.body.message.text;
  const hmac = crypto.createHmac('sha256', secret)
    .update(checkString)
    .digest('hex');
  
  return hmac === req.headers['x-telegram-bot-api-secret-token'];
}
```

---

## T018 - Channel Credentials in Logs

**Severity**: HIGH  
**Category**: channels  
**Tags**: logging, exposure, credentials

**Description**: Bot tokens or API keys appearing in application logs.

**Detection Criteria**:
- Logging full config objects
- No credential redaction in debug output

**Impact**: Log files, monitoring dashboards, or error tracking expose credentials.

**Mitigation**:
```javascript
// Redact before logging
function redactConfig(config) {
  const redacted = { ...config };
  if (redacted.telegram?.bot_token) {
    redacted.telegram.bot_token = '***REDACTED***';
  }
  if (redacted.discord?.webhook_url) {
    redacted.discord.webhook_url = '***REDACTED***';
  }
  return redacted;
}

console.log(redactConfig(config));
```
