# LLM Comparison Test - Execution Guide

## Prerequisites

1. **Environment Variables**
   ```bash
   export ANTHROPIC_API_KEY="your-anthropic-api-key"
   export TRELLO_API_KEY="your-trello-key"
   export TRELLO_TOKEN="your-trello-token"
   ```

2. **Node.js** (v14+ required)
   ```bash
   node --version
   ```

3. **Network Access**
   - ClawSec API: https://clawsec-skill-production.up.railway.app
   - Anthropic API: https://api.anthropic.com

## Quick Start

### Option 1: Run Full Test Suite (Recommended)

```bash
cd /root/.openclaw/workspace/clawsec
chmod +x test-llm-comparison.js
node test-llm-comparison.js
```

**Expected Output:**
- Tests all 3 configurations with both models
- Saves results to `test-results/` directory
- Prints summary statistics

**Duration:** ~5-10 minutes (6 LLM API calls + processing)

**Cost:** ~$0.15-0.30 total (3 scans × 2 models)

### Option 2: Quick Verification Test

```bash
cd /root/.openclaw/workspace/clawsec
node quick-test.js
```

**Purpose:** Verify API connectivity before running full suite

**Duration:** ~30 seconds

**Cost:** Free (no LLM calls)

### Option 3: Manual Step-by-Step

#### Step 1: Test ClawSec API

```bash
curl https://clawsec-skill-production.up.railway.app/health
```

#### Step 2: Run Basic Scan

```bash
curl -X POST https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d @test-configs/basic-scan.json
```

#### Step 3: Run Full LLM Comparison

```bash
node test-llm-comparison.js
```

## Test Results

Results are saved to:
```
clawsec/
├── test-results/
│   ├── basic-scan-comparison.json
│   ├── complex-scan-comparison.json
│   ├── edge-case-scan-comparison.json
│   └── summary.json
└── docs/
    └── llm-comparison.md (updated with results)
```

## Analyzing Results

### Automated Analysis

The test script automatically generates:
1. Per-test comparison JSON files
2. Summary statistics
3. Cost calculations
4. Performance metrics

### Manual Analysis

Review the generated reports:
```bash
cat test-results/summary.json | jq '.'
```

Compare models:
```bash
# Haiku report
cat test-results/basic-scan-comparison.json | jq '.haiku.report'

# Sonnet report  
cat test-results/basic-scan-comparison.json | jq '.sonnet.report'
```

### Update Documentation

After tests complete, update `/root/.openclaw/workspace/clawsec/docs/llm-comparison.md` with:
1. Actual test results (replace [TBD] placeholders)
2. Quality assessments
3. Cost calculations
4. Final recommendation

## Troubleshooting

### Error: ANTHROPIC_API_KEY not set
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Error: Connection refused
- Check ClawSec API is running: `curl https://clawsec-skill-production.up.railway.app/health`
- Verify network connectivity
- Check Railway deployment status

### Error: Rate limited
- Add delays between tests (5-10 seconds)
- The script includes built-in rate limiting
- Wait 60 seconds and retry

### Error: Timeout
- Increase timeout in script (currently 60s for LLM calls)
- Check Anthropic API status: https://status.anthropic.com

## Post-Test Actions

1. **Review Results**
   ```bash
   cat test-results/summary.json
   ```

2. **Update Trello Card**
   ```bash
   # Script will auto-update, or manually:
   # Post comment with results summary
   # Move card to "To review"
   ```

3. **Update PROJECT.md**
   - Mark LLM Pipeline section complete
   - Update model recommendation

4. **Commit Results**
   ```bash
   cd /root/.openclaw/workspace/clawsec
   git add test-results/ docs/llm-comparison.md
   git commit -m "LLM comparison complete: [Haiku/Sonnet] recommended for MVP"
   git push origin main
   ```

## Expected Timeline

- **Environment setup**: 2 minutes
- **Quick verification**: 30 seconds
- **Full test execution**: 5-10 minutes
- **Results analysis**: 10-15 minutes
- **Documentation update**: 15-20 minutes

**Total**: ~30-45 minutes

## Cost Breakdown

### Per-Scan Estimates

**Haiku (claude-3-5-haiku-20241022):**
- Input: ~3,000 tokens × $1.00/MTok = $0.003
- Output: ~1,500 tokens × $5.00/MTok = $0.0075
- **Total: ~$0.011 per scan**

**Sonnet (claude-3-5-sonnet-20241022):**
- Input: ~3,000 tokens × $3.00/MTok = $0.009
- Output: ~2,000 tokens × $15.00/MTok = $0.030
- **Total: ~$0.039 per scan**

### Full Test Suite

- 3 test configs × 2 models = 6 LLM calls
- Haiku: 3 × $0.011 = $0.033
- Sonnet: 3 × $0.039 = $0.117
- **Total estimated cost: ~$0.15**

## Next Steps After Testing

Based on results, choose MVP model:

### If Haiku Wins
- Update `server/index.js` to use Haiku
- Document cost savings in README
- Market as "Fast, accurate AI security audits"

### If Sonnet Wins
- Update `server/index.js` to use Sonnet
- Document premium quality in README
- Market as "Deep, comprehensive AI security analysis"

### If Close Decision
- Consider hybrid approach (tier-based)
- Implement model selection parameter
- A/B test with real users

---

**Ready to run?**

```bash
cd /root/.openclaw/workspace/clawsec
node test-llm-comparison.js
```

---

*Last Updated: 2026-02-06*
