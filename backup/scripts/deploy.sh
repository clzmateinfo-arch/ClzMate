#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "Dependencies installed. Start with: npm start"
