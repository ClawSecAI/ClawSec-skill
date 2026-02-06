# ClawSec Threat Database Format

**Status**: 🟢 Testing (format chosen, optimization needed)  
**Last Updated**: 2026-02-06

---

## Current State

### Location
- **Source**: `/root/.openclaw/workspace/security/threat-intel/prompt-guard-threat-catalog.md`
- **Server**: `/root/.openclaw/workspace/clawsec/threats/core.md` (copy/subset)
- **Index**: `/root/.openclaw/workspace/clawsec/threats/index.json` (metadata)

### Statistics
- **Total Size**: ~40KB (Prompt Guard catalog alone)
- **Additional Intel**: ~270KB total in security/threat-intel/
- **Patterns**: 349+ threat patterns
- **Languages**: 4 (EN, KO, JA, ZH)
- **Categories**: 25+ attack types

---

## Format Decision: Markdown ✅

### Why Markdown?

#### ✅ **LLM-Friendly**
- Natural language structure
- Easy for Claude/GPT to parse and understand
- No schema rigidity - flexible descriptions
- Human-readable and machine-parseable

#### ✅ **Context Injection**
- Drop directly into LLM prompt
- No conversion needed
- Preserves formatting (tables, code blocks, lists)
- Maintains semantic relationships

#### ✅ **Maintainability**
- Easy to edit by hand
- Git-friendly (clear diffs)
- Can be generated from multiple sources
- Standard tooling (editors, linters)

#### ✅ **Existing Ecosystem**
- Prompt Guard catalog is already Markdown
- Security briefings are Markdown
- No migration needed

### Comparison: Alternative Formats

| Format | LLM-Friendly | Token Efficiency | Human-Readable | Structured | Verdict |
|--------|--------------|------------------|----------------|------------|---------|
| **Markdown** | ✅ Excellent | ✅ Good | ✅ Excellent | ⚠️ Loose | ✅ **CHOSEN** |
| JSON | ⚠️ OK | ✅ Good | ❌ Poor | ✅ Strict | ❌ Too rigid |
| YAML | ✅ Good | ✅ Good | ✅ Good | ✅ Flexible | ⚠️ Parse overhead |
| XML | ❌ Poor | ❌ Verbose | ❌ Poor | ✅ Strict | ❌ Token-heavy |
| Plain Text | ✅ OK | ✅ Best | ⚠️ No structure | ❌ None | ❌ Hard to parse |

**Winner**: Markdown - Best balance of all criteria.

---

## Token Budget Analysis

### Model Limits

| Model | Context Window | Practical Limit | Cost per 1M Input Tokens |
|-------|----------------|-----------------|---------------------------|
| **Claude Haiku 4** | 200K | ~180K | $0.80 |
| **Claude Sonnet 4.5** | 200K | ~180K | $3.00 |
| **Claude Opus 3.5** | 200K | ~180K | $15.00 |

**Note**: Practical limit accounts for output buffer (~10-20K tokens).

### Current Usage Estimate

```
Scan Input (OpenClaw config):        ~2-5K tokens
Report Template (prompt):            ~1K tokens
Threat Database (full):              ~100-150K tokens
System Instructions:                 ~1K tokens
Output Buffer (report):              ~5-10K tokens
-------------------------------------------------------
TOTAL:                               ~109-167K tokens ✅
```

**Status**: Fits within 200K context, but tight for Haiku tier pricing.

---

## Context Injection Strategy

### Tier 1: Core Threats (Always Included)

**Size**: ~10KB (~2,500 tokens)

**Contains**:
- Top 20 critical patterns (T001-T020)
- Gateway security (T001-T003)
- Credential exposure (T005, T011)
- Tool permissions (T003, T007)
- Telegram security (T011-T013)

**Rationale**: 
- Highest likelihood findings
- Covers 80% of typical OpenClaw deployments
- Low token cost

**File**: `threats/core.md`

---

### Tier 2: Conditional Threats (Scan-Based Selection)

**Size**: ~20-40KB (~5,000-10,000 tokens)

**Selection Logic**:
```javascript
// Pseudo-code for smart filtering
function selectConditionalThreats(scanInput) {
  const threats = [];
  
  // If Telegram configured → include Telegram threats
  if (scanInput.channels?.telegram) {
    threats.push('telegram-specific-threats.md');
  }
  
  // If exec tool enabled → include command injection threats
  if (scanInput.tools?.exec) {
    threats.push('command-injection-threats.md');
  }
  
  // If browser tool enabled → include web threats
  if (scanInput.tools?.browser) {
    threats.push('web-security-threats.md');
  }
  
  // If cron jobs configured → include cron threats
  if (scanInput.cron?.length > 0) {
    threats.push('cron-security-threats.md');
  }
  
  return threats;
}
```

