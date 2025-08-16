#!/bin/bash
set -e

echo "🚀 Starting deployment script..."

cd "$(dirname "$0")"

echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install
