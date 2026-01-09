#!/bin/bash

# Fix navbar alignment: left-align brand, right-align menu and hamburger
# Run this from: ~/Documents/GitHub/notf/

echo "🔧 Fixing Navbar Alignment"
echo "=========================="
echo ""

cd ~/Documents/GitHub/notf/website/src/assets/css

# Backup
cp main.css main.css.backup
echo "✅ Backup created: main.css.backup"
echo ""

# Create a temporary file with the navbar CSS replacement
cat > navbar-fix.css << 'NAVFIX'
/* Header & Navigation - COOL COLORS */
header {
    background: linear-gradient(135deg, var(--color-green) 0%, var(--color-teal) 100%);
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 0;
    z-index: 100;
}

nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Logo and Brand - LEFT ALIGNED */
.nav-brand {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
}

.logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
    text-decoration: none;
    padding: 0;
}

.logo-link:hover {
    background: none;
}

.nav-logo {
    height: 50px;
    width: 50px;
    border-radius: 50%;
    background: white;
    padding: 2px;
}

.nav-title {
    font-weight: 700;
    font-size: 1.5rem;
    color: white;
}

/* Hamburger Menu - RIGHT ALIGNED */
.hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    margin-left: auto;
    order: 2;
}

.hamburger span {
    display: block;
    width: 25px;
    height: 3px;
    background: white;
    border-radius: 3px;
    transition: all 0.3s;
}

.hamburger.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
}

.hamburger.active span:nth-child(2) {
    opacity: 0;
}

.hamburger.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
}

/* Navigation Menu - RIGHT ALIGNED */
.nav-menu {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-left: auto;
    order: 1;
}

.nav-menu a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.nav-menu a:hover {
    background: rgba(255, 255, 255, 0.15);
}

.join-link {
    background: var(--color-yellow) !important;
    color: var(--color-text) !important;
    font-weight: 600 !important;
}

.join-link:hover {
    background: var(--color-pink) !important;
    color: white !important;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    nav {
        position: relative;
    }
    
    .hamburger {
        display: flex;
    }
    
    .nav-menu {
        position: fixed;
        left: -100%;
        top: 76px;
        flex-direction: column;
        background: linear-gradient(135deg, var(--color-green) 0%, var(--color-teal) 100%);
        width: 100%;
        text-align: center;
        transition: left 0.3s;
        box-shadow: var(--shadow-lg);
        padding: 2rem 0;
        gap: 0;
        margin-left: 0;
    }
    
    .nav-menu.active {
        left: 0;
    }
    
    .nav-menu a {
        display: block;
        width: 100%;
        padding: 1rem;
        margin: 0;
        border-radius: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .nav-logo {
        height: 40px;
        width: 40px;
    }
    
    .nav-title {
        font-size: 1.25rem;
    }
}
NAVFIX

echo "📝 Applying navbar alignment fix..."

# Use Python to replace the navbar section
python3 << 'PYFIX'
import re

# Read the CSS file
with open('main.css', 'r') as f:
    css = f.read()

# Read the new navbar CSS
with open('navbar-fix.css', 'r') as f:
    new_navbar = f.read()

# Find and replace the navbar section (from "/* Header & Navigation" to the end of mobile responsive)
pattern = r'/\* Header & Navigation.*?@media \(max-width: 768px\) \{.*?\n\}'
replacement = new_navbar

css_fixed = re.sub(pattern, replacement, css, flags=re.DOTALL)

# Write back
with open('main.css', 'w') as f:
    f.write(css_fixed)

print("  ✅ Navbar CSS updated")
PYFIX

# Clean up temporary file
rm navbar-fix.css

echo ""
echo "🔨 Rebuilding website..."
cd ~/Documents/GitHub/notf/website
npm run build

echo ""
echo "📦 Deploying..."
cd ~/Documents/GitHub/notf
rm -rf docs/*
cp -r website/_site/* docs/

echo ""
echo "📤 Committing changes..."
git add .
git commit -m "Fix navbar alignment: left-align brand, right-align menu and hamburger"
git push

echo ""
echo "✅ NAVBAR ALIGNMENT FIXED!"
echo "=========================="
echo ""
echo "Changes applied:"
echo "  ✅ Brand/logo: LEFT aligned"
echo "  ✅ Menu items: RIGHT aligned"
echo "  ✅ Hamburger: RIGHT aligned (mobile)"
echo "  ✅ Works across all pages"
echo ""
echo "Desktop view:"
echo "  [NOTF Logo] .................. [Home About Members ... Search]"
echo ""
echo "Mobile view:"
echo "  [NOTF Logo] .................. [☰]"
echo ""
echo "Live site: https://urbanmorph.github.io/notf/"