**Categories**:
- `telegram-threats.md` - Telegram-specific attacks (T011-T015)
- `command-injection-threats.md` - Exec tool exploits (T003, T007)
- `web-security-threats.md` - Browser tool risks (T020-T025)
- `cron-security-threats.md` - Scheduled job vulnerabilities (T030-T035)
- `node-security-threats.md` - Node pairing risks (T040-T045)

**Rationale**:
- Only load relevant threats
- Reduces token cost by 50-70%
- Improves LLM focus (less noise)

---

### Tier 3: Full Catalog (Reference Only)

**Size**: ~270KB total (~70,000 tokens)

**Contains**:
- Prompt Guard full catalog (349+ patterns)
- Daily security briefings
- CVE database excerpts
- OWASP LLM guidelines
- Attack case studies

**Usage**:
- NOT loaded into LLM context by default
- Available for deep-dive analysis (Opus tier)
- Human reference documentation
- Future: Vector DB for semantic search

**Status**: ⏸️ Not implemented (post-hackathon feature)

---

## Threat Database Structure

### File Organization

```
threats/
├── index.json              # Metadata, threat mappings
├── core.md                 # Tier 1: Always loaded (~10KB)
├── telegram-threats.md     # Tier 2: Conditional
├── command-injection-threats.md
├── web-security-threats.md
├── cron-security-threats.md
├── node-security-threats.md
└── full-catalog/           # Tier 3: Reference only
    ├── prompt-guard-full.md
    ├── daily-briefings/
    └── cve-database/
```

### index.json Format

```json
{
  "version": "0.1.0-hackathon",
  "last_updated": "2026-02-06T18:30:00Z",
  "threats": {
    "T001": {
      "id": "T001",
      "title": "Weak or Default Gateway Token",
      "severity": "CRITICAL",
      "category": "gateway",
      "tier": 1,
      "file": "core.md",
      "line_range": [15, 45]
    },
    "T002": {
      "id": "T002",
      "title": "Public Gateway Exposure",
      "severity": "HIGH",
      "category": "gateway",
      "tier": 1,
      "file": "core.md",
      "line_range": [46, 76]
    },
    "T011": {
      "id": "T011",
      "title": "Telegram Bot Token in Config",
      "severity": "HIGH",
      "category": "telegram",
      "tier": 2,
      "file": "telegram-threats.md",
      "line_range": [10, 40]
    }
  },
  "categories": ["gateway", "telegram", "tools", "cron", "nodes"],
  "tiers": {
    "1": { "name": "Core", "size_kb": 10, "always_loaded": true },
    "2": { "name": "Conditional", "size_kb": 40, "scan_based": true },
    "3": { "name": "Full", "size_kb": 270, "reference_only": true }
  },
  "stats": {
    "total_threats": 45,
    "critical": 8,
    "high": 15,
    "medium": 12,
    "low": 10
  }
}
```

---

## Token Optimization Strategies

### 1. Pre-Filtering (Implemented)

✅ **Done**: Load only core threats (10KB)

🟡 **In Progress**: Conditional loading based on scan input

🔴 **Not Started**: Vector DB semantic search

### 2. Compression Techniques

#### Remove Redundancy
```markdown
<!-- BEFORE (verbose) -->
## Threat T001: Weak or Default Gateway Token

**Description**: The gateway token is weak or matches common patterns like 'password', 'admin', 'test', etc.

**Impact**: An attacker could gain complete control of the OpenClaw system.

**Likelihood**: High, especially if gateway is exposed.

<!-- AFTER (concise) -->
## T001: Weak Gateway Token
Weak/default tokens (e.g., 'password', 'admin') enable complete system compromise. Likelihood: HIGH if exposed.
```

**Token Savings**: ~30-40% reduction

#### Abbreviate Repeated Terms
```markdown
<!-- Use abbreviations -->
- OC (OpenClaw)
- GW (Gateway)
- TG (Telegram)
- exec → cmd exec
- configuration → config
```

**Token Savings**: ~10-15% reduction

#### Remove Examples (Move to Docs)
- Keep threat descriptions
- Remove code examples from context
- Link to full documentation for humans

**Token Savings**: ~20-30% reduction

---

## Pre-Filtering Implementation Plan

### Phase 1: Category Detection ✅ Done

