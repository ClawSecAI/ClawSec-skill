# Gateway Security Threats

OpenClaw gateway-specific security threats beyond core issues.

## T006 - No Rate Limiting

**Severity**: MEDIUM  
**Category**: gateway  
**Tags**: rate-limiting, dos, abuse

**Description**: Gateway has no rate limiting configured, allowing unlimited authentication attempts or API requests.

**Detection Criteria**:
- No `rate_limit` configuration in gateway settings
- No external rate limiter (nginx, cloudflare) configured

**Impact**: Enables brute force attacks, API abuse, resource exhaustion, denial of service.

**Mitigation**:
```yaml
# config.yaml:
gateway:
  rate_limit:
    enabled: true
    max_requests: 100
    window_ms: 60000  # 1 minute
    
# Or use external rate limiter (nginx):
# limit_req_zone $binary_remote_addr zone=gateway:10m rate=10r/s;
```

---

## T007 - Insecure CORS Configuration

**Severity**: MEDIUM  
**Category**: gateway  
**Tags**: cors, cross-origin, browser

**Description**: CORS configured to allow all origins (*) or untrusted domains.

**Detection Criteria**:
- `cors.origin` set to "*"
- Multiple untrusted domains in allowed origins

**Impact**: Allows malicious websites to make requests to gateway, potential CSRF attacks.

**Mitigation**:
```yaml
gateway:
  cors:
    origin: "https://trusted-domain.com"
    credentials: true
```

---

## T008 - Default Port Usage

**Severity**: LOW  
**Category**: gateway  
**Tags**: port, scanning, reconnaissance

**Description**: Using default OpenClaw port (2024) makes system easy to discover via port scanning.

**Detection Criteria**:
- Gateway port is 2024 (OpenClaw default)

**Impact**: Easier for attackers to identify OpenClaw installations during reconnaissance.

**Mitigation**:
```yaml
gateway:
  port: 8443  # Use non-standard port
```

---

## T009 - Missing Request Size Limits

**Severity**: MEDIUM  
**Category**: gateway  
**Tags**: dos, resource-exhaustion

**Description**: No limits on request body size, allowing large payload attacks.

**Detection Criteria**:
- No `max_request_size` or similar limit configured

**Impact**: Attacker can send huge payloads to exhaust memory/disk.

**Mitigation**:
```javascript
// Express example:
app.use(express.json({ limit: '10mb' }));
```

---

## T010 - No Request Timeout

**Severity**: LOW  
**Category**: gateway  
**Tags**: timeout, resource-exhaustion

**Description**: Requests have no timeout configured, allowing slow-loris style attacks.

**Detection Criteria**:
- No request timeout in gateway config
- No reverse proxy with timeout

**Impact**: Attacker can hold connections open indefinitely.

**Mitigation**:
```yaml
gateway:
  timeout_ms: 30000  # 30 seconds
```
