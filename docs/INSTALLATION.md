# ClawSec Installation Guide

Complete installation and deployment guide for ClawSec skill and server.

---

## 📦 Installation Locations

### Standard Directory Structure

```
/root/.openclaw/
├── workspace/
│   └── clawsec/                    # Main repository (this folder)
│       ├── client/                 # Client-side skill code
│       │   ├── bin/clawsec        # CLI executable
│       │   └── config.json        # Client configuration
│       ├── server/                 # Server-side API code
│       ├── security/               # Threat intelligence database
│       ├── docs/                   # Documentation
│       └── tests/                  # Test suites
│
└── skills/
    └── clawsec/
        └── SKILL.md                # OpenClaw skill manifest (symlink or copy)
```

### OpenClaw Skills Directory

**Location:** `/root/.openclaw/skills/clawsec/`

This directory is where OpenClaw discovers skills. You can either:
- **Option A (Recommended):** Create symlink to SKILL.md in main repo
- **Option B:** Copy SKILL.md manually (requires updates on changes)

**Setup commands:**

```bash
# Option A: Create symlink (stays in sync automatically)
mkdir -p /root/.openclaw/skills/clawsec
ln -sf /root/.openclaw/workspace/clawsec/SKILL.md /root/.openclaw/skills/clawsec/SKILL.md

# Option B: Copy file (manual updates needed)
mkdir -p /root/.openclaw/skills/clawsec
cp /root/.openclaw/workspace/clawsec/SKILL.md /root/.openclaw/skills/clawsec/SKILL.md
```

**Verification:**

```bash
# Check skill is discoverable
ls -la /root/.openclaw/skills/clawsec/SKILL.md

# Verify symlink (if using Option A)
readlink /root/.openclaw/skills/clawsec/SKILL.md
# Should output: /root/.openclaw/workspace/clawsec/SKILL.md
```

---

## 🚀 Installation Methods

### Method 1: NPM Global Installation (Recommended for CLI)

Install ClawSec CLI globally for system-wide access:

```bash
# Clone repository
cd /root/.openclaw/workspace
git clone https://github.com/ClawSecAI/ClawSec-skill.git clawsec
cd clawsec

# Install globally
npm install -g .

# Verify installation
clawsec version
clawsec help
```

**After global install, the `clawsec` command is available system-wide:**

```bash
clawsec scan /path/to/config.json
clawsec health
```

**Binary location:** `/usr/local/bin/clawsec` (or similar, depending on npm prefix)

### Method 2: Local Development Installation

For development or if you don't want global installation:

```bash
# Clone repository
cd /root/.openclaw/workspace
git clone https://github.com/ClawSecAI/ClawSec-skill.git clawsec
cd clawsec

# Install dependencies locally
npm install

# Run CLI from local directory
./client/bin/clawsec version
node client/bin/clawsec scan config.json
```

### Method 3: OpenClaw Skill Only (No CLI)

If you only need the skill for OpenClaw (no standalone CLI):

```bash
# Clone repository
cd /root/.openclaw/workspace
git clone https://github.com/ClawSecAI/ClawSec-skill.git clawsec

# Create skill directory
mkdir -p /root/.openclaw/skills/clawsec

# Copy or symlink SKILL.md
ln -sf /root/.openclaw/workspace/clawsec/SKILL.md /root/.openclaw/skills/clawsec/SKILL.md

# Restart OpenClaw Gateway to discover skill
openclaw gateway restart
```

---

## 🔧 Server Installation (Railway Deployment)

The ClawSec API server is deployed on Railway.app. For production use, no server installation is required - just use the hosted endpoint.

**Production Server:** `https://clawsec-skill-production.up.railway.app`

### Self-Hosting the Server (Optional)

If you want to run your own ClawSec server:

**Requirements:**
- Node.js 18+ (`node --version`)
- Anthropic API key (`ANTHROPIC_API_KEY`)
- (Optional) X402 payment credentials for USDC payments

**Setup:**

```bash
# Clone repository
cd /root/.openclaw/workspace/clawsec

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
# Set: ANTHROPIC_API_KEY, PORT, NETWORK, etc.

# Start server
npm start
# Or with auto-reload during development:
npm run dev
```

