# ClawSec API Reference

**Base URL**: `https://clawsec-skill-production.up.railway.app`

**Version**: 0.1.0-hackathon

**Protocol**: HTTPS only

---

## Authentication

Currently no authentication required (demo mode).

Future versions will support:
- API key authentication
- X402 payment verification
- Rate limiting per API key

---

## Endpoints

### GET /health

Health check endpoint.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "ClawSec",
  "version": "0.1.0-hackathon",
  "uptime": 123456,
  "timestamp": "2026-02-06T18:30:00.000Z"
}
```

**Example**:
```bash
curl https://clawsec-skill-production.up.railway.app/health
```

---

### GET /api/v1

API information and available endpoints.

**Response** (200 OK):
```json
{
  "name": "ClawSec API",
  "version": "0.1.0-hackathon",
  "description": "AI-powered security audits for OpenClaw",
  "endpoints": {
    "health": "GET /health",
    "scan": "POST /api/v1/scan",
    "threats": "GET /api/v1/threats"
  },
  "payment": {
    "enabled": false,
    "protocol": "X402",
    "network": "base-sepolia"
  },
  "docs": "https://github.com/ClawSecAI/ClawSec-skill"
}
```

**Example**:
```bash
curl https://clawsec-skill-production.up.railway.app/api/v1
```

---

### GET /api/v1/threats

Retrieve threat intelligence database index.

**Response** (200 OK):
```json
{
  "version": "1.0",
  "total_threats": 349,
  "categories": [
    "authentication",
    "channels",
    "tools",
    "configuration",
    "skills"
  ],
  "last_updated": "2026-02-06T09:00:00.000Z"
}
```

**Example**:
```bash
curl https://clawsec-skill-production.up.railway.app/api/v1/threats
```

---

### POST /api/v1/scan

Submit OpenClaw configuration for security analysis.

**Request Headers**:
- `Content-Type: application/json`
- `X-PAYMENT: <payment-proof>` (optional, future feature)

**Request Body**:
```json
{
  "gateway": {
    "token": "your-gateway-token",
    "bind": "127.0.0.1",
    "port": 2024,
    "rate_limit": {
      "enabled": true,
      "max_requests": 100
    }
  },
  "channels": {
    "telegram": {
      "bot_token": "${TELEGRAM_BOT_TOKEN}",
      "allowed_chats": [123456789]
    }
  },
  "tools": {
    "exec": {
      "policy": "allowlist",
      "allowed_commands": ["ls", "cat"]
    }
  },
  "sessions": {
    "encryption": {
      "enabled": true
    }
  }
}
```

**Response** (200 OK):
```json
{
  "scan_id": "clawsec-1738869600000-abc123",
  "timestamp": "2026-02-06T18:40:00.000Z",
  "report": "# OpenClaw Security Audit Report\n\n...",
  "findings_count": 3,
  "risk_level": "MEDIUM"
}
```

**Risk Levels**:
- `CRITICAL`: 1+ critical findings
- `HIGH`: 3+ high severity findings
- `MEDIUM`: 1-2 high severity findings
- `LOW`: Only low/medium findings

**Error Responses**:

**400 Bad Request** - Invalid input:
```json
{
  "error": "Invalid scan input",
  "expected": "JSON object with OpenClaw configuration"
}
```

**402 Payment Required** - Payment needed (future):
```json
{
  "error": "Payment Required",
  "protocol": "X402",
  "price": "0.01 USDC",
  "network": "base-sepolia",
  "instructions": "Include X-PAYMENT header with signed payment payload"
}
```

**429 Too Many Requests** - Rate limit exceeded (future):
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60,
  "limit": 10,
  "window": "minute"
}
```

**500 Internal Server Error** - Server processing error:
```json
{
  "error": "Scan failed",
  "message": "Internal processing error"
}
```

**Example**:
```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": {
      "token": "test-token-123",
      "bind": "0.0.0.0"
    }
  }'
```

---

## Report Format

Security audit reports are returned as Markdown with the following structure:

### Sections

1. **Header**
   - Generated timestamp
   - Scan ID
   - ClawSec version

2. **Executive Summary**
   - Total findings count
   - Overall risk level
   - Key findings (top 3)
   - Immediate actions required

3. **Risk Breakdown**
   - Table showing severity distribution
   - Count and percentage for each level

