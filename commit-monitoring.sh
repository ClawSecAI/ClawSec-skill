#!/bin/bash
# Commit and push monitoring implementation

cd /root/.openclaw/workspace/clawsec

echo "📝 Staging monitoring changes..."

# Add all modified and new files
git add server/index.js
git add docs/monitoring-setup.md
git add test-monitoring.js
git add package.json
git add .env
git add README.md
git add PROJECT.md

echo "✅ Files staged"
echo ""

echo "📊 Git status:"
git status --short
echo ""

echo "💾 Committing changes..."
git commit -m "feat: Add comprehensive production monitoring

- Enhanced /health endpoint with system metrics (CPU, memory, uptime)
- Integrated Sentry error tracking and performance monitoring
- Added structured JSON logging with request IDs and business metrics
- Created comprehensive monitoring setup guide (docs/monitoring-setup.md)
- Added Railway Observability Dashboard configuration guide
- Documented uptime monitoring setup (Better Uptime / UptimeRobot)
- Implemented slow request detection and alerting
- Added monitoring test suite (test-monitoring.js)
- Updated README with monitoring section and quick setup
- Updated PROJECT.md Section 6.2 to mark monitoring as complete

Monitoring stack:
- Railway Dashboard (built-in metrics, logs, alerts)
- Sentry (optional error tracking, APM)
- Better Uptime (optional external uptime checks)
- Enhanced logging (structured JSON with performance metrics)

Deliverables:
- docs/monitoring-setup.md (19KB comprehensive guide)
- Enhanced /health endpoint with 12+ metrics
- Sentry SDK integration (optional dependencies)
- Test suite for monitoring features
- Alert configuration templates
- Incident response runbook

Trello Card: #39 - Railway Health Monitoring
Status: ✅ Complete - Production Ready"

if [ $? -eq 0 ]; then
    echo "✅ Commit successful"
    echo ""
    
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Push successful!"
        echo ""
        echo "🎉 Monitoring implementation complete and pushed to GitHub"
        echo ""
        echo "Next steps:"
        echo "  1. Post comment to Trello card with completion details"
        echo "  2. Move card to 'To Review' list"
        echo "  3. Notify Stan (@stanhaupt1) for review"
    else
        echo "❌ Push failed"
        exit 1
    fi
else
    echo "❌ Commit failed"
    exit 1
fi
