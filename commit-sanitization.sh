#!/bin/bash
# Commit and push advanced sanitization changes

cd /root/.openclaw/workspace/clawsec

# Check git status
echo "=== Git Status ==="
git status

# Add all sanitization-related files
echo -e "\n=== Adding Files ==="
git add client/advanced-sanitizer.js
git add client/test-advanced-sanitization.js
git add client/example-usage.js
git add client/run-advanced-sanitization-tests.sh
git add docs/advanced-sanitization.md
git add PROJECT.md

# Show what will be committed
echo -e "\n=== Files Staged for Commit ==="
git diff --staged --name-only

# Commit
echo -e "\n=== Committing ==="
git commit -m "feat: Advanced sanitization for credit cards, SSNs, private keys, and 50+ credential types

- Implement comprehensive redaction engine with 50+ detection patterns
- Add credit card validation using Luhn algorithm
- Add SSN/SIN redaction with context awareness  
- Add private key detection (RSA, EC, DSA, OpenSSH, PGP)
- Add payment gateway credentials (Stripe, Square, PayPal)
- Add cloud provider keys (AWS, Azure, GCP, DigitalOcean)
- Add package manager tokens (npm, PyPI, Docker)
- Add communication service keys (Twilio, SendGrid, Mailgun)
- Add database connection strings (PostgreSQL, MySQL, MongoDB, Redis)
- Add webhook URLs (Slack, Discord)
- Add social media tokens (Telegram, Facebook, Twitter)
- Include 40+ comprehensive test cases
- Add complete API documentation
- Update PROJECT.md Section 1.3 to Done status

Trello: https://trello.com/c/nz8e77Q7
Card: Sanitization - Advanced Redaction"

# Pull with rebase to handle any remote changes
echo -e "\n=== Pulling Remote Changes ==="
git pull --rebase origin main

# Push to GitHub
echo -e "\n=== Pushing to GitHub ==="
git push origin main

echo -e "\n=== ✅ Complete ==="
