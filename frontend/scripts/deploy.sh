#!/bin/bash
set -e

echo "🚀 Starting deployment script..."

cd "$(dirname "$0")"

echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm cache clean --force
npm install --legacy-peer-deps

echo "⚡ Running build..."
npm run build:render
