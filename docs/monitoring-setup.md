# ClawSec Production Monitoring Guide

**Last Updated:** 2026-02-06  
**Status:** Production Ready  
**Environment:** Railway (clawsec-skill-production.up.railway.app)

## Table of Contents

1. [Overview](#overview)
2. [Health Check Endpoint](#health-check-endpoint)
3. [Railway Metrics Dashboard](#railway-metrics-dashboard)
4. [Error Tracking with Sentry](#error-tracking-with-sentry)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Log Aggregation](#log-aggregation)
7. [Performance Monitoring](#performance-monitoring)
8. [Alert Configuration](#alert-configuration)
9. [Maintenance Procedures](#maintenance-procedures)

---

## Overview

ClawSec production monitoring consists of multiple layers:

- **Health Checks** - `/health` endpoint for system status
- **Railway Dashboard** - Built-in metrics (CPU, memory, network, disk)
- **Sentry** - Error tracking and performance monitoring
- **Uptime Monitoring** - External service availability checks
- **Enhanced Logging** - Structured JSON logs with request tracing
- **Performance Metrics** - Response time tracking and throughput analysis

**Monitoring Stack:**
- Railway Observability Dashboard (metrics, logs, alerts)
- Sentry (error tracking, performance monitoring)
- Better Uptime or UptimeRobot (external uptime checks)
- Custom performance middleware (response times, request counts)

---

## Health Check Endpoint

### Endpoint Details

**URL:** `https://clawsec-skill-production.up.railway.app/health`  
**Method:** GET  
**Response Time:** < 100ms  
**Uptime Target:** 99.9%

### Response Format

```json
{
  "status": "healthy",
  "service": "ClawSec",
  "version": "0.1.0-hackathon",
  "uptime": 86400.5,
  "timestamp": "2026-02-06T22:00:00.000Z",
  "system": {
    "memory": {
      "used": 45.3,
      "total": 512,
      "percentage": 8.85
    },
    "cpu": {
      "usage": 12.5,
      "load": [0.5, 0.3, 0.2]
    },
    "process": {
      "pid": 1234,
      "nodeVersion": "v22.22.0"
    }
  },
  "dependencies": {
    "database": "ok",
    "filesystem": "ok",
    "anthropic": "ok"
  }
}
```

### Health Check Monitoring

**Recommended Monitoring Frequency:**
- External uptime check: Every 1 minute
- Internal health log: Every 5 minutes
- Alert on 3 consecutive failures

**Health Status Codes:**
- `200` - Healthy (all systems operational)
- `503` - Degraded (some dependencies unavailable)
- `500` - Unhealthy (critical system failure)

---

## Railway Metrics Dashboard

### Setup Instructions

**Step 1: Access Dashboard**
1. Log into Railway: https://railway.com
2. Navigate to ClawSec project
3. Select **Production** environment
4. Click **Observability** tab in top navigation

**Step 2: Create Initial Dashboard**
1. Click "Start with a simple dashboard"
2. Railway auto-generates widgets for:
   - Project spend tracking
   - Service metrics (CPU, memory, network, disk)
   - Log aggregation

**Step 3: Add Custom Widgets**

Click "New" → Select data source → Configure:

#### Widget 1: CPU Usage
- **Data Source:** CPU Usage
- **Filter:** `@service:clawsec-server`
- **Type:** Graph (line chart)
- **Alert Threshold:** 80% for 5 minutes

#### Widget 2: Memory Usage
- **Data Source:** Memory Usage
- **Filter:** `@service:clawsec-server`
- **Type:** Graph (area chart)
- **Alert Threshold:** 450MB of 512MB

#### Widget 3: Response Time Logs
- **Data Source:** Logs
- **Filter:** `"response_time" @service:clawsec-server`
- **Type:** Log stream
- **Display:** Last 50 entries

#### Widget 4: Error Logs
- **Data Source:** Logs
- **Filter:** `ERROR OR "statusCode:5" @service:clawsec-server`
- **Type:** Log stream
- **Alert:** Notify on any match

#### Widget 5: Network Egress
- **Data Source:** Network Out
- **Filter:** `@service:clawsec-server`
- **Type:** Graph (line chart)
- **Purpose:** Track API response bandwidth

#### Widget 6: Scan Request Count
- **Data Source:** Logs
- **Filter:** `"POST /api/v1/scan" @service:clawsec-server`
- **Type:** Count widget
- **Purpose:** Track daily scan volume

### Railway Filtering Syntax

```
# Filter by exact text
"POST /api/v1/scan"

# Filter by key/value
@service:clawsec-server
@deployment:production
@replica:0

# Boolean operators
@service:clawsec-server AND "ERROR"
"POST /api/v1/scan" OR "GET /health"
@service:clawsec-server - "GET /health"  # Exclude health checks
```

### Available Metrics

| Metric | Description | Normal Range | Alert Threshold |
|--------|-------------|--------------|-----------------|
| CPU Usage | % of allocated CPU | 5-30% | > 80% for 5 min |
| Memory Usage | MB of RAM used | 50-200 MB | > 450 MB |
| Network In | Inbound traffic | Varies | - |
| Network Out | Outbound traffic | Varies | > 10 GB/day |
| Disk Usage | Storage consumption | < 100 MB | > 900 MB |
| Request Count | Requests per minute | 1-100 | - |
| Error Rate | Errors per minute | 0-1 | > 5 |

---

## Error Tracking with Sentry

### Setup Instructions

**Step 1: Create Sentry Account**
1. Sign up at https://sentry.io (free tier: 5K errors/month)
2. Create new project: **ClawSec Production**
3. Platform: **Node.js + Express**
4. Copy DSN (looks like: `https://[key]@sentry.io/[project-id]`)

**Step 2: Install Sentry SDK**

```bash
cd /root/.openclaw/workspace/clawsec
npm install --save @sentry/node @sentry/profiling-node
```

**Step 3: Add DSN to Environment Variables**

In Railway dashboard:
1. Go to ClawSec service → **Variables** tab
2. Add new variable:
   - **Key:** `SENTRY_DSN`
   - **Value:** `https://[your-key]@sentry.io/[project-id]`
3. Redeploy service

**Step 4: Configure Sentry (Already Implemented)**

Sentry is integrated in `server/index.js` with:
- Error capturing (unhandled exceptions, rejections)
- Request tracing (track slow API calls)
- Performance monitoring (transaction tracking)
- Release tracking (git commits)

### Sentry Features Enabled

✅ **Error Tracking**
- Automatic exception capture
- Stack traces with source maps
- Breadcrumb trail (user actions before error)
- Error grouping by root cause

✅ **Performance Monitoring**
- API endpoint response times
- Database query performance
- External API call tracking (Anthropic)
- Transaction sampling (10% of requests)

✅ **Release Tracking**
- Tag errors with git commit SHA
- Track error rate by deployment
- Compare error rates across versions

✅ **Alert Rules**
- Email on new error types
- Slack notification on critical errors
- Daily error digest

### Sentry Dashboard Access

**URL:** https://sentry.io/organizations/[org]/projects/clawsec/  
**Key Metrics:**
- Error rate (errors per minute)
- Crash-free sessions
- Affected users
- Most common errors

**Recommended Alerts:**
1. **Critical Error Alert** - Any 5xx error → Immediate email/Slack
2. **Error Spike Alert** - 10+ errors in 5 minutes → Email
3. **Performance Degradation** - P95 response time > 10s → Email

---

## Uptime Monitoring

### Recommended Services

**Option 1: Better Uptime (Recommended)**
- **Free Tier:** 10 monitors, 30-second checks
- **URL:** https://betteruptime.com
- **Features:** Status page, incident management, on-call scheduling

**Option 2: UptimeRobot**
- **Free Tier:** 50 monitors, 5-minute checks
- **URL:** https://uptimerobot.com
- **Features:** Multi-location checks, public status page

### Setup Instructions (Better Uptime)

**Step 1: Create Account**
1. Sign up at https://betteruptime.com
2. Verify email and create team

**Step 2: Add Monitor**
1. Click "Create monitor"
2. **Monitor Type:** HTTP(S)
3. **URL:** `https://clawsec-skill-production.up.railway.app/health`
4. **Check Frequency:** Every 1 minute
5. **Expected Status Code:** 200
6. **Response Contains:** `"status":"healthy"`
7. **Timeout:** 10 seconds
8. **Monitor Name:** ClawSec Production Health

**Step 3: Configure Alerts**
1. **On-Call Schedule:**
   - Add your email/phone
   - Set alert escalation (1 min → 5 min → 15 min)

2. **Alert Channels:**
   - Email: Immediate notification
   - Slack: (Optional) Create webhook integration
   - SMS: (Optional) Add phone number for critical alerts

3. **Alert Conditions:**
   - Down for: 3 minutes (3 failed checks)
   - Slow response: > 5 seconds
   - SSL certificate expires: 7 days before

**Step 4: Create Status Page**
1. Enable public status page: `clawsec.betteruptime.com`
2. Add ClawSec service components:
   - API Server
   - LLM Analysis
   - Threat Database
3. Share status page URL in README

### Uptime Targets

| Metric | Target | Current |
|--------|--------|---------|
| Monthly Uptime | 99.9% | TBD |
| Max Downtime | 43 minutes/month | TBD |
| Response Time (P95) | < 2 seconds | TBD |
| Response Time (P99) | < 5 seconds | TBD |

### Incident Response

**When Uptime Monitor Alerts Fire:**

1. **Check Health Endpoint** (manual curl test)
   ```bash
   curl -i https://clawsec-skill-production.up.railway.app/health
   ```

2. **Check Railway Dashboard** (service status, logs, metrics)
   - Is service running?
   - Are there recent errors in logs?
   - Is CPU/memory spiked?

3. **Check Sentry** (recent errors, performance issues)
   - Any unhandled exceptions?
   - Database connection issues?
   - External API timeouts?

4. **Restart Service** (if needed via Railway dashboard)
   ```
   Railway → ClawSec Service → Settings → Restart
   ```

5. **Post-Incident Review**
   - Document root cause in `docs/incidents/YYYY-MM-DD-summary.md`
   - Update monitoring thresholds if needed
   - Create preventive measures

---

## Log Aggregation

### Structured Logging Format

ClawSec uses structured JSON logging for all requests:

```json
{
  "timestamp": "2026-02-06T22:00:00.000Z",
  "level": "info",
  "message": "POST /api/v1/scan",
  "request_id": "req-abc123",
  "method": "POST",
  "path": "/api/v1/scan",
  "status_code": 200,
  "response_time_ms": 1234,
  "client_ip": "203.0.113.42",
  "user_agent": "ClawSec-Client/0.1.0",
  "scan_id": "clawsec-1234567890-abc123",
  "findings_count": 5,
  "risk_level": "HIGH"
}
```

### Log Levels

| Level | Purpose | Railway Filter |
|-------|---------|----------------|
| `error` | Unhandled exceptions, critical failures | `@level:error` |
| `warn` | Degraded performance, rate limits | `@level:warn` |
| `info` | Request logs, scan results | `@level:info` |
| `debug` | Detailed tracing (dev only) | `@level:debug` |

### Railway Log Queries

**View All Errors (Last 24h):**
```
@service:clawsec-server AND @level:error
```

**View Slow Requests (> 5s):**
```
@service:clawsec-server AND "response_time_ms" AND response_time_ms>5000
```

**View Scan Requests:**
```
@service:clawsec-server AND "POST /api/v1/scan"
```

**View 5xx Errors:**
```
@service:clawsec-server AND "status_code:5"
```

### Log Retention

- **Railway:** 30 days of logs (included in all plans)
- **Sentry:** 30 days of error events (free tier)
- **Local Archive:** (Optional) Export logs weekly for compliance

### Log Export (Optional)

Export logs from Railway dashboard for long-term storage:

```bash
# Via Railway CLI
railway logs --environment production --service clawsec-server > logs-$(date +%Y-%m-%d).txt
```

Store in `/root/.openclaw/workspace/clawsec/logs/archive/` or external bucket.

---

## Performance Monitoring

### Enhanced Metrics (Implemented)

ClawSec tracks detailed performance metrics:

```javascript
{
  "request": {
    "id": "req-abc123",
    "method": "POST",
    "path": "/api/v1/scan",
    "timestamp": "2026-02-06T22:00:00.000Z"
  },
  "response": {
    "status_code": 200,
    "response_time_ms": 1234,
    "body_size_bytes": 4567
  },
  "business": {
    "scan_id": "clawsec-1234567890-abc123",
    "findings_count": 5,
    "risk_level": "HIGH",
    "scan_type": "config"
  },
  "performance": {
    "llm_latency_ms": 890,
    "context_build_ms": 45,
    "report_gen_ms": 299
  }
}
```

### Performance Targets

| Endpoint | P50 | P95 | P99 | Timeout |
|----------|-----|-----|-----|---------|
| GET /health | 50ms | 100ms | 200ms | 5s |
| POST /api/v1/scan | 2s | 8s | 15s | 60s |
| GET /api/v1/threats | 100ms | 300ms | 500ms | 5s |

### Slow Request Analysis

**Identify Slow Scans in Railway:**
```
@service:clawsec-server AND "response_time_ms" AND response_time_ms>10000
```

**Common Causes:**
1. Large scan payloads (> 100KB config)
2. LLM API latency (Anthropic timeout)
3. Memory pressure (GC pauses)
4. Network issues (Railway → Anthropic)

**Optimization Strategies:**
- Enable response caching for similar scans
- Reduce LLM context window (token optimization)
- Implement request queuing for burst traffic
- Add CDN for static assets

### Request Rate Tracking

Track requests per minute via Railway logs:

```
# Count requests in last hour
@service:clawsec-server AND "POST /api/v1/scan" AND timestamp>now-1h
```

**Rate Limiting (TODO):**
- Implement rate limiting: 100 requests/minute per IP
- Return `429 Too Many Requests` with `Retry-After` header
- Track rate limit violations in Sentry

---

## Alert Configuration

### Railway Monitors (Built-In)

Configure in **Observability Dashboard → Widget Menu → Add Monitor:**

#### Alert 1: High CPU Usage
- **Metric:** CPU Usage
- **Condition:** Above 80%
- **Duration:** 5 minutes
- **Action:** Email + In-app notification

#### Alert 2: Memory Pressure
- **Metric:** Memory Usage
- **Condition:** Above 450 MB
- **Duration:** 5 minutes
- **Action:** Email + In-app notification

#### Alert 3: Error Rate Spike
- **Metric:** Log count (filter: `@level:error`)
- **Condition:** Above 10 errors
- **Duration:** 5 minutes
- **Action:** Email + Webhook

#### Alert 4: Service Down
- **Metric:** Health check failures
- **Condition:** 3 consecutive failures
- **Duration:** 3 minutes
- **Action:** Email + SMS (via Better Uptime)

### Sentry Alerts

Configure in **Sentry → Alerts → Create Alert Rule:**

#### Alert 1: New Error Type
- **Condition:** First seen error
- **Action:** Email immediately
- **Assignee:** @ubik

#### Alert 2: High Error Volume
- **Condition:** 10+ errors in 5 minutes
- **Action:** Email + Slack
- **Filter:** Any error

#### Alert 3: Performance Degradation
- **Condition:** P95 response time > 10s
- **Action:** Email
- **Frequency:** Once per hour

### Alert Escalation Matrix

| Severity | Response Time | Notification | Action |
|----------|---------------|--------------|--------|
| **Critical** | 5 minutes | Email + SMS | Immediate investigation |
| **High** | 15 minutes | Email | Investigation within 1 hour |
| **Medium** | 1 hour | Email | Investigation next business day |
| **Low** | 24 hours | Email digest | Track and monitor |

**Critical Conditions:**
- Service down (health check fails)
- Error rate > 50%
- Database connection lost
- Memory usage > 95%

**High Conditions:**
- Error rate > 10%
- Response time P95 > 10s
- CPU usage > 90%
- Uptime < 99% (weekly)

---

## Maintenance Procedures

### Daily Checks (Automated)

Run at 9:00 AM UTC via Railway cron or GitHub Actions:

```bash
#!/bin/bash
# daily-health-check.sh

# Test health endpoint
HEALTH_STATUS=$(curl -s https://clawsec-skill-production.up.railway.app/health | jq -r '.status')

if [ "$HEALTH_STATUS" != "healthy" ]; then
  echo "❌ Health check failed: $HEALTH_STATUS"
  # Send alert via webhook
else
  echo "✅ ClawSec is healthy"
fi

# Check error rate in Sentry (via API)
# Check uptime percentage in Better Uptime (via API)
```

### Weekly Tasks

1. **Review Sentry Dashboard** (15 min)
   - Check error trends
   - Review new error types
   - Update error fingerprints

2. **Review Railway Metrics** (15 min)
   - Check CPU/memory trends
   - Review slow request logs
   - Verify alert configurations

3. **Export Logs** (5 min)
   - Download weekly logs from Railway
   - Archive to local storage
   - Check log retention policy

4. **Test Uptime Monitor** (5 min)
   - Manually trigger downtime alert (pause service)
   - Verify alert delivery (email, Slack, SMS)
   - Re-enable service

### Monthly Tasks

1. **Review Uptime SLA** (30 min)
   - Calculate actual uptime percentage
   - Document downtime incidents
   - Create post-mortem reports

2. **Update Alert Thresholds** (30 min)
   - Adjust based on baseline metrics
   - Reduce false positive alerts
   - Test alert notifications

3. **Performance Audit** (1 hour)
   - Analyze P95/P99 response times
   - Identify optimization opportunities
   - Review token optimization stats

4. **Security Review** (1 hour)
   - Check for leaked credentials in logs
   - Review error messages for info disclosure
   - Update threat database patterns

### Incident Response Runbook

**Step 1: Acknowledge**
- Receive alert (email, SMS, Slack)
- Check incident details (service, time, severity)
- Acknowledge in monitoring dashboard

**Step 2: Assess**
- Check health endpoint: `curl https://clawsec-skill-production.up.railway.app/health`
- Check Railway dashboard (CPU, memory, logs)
- Check Sentry (recent errors)
- Estimate impact (users affected, duration)

**Step 3: Mitigate**
- Restart service (if unresponsive): Railway → Settings → Restart
- Rollback deployment (if recent): Railway → Deployments → Rollback
- Scale resources (if needed): Railway → Settings → Resources
- Disable problematic feature (feature flag)

**Step 4: Resolve**
- Verify service health restored
- Monitor for 15 minutes (watch for recurrence)
- Update status page (Better Uptime)
- Close incident

**Step 5: Document**
- Create incident report: `docs/incidents/YYYY-MM-DD-[issue].md`
- Include timeline, root cause, resolution
- Document preventive measures
- Update runbook if needed

---

## Quick Reference

### Key URLs

- **Production API:** https://clawsec-skill-production.up.railway.app
- **Health Check:** https://clawsec-skill-production.up.railway.app/health
- **Railway Dashboard:** https://railway.com/project/[project-id]
- **Sentry Dashboard:** https://sentry.io/organizations/[org]/projects/clawsec/
- **Uptime Status:** https://clawsec.betteruptime.com

### Emergency Contacts

- **Primary:** @ubik (Telegram: @ubikh)
- **Secondary:** @stanhaupt1 (Telegram)
- **Railway Support:** https://railway.com/help

### Common Commands

```bash
# Test health endpoint
curl https://clawsec-skill-production.up.railway.app/health | jq

# Test scan endpoint
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"gateway":{"token":"test123"}}'

# Railway CLI
railway login
railway link [project-id]
railway logs --environment production
railway status

# View Sentry errors
sentry-cli issues list --project clawsec
```

---

## Next Steps

- [ ] Create Sentry account and add DSN to Railway
- [ ] Set up Better Uptime monitor for `/health` endpoint
- [ ] Configure Railway Observability Dashboard widgets
- [ ] Set up alert notification channels (email, Slack)
- [ ] Test all alert rules (trigger intentional failures)
- [ ] Document first week's performance baseline
- [ ] Schedule weekly review calendar reminders

**Priority:** HIGH - Complete before demo/launch  
**Estimated Time:** 2-3 hours total setup

---

*Last updated: 2026-02-06 by Ubik (@ClawSecAI)*  
*For support: https://github.com/ClawSecAI/ClawSec-skill/issues*
