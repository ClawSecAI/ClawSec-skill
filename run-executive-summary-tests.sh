#!/bin/bash
# Run executive summary tests

cd "$(dirname "$0")/server/lib"
chmod +x test-executive-summary.js
node test-executive-summary.js
