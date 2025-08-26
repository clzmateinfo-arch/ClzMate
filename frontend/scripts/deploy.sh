#!/bin/bash
set -euo pipefail

echo "🚀 Starting deployment script..."
cd "$(dirname "$0")"

echo "🧹 Cleaning up node_modules..."
rm -rf node_modules

echo "📦 Installing dependencies..."

npm cache clean --force

if [ -f package-lock.json ]; then
  echo "Using npm ci with dev deps and legacy-peer-deps..."
  npm ci --include=dev --legacy-peer-deps
else
  echo "No package-lock.json found, using npm install with dev deps..."
  npm install --include=dev --legacy-peer-deps
fi

echo "⚡ Running build..."
npm run build:render

echo "✅ Build finished."
