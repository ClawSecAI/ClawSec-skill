# ClawSec Quick Start Guide

Get up and running with ClawSec in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- OpenClaw configuration file (JSON format)

## Installation

```bash
# Clone repository
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cd ClawSec-skill

# Install dependencies
npm install

# Copy environment example
cp .env.example .env
```

## Start Server

```bash
# Start ClawSec server
npm start

# Server runs on http://localhost:4021
```

You should see:
```
🔒 ClawSec Server v0.1.0-hackathon
🚀 Server running on http://localhost:4021
📊 Health check: http://localhost:4021/health
🔍 API info: http://localhost:4021/api/v1
💡 Payment: DISABLED (demo mode)
```

## Run Your First Scan

### Option 1: Using CLI

```bash
# Test with example configuration
./client/bin/clawsec scan examples/sample-scan.json

# Scan your own OpenClaw config
./client/bin/clawsec scan /path/to/your/config.json
```

Output:
```
🔍 Scanning configuration: examples/sample-scan.json

✅ Scan complete!

📊 Scan ID: clawsec-1770342037975-q8onc
🔍 Findings: 4
⚠️  Risk Level: CRITICAL

📝 Report saved to: clawsec-report-1770342037975.md
```

### Option 2: Using API

```bash
curl -X POST http://localhost:4021/api/v1/scan \
  -H "Content-Type: application/json" \
  -d @examples/sample-scan.json \
  | jq .
```

Response:
```json
{
  "scan_id": "clawsec-...",
  "timestamp": "2026-02-06T01:40:37Z",
  "report": "# OpenClaw Security Audit Report\n\n...",
  "findings_count": 4,
  "risk_level": "CRITICAL"
}
```

## Understanding the Report

The security report includes:

1. **Executive Summary**
   - Overall risk level (CRITICAL/HIGH/MEDIUM/LOW)
   - Top 3 key findings
   - Immediate actions required

2. **Risk Breakdown**
   - Severity distribution (Critical/High/Medium/Low)
   - Percentage of each severity level

3. **Detailed Findings**
   - Each vulnerability with:
     - Threat ID (e.g., T001)
     - Severity and description
     - Evidence from your configuration
     - Step-by-step remediation
     - Verification commands

4. **Next Steps**
   - Prioritized action items
   - Timeline (immediate/this week/this month)

## Example Configuration

Create a JSON file with your OpenClaw configuration:

```json
{
  "gateway": {
    "bind": "127.0.0.1",
    "port": 2024,
    "token": "<your-gateway-token>"
  },
  "sessions": {
    "encryption": {
      "enabled": true,
      "key": "<encryption-key>"
    }
  },
  "tools": {
    "exec": {
      "policy": "allowlist",
      "commands": ["ls", "cat"]
    }
  },
  "channels": {
    "telegram": {
      "bot_token": "<from-env>",
      "chat_id": "123456789"
    }
  }
}
```

**Note**: Use `"<from-env>"` for sensitive values that should be in environment variables.

## CLI Commands

```bash
# Scan configuration
./client/bin/clawsec scan config.json

# Check server health
./client/bin/clawsec health

# Show version
./client/bin/clawsec version

# Show help
./client/bin/clawsec help
```

## Environment Variables

Configure via `.env` file:

```bash
# Server port (default: 4021)
PORT=4021

# Enable X402 payment (default: false for demo)
ENABLE_PAYMENT=false

# Wallet address for payments
WALLET_ADDRESS=0x...

# Network (base-sepolia for testnet)
NETWORK=base-sepolia

# LLM API key (optional - uses mock analysis if empty)
ANTHROPIC_API_KEY=
```

## API Endpoints

- `GET /health` - Server health check
- `GET /api/v1` - API information
- `GET /api/v1/threats` - Threat database
- `POST /api/v1/scan` - Run security scan

## Testing

```bash
# Run integration tests
node tests/integration/server.test.js

# Expected output:
# ✅ Health check endpoint
# ✅ API info endpoint
# ✅ Threat database endpoint
# ✅ Security scan detects weak configuration
# ✅ Security scan passes secure configuration
# ✅ Returns 404 for unknown routes
```

## Common Issues

### Server won't start

Check if port 4021 is already in use:
```bash
lsof -i :4021
```

Change port in `.env`:
```bash
PORT=5000
```

### "Cannot connect to server" error

Ensure server is running:
```bash
./client/bin/clawsec health
```

If server is on different host:
```bash
CLAWSEC_SERVER=http://192.168.1.100:4021 ./client/bin/clawsec health
```

### Empty report or no findings

This is good! It means your configuration is secure. The report will show:
- Overall Risk Level: LOW
- No critical or high severity issues
- Best practices recommendations

## Next Steps

1. **Review your security report** - Address all CRITICAL and HIGH findings first
2. **Re-scan after changes** - Verify fixes worked
3. **Schedule regular scans** - Add to cron or CI/CD pipeline
4. **Read threat database** - `cat threats/core.md` for detailed threat descriptions

## Support

- GitHub Issues: https://github.com/ClawSecAI/ClawSec-skill/issues
- Documentation: https://github.com/ClawSecAI/ClawSec-skill/tree/main/docs
- OpenClaw Docs: https://docs.openclaw.ai/security

## Development

Want to contribute?

```bash
# Start in development mode (auto-reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

**Happy auditing! 🔒👁️**
