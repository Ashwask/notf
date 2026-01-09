#!/bin/bash

# Deployment script for NOTF redesigned homepage
# Run this from: ~/Documents/GitHub/notf/

echo "🚀 Deploying NOTF Redesigned Homepage..."
echo ""

# Step 1: Append homepage CSS to main.css
echo "📝 Adding homepage CSS..."
cat >> website/src/assets/css/main.css << 'EOF'

/* ===================================
   REDESIGNED HOMEPAGE
   =================================== */

/* Hero Section */
.hero {
    background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-green) 100%);
    color: white;
    padding: 4rem 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    min-height: 500px;
}

.hero-content {
    max-width: 600px;
}

.hero-title {
    font-size: 2.75rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1.5rem;
}

.hero-subtitle {
    font-size: 1.25rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    opacity: 0.95;
}

.hero-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 3rem;
}

.btn-hero-primary,
.btn-hero-secondary {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1.125rem;
    text-decoration: none;
    transition: all 0.3s;
    display: inline-block;
}

.btn-hero-primary {
    background: var(--color-yellow);
    color: var(--color-text);
}

.btn-hero-primary:hover {
    background: var(--color-pink);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-hero-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid white;
}

.btn-hero-secondary:hover {
    background: white;
    color: var(--color-teal);
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.hero-image {
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-illustration {
    width: 100%;
    max-width: 400px;
    height: auto;
}

/* Features Section */
.features-section {
    padding: 5rem 2rem;
    background: var(--color-bg);
}

.features-section .section-title {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.features-section .section-subtitle {
    text-align: center;
    font-size: 1.125rem;
    color: var(--color-text-light);
    margin-bottom: 3rem;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.features-section .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    transition: all 0.3s;
    border-top: 4px solid var(--color-border);
}

.features-section .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
}

.features-section .feature-card.feature-primary {
    border-top-color: var(--color-yellow);
    background: linear-gradient(135deg, rgba(251, 200, 49, 0.05) 0%, white 100%);
}

.features-section .feature-card:nth-child(2) {
    border-top-color: var(--color-teal);
}

.features-section .feature-card:nth-child(3) {
    border-top-color: var(--color-pink);
}

.features-section .feature-card:nth-child(4) {
    border-top-color: var(--color-green);
}

.features-section .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.features-section .feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.features-section .feature-card > p {
    color: var(--color-text-light);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.feature-list {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
}

.feature-list li {
    padding: 0.5rem 0;
    color: var(--color-text);
    font-size: 0.9375rem;
}

.features-section .feature-link {
    color: var(--color-teal);
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
}

.features-section .feature-link:hover {
    color: var(--color-green);
    transform: translateX(5px);
}

/* Participate Section */
.participate-section {
    padding: 5rem 2rem;
    background: white;
}

.steps-container {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 1200px;
    margin: 0 auto;
    gap: 2rem;
}

.participate-section .step {
    flex: 1;
    background: var(--color-bg);
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    position: relative;
}

.participate-section .step-number {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-green) 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 auto 1.5rem;
    box-shadow: var(--shadow-md);
}

.step-content h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.step-content p {
    color: var(--color-text-light);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.step-link {
    color: var(--color-teal);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
}

.step-link:hover {
    color: var(--color-green);
}

.steps-container .step-connector {
    width: 40px;
    height: 4px;
    background: linear-gradient(to right, var(--color-teal), var(--color-yellow));
    border-radius: 2px;
}

/* Highlights Section */
.highlights-section {
    padding: 5rem 2rem;
    background: var(--color-bg);
}

.highlights-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
}

.btn-outline {
    padding: 0.75rem 1.5rem;
    border: 2px solid var(--color-teal);
    color: var(--color-teal);
    background: transparent;
    border-radius: 0.5rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;
}

.btn-outline:hover {
    background: var(--color-teal);
    color: white;
}

.highlights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.highlight-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: var(--shadow-sm);
    border-left: 4px solid var(--color-teal);
    transition: all 0.3s;
}

.highlight-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-4px);
}

.highlight-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
}

.highlight-badge.success {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
}

.highlight-badge.new {
    background: rgba(251, 200, 49, 0.2);
    color: #d97706;
}

.highlight-card h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    color: var(--color-text);
}

.highlight-card p {
    color: var(--color-text-light);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.highlight-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--color-text-light);
}

/* Resources Section */
.resources-section {
    padding: 5rem 2rem;
    background: white;
}

.resources-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;
}