**Server will run at:** `http://localhost:4021` (or your configured PORT)

**Health check:**
```bash
curl http://localhost:4021/health
```

---

## 📋 Post-Installation Checklist

### For Client Installation:

- [ ] Repository cloned to `/root/.openclaw/workspace/clawsec`
- [ ] Dependencies installed (`npm install` completed)
- [ ] CLI command works (`clawsec version` or `./client/bin/clawsec version`)
- [ ] Server connectivity verified (`clawsec health`)

### For OpenClaw Skill:

- [ ] SKILL.md present in `/root/.openclaw/skills/clawsec/SKILL.md`
- [ ] OpenClaw Gateway restarted (`openclaw gateway restart`)
- [ ] Skill discoverable in OpenClaw (check logs or skill list)
- [ ] Test scan executed successfully

### For Server (Self-Hosted):

- [ ] `.env` file configured with API keys
- [ ] Server starts without errors (`npm start`)
- [ ] Health endpoint responds (`curl /health`)
- [ ] Test scan request successful (`POST /api/v1/scan`)

---

## 🔄 Updating ClawSec

### Update CLI/Client:

```bash
cd /root/.openclaw/workspace/clawsec
git pull origin main
npm install  # Install any new dependencies

# If globally installed, reinstall:
npm install -g .
```

### Update OpenClaw Skill:

```bash
cd /root/.openclaw/workspace/clawsec
git pull origin main

# If using symlink, no action needed
# If copied manually, re-copy SKILL.md:
cp SKILL.md /root/.openclaw/skills/clawsec/SKILL.md

# Restart OpenClaw
openclaw gateway restart
```

### Update Server (Self-Hosted):

```bash
cd /root/.openclaw/workspace/clawsec
git pull origin main
npm install
npm start
```

**For Railway deployment:** Changes pushed to `main` branch auto-deploy (if connected to GitHub).

---

## 🗑️ Uninstallation

### Remove Global CLI:

```bash
npm uninstall -g clawsec
```

### Remove OpenClaw Skill:

```bash
rm -rf /root/.openclaw/skills/clawsec
openclaw gateway restart
```

### Remove Repository:

```bash
rm -rf /root/.openclaw/workspace/clawsec
```

---

## 🐛 Troubleshooting Installation

### CLI not found after global install

**Problem:** `clawsec: command not found`

**Solution:**
```bash
# Check npm global bin directory
npm config get prefix
# Should show /usr/local or similar

# Add to PATH if needed
export PATH="$(npm config get prefix)/bin:$PATH"
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission errors during global install

**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Use sudo (not recommended for security)
sudo npm install -g .

# OR configure npm to use user directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g .
```

### SKILL.md not discovered by OpenClaw

**Problem:** Skill doesn't appear in OpenClaw

**Solution:**
```bash
# Verify file exists
ls -la /root/.openclaw/skills/clawsec/SKILL.md

# Check file permissions (should be readable)
chmod 644 /root/.openclaw/skills/clawsec/SKILL.md

# Restart Gateway
openclaw gateway restart

# Check Gateway logs for errors
journalctl -u openclaw-gateway -n 50
```

### Server connection failures

**Problem:** `Cannot connect to server` when running `clawsec health`

**Solution:**
```bash
# Check server URL
echo $CLAWSEC_SERVER
# Should be: https://clawsec-skill-production.up.railway.app

# Set if missing
export CLAWSEC_SERVER=https://clawsec-skill-production.up.railway.app

# Test connectivity
curl https://clawsec-skill-production.up.railway.app/health

# Check if Railway server is down (status page)
# https://status.railway.app/
```

### Dependency installation failures

**Problem:** `npm install` fails with errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (must be 18+)
node --version
# If too old, update Node.js first
```

---

## 📚 Next Steps

After installation, see:
- [CONFIGURATION.md](./CONFIGURATION.md) - Environment variables and configuration
- [USAGE.md](./USAGE.md) - How to run scans and use the CLI
- [API-REFERENCE.md](./api-reference.md) - API endpoints and integration
- [DEPENDENCIES.md](./DEPENDENCIES.md) - Complete dependency documentation

---

**Installation complete! 🎉**

Run your first scan:
```bash
clawsec scan examples/sample-scan.json
```
