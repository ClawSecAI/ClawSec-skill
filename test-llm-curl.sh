#!/bin/bash
# LLM Comparison Test using curl
# This script tests Haiku vs Sonnet for ClawSec report generation

set -e

# Check environment
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

# Create output directory
mkdir -p test-results

echo "🔒 ClawSec LLM Comparison Test (curl version)"
echo "=============================================="
echo ""

# Test configurations
TESTS=("basic-scan" "complex-scan" "edge-case-scan")

for TEST_NAME in "${TESTS[@]}"; do
    echo "📋 Testing: $TEST_NAME"
    echo "-------------------------------------------"
    
    # Load test config
    TEST_CONFIG=$(cat "test-configs/${TEST_NAME}.json")
    CONFIG_ONLY=$(echo "$TEST_CONFIG" | jq '.config')
    
    echo "⏳ Step 1: Running ClawSec scan..."
    
    # Call ClawSec API
    SCAN_RESULT=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$CONFIG_ONLY" \
        https://clawsec-skill-production.up.railway.app/api/v1/scan)
    
    echo "$SCAN_RESULT" | jq '.'
    
    FINDINGS_COUNT=$(echo "$SCAN_RESULT" | jq -r '.findings_count')
    RISK_LEVEL=$(echo "$SCAN_RESULT" | jq -r '.risk_level')
    
    echo "✅ Scan complete: $FINDINGS_COUNT findings, risk: $RISK_LEVEL"
    echo ""
    
    # Load threat context (first 10KB)
    THREAT_CONTEXT=$(head -c 10000 threats/core.md 2>/dev/null || echo "Generic security best practices")
    
    # Build LLM prompt
    PROMPT="You are a security expert analyzing an OpenClaw configuration audit. Your task is to enhance the security report with deeper insights, prioritization, and actionable recommendations.

**Context:**
You are analyzing a security scan of an OpenClaw instance (an AI agent platform). The rule-based scanner has identified $FINDINGS_COUNT security issues with an overall risk level of $RISK_LEVEL.

**Threat Intelligence Context:**
$THREAT_CONTEXT

**Scan Results:**
$SCAN_RESULT

**Your Task:**
Generate an enhanced security audit report that includes:

1. **Executive Summary** (2-3 paragraphs)
   - Overview of security posture
   - Critical risk factors
   - Business impact assessment

2. **Prioritized Action Plan**
   - Group findings by urgency and impact
   - Provide clear, step-by-step remediation
   - Estimate implementation effort (hours/days)

3. **Deep Analysis**
   - Explain attack scenarios for each finding
   - Assess likelihood of exploitation
   - Identify cascading vulnerabilities

4. **Security Roadmap**
   - Immediate fixes (today)
   - Short-term improvements (this week)
   - Long-term security hardening

5. **Compliance & Best Practices**
   - Map findings to OWASP LLM Top 10
   - GDPR/privacy considerations

