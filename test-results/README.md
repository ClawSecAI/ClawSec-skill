# Test Results Directory

This directory will contain the output from LLM comparison tests.

## Expected Files (After Test Execution)

### Reports (6 files):
- `basic-scan-haiku-report.md` - Haiku's report for basic config
- `basic-scan-sonnet-report.md` - Sonnet's report for basic config
- `complex-scan-haiku-report.md` - Haiku's report for complex config
- `complex-scan-sonnet-report.md` - Sonnet's report for complex config
- `edge-case-scan-haiku-report.md` - Haiku's report for edge case
- `edge-case-scan-sonnet-report.md` - Sonnet's report for edge case

### Metrics (3 files):
- `basic-scan-comparison.json` - Detailed metrics for basic scan
- `complex-scan-comparison.json` - Detailed metrics for complex scan
- `edge-case-scan-comparison.json` - Detailed metrics for edge case

### Summary (1 file):
- `summary.json` - Aggregated results across all tests (optional)

## How to Generate Results

Run one of these commands from the clawsec directory:

```bash
# Bash version (recommended)
./test-llm-curl.sh

# Node.js version
node test-llm-comparison.js
```

See `../EXECUTE-LLM-TEST.md` for detailed instructions.

## What to Do With Results

1. **Read the reports** - Compare quality, depth, actionability
2. **Check the metrics** - Cost, speed, token usage
3. **Use the template** - Fill in `../docs/llm-comparison-analysis-template.md`
4. **Make recommendation** - Which model for production?
5. **Update Trello** - Move card to "To Review" with summary

## Analysis Checklist

After tests complete:

- [ ] All 9 expected files exist
- [ ] Reports are properly formatted markdown
- [ ] Metrics show cost and timing data
- [ ] Read all 6 reports for quality comparison
- [ ] Fill in analysis template with results
- [ ] Calculate averages across all tests
- [ ] Make final model recommendation
- [ ] Update PROJECT.md with chosen model
- [ ] Update Trello card
- [ ] Commit and push results

## Cost Breakdown

Expected costs (may vary slightly):

| Test | Haiku | Sonnet | Total |
|------|-------|--------|-------|
| Basic | ~$0.008 | ~$0.030 | ~$0.038 |
| Complex | ~$0.015 | ~$0.050 | ~$0.065 |
| Edge Case | ~$0.006 | ~$0.025 | ~$0.031 |
| **Total** | **~$0.029** | **~$0.105** | **~$0.134** |

Total cost for full test suite: **~$0.15**

## Timing Estimates

Expected durations:

| Test | Haiku | Sonnet | Total |
|------|-------|--------|-------|
| Basic | 2-4s | 5-10s | ~15s |
| Complex | 3-6s | 8-15s | ~20s |
| Edge Case | 2-3s | 4-8s | ~12s |
| **Total** | **~8s** | **~25s** | **~47s active** |

Total execution time: **5-10 minutes** (including delays and API calls)

## Troubleshooting

### No files generated?
- Check that test script ran successfully
- Look for errors in console output
- Verify ANTHROPIC_API_KEY is set
- Check network connectivity

### Incomplete files?
- Test may have been interrupted
- Check for API rate limiting
- Review error messages in console
- Try running tests individually

### Quality issues?
- Reports may still be valuable even if not perfect
- Compare what you have
- Document limitations in analysis
- Consider re-running specific tests

## Support

Questions? Check:
- `../EXECUTE-LLM-TEST.md` - Execution guide
- `../LLM-TEST-STATUS.md` - Current status
- `../docs/llm-comparison-analysis-template.md` - Analysis framework
- `../SUBAGENT-HANDOFF.md` - Complete context

---

**Status:** Awaiting test execution  
**Last Updated:** 2026-02-06 20:35 UTC
