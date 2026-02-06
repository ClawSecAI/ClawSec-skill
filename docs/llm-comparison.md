# ClawSec LLM Comparison: Haiku vs Sonnet for Security Audit Reports

**Date:** 2026-02-06  
**Author:** Ubik (ClawSec AI)  
**Purpose:** Determine optimal LLM for ClawSec MVP security report generation

---

## Executive Summary

**TL;DR:** [To be filled after testing]

**Test Scope:**
- **Models Tested:** Claude 3.5 Haiku vs Claude 3.5 Sonnet
- **Test Cases:** 3 configurations (basic, complex, edge-case)
- **Metrics:** Report quality, accuracy, cost, speed
- **Total Tests:** 6 LLM-enhanced reports generated

**Recommendation:** [To be filled after analysis]

---

## Test Setup & Methodology

### Test Environment
- **ClawSec API:** https://clawsec-skill-production.up.railway.app
- **Models:**
  - **Haiku:** `claude-3-5-haiku-20241022`
    - Pricing: ~$1.00/MTok input, ~$5.00/MTok output
    - Expected: Fast, cost-effective, good for basic analysis
  - **Sonnet:** `claude-3-5-sonnet-20241022`
    - Pricing: ~$3.00/MTok input, ~$15.00/MTok output
    - Expected: Thorough, detailed, best for complex analysis

### Test Methodology

1. **Baseline Scan**
   - Send test configuration to ClawSec API
   - Receive rule-based security findings
   - Record: finding count, risk level, scan time

2. **LLM Enhancement**
   - Feed findings + threat context to each model
   - Prompt: Generate comprehensive security audit report
   - Record: response time, token usage, output length

3. **Quality Assessment**
   - Accuracy: Does the report correctly interpret findings?
   - Completeness: Are all issues covered adequately?
   - Actionability: Are recommendations specific and practical?
   - Clarity: Is the report easy to understand?
   - False positives: Any hallucinated or incorrect analysis?

4. **Cost Calculation**
   - Actual token usage from API responses
   - Calculate per-scan cost at current pricing
   - Estimate monthly costs at scale (100-1000 scans)

5. **Speed Measurement**
   - Measure API latency for each model
   - Assess suitability for production (< 30s ideal)

### Test Cases

#### Test Case 1: Basic Security Scan
**File:** `test-configs/basic-scan.json`  
**Description:** Simple OpenClaw config with 3-4 known security issues  
**Expected Issues:**
- Weak gateway token (CRITICAL)
- Public gateway exposure (HIGH)
- No Telegram whitelist (MEDIUM)
- Unrestricted exec (HIGH)

**Purpose:** Test model performance on straightforward vulnerabilities with clear remediation paths.

#### Test Case 2: Complex Security Scan
**File:** `test-configs/complex-scan.json`  
**Description:** Complex configuration with 10+ issues across multiple categories  
**Expected Issues:**
- Multiple hardcoded credentials
- Exposed API keys (OpenAI, Anthropic, GitHub)
- Multiple bot tokens (Telegram, Discord, Slack)
- Unrestricted tool execution
- Insecure browser/fetch configurations
- Unencrypted session storage
- Network exposure issues

**Purpose:** Test model depth of analysis, ability to identify relationships between vulnerabilities, and prioritization skills.

#### Test Case 3: Edge Case Scan
**File:** `test-configs/edge-case-scan.json`  
**Description:** Mostly secure configuration with best practices implemented  
**Expected Issues:**
- Minimal or zero findings
- All secrets use environment variables
- Rate limiting enabled
- Session encryption configured
- Network isolation properly set

**Purpose:** Test model's false positive rate, ability to recognize secure configurations, and whether it provides value even when few issues exist.

---

## Test Results

### Test Case 1: Basic Security Scan

#### Baseline Scan Results
```json
[Results to be inserted]
```

#### Haiku Results
- **Duration:** [To be filled]
- **Cost:** [To be filled]
- **Input Tokens:** [To be filled]
- **Output Tokens:** [To be filled]
- **Report Length:** [To be filled] characters

**Report Excerpt:**
```
[First 500 characters of Haiku report]
```

#### Sonnet Results
- **Duration:** [To be filled]
- **Cost:** [To be filled]
- **Input Tokens:** [To be filled]
- **Output Tokens:** [To be filled]
- **Report Length:** [To be filled] characters

**Report Excerpt:**
```
[First 500 characters of Sonnet report]
```

---

### Test Case 2: Complex Security Scan

#### Baseline Scan Results
```json
[Results to be inserted]
```

#### Haiku Results
[To be filled]

#### Sonnet Results
[To be filled]

---

### Test Case 3: Edge Case Scan

#### Baseline Scan Results
```json
[Results to be inserted]
```

#### Haiku Results
[To be filled]

#### Sonnet Results
[To be filled]

---

## Quality Comparison

### Accuracy
| Metric | Haiku | Sonnet | Winner |
|--------|-------|--------|--------|
| Correct vulnerability interpretation | [TBD]% | [TBD]% | [TBD] |
| False positive rate | [TBD]% | [TBD]% | [TBD] |
| Attack scenario accuracy | [TBD]/5 | [TBD]/5 | [TBD] |
| Remediation correctness | [TBD]/5 | [TBD]/5 | [TBD] |

### Completeness
| Metric | Haiku | Sonnet | Winner |
|--------|-------|--------|--------|
| All findings covered | [TBD] | [TBD] | [TBD] |
| Context depth | [TBD]/5 | [TBD]/5 | [TBD] |
| Additional insights | [TBD]/5 | [TBD]/5 | [TBD] |
| OWASP mapping | [TBD]/5 | [TBD]/5 | [TBD] |

