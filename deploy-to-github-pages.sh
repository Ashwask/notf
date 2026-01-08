#!/bin/bash

set -e

cd ~/Documents/GitHub/notf

echo "1. Building website..."
cd website
npm install --silent
npm run build

echo "2. Copying to docs..."
cd ..
rm -rf docs/*
cp -r website/_site/* docs/

echo "3. Verifying pages..."
for page in index about members communities resources; do
    if [ -f "docs/${page}/index.html" ] || [ -f "docs/${page}.html" ]; then
        echo "   ✓ ${page} page exists"
    else
        echo "   ✗ ${page} page MISSING"
    fi
done

echo "4. Committing and pushing..."
git add .
git commit -m "Deploy: $(date +%Y-%m-%d)" || echo "No changes to commit"
git push

echo ""
echo "✓ Deployed!"
echo "Check: https://urbanmorph.github.io/notf/"
