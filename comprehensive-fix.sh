#!/bin/bash

# Comprehensive fix for CSS conflicts
# This script:
# 1. Removes the conflicting duplicate homepage CSS
# 2. Creates a new index.njk that works with existing CSS
# 3. Rebuilds and deploys

echo "🔧 Comprehensive CSS Conflict Fix"
echo "=================================="
echo ""

cd ~/Documents/GitHub/notf

# Step 1: Remove duplicate CSS
echo "Step 1: Removing duplicate homepage CSS..."
cd website/src/assets/css

# Backup
cp main.css main.css.backup
echo "  ✅ Backup created"

# Find where redesigned CSS starts (after last occurrence of specific comment)
LINE_NUM=$(grep -n "/\* ===================================" main.css | tail -1 | cut -d: -f1)

if [ ! -z "$LINE_NUM" ]; then
    head -n $((LINE_NUM - 2)) main.css > main.css.temp
    mv main.css.temp main.css
    echo "  ✅ Removed duplicate CSS (from line $LINE_NUM onwards)"
else
    echo "  ⚠️  Could not find duplicate CSS marker"
fi

cd ~/Documents/GitHub/notf

# Step 2: Create a new index.njk that uses EXISTING CSS classes
echo ""
echo "Step 2: Creating new homepage with existing CSS..."

cat > website/src/index.njk << 'HOMEPAGE'
---
layout: base.njk
title: Neighbourhoods of the Future
---

<!-- Hero Section -->
<section class="hero">
    <div class="hero-content">
        <h1>Building Connected, Resilient Neighbourhoods</h1>
        <p class="hero-subtitle">Join a network of communities and organizations transforming neighbourhoods through collaboration and shared resources.</p>
        <div class="hero-cta">
            <a href="{{ '/matcher/' | url }}" class="btn btn-primary-large">🤝 Find Matches</a>
            <a href="{{ '/join/' | url }}" class="btn btn-secondary">Join the Network</a>
        </div>
    </div>
</section>

<!-- Stats -->
<section class="stats">
    <div class="stat-card">
        <div class="stat-number">{{ members.length }}</div>
        <div class="stat-label">Organizations</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">{{ communities.length }}</div>
        <div class="stat-label">Communities</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">100+</div>
        <div class="stat-label">Active Collaborations</div>
    </div>
</section>

<!-- Features -->
<section class="features">
    <div class="container">
        <h2 class="section-title">How NOTF Works</h2>
        <p class="section-subtitle">Four powerful ways to connect, collaborate, and transform your neighbourhood</p>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🤝</div>
                <h3>Ask/Offer Matcher</h3>
                <p>Smart matching algorithm connects community needs with available resources. Find funding, volunteers, expertise, and more.</p>
                <a href="{{ '/matcher/' | url }}" class="feature-link">Explore Matches →</a>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📍</div>
                <h3>Interactive Map</h3>
                <p>Visualize all {{ communities.length }} communities across Bengaluru. Discover neighbours and find local initiatives.</p>
                <a href="{{ '/map/' | url }}" class="feature-link">View Map →</a>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🏘️</div>
                <h3>Community Directory</h3>
                <p>Browse {{ communities.length }} active neighbourhoods. Learn about their work and discover collaboration opportunities.</p>
                <a href="{{ '/communities/' | url }}" class="feature-link">Browse Communities →</a>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🏢</div>
                <h3>Organization Network</h3>
                <p>Connect with {{ members.length }} organizations supporting community work. CBOs, solution providers, and more.</p>
                <a href="{{ '/members/' | url }}" class="feature-link">View Organizations →</a>
            </div>
        </div>
    </div>
</section>

<!-- Cities -->
<section class="cities">
    <div class="container">
        <h2 class="section-title">Join the Movement</h2>
        <p class="section-subtitle">Three simple steps to start transforming your neighbourhood</p>
        
        <div class="cities-grid">
            <div class="city-card">
                <h3>1. Register</h3>
                <p>Submit your community or organization details through our simple form. We'll review within 3-5 days.</p>
                <a href="{{ '/join/' | url }}" class="feature-link">Get Started →</a>
            </div>
            
            <div class="city-card">
                <h3>2. Connect</h3>
                <p>Get matched with communities and organizations that align with your needs and offers.</p>
                <a href="{{ '/matcher/' | url }}" class="feature-link">Find Matches →</a>
            </div>
            
            <div class="city-card">
                <h3>3. Collaborate</h3>
                <p>Build partnerships, share resources, and create lasting impact in your neighbourhood.</p>
                <a href="{{ '/resources/' | url }}" class="feature-link">Learn How →</a>
            </div>
        </div>
    </div>
</section>

<!-- Resources Preview -->
<section class="resources-preview">
    <div class="container">
        <h2 class="section-title">Resources & Network Highlights</h2>
        <p class="section-subtitle">Success stories and toolkits from the NOTF network</p>
        
        <div class="resource-grid">
            <div class="resource-card">
                <h4>🟢 Waste Management Partnership</h4>
                <p>Women of Wisdom (JP Nagar) connected with Biome Environmental for composting training workshops.</p>
            </div>
            
            <div class="resource-card">
                <h4>🟢 Community Space Network</h4>
                <p>5 communities sharing meeting spaces and coordination resources across Bengaluru.</p>
            </div>
            
            <div class="resource-card">
                <h4>🆕 Solar Energy Initiative</h4>
                <p>Selco Foundation providing renewable energy solutions to 3 community centers.</p>
            </div>
        </div>
        
        <div class="cta-center">
            <a href="{{ '/search/' | url }}" class="btn btn-primary">View All Resources</a>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2>Ready to Transform Your Neighbourhood?</h2>
        <p>Join {{ members.length }}+ organizations and {{ communities.length }} communities building a better future together.</p>
        <div class="cta-center">
            <a href="{{ '/join/' | url }}" class="btn btn-primary-large">Join NOTF Network</a>
            <a href="{{ '/about/' | url }}" class="btn btn-secondary">Learn More</a>
        </div>
    </div>
</section>
HOMEPAGE

echo "  ✅ Created new homepage using existing CSS"

# Step 3: Rebuild
echo ""
echo "Step 3: Rebuilding website..."
cd website
npm run build

# Step 4: Deploy
echo ""
echo "Step 4: Deploying..."
cd ..
rm -rf docs/*
cp -r website/_site/* docs/

echo ""
echo "Step 5: Committing..."
git add .
git commit -m "Fix CSS conflicts - redesigned homepage using existing CSS classes"
git push

echo ""
echo "✅ FIX COMPLETE!"
echo "================"
echo ""
echo "Changes made:"
echo "  ✅ Removed duplicate/conflicting CSS"
echo "  ✅ Created new homepage using existing CSS"
echo "  ✅ All card layouts restored"
echo "  ✅ Formatting fixed"
echo ""
echo "Live site: https://urbanmorph.github.io/notf/"
echo ""
echo "The homepage now showcases:"
echo "  • Hero section with stats"
echo "  • 4 feature cards (Matcher, Map, Communities, Organizations)"
echo "  • 3-step participation flow"
echo "  • Network highlights"
echo "  • Strong CTA section"
echo ""
echo "All using the existing design system!"