### Actionability
| Metric | Haiku | Sonnet | Winner |
|--------|-------|--------|--------|
| Specificity of recommendations | [TBD]/5 | [TBD]/5 | [TBD] |
| Code examples provided | [TBD] | [TBD] | [TBD] |
| Prioritization clarity | [TBD]/5 | [TBD]/5 | [TBD] |
| Implementation guidance | [TBD]/5 | [TBD]/5 | [TBD] |

### Clarity & Presentation
| Metric | Haiku | Sonnet | Winner |
|--------|-------|--------|--------|
| Executive summary quality | [TBD]/5 | [TBD]/5 | [TBD] |
| Technical accuracy | [TBD]/5 | [TBD]/5 | [TBD] |
| Non-technical readability | [TBD]/5 | [TBD]/5 | [TBD] |
| Report structure | [TBD]/5 | [TBD]/5 | [TBD] |

---

## Cost Analysis

### Per-Scan Cost

| Model | Avg Input Tokens | Avg Output Tokens | Avg Cost per Scan | Notes |
|-------|-----------------|-------------------|-------------------|-------|
| Haiku | [TBD] | [TBD] | $[TBD] | [Analysis] |
| Sonnet | [TBD] | [TBD] | $[TBD] | [Analysis] |

**Cost Difference:** Sonnet is [TBD]x more expensive than Haiku per scan.

### Monthly Cost Projections

Assuming varying usage levels:

| Usage Level | Scans/Month | Haiku Cost | Sonnet Cost | Difference |
|-------------|-------------|------------|-------------|------------|
| Light (MVP) | 100 | $[TBD] | $[TBD] | $[TBD] |
| Medium | 500 | $[TBD] | $[TBD] | $[TBD] |
| Heavy | 1,000 | $[TBD] | $[TBD] | $[TBD] |
| Enterprise | 10,000 | $[TBD] | $[TBD] | $[TBD] |

### Token Usage Breakdown

**Average tokens per test case:**

#### Basic Scan (3-4 issues)
- Haiku: [TBD] input, [TBD] output
- Sonnet: [TBD] input, [TBD] output

#### Complex Scan (10+ issues)
- Haiku: [TBD] input, [TBD] output
- Sonnet: [TBD] input, [TBD] output

#### Edge Case (minimal issues)
- Haiku: [TBD] input, [TBD] output
- Sonnet: [TBD] input, [TBD] output

---

## Performance Analysis

### Speed Comparison

| Model | Avg Response Time | Min | Max | Suitable for Production? |
|-------|------------------|-----|-----|-------------------------|
| Haiku | [TBD]s | [TBD]s | [TBD]s | [TBD] |
| Sonnet | [TBD]s | [TBD]s | [TBD]s | [TBD] |

**Speed Difference:** Haiku is [TBD]x faster than Sonnet.

**Production Considerations:**
- Target: < 30 seconds for good UX
- Haiku: [Analysis]
- Sonnet: [Analysis]

### Scalability

**Throughput estimates:**
- Haiku: ~[TBD] scans/minute (based on avg response time)
- Sonnet: ~[TBD] scans/minute (based on avg response time)

**Rate limit considerations:**
- Anthropic API limits: [TBD] requests/minute
- Recommended: Implement queueing for burst traffic

---

## Side-by-Side Report Comparison

### Example: Basic Scan - Gateway Token Vulnerability

#### Haiku's Analysis:
```
[Full section from Haiku report]
```

#### Sonnet's Analysis:
```
[Full section from Sonnet report]
```

#### Comparison:
- **Depth:** [Analysis]
- **Actionability:** [Analysis]
- **Accuracy:** [Analysis]
- **Value:** [Analysis]

---

## Qualitative Observations

### Haiku Strengths
[To be filled after testing]

### Haiku Weaknesses
[To be filled after testing]

### Sonnet Strengths
[To be filled after testing]

### Sonnet Weaknesses
[To be filled after testing]

### Unexpected Findings
[To be filled after testing]

---

## Final Recommendation

### For ClawSec MVP

**Recommended Model:** [TO BE DETERMINED]

**Rationale:**
[Detailed reasoning based on:
- Quality needs for MVP
- Budget constraints
- Performance requirements
- User expectations
- Competition analysis]

### Hybrid Approach Consideration

**Option:** Tier-based model selection
- **Free/Basic tier:** Haiku (fast, good enough)
- **Pro tier:** Sonnet (premium analysis)
- **Enterprise tier:** Sonnet + human review

**Pros:**
- Optimize cost vs quality tradeoff
- Offer differentiated pricing
- Scale efficiently

**Cons:**
- More complex implementation
- Harder to benchmark/market
- Need to explain tiers to users

### Implementation Plan

**If Haiku wins:**
1. [Steps]

**If Sonnet wins:**
1. [Steps]

**If Hybrid:**
1. [Steps]

---

## Conclusion

[Summary paragraph]

**Key Metrics:**
- ✅ Quality: [Winner] by [margin]
- ✅ Cost: [Winner] by [margin]
- ✅ Speed: [Winner] by [margin]
- ✅ Overall: [Recommendation]

**Next Steps:**
1. [Action items based on recommendation]
2. Update server to use chosen model
3. Document decision in PROJECT.md
4. Update pricing/marketing accordingly

---

## Appendix

### Full Report Samples

[Link to full report files in test-results/]

### Raw Test Data

[Link to JSON files with complete test results]

### Test Execution Logs

[Link to console logs if relevant]

---

*Last Updated: 2026-02-06*  
*Testing Status: [IN PROGRESS / COMPLETE]*
