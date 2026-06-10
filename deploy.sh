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
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed: dist/index.html not found"
    exit 1
fi

echo "   → dist/index.html ✓"

ASSETS=$(ls dist/assets/ | wc -l | tr -d ' ')
echo "   → dist/assets/ ($ASSETS files) ✓"

echo ""
echo "📊 Build Summary:"
echo "   Bundle size: $(du -sh dist/ | cut -f1)"

echo ""
echo "🎉 Build successful!"
echo ""
echo "Next steps:"
echo "   1. Commit and push to GitHub"
echo "   2. 4EVERLAND will auto-deploy from the main branch"
echo "   3. Check 4EVERLAND dashboard for the live URL"
echo ""
echo "⚠️  Important:"
echo "   - Data persists via browser localStorage on 4EVERLAND"
echo "   - No Google Auth — vets use email/password + T&C acceptance"
echo "   - Admin login: drdsp@pm.me / PTP102"
echo ""
