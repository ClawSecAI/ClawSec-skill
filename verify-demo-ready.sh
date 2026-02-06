#!/bin/bash
# Quick verification script for demo readiness

echo "============================================================"
echo "🔒 ClawSec Demo Readiness Check"
echo "============================================================"
echo ""

SERVER_URL="https://clawsec-skill-production.up.railway.app"
ERRORS=0

# Check 1: Server Health
echo "1️⃣  Checking server health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/health" --max-time 10)
if [ "$HEALTH" = "200" ]; then
  echo "   ✅ Server is healthy"
else
  echo "   ❌ Server health check failed (HTTP $HEALTH)"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: API Info
echo "2️⃣  Checking API info endpoint..."
API_INFO=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/v1" --max-time 10)
if [ "$API_INFO" = "200" ]; then
  echo "   ✅ API info available"
else
  echo "   ❌ API info endpoint failed (HTTP $API_INFO)"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: Threats Database
echo "3️⃣  Checking threats database..."
THREATS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/v1/threats" --max-time 10)
if [ "$THREATS" = "200" ]; then
  echo "   ✅ Threats database accessible"
else
  echo "   ❌ Threats database failed (HTTP $THREATS)"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: Scan Endpoint (quick test)
echo "4️⃣  Testing scan endpoint with minimal config..."
TEST_CONFIG='{"gateway":{"token":"test123","bind":"127.0.0.1"}}'
SCAN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVER_URL/api/v1/scan" \
  -H "Content-Type: application/json" \
  -d "$TEST_CONFIG" \
  --max-time 60)

if [ "$SCAN" = "200" ]; then
  echo "   ✅ Scan endpoint operational"
else
  echo "   ❌ Scan endpoint failed (HTTP $SCAN)"
  ERRORS=$((ERRORS + 1))
fi

# Check 5: Test Files Present
echo "5️⃣  Checking test infrastructure..."
if [ -f "E2E-TEST-REPORT.md" ] && [ -f "test-e2e-complete.js" ]; then
  echo "   ✅ Test files present"
else
  echo "   ⚠️  Some test files missing"
fi

# Check 6: Documentation
echo "6️⃣  Checking documentation..."
if [ -f "README.md" ] && [ -f "PROJECT.md" ]; then
  echo "   ✅ Documentation present"
else
  echo "   ⚠️  Some documentation missing"
fi

# Summary
echo ""
echo "============================================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ DEMO READY - All systems operational"
  echo ""
  echo "Server URL: $SERVER_URL"
  echo "Status: 🟢 LIVE"
  echo ""
  echo "Quick Test Command:"
  echo "curl -X POST \"$SERVER_URL/api/v1/scan\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"gateway\":{\"token\":\"weak-123\",\"bind\":\"0.0.0.0\"}}'"
else
  echo "⚠️  ISSUES DETECTED - $ERRORS check(s) failed"
  echo ""
  echo "Action Required:"
  echo "- Check Railway dashboard"
  echo "- Verify server logs"
  echo "- Retry in a few minutes"
fi
echo "============================================================"

exit $ERRORS
