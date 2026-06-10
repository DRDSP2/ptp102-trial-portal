#!/bin/bash
set -e

echo "🚀 PTP-102 Trial Portal — Build & Deploy Prep"
echo "================================================"

# Verify we're in project root
if [ ! -d "src" ]; then
    echo "❌ Error: Run this script from the project root (where src/ and dist/ are)"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building production bundle..."
npm run build

echo ""
echo "✅ Step 3: Verifying build output..."
if [ ! -f "../dist/index.html" ]; then
    echo "❌ Build failed: dist/index.html not found"
    exit 1
fi

echo "   → dist/index.html ✓"

ASSETS=$(ls ../dist/assets/ | wc -l | tr -d ' ')
echo "   → dist/assets/ ($ASSETS files) ✓"

if [ -f "../dist/_redirects" ]; then
    echo "   → dist/_redirects (SPA routing) ✓"
else
    echo "   ⚠️ dist/_redirects missing — SPA routing may not work on Cloudflare Pages"
fi

if [ -f "../dist/_headers" ]; then
    echo "   → dist/_headers (security headers) ✓"
else
    echo "   ⚠️ dist/_headers missing — security headers not applied"
fi

echo ""
echo "📊 Build Summary:"
echo "   Bundle size: $(du -sh ../dist/ | cut -f1)"

echo ""
echo "🎉 Build successful! You're ready to deploy."
echo ""
echo "Next steps:"
echo "   1. Commit and push to GitHub"
echo "   2. Connect Cloudflare Pages to your repo"
echo "   3. Follow DEPLOYMENT.md for full instructions"
echo ""
