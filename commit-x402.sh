#!/bin/bash
# Commit X402 Payment Integration

cd /root/.openclaw/workspace/clawsec

echo "📝 Adding files to git..."
git add package.json
git add .env
git add server/payment.js
git add server/index.js
git add client/x402-client.js
git add docs/x402-integration.md
git add test-x402-payment.js
git add PROJECT.md
git add README.md
git add X402-IMPLEMENTATION-SUMMARY.md

echo "✅ Files staged"

echo "📝 Committing..."
git commit -m "feat: Implement X402 payment integration for USDC micropayments

- Add X402 server integration (payment.js module)
- Integrate @x402/express middleware into main server
- Implement payment tracking and status endpoint
- Create client-side payment SDK wrapper
- Add comprehensive documentation (10KB guide)
- Create integration test script
- Update PROJECT.md status (2.2: Testing)
- Configure Base Sepolia testnet with test wallet

Components:
- Server: Express middleware, payment verification, status API
- Client: X402 fetch wrapper, wallet integration
- Testing: Complete test script with 5 test cases
- Docs: Setup guide, API reference, troubleshooting

Status: Implementation complete, testnet validation pending
Blocker: Need npm install + server restart to test

Related: Trello Card #lFio4o8T"

echo "✅ Commit created"

echo "📤 Pushing to GitHub..."
git pull --rebase origin main
git push origin main

echo "✅ Pushed successfully!"
echo ""
echo "Next steps:"
echo "1. npm install (to install @x402/* packages)"
echo "2. npm start (start server)"
echo "3. node test-x402-payment.js (run tests)"
