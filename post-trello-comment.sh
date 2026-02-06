#!/bin/bash
# Post integration test results to Trello card

CARD_ID="6985c368cb871d55fac7676d"
COMMENT_FILE="trello-comment.md"

# Read comment from file
COMMENT=$(cat "$COMMENT_FILE")

# Post to Trello (curl will handle URL encoding)
curl -X POST \
  "https://api.trello.com/1/cards/${CARD_ID}/actions/comments" \
  -H "Accept: application/json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "text=${COMMENT}" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}"

echo ""
echo "✅ Comment posted to Trello card ${CARD_ID}"
