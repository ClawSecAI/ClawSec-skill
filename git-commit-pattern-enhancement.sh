#!/bin/bash
# Git commit script for Pattern Matching v0.3.0 enhancement
# ClawSec Project - Trello Card #vYDK1ayO

set -e

cd /root/.openclaw/workspace/clawsec

echo "🔄 ClawSec - Pattern Matching v0.3.0 - Git Workflow"
echo "==================================================="
echo ""

echo "📊 Checking git status..."
git status

echo ""
echo "➕ Adding changed files..."
git add server/patterns.js
git add server/test-patterns.js
git add docs/pattern-matching.md
git add PROJECT.md
git add count-patterns.js
git add run-pattern-tests.sh

echo ""
echo "📝 Committing changes..."
git commit -m "feat: Pattern Matching Engine v0.3.0 - Added 30+ new credential types (70+ total patterns)

- Enhanced pattern detection with 30 new credential types
- Categories added: Email/Communication, Monitoring, CI/CD, Social Media, Payment, Infrastructure, Cryptocurrency, Analytics
- New patterns: SendGrid, Mailgun, Twilio, Mailchimp, Datadog, New Relic, Sentry, CircleCI, Travis CI, Docker Hub, JFrog, Twitter, Facebook, LinkedIn, Square, Coinbase, DigitalOcean, Heroku, Cloudflare, Firebase, PlanetScale, Supabase, Ethereum, Bitcoin, Algolia, Elastic
- Expanded test suite from 20 to 30+ tests
- Updated documentation with comprehensive pattern reference
- Version bump: 0.2.0 → 0.3.0
- Pattern count: 40 → 70+ patterns

Trello: https://trello.com/c/vYDK1ayO
Card: Core Scanning - Pattern Enhancement"

echo ""
echo "🔄 Pulling latest changes (rebase)..."
git pull --rebase origin main

echo ""
echo "🚀 Pushing to remote (main branch)..."
git push origin main

echo ""
echo "✅ Git workflow complete!"
echo ""
echo "📋 Next step: Update Trello card and move to 'To Review'"
