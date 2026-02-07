# ClawSec Dependencies Documentation

Complete guide to ClawSec dependencies, installation, versioning, and troubleshooting.

---

## 📦 Overview

ClawSec has minimal dependencies to maintain security, performance, and ease of installation.

**Dependency categories:**
- **Core dependencies** (required for runtime)
- **Optional dependencies** (enhances functionality)
- **Development dependencies** (testing and development only)

**Installation size:**
- Core: ~15 MB (production)
- With dev dependencies: ~45 MB (development)

---

## 🔧 System Requirements

### Node.js

**Required version:** Node.js 18.0.0 or higher  
**Recommended version:** Node.js 20.x LTS (latest stable)

**Check current version:**
```bash
node --version
```

**Install/update Node.js:**

**Option 1: Using nvm (Node Version Manager - Recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart shell or source profile
source ~/.bashrc  # or ~/.zshrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

**Option 2: Using package manager**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (Homebrew)
brew install node@20

# Verify
node --version
```

**Why Node 18+?**
- Native fetch API support (no need for node-fetch)
- Top-level await support
- Enhanced performance and security
- ESM and CommonJS interop improvements

### npm

**Required version:** npm 8.0.0 or higher  
**Recommended version:** npm 10.x (latest)

**Check current version:**
```bash
npm --version
```

**Update npm:**
```bash
npm install -g npm@latest
```

### Operating System

**Supported platforms:**
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- macOS (10.15 Catalina or later)
- Windows 10/11 (with WSL2 recommended)

**Not supported:**
- Windows native (without WSL) - HTTPS and crypto modules may have issues
- Node.js < 18

---

## 📚 Core Dependencies (Production)

### express (^4.19.2)

**Purpose:** HTTP server framework for API endpoints  
**License:** MIT  
**Size:** ~200 KB  
**Documentation:** https://expressjs.com/

**What it does:**
- Handles HTTP requests/responses
- Routing for `/api/v1/scan`, `/health`, etc.
- Middleware support (CORS, rate limiting, error handling)

**Why this version?**
- Mature, stable framework (v4.x is production-ready)
- Excellent performance and security
- Wide ecosystem of middleware

**Installation:**
```bash
npm install express@^4.19.2
```

**Usage in ClawSec:**
- `server/index.js` - Main API server
- Routes: `/api/v1/scan`, `/health`, `/api/v1/threats`

### dotenv (^16.4.5)

**Purpose:** Environment variable loader from `.env` files  
**License:** BSD-2-Clause  
**Size:** ~15 KB  
**Documentation:** https://github.com/motdotla/dotenv

**What it does:**
- Loads environment variables from `.env` file
- Keeps secrets out of source code
- Supports multiple environments (dev/staging/prod)

**Why this version?**
- Latest stable release with security patches
- Zero dependencies
- Fast and lightweight

**Installation:**
```bash
npm install dotenv@^16.4.5
```

**Usage in ClawSec:**
- `server/index.js` - Load `ANTHROPIC_API_KEY`, `PORT`, etc.
- `.env.example` - Template for environment configuration

### cors (^2.8.5)

**Purpose:** Cross-Origin Resource Sharing (CORS) middleware  
**License:** MIT  
**Size:** ~10 KB  
**Documentation:** https://github.com/expressjs/cors

**What it does:**
- Enables secure cross-origin requests
- Allows browser-based clients to access API
- Prevents CSRF attacks with proper configuration

**Why this version?**
- Industry standard for Express CORS
- Simple, secure defaults
- Configurable for production use

**Installation:**
```bash
npm install cors@^2.8.5
```

**Usage in ClawSec:**
- `server/index.js` - Enable CORS for all routes
- Configuration: Allow all origins in dev, restrict in production

### ajv (^8.12.0)

**Purpose:** JSON Schema validator (fastest validator)  
**License:** MIT  
**Size:** ~120 KB  
**Documentation:** https://ajv.js.org/

**What it does:**
- Validates API request/response payloads
- Ensures data integrity
- Provides clear error messages for invalid input

**Why this version?**
- Fastest JSON Schema validator (10x faster than alternatives)
- Full JSON Schema Draft-07 support
- Extensive testing and production use

**Installation:**
```bash
npm install ajv@^8.12.0
```

**Usage in ClawSec:**
- `server/validator.js` - Schema validation engine
- Schemas: `server/schemas/report.js`, `server/schemas/scan-input.js`
- Validates scan requests and report generation

### ajv-formats (^3.0.1)

**Purpose:** Format validators for Ajv (email, URL, date, etc.)  
**License:** MIT  
**Size:** ~20 KB  
**Documentation:** https://github.com/ajv-validator/ajv-formats

**What it does:**
- Adds format validation to Ajv (email, uri, date-time, ipv4, etc.)
- Extends JSON Schema validation capabilities
- Validates input data formats

**Why this version?**
- Official Ajv plugin
- Supports all standard JSON Schema formats
- Zero additional dependencies

**Installation:**
```bash
npm install ajv-formats@^3.0.1
```

**Usage in ClawSec:**
- `server/validator.js` - Register formats with Ajv instance
- Used for validating email addresses, URLs, dates in scan data

### @x402/express (^0.7.3)

**Purpose:** X402 payment protocol middleware for Express  
**License:** MIT  
**Size:** ~50 KB  
**Documentation:** https://www.x402.org/docs/

**What it does:**
- Integrates X402 payment protocol into Express routes
- Handles USDC payment verification
- Provides payment middleware for protected endpoints

**Why this version?**
- Latest stable release (0.7.x)
- Supports Base Sepolia testnet and Base mainnet
- Full USDC payment support

**Installation:**
```bash
npm install @x402/express@^0.7.3
```

**Usage in ClawSec:**
- `server/payment.js` - X402 payment integration
- `server/index.js` - Apply payment middleware to `/api/v1/scan`

### @x402/evm (^0.7.3)

**Purpose:** EVM (Ethereum Virtual Machine) scheme for X402  
**License:** MIT  
**Size:** ~80 KB  
**Documentation:** https://www.x402.org/docs/schemes/evm

**What it does:**
- Enables X402 payments on EVM-compatible chains (Base, Ethereum, etc.)
- Handles USDC token transfers
- Verifies blockchain transactions

**Why this version?**
- Matches @x402/express version (0.7.3)
- Base blockchain support (mainnet + testnet)
- Production-ready EVM integration

**Installation:**
```bash
npm install @x402/evm@^0.7.3
```

**Usage in ClawSec:**
- `server/payment.js` - Register EVM scheme with X402
- Supports Base Sepolia (testnet) and Base (mainnet)

### @x402/core (^0.7.3)

**Purpose:** Core X402 protocol library  
**License:** MIT  
**Size:** ~100 KB  
**Documentation:** https://www.x402.org/docs/

**What it does:**
- Core X402 protocol implementation
- Payment request/response handling
- Facilitator client integration

**Why this version?**
- Latest stable release
- Required by @x402/express and @x402/evm
- Unified version across X402 packages

**Installation:**
```bash
npm install @x402/core@^0.7.3
```

**Usage in ClawSec:**
- Indirect dependency (used by @x402/express and @x402/evm)
- No direct imports in application code

### express-rate-limit (^7.1.5)

**Purpose:** Rate limiting middleware for Express  
**License:** MIT  
**Size:** ~25 KB  
**Documentation:** https://github.com/express-rate-limit/express-rate-limit

**What it does:**
- Limits number of requests per IP address
- Prevents abuse and DDoS attacks
- Configurable windows and thresholds

**Why this version?**
- Latest major version (v7.x) with memory store
- Flexible configuration
- Production-ready with good performance

**Installation:**
```bash
npm install express-rate-limit@^7.1.5
```

**Usage in ClawSec:**
- `server/rate-limit.js` - Rate limiting configuration
- Applied globally to all routes
- Default: 100 requests per minute per IP

---

## 🌟 Optional Dependencies

### @sentry/node (^7.100.0)

**Purpose:** Error tracking and performance monitoring  
**License:** BSD-3-Clause  
**Size:** ~500 KB  
**Documentation:** https://docs.sentry.io/platforms/node/

**What it does:**
- Automatic error capture and stack traces
- Performance monitoring (APM)
- Release tracking and source maps
- User feedback collection

**When to install:**
- Production deployments (highly recommended)
- When you need error alerting
- For performance monitoring

**Installation:**
```bash
npm install @sentry/node@^7.100.0
```

**Configuration:**
```bash
# Add to .env
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/789012
```

**Usage in ClawSec:**
- `server/index.js` - Sentry initialization (optional)
- Only loads if `SENTRY_DSN` environment variable is set
- Does not break app if missing

### @sentry/profiling-node (^1.3.0)

**Purpose:** CPU profiling for Sentry  
**License:** BSD-3-Clause  
**Size:** ~200 KB  
**Documentation:** https://docs.sentry.io/platforms/node/profiling/

**What it does:**
- Captures CPU profiles during slow requests
- Identifies performance bottlenecks
- Visualizes function call graphs

**When to install:**
- When using @sentry/node in production
- For performance optimization
- Optional enhancement to error tracking

**Installation:**
```bash
npm install @sentry/profiling-node@^1.3.0
```

**Usage in ClawSec:**
- `server/index.js` - Profiling integration (optional)
- Automatically integrates with Sentry if present

---

## 🧪 Development Dependencies

### nodemon (^3.1.0)

**Purpose:** Auto-restart server on file changes  
**License:** MIT  
**Size:** ~50 KB  
**Documentation:** https://nodemon.io/

**What it does:**
- Monitors file changes during development
- Automatically restarts server
- Improves development workflow

**Installation:**
```bash
npm install --save-dev nodemon@^3.1.0
```

**Usage:**
```bash
npm run dev  # Uses nodemon
```

### jest (^29.7.0)

**Purpose:** JavaScript testing framework  
**License:** MIT  
**Size:** ~1.5 MB  
**Documentation:** https://jestjs.io/

**What it does:**
- Unit testing framework
- Test runner with parallel execution
- Assertion library and mocking

**Installation:**
```bash
npm install --save-dev jest@^29.7.0
```

**Usage:**
```bash
npm test           # Run all tests
npm run test:integration
npm run test:e2e
```

---

## 📋 Complete Dependency List

### Production Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| express | ^4.19.2 | 200 KB | HTTP server framework |
| dotenv | ^16.4.5 | 15 KB | Environment variable loader |
| cors | ^2.8.5 | 10 KB | CORS middleware |
| ajv | ^8.12.0 | 120 KB | JSON Schema validator |
| ajv-formats | ^3.0.1 | 20 KB | Format validators |
| @x402/express | ^0.7.3 | 50 KB | X402 payment middleware |
| @x402/evm | ^0.7.3 | 80 KB | EVM scheme for X402 |
| @x402/core | ^0.7.3 | 100 KB | X402 core library |
| express-rate-limit | ^7.1.5 | 25 KB | Rate limiting |

**Total production size:** ~620 KB (excluding transitive dependencies)

### Optional Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| @sentry/node | ^7.100.0 | 500 KB | Error tracking |
| @sentry/profiling-node | ^1.3.0 | 200 KB | CPU profiling |

**Total optional size:** ~700 KB

### Development Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| nodemon | ^3.1.0 | 50 KB | Auto-restart server |
| jest | ^29.7.0 | 1.5 MB | Testing framework |

**Total dev size:** ~1.55 MB

---

## 🔄 Installation Methods

### Standard Installation

```bash
# Install all production dependencies
npm install

# Install with optional dependencies
npm install --include=optional

# Install with dev dependencies
npm install --include=dev
```

### Production-Only Installation

```bash
# Minimal production install (no dev dependencies)
npm install --production

# Or using NODE_ENV
NODE_ENV=production npm install
```

### Selective Installation

```bash
# Install only core dependencies (no optional)
npm install --no-optional

# Install specific packages
npm install express dotenv cors ajv ajv-formats
```

---

## 🔐 Security & Auditing

### Check for Vulnerabilities

```bash
# Audit dependencies for known vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

### Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update to latest compatible versions (respect ^)
npm update

# Update to latest versions (may break)
npm install <package>@latest
```

### Dependency Lock File

**package-lock.json** ensures reproducible builds:
- Locks exact versions of dependencies
- Includes transitive dependencies
- Should be committed to Git
- Used in production deployments

```bash
# Regenerate lock file
rm package-lock.json
npm install

# Verify integrity
npm ci  # Clean install from lock file
```

---

## 🐛 Troubleshooting Dependencies

### Installation Failures

**Problem:** `npm install` fails with errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, check Node.js version
node --version  # Must be 18.0.0+
```

### Missing Dependencies

**Problem:** `Error: Cannot find module 'express'`

**Solution:**
```bash
# Verify package.json exists
cat package.json

# Install missing dependency
npm install express

# Or reinstall all
npm install
```

### Version Conflicts

**Problem:** `npm ERR! peer dependency conflict`

**Solution:**
```bash
# Force install (use with caution)
npm install --force

# Or use legacy peer deps
npm install --legacy-peer-deps

# Or update conflicting packages
npm update <package>
```

### X402 Installation Issues

**Problem:** `@x402/express` fails to install

**Solution:**
```bash
# Install X402 packages explicitly
npm install @x402/core@0.7.3
npm install @x402/evm@0.7.3
npm install @x402/express@0.7.3

# Check Node.js version (must be 18+)
node --version

# If still failing, try without optional deps
npm install --no-optional
```

### Sentry Installation Issues

**Problem:** `@sentry/profiling-node` fails (native module)

**Solution:**
```bash
# Skip optional dependencies (Sentry is optional)
npm install --no-optional

# Or install without profiling
npm install @sentry/node

# Sentry gracefully degrades if missing
```

---

## 📊 Dependency Tree

### Transitive Dependencies

**Major transitive dependencies** (installed automatically):

- **express** → body-parser, cookie-parser, debug, qs, etc. (~30 packages)
- **ajv** → json-schema-traverse, require-from-string (~5 packages)
- **@x402/express** → ethers, @x402/core (~20 packages)
- **express-rate-limit** → None (zero dependencies)

**View full dependency tree:**
```bash
npm list
npm list --depth=1  # Show only direct dependencies
```

### Dependency Graph

```
ClawSec
├── express (HTTP server)
│   ├── body-parser
│   ├── cookie
│   ├── debug
│   └── ... (30 transitive)
├── dotenv (Environment)
├── cors (CORS middleware)
├── ajv (Validation)
│   └── json-schema-traverse
├── ajv-formats (Format validators)
├── @x402/express (Payments)
│   ├── @x402/core
│   ├── @x402/evm
│   └── ethers (Web3)
├── express-rate-limit (Rate limiting)
├── [OPTIONAL] @sentry/node (Monitoring)
└── [DEV] jest, nodemon (Testing)
```

---

## 🎯 Production Deployment Checklist

### Before Deploying:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] All dependencies installed (`npm install`)
- [ ] Lock file committed (`git add package-lock.json`)
- [ ] Environment variables configured (`.env`)
- [ ] Audit passed (`npm audit`)
- [ ] Tests passing (`npm test`)

### Railway Deployment:

- [ ] `package.json` committed to Git
- [ ] `package-lock.json` committed (Railway uses it)
- [ ] `engines` field specified (`"node": ">=18.0.0"`)
- [ ] Build command: `npm install` (default)
- [ ] Start command: `npm start` (or `node server/index.js`)

### Docker Deployment:

```dockerfile
# Use official Node.js 20 image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Expose port
EXPOSE 4021

# Start server
CMD ["npm", "start"]
```

---

## 📚 Related Documentation

- [INSTALLATION.md](./INSTALLATION.md) - Installation guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Environment variables
- [README.md](../README.md) - Project overview
- [package.json](../package.json) - Dependency manifest

---

## 📝 Dependency Change Log

### v0.1.0-hackathon (2026-02-07)

**Added:**
- express@^4.19.2 - HTTP server
- dotenv@^16.4.5 - Environment config
- cors@^2.8.5 - CORS middleware
- ajv@^8.12.0 - JSON validation
- ajv-formats@^3.0.1 - Format validators
- @x402/express@^0.7.3 - Payment middleware
- @x402/evm@^0.7.3 - EVM support
- @x402/core@^0.7.3 - X402 core
- express-rate-limit@^7.1.5 - Rate limiting
- @sentry/node@^7.100.0 (optional) - Error tracking
- @sentry/profiling-node@^1.3.0 (optional) - Profiling

**Development:**
- nodemon@^3.1.0 - Dev server
- jest@^29.7.0 - Testing

**Rationale:**
- Minimal production footprint (~620 KB)
- Industry-standard, battle-tested packages
- Security-first with audit compliance
- Optional monitoring for production
- Zero unnecessary dependencies

---

**Dependencies documented! 📦**

Install all dependencies:
```bash
npm install
```

Verify installation:
```bash
npm list
npm audit
```
