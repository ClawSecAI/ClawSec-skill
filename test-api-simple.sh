#!/bin/bash
# Simple API test using curl (no Node.js required)

echo "🔒 ClawSec API Test"
echo "=================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "Test 1: Health Check"
echo "-------------------"
HEALTH=$(curl -s https://clawsec-skill-production.up.railway.app/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ PASS${NC} - API is healthy"
    echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ FAIL${NC} - API health check failed"
    echo "$HEALTH"
    exit 1
fi

echo ""
echo "Test 2: API Info"
echo "----------------"
API_INFO=$(curl -s https://clawsec-skill-production.up.railway.app/api/v1)
if echo "$API_INFO" | grep -q "ClawSec API"; then
    echo -e "${GREEN}✅ PASS${NC} - API info retrieved"
    echo "$API_INFO" | jq '.' 2>/dev/null || echo "$API_INFO"
else
    echo -e "${RED}❌ FAIL${NC} - API info retrieval failed"
    echo "$API_INFO"
    exit 1
fi

echo ""
echo "Test 3: Basic Scan"
echo "------------------"

# Create temp file with test config
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << 'EOF'
{
  "gateway": {
    "token": "test-123",
    "bind": "0.0.0.0"
  },
  "channels": {
    "telegram": {
      "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890"
    }
  }
}
EOF

SCAN_RESULT=$(curl -s -X POST \
  https://clawsec-skill-production.up.railway.app/api/v1/scan \
  -H "Content-Type: application/json" \
  -d @"$TEMP_CONFIG")

rm "$TEMP_CONFIG"

if echo "$SCAN_RESULT" | grep -q "scan_id"; then
    echo -e "${GREEN}✅ PASS${NC} - Scan completed successfully"
    
    # Extract key info
    FINDINGS=$(echo "$SCAN_RESULT" | jq -r '.findings_count' 2>/dev/null)
    RISK=$(echo "$SCAN_RESULT" | jq -r '.risk_level' 2>/dev/null)
    
    echo ""
    echo "Scan Results:"
    echo "  Findings: $FINDINGS"
    echo "  Risk Level: $RISK"
    echo ""
    
    # Show first 500 chars of report
    REPORT=$(echo "$SCAN_RESULT" | jq -r '.report' 2>/dev/null)
    echo "Report excerpt:"
    echo "$REPORT" | head -c 500
    echo ""
    echo "[... truncated ...]"
else
    echo -e "${RED}❌ FAIL${NC} - Scan failed"
    echo "$SCAN_RESULT"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "API is working correctly."
echo "Ready to run LLM comparison tests."
echo ""
echo "Next step:"
echo "  cd /root/.openclaw/workspace/clawsec"
echo "  node test-llm-comparison.js"
echo "========================================="