```javascript
function detectCategories(scanInput) {
  const categories = ['core']; // Always include core
  
  if (scanInput.channels?.telegram) categories.push('telegram');
  if (scanInput.channels?.discord) categories.push('discord');
  if (scanInput.tools?.exec) categories.push('exec');
  if (scanInput.tools?.browser) categories.push('browser');
  if (scanInput.cron?.length > 0) categories.push('cron');
  if (scanInput.nodes?.length > 0) categories.push('nodes');
  
  return categories;
}
```

### Phase 2: Selective Loading 🟡 In Progress

```javascript
function loadRelevantThreats(categories) {
  const threats = [];
  
  // Always load core
  threats.push(loadFile('threats/core.md'));
  
  // Load conditional threats
  if (categories.includes('telegram')) {
    threats.push(loadFile('threats/telegram-threats.md'));
  }
  // ... etc
  
  return threats.join('\n\n---\n\n');
}
```

### Phase 3: Priority Ordering 🔴 Not Started

```javascript
// Load threats by severity
// CRITICAL threats first, then HIGH, etc.
function orderThreatsBySeverity(threats) {
  return threats.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
```

---

## Caching Strategy (Future)

### Server-Side Cache

```javascript
// Cache threat files in memory
const threatCache = new Map();

function getCachedThreats(category) {
  if (!threatCache.has(category)) {
    const content = fs.readFileSync(`threats/${category}.md`, 'utf8');
    threatCache.set(category, content);
  }
  return threatCache.get(category);
}
```

**Benefits**:
- No disk I/O on each request
- Faster response times
- Lower CPU usage

**Invalidation**: Clear on file modification (watch for updates)

---

## Vector Database (Post-Hackathon)

### Concept: Semantic Threat Search

Instead of loading all threats:
1. Embed threats into vector space (OpenAI embeddings)
2. Embed scan input into same space
3. Query for top-k most relevant threats (cosine similarity)
4. Load only relevant threats into context

**Example**:
```
Scan input: "telegram bot with exec tool enabled"

Vector search returns:
- T011: Telegram Bot Token Exposure (similarity: 0.92)
- T012: No Telegram Chat Whitelist (similarity: 0.88)
- T003: Unrestricted Command Execution (similarity: 0.85)
- T007: Exec Tool Policy Missing (similarity: 0.83)

Load only these 4 threats → ~2KB instead of 40KB
```

**Tech Stack**:
- Pinecone or Weaviate (vector DB)
- OpenAI text-embedding-3-small (~$0.02 per 1M tokens)
- Precompute embeddings for all threats (one-time cost)

**Token Savings**: 90%+ reduction

**Status**: 🔴 Not implemented (post-hackathon feature)

---

## Deliverables Summary

### ✅ Completed
- [x] Format chosen: Markdown
- [x] Core threat database (~10KB)
- [x] Basic context injection
- [x] Token budget analysis

### 🟡 In Progress
- [ ] Conditional threat loading (scan-based)
- [ ] Separate threat category files
- [ ] index.json metadata

### 🔴 Planned (Post-Hackathon)
- [ ] Token compression (30-50% reduction)
- [ ] Server-side caching
- [ ] Vector DB semantic search
- [ ] Automated threat updates (daily briefing integration)

---

## Example Threat Entry Format

```markdown
## T001: Weak or Default Gateway Token

**Severity**: 🔴 CRITICAL  
**Category**: Gateway Security  
**OWASP**: LLM06 - Sensitive Information Disclosure

### Description
Gateway token is weak (&lt;32 chars) or matches common patterns (test, admin, password, token, secret, your-token-here).

### Impact
- Complete system compromise
- Arbitrary command execution
- Data exfiltration
- Service disruption

### Likelihood
HIGH - Default configs often ship with weak tokens.

### Detection Logic
```javascript
const isWeak = token.length < 32 || 
  ['test', 'admin', 'password', 'token', 'secret', 'your-token-here']
    .some(w => token.toLowerCase().includes(w));
```

### Remediation

**Immediate**:
1. Generate strong token: `openssl rand -hex 32`
2. Update `gateway.token` in `openclaw.json`
3. Restart gateway: `openclaw gateway restart`

**Short-term**:
- Implement token rotation policy (90 days)
- Add monitoring for failed auth attempts

**Long-term**:
- Use hardware security module (HSM)
- Implement OAuth2/OIDC

### References
- [OpenClaw Gateway Docs](https://openclaw.org/docs/gateway)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---
```

---

## Questions for Stan

1. Should we split threat database into multiple repos? (Core threats in ClawSec repo, extended threats in separate repo)
2. Priority on vector DB implementation? (High value but adds complexity)
3. Should daily security briefings auto-update threat DB? (Requires CI/CD pipeline)

---

**Next Steps**: Implement Phase 2 (selective loading) in `server/index.js`.
