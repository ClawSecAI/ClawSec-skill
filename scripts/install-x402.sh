#!/bin/bash
# X402 SDK Installation Script
# Run from clawsec/ directory: bash scripts/install-x402.sh

set -e  # Exit on error

echo "🔧 Installing X402 SDK packages..."
echo ""

cd "$(dirname "$0")/.." || exit 1

echo "Current directory: $(pwd)"
echo ""

# Install X402 packages
echo "📦 Installing @x402/express, @x402/evm, @x402/core..."
npm install @x402/express @x402/evm @x402/core

echo ""
echo "✅ X402 SDK installation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure CDP_CLIENT_API_KEY and CDP_SECRET_API_KEY are in .env"
echo "2. Add WALLET_ADDRESS to .env (your Base Sepolia wallet)"
echo "3. Update server/index.js with X402 middleware (see server/index-x402.js)"
echo "4. Test integration: npm start"