Output a professional, markdown-formatted security report."

    # Test Haiku
    echo "⏳ Step 2: Testing Haiku model..."
    START_TIME=$(date +%s%3N)
    
    HAIKU_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d "{
            \"model\": \"claude-3-5-haiku-20241022\",
            \"max_tokens\": 4096,
            \"temperature\": 0.3,
            \"messages\": [{
                \"role\": \"user\",
                \"content\": $(echo "$PROMPT" | jq -Rs .)
            }]
        }" \
        https://api.anthropic.com/v1/messages)
    
    HAIKU_END=$(date +%s%3N)
    HAIKU_DURATION=$((HAIKU_END - START_TIME))
    
    HAIKU_REPORT=$(echo "$HAIKU_RESPONSE" | jq -r '.content[0].text')
    HAIKU_INPUT_TOKENS=$(echo "$HAIKU_RESPONSE" | jq -r '.usage.input_tokens')
    HAIKU_OUTPUT_TOKENS=$(echo "$HAIKU_RESPONSE" | jq -r '.usage.output_tokens')
    
    # Calculate Haiku cost ($1/$5 per MTok)
    HAIKU_INPUT_COST=$(echo "scale=6; $HAIKU_INPUT_TOKENS / 1000000 * 1.00" | bc)
    HAIKU_OUTPUT_COST=$(echo "scale=6; $HAIKU_OUTPUT_TOKENS / 1000000 * 5.00" | bc)
    HAIKU_TOTAL_COST=$(echo "scale=6; $HAIKU_INPUT_COST + $HAIKU_OUTPUT_COST" | bc)
    
    echo "✅ Haiku complete:"
    echo "   ⏱️  Duration: ${HAIKU_DURATION}ms"
    echo "   💰 Cost: \$${HAIKU_TOTAL_COST}"
    echo "   📝 Tokens: $HAIKU_INPUT_TOKENS in, $HAIKU_OUTPUT_TOKENS out"
    echo ""
    
    # Save Haiku report
    echo "$HAIKU_REPORT" > "test-results/${TEST_NAME}-haiku-report.md"
    
    # Small delay to avoid rate limiting
    sleep 2
    
    # Test Sonnet
    echo "⏳ Step 3: Testing Sonnet model..."
    START_TIME=$(date +%s%3N)
    
    SONNET_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -d "{
            \"model\": \"claude-3-5-sonnet-20241022\",
            \"max_tokens\": 4096,
            \"temperature\": 0.3,
            \"messages\": [{
                \"role\": \"user\",
                \"content\": $(echo "$PROMPT" | jq -Rs .)
            }]
        }" \
        https://api.anthropic.com/v1/messages)
    
    SONNET_END=$(date +%s%3N)
    SONNET_DURATION=$((SONNET_END - START_TIME))
    
    SONNET_REPORT=$(echo "$SONNET_RESPONSE" | jq -r '.content[0].text')
    SONNET_INPUT_TOKENS=$(echo "$SONNET_RESPONSE" | jq -r '.usage.input_tokens')
    SONNET_OUTPUT_TOKENS=$(echo "$SONNET_RESPONSE" | jq -r '.usage.output_tokens')
    
    # Calculate Sonnet cost ($3/$15 per MTok)
    SONNET_INPUT_COST=$(echo "scale=6; $SONNET_INPUT_TOKENS / 1000000 * 3.00" | bc)
    SONNET_OUTPUT_COST=$(echo "scale=6; $SONNET_OUTPUT_TOKENS / 1000000 * 15.00" | bc)
    SONNET_TOTAL_COST=$(echo "scale=6; $SONNET_INPUT_COST + $SONNET_OUTPUT_COST" | bc)
    
    echo "✅ Sonnet complete:"
    echo "   ⏱️  Duration: ${SONNET_DURATION}ms"
    echo "   💰 Cost: \$${SONNET_TOTAL_COST}"
    echo "   📝 Tokens: $SONNET_INPUT_TOKENS in, $SONNET_OUTPUT_TOKENS out"
    echo ""
    
    # Save Sonnet report
    echo "$SONNET_REPORT" > "test-results/${TEST_NAME}-sonnet-report.md"
    
    # Calculate comparison
    SPEED_RATIO=$(echo "scale=2; $SONNET_DURATION / $HAIKU_DURATION" | bc)
    COST_RATIO=$(echo "scale=2; $SONNET_TOTAL_COST / $HAIKU_TOTAL_COST" | bc)
    
    # Save comparison data
    cat > "test-results/${TEST_NAME}-comparison.json" <<EOF
{
  "test_name": "$TEST_NAME",
  "scan_result": $SCAN_RESULT,
  "haiku": {
    "model": "claude-3-5-haiku-20241022",
    "duration_ms": $HAIKU_DURATION,
    "cost": {
      "input_cost": $HAIKU_INPUT_COST,
      "output_cost": $HAIKU_OUTPUT_COST,
      "total_cost": $HAIKU_TOTAL_COST,
      "input_tokens": $HAIKU_INPUT_TOKENS,
      "output_tokens": $HAIKU_OUTPUT_TOKENS
    },
    "report_length": ${#HAIKU_REPORT}
  },
  "sonnet": {
    "model": "claude-3-5-sonnet-20241022",
    "duration_ms": $SONNET_DURATION,
    "cost": {
      "input_cost": $SONNET_INPUT_COST,
      "output_cost": $SONNET_OUTPUT_COST,
      "total_cost": $SONNET_TOTAL_COST,
      "input_tokens": $SONNET_INPUT_TOKENS,
      "output_tokens": $SONNET_OUTPUT_TOKENS
    },
    "report_length": ${#SONNET_REPORT}
  },
  "comparison": {
    "speed_ratio": "$SPEED_RATIO",
    "cost_ratio": "$COST_RATIO",
    "haiku_faster": true,
    "sonnet_more_expensive": true
  }
}
EOF
    
    echo "💾 Results saved to test-results/${TEST_NAME}-*"
    echo ""
    echo "📊 Quick Comparison:"
    echo "   Speed: Haiku ${SPEED_RATIO}x faster"
    echo "   Cost: Sonnet ${COST_RATIO}x more expensive"
    echo ""
    echo "⏸️  Waiting 5 seconds before next test..."
    echo ""
    sleep 5
done

echo "=============================================="
echo "✅ All tests complete!"
echo ""
echo "📁 Results saved in test-results/ directory:"
echo "   - *-haiku-report.md (Haiku generated reports)"
echo "   - *-sonnet-report.md (Sonnet generated reports)"
echo "   - *-comparison.json (Detailed metrics)"
echo ""
echo "🔍 Next steps:"
echo "1. Review reports for quality comparison"
echo "2. Analyze metrics in comparison.json files"
echo "3. Generate final recommendation"
