#!/bin/bash

# ClawSec Server Health Check
# Quick script to verify Railway server is operational

SERVER="https://clawsec-skill-production.up.railway.app"

echo "🔍 Testing ClawSec Server..."
echo "================================"

# Test 1: Health endpoint
echo -e "\n1. Health Check:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "${SERVER}/health" | head -20

# Test 2: API version
echo -e "\n2. API Version:"
curl -s -w "\nStatus: %{http_code}\n" \
  "${SERVER}/api/v1" | head -20

# Test 3: Threat database
echo -e "\n3. Threat Database:"
curl -s -w "\nStatus: %{http_code}\n" \
  "${SERVER}/api/v1/threats" | head -20

# Test 4: DNS resolution
echo -e "\n4. DNS Resolution:"
nslookup clawsec-skill-production.up.railway.app | grep "Address:" | tail -2

# Test 5: TLS certificate
echo -e "\n5. TLS Certificate:"
echo | openssl s_client -connect clawsec-skill-production.up.railway.app:443 2>/dev/null | \
  grep -A 2 "subject="

echo -e "\n✅ Server health check complete!"