4. **Detailed Findings**
   - Threat ID (e.g., T001)
   - Severity (CRITICAL/HIGH/MEDIUM/LOW)
   - Title and description
   - Impact and likelihood
   - Evidence (JSON)
   - Remediation steps (immediate/short-term/long-term)

5. **Next Steps**
   - Immediate actions (today)
   - Short-term actions (this week)
   - Long-term recommendations

### Severity Levels

- **🔴 CRITICAL**: Immediate exploitation possible, system compromise likely
- **🟠 HIGH**: Significant security risk, exploitation probable
- **🟡 MEDIUM**: Moderate risk, exploitation possible under certain conditions
- **🟢 LOW**: Minor security concern, best practice recommendation

### Sample Report

```markdown
# OpenClaw Security Audit Report

**Generated**: 2026-02-06T18:40:00.000Z
**Scan ID**: clawsec-1738869600000-abc123
**ClawSec Version**: 0.1.0-hackathon

---

## Executive Summary

This security audit analyzed your OpenClaw configuration and identified **3 security issues**.

**Overall Risk Level**: 🟠 **HIGH**

### Key Findings
- **Weak or Default Gateway Token** (CRITICAL)
- **Public Gateway Exposure** (HIGH)
- **Unencrypted Session Storage** (MEDIUM)

### Immediate Actions Required
1. Fix **Weak or Default Gateway Token**
2. Fix **Public Gateway Exposure**

---

## Risk Breakdown

| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 Critical | 1 | 33% |
| 🟠 High     | 1 | 33% |
| 🟡 Medium   | 1 | 33% |
| 🟢 Low      | 0 | 0% |
| **Total**   | **3** | **100%** |

---

## Detailed Findings

### 🔴 CRITICAL - Weak or Default Gateway Token

**Threat ID**: T001
**Description**: Gateway token is weak or matches common patterns
**Impact**: Complete system compromise possible
**Likelihood**: HIGH

**Evidence**:
\`\`\`json
{
  "token_length": 14,
  "token_pattern": "weak"
}
\`\`\`

**Remediation Steps**:

**Immediate**:
- [ ] Generate strong token: openssl rand -hex 32
- [ ] Update gateway.token in config
- [ ] Restart gateway

**Short term**:
- [ ] Implement token rotation policy

**Long term**:
- [ ] Add monitoring for failed auth attempts

---

[Additional findings...]
```

---

## Rate Limits

**Current**: No rate limiting (demo mode)

**Future limits**:
- Free tier: 10 scans/hour
- Paid tier: 100 scans/hour
- Enterprise: Custom limits

---

## Timeouts

**Recommended client timeouts**:
- Connection: 30 seconds
- Request: 60 seconds (scans can take 10-30 seconds)

**Server-side timeouts**:
- Request processing: 120 seconds
- LLM analysis: 60 seconds

---

## Error Handling

### Retry Strategy

Recommended retry logic for network errors:

```javascript
async function scanWithRetry(config, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await scan(config);
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retry ${attempt}/${maxAttempts} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Retriable Errors

- Network timeouts (`ETIMEDOUT`, `ECONNRESET`)
- Connection refused (`ECONNREFUSED`)
- DNS errors (`ENOTFOUND`)
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

### Non-Retriable Errors

- 400 Bad Request (fix input first)
- 401 Unauthorized (check credentials)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (wrong endpoint)
- 429 Too Many Requests (wait for rate limit reset)

---

## Best Practices

### Client Implementation

1. **Always use HTTPS** - Never downgrade to HTTP
2. **Set reasonable timeouts** - 30s connection, 60s request
3. **Implement retry logic** - Exponential backoff, max 3 attempts
4. **Sanitize input** - Remove secrets before sending
5. **Handle errors gracefully** - Don't crash on network issues
6. **Log requests** - For debugging and auditing
7. **Cache results** - Don't re-scan unchanged configs

### Security

1. **Never log sensitive data** - Redact tokens in logs
2. **Validate server certificate** - Don't disable TLS verification
3. **Use environment variables** - For API keys and tokens
4. **Rotate credentials regularly** - Update tokens quarterly
5. **Monitor for anomalies** - Unusual response times or errors

---

## Support

- **Documentation**: [GitHub README](https://github.com/ClawSecAI/ClawSec-skill)
- **Issues**: [GitHub Issues](https://github.com/ClawSecAI/ClawSec-skill/issues)
- **Contact**: [@ClawSecAI on Moltbook](https://moltbook.com/u/ClawSecAI)

---

*Last Updated: 2026-02-06*