.resources-info h2 {
    text-align: left;
    margin-bottom: 1.5rem;
}

.resources-info p {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--color-text-light);
    margin-bottom: 2rem;
}

.resources-list {
    list-style: none;
    padding: 0;
    margin-bottom: 2rem;
}

.resources-list li {
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
}

.resources-cards {
    display: grid;
    gap: 1.5rem;
}

.resource-mini-card {
    background: var(--color-bg);
    padding: 1.5rem;
    border-radius: 0.75rem;
    border-left: 3px solid var(--color-teal);
    transition: all 0.3s;
}

.resource-mini-card:hover {
    transform: translateX(8px);
    box-shadow: var(--shadow-sm);
}

.resource-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--color-teal);
    color: white;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.resource-mini-card h4 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: var(--color-text);
}

.resource-mini-card p {
    font-size: 0.9375rem;
    color: var(--color-text-light);
    margin: 0;
}

/* Impact Section */
.impact-section {
    padding: 5rem 2rem;
    background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-green) 100%);
    color: white;
}

.impact-section .section-title {
    color: white;
}

.impact-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
}

.impact-stat {
    text-align: center;
}

.impact-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.impact-value {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.impact-label {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.impact-stat p {
    opacity: 0.9;
    font-size: 0.9375rem;
}

/* CTA Section */
.cta-section {
    padding: 5rem 2rem;
    background: var(--color-bg);
}

.cta-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: var(--color-text);
}

.cta-content p {
    font-size: 1.25rem;
    color: var(--color-text-light);
    margin-bottom: 2.5rem;
}

.cta-buttons {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
}

.btn-cta-primary,
.btn-cta-secondary {
    padding: 1rem 2.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1.125rem;
    text-decoration: none;
    transition: all 0.3s;
    display: inline-block;
}

.btn-cta-primary {
    background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-green) 100%);
    color: white;
}

.btn-cta-primary:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-xl);
}

.btn-cta-secondary {
    background: white;
    color: var(--color-teal);
    border: 2px solid var(--color-teal);
}

.btn-cta-secondary:hover {
    background: var(--color-teal);
    color: white;
}

/* Responsive Homepage */
@media (max-width: 1024px) {
    .hero {
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
    }
    
    .hero-content {
        max-width: 100%;
    }
    
    .hero-actions {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .resources-split {
        grid-template-columns: 1fr;
        gap: 3rem;
    }
}

@media (max-width: 768px) {
    .hero {
        padding: 3rem 1.5rem;
        min-height: auto;
    }
    
    .hero-title {
        font-size: 2rem;
    }
    
    .hero-subtitle {
        font-size: 1rem;
    }
    
    .hero-stats {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    
    .hero-image {
        display: none;
    }
    
    .features-section .section-title {
        font-size: 2rem;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    .steps-container {
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .steps-container .step-connector {
        width: 4px;
        height: 40px;
        background: linear-gradient(to bottom, var(--color-teal), var(--color-yellow));
    }
    
    .highlights-header {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }
    
    .highlights-grid {
        grid-template-columns: 1fr;
    }
    
    .impact-stats {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .cta-content h2 {
        font-size: 1.75rem;
    }
    
    .cta-buttons {
        flex-direction: column;
        gap: 1rem;
    }
}
EOF

echo "✅ CSS appended successfully!"
echo ""

# Step 2: Rebuild the website
echo "🔨 Building the website..."
cd website
npm run build

# Step 3: Copy to docs
echo "📦 Copying to docs directory..."
cd ..
rm -rf docs/*
cp -r website/_site/* docs/

# Step 4: Git operations
echo "📤 Committing and pushing..."
git add .
git commit -m "Redesign homepage with Decidim-inspired UI - Add hero, features, steps, highlights, resources, impact, and CTA sections"
git push

echo ""
echo "🎉 HOMEPAGE REDESIGN DEPLOYED!"
echo "================================="
echo ""
echo "New Homepage Features:"
echo "  🎨 Hero section with gradient background"
echo "  📊 Live stats (54 orgs, 20 communities)"  
echo "  🤝 4 feature cards (Matcher, Map, Communities, Organizations)"
echo "  👣 3-step participation flow"
echo "  ⭐ Network highlights section"
echo "  📚 Resources preview"
echo "  💪 Impact statistics"
echo "  📢 Strong CTA section"
echo "  📱 Fully responsive design"
echo ""
echo "Live site: https://urbanmorph.github.io/notf/"
echo ""
echo "✨ The new homepage showcases all NOTF features!"
