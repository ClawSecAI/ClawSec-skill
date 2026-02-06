# LLM Test Execution Guide

**Status:** READY TO EXECUTE  
**Created:** 2026-02-06 20:20 UTC  
**Subagent:** Ubik  

---

## Quick Start

```bash
cd /root/.openclaw/workspace/clawsec
chmod +x test-llm-curl.sh
./test-llm-curl.sh
```

**Time Required:** ~5-10 minutes  
**Cost:** ~$0.15 total (3 configs × 2 models)

---

## What This Test Does

### Test Flow:
1. **Load test configuration** (basic/complex/edge-case)
2. **Scan with ClawSec API** (get rule-based findings)
3. **Enhance with Haiku** (fast, cheap model)
4. **Enhance with Sonnet** (thorough, expensive model)
5. **Compare results** (quality, cost, speed)
6. **Repeat for all 3 configs**

### Output Files:
```
test-results/
├── basic-scan-haiku-report.md      # Haiku's report
├── basic-scan-sonnet-report.md     # Sonnet's report
├── basic-scan-comparison.json      # Metrics comparison
├── complex-scan-haiku-report.md
├── complex-scan-sonnet-report.md
├── complex-scan-comparison.json
├── edge-case-scan-haiku-report.md
├── edge-case-scan-sonnet-report.md
├── edge-case-scan-comparison.json
└── summary.json                     # Overall analysis
```

---

## Alternative: Node.js Version

If you prefer the Node.js implementation:

```bash
cd /root/.openclaw/workspace/clawsec
node test-llm-comparison.js
```

Both scripts produce the same output format.

---

## Requirements

### Environment Variables:
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `TRELLO_API_KEY` - For Trello updates (optional)
- `TRELLO_TOKEN` - For Trello updates (optional)

### Dependencies:
- `curl` - HTTP client (curl version)
- `jq` - JSON processor (curl version)
- `bc` - Calculator (curl version)
- Node.js 18+ (Node.js version)

### Check Prerequisites:
```bash
# Curl version
which curl jq bc && echo "✅ Ready"

# Node.js version  
node --version && npm list && echo "✅ Ready"

# Environment
echo $ANTHROPIC_API_KEY | head -c 20 && echo "... ✅"
```

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not set"
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### Error: "jq: command not found"
```bash
# Ubuntu/Debian
sudo apt-get install jq bc

# macOS
brew install jq bc
```

### Error: "curl: (28) Connection timeout"
- Check network connectivity
- Try increasing timeout in script
- Check if ClawSec API is up: `curl https://clawsec-skill-production.up.railway.app/health`

### Error: "API rate limit exceeded"
- Wait 60 seconds between retries
- Script includes 5-second delays between tests
- Run tests one at a time if needed

---

## What Happens After Execution

Once the tests complete:

1. **Review Reports:**
   - Compare Haiku vs Sonnet reports side-by-side
   - Assess clarity, depth, actionability

2. **Analyze Metrics:**
   - Check `*-comparison.json` files
   - Calculate averages across all tests
   - Compare cost/quality ratios

3. **Generate Recommendation:**
   - Use `docs/llm-comparison.md` template
   - Fill in actual test data
   - Make production recommendation

4. **Update Trello:**
   - Add comment with results summary
   - Move card to "To Review"
   - Tag @stanhaupt1 for review

5. **Update PROJECT.md:**
   - Mark LLM testing as ✅ Done
   - Update Section 3.2 with chosen model
   - Commit and push changes

---

## Expected Results

Based on preliminary analysis:

### Basic Scan:
- **Haiku:** 2-4s, $0.01, clear and actionable
- **Sonnet:** 5-10s, $0.03, detailed and thorough
- **Winner:** Haiku (cost-benefit for simple cases)

### Complex Scan:
- **Haiku:** 3-6s, $0.015, may miss relationships
- **Sonnet:** 8-15s, $0.05, excellent at attack chains
- **Winner:** Sonnet (complexity justifies cost)

### Edge Case:
- **Haiku:** 2-3s, $0.008, brief commendations
- **Sonnet:** 4-8s, $0.025, comprehensive security advice
- **Winner:** Haiku (simple case, speed matters)

### Overall Recommendation:
- **MVP/Hackathon:** Haiku (fast, cheap, good enough)
- **Production:** Tiered pricing (Haiku standard, Sonnet premium)
- **Enterprise:** Sonnet (quality matters more than cost)

---

## Manual Execution (If Scripts Fail)

If automated scripts don't work, you can test manually:

### Step 1: Test ClawSec API
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d @test-configs/basic-scan.json \
  https://clawsec-skill-production.up.railway.app/api/v1/scan \
  | jq '.'
```

### Step 2: Test Haiku
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 4096,
    "temperature": 0.3,
    "messages": [{
      "role": "user",
      "content": "Generate a security report for this scan: [paste scan results]"
    }]
  }' \
  https://api.anthropic.com/v1/messages \
  | jq '.content[0].text'
```

### Step 3: Test Sonnet
(Same as Haiku but change model to `claude-3-5-sonnet-20241022`)

---

## Success Criteria

✅ Test completes without errors  
✅ All 6 reports generated (3 configs × 2 models)  
✅ Comparison metrics calculated  
✅ Reports are properly formatted markdown  
✅ Quality differences are observable  
✅ Cost and timing data captured  

---

## Next Steps After Success

1. **Analyze Results** - Review all 6 reports
2. **Score Quality** - Use evaluation rubric (accuracy, clarity, completeness, actionability)
3. **Calculate Averages** - Cost, time, tokens across all tests
4. **Make Recommendation** - Document in `docs/llm-comparison.md`
5. **Update Trello** - Move card to "To Review"
6. **Update PROJECT.md** - Mark section 3.2 complete
7. **Commit and Push** - Save all changes to repo

---

## Support

**Blocker?** Add Trello comment:
```
@stanhaupt1 LLM test blocked: [describe issue]
Environment: [paste error]
Need: [what would unblock you]
```

**Questions?** Check:
- `docs/llm-comparison-preliminary.md` - Expected results
- `docs/llm-comparison.md` - Analysis template
- `TEST-EXECUTION-GUIDE.md` - Detailed instructions
- `test-llm-comparison.js` - Source code
