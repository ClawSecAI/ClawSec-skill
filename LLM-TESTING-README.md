# LLM Testing: Haiku vs Sonnet - Quick Start

**Status:** Infrastructure Complete, Ready for Execution  
**Trello Card:** https://trello.com/c/Q9djoEq7

---

## 🚀 Quick Start (TL;DR)

```bash
cd /root/.openclaw/workspace/clawsec
node test-llm-comparison.js
```

**Duration:** 5-10 minutes  
**Cost:** ~$0.15  
**Output:** Complete comparison data in `test-results/`

---

## 📁 File Guide

### Test Infrastructure
- `test-configs/` - Test configurations (3 files)
  - `basic-scan.json` - Simple config with 3-4 issues
  - `complex-scan.json` - Complex config with 10+ issues
  - `edge-case-scan.json` - Secure config with best practices

- `test-llm-comparison.js` - **Main test harness** ⭐
  - Comprehensive comparison of Haiku vs Sonnet
  - Measures: cost, speed, quality, tokens
  - Saves results to `test-results/`

- `quick-test.js` - Quick verification
  - Tests environment and API connectivity
  - Run this first if unsure

- `test-api-simple.sh` - Curl-based test
  - No Node.js required
  - Simple API health check

### Documentation
- `TEST-EXECUTION-GUIDE.md` - **Complete execution guide** ⭐
  - Prerequisites
  - 3 execution options
  - Troubleshooting
  - Post-test actions

- `docs/llm-comparison.md` - **Analysis template** ⭐
  - Ready to fill with test results
  - Quality comparison matrices
  - Cost analysis tables
  - Recommendation framework

- `docs/llm-comparison-preliminary.md` - **Pre-test analysis** ⭐
  - Model profiles
  - Expected results
  - Cost-benefit scenarios
  - Decision framework

- `LLM-TESTING-SUMMARY.md` - Work summary
  - What was completed
  - What's pending
  - Next steps

- `TRELLO-UPDATE.md` - Trello status report
  - Comprehensive work summary
  - Ready to post

### Scripts
- `finalize-llm-work.sh` - Commit and finalize
- `post-trello-update.sh` - Post update to Trello

---

## 🎯 What You Need

### Required
- Node.js (v14+)
- `ANTHROPIC_API_KEY` environment variable
- Network access to:
  - ClawSec API: https://clawsec-skill-production.up.railway.app
  - Anthropic API: https://api.anthropic.com

### Optional
- `jq` for pretty JSON output
- `TRELLO_API_KEY` and `TRELLO_TOKEN` for Trello updates

---

## 📊 What Gets Tested

### Models
1. **Haiku** (`claude-3-5-haiku-20241022`)
   - Expected: Fast (~3s), cheap (~$0.01), good quality
   
2. **Sonnet** (`claude-3-5-sonnet-20241022`)
   - Expected: Slower (~10s), expensive (~$0.03), excellent quality

### Test Cases
1. **Basic Scan** - Simple config with 3-4 known issues
2. **Complex Scan** - Complex config with 10+ issues
3. **Edge Case** - Secure config with minimal issues

### Metrics
- ⏱️ Response time (milliseconds)
- 💰 Cost per scan (dollars)
- 📝 Token usage (input/output)
- 📊 Report length (characters)
- ✅ Quality (manual assessment)

---

## 💡 Preliminary Recommendation

**Recommended:** **Haiku for MVP** (70% confidence)

**Why Haiku:**
- 3x cheaper (~$0.01 vs ~$0.03)
- 3x faster (2-5s vs 5-15s)
- Sufficient quality for MVP
- Better UX (speed matters)
- Healthier unit economics

**When to use Sonnet:**
- Complex configurations (10+ issues)
- Professional/enterprise users
- Premium tier offering
- Quality > Speed priority

See `docs/llm-comparison-preliminary.md` for detailed analysis.

---

## 📖 Execution Options

### Option 1: Full Test Suite (Recommended)

```bash
cd /root/.openclaw/workspace/clawsec
node test-llm-comparison.js
```

**Pros:** Complete data, confidence in decision  
**Cons:** Takes 5-10 min, costs ~$0.15

### Option 2: Quick Verification Only

```bash
cd /root/.openclaw/workspace/clawsec
node quick-test.js
```

**Pros:** Fast (30s), free  
**Cons:** No comparison data

### Option 3: Ship with Preliminary Recommendation

Skip testing, use Haiku for MVP based on preliminary analysis.

**Pros:** Fast, high confidence (70%)  
**Cons:** No empirical data

---

## 📋 After Testing

1. **Review results:**
   ```bash
   cat test-results/summary.json | jq '.'
   ```

2. **Update analysis doc:**
   - Edit `docs/llm-comparison.md`
   - Fill in [TBD] placeholders with actual data

3. **Make decision:**
   - Choose Haiku, Sonnet, or hybrid approach
   - Document rationale

4. **Update server:**
   - Modify `server/index.js` to use chosen model
   - Update pricing in README

5. **Commit:**
   ```bash
   git add test-results/ docs/llm-comparison.md PROJECT.md
   git commit -m "LLM testing complete: [Haiku/Sonnet] chosen for MVP"
   git push origin main
   ```

6. **Update Trello:**
   - Post results summary
   - Move card to "To review"

---

## 🔗 Key Links

- **Trello Card:** https://trello.com/c/Q9djoEq7
- **ClawSec API:** https://clawsec-skill-production.up.railway.app
- **Anthropic Docs:** https://docs.anthropic.com/claude/reference/messages_post
- **Anthropic Pricing:** https://www.anthropic.com/pricing

---

## 🆘 Need Help?

### Common Issues

**"ANTHROPIC_API_KEY not set"**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**"Connection refused"**
- Check ClawSec API: `curl https://clawsec-skill-production.up.railway.app/health`
- Verify network connectivity

**"Rate limited"**
- Wait 60 seconds
- Script includes automatic delays

**"Timeout"**
- Increase timeout in script (currently 60s)
- Check Anthropic status: https://status.anthropic.com

See `TEST-EXECUTION-GUIDE.md` for complete troubleshooting.

---

## 💬 Questions?

- Check `TEST-EXECUTION-GUIDE.md` first
- Review `docs/llm-comparison-preliminary.md` for analysis
- Post questions on Trello card: https://trello.com/c/Q9djoEq7

---

**Ready to test?**

```bash
cd /root/.openclaw/workspace/clawsec
node test-llm-comparison.js
```

**Or ship with Haiku** and validate later. Your call! 🚀

---

*Last Updated: 2026-02-06*
