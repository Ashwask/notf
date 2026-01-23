# NOTF New Brand - Quick Reference Guide

## 🎨 Color Palette (Copy & Paste)

```css
/* Primary Background */
--warm-cream: #FAF6E8;

/* Primary Colors */
--olive-green: #B9C98A;      /* Community, sustainability */
--terracotta: #C45A2A;       /* People, warmth */
--forest-green: #2F4A2C;     /* Stability, systems */

/* Secondary Colors */
--mustard-yellow: #F5B82E;   /* Optimism, ideas */
--slate-blue: #3F5F7A;       /* Trust, policy */
--charcoal: #2B2B2B;         /* Text */
```

---

## 🎯 Quick Usage Guide

### When to Use Each Color

**Olive Green (#B9C98A)**
- ✅ Secondary buttons
- ✅ Community-related features
- ✅ Sustainability topics
- ✅ Success messages

**Terracotta (#C45A2A)**
- ✅ Primary CTAs
- ✅ Important buttons
- ✅ People-focused content
- ✅ Warmth & connection

**Forest Green (#2F4A2C)**
- ✅ Headers & navigation
- ✅ Primary brand elements
- ✅ Stability indicators
- ✅ System messaging

**Mustard Yellow (#F5B82E)**
- ✅ Highlights & accents
- ✅ Optimistic messaging
- ✅ Energy indicators
- ✅ Hover states (links)

**Slate Blue (#3F5F7A)**
- ✅ Professional elements
- ✅ Policy/structure content
- ✅ Trust indicators
- ✅ Admin features

**Charcoal (#2B2B2B)**
- ✅ Body text
- ✅ Headers (alternative)
- ✅ Footer backgrounds
- ✅ Contrast elements

---

## 🚫 Design Rules (DON'T)

❌ **No Gradients** - Flat colors only
❌ **No Neon Colors** - Stick to earthy palette
❌ **No 3D Effects** - Keep it flat
❌ **No Drop Shadows** - Use subtle, flat shadows only
❌ **Maximum 5 Colors** - Per composition
❌ **No Rigid Symmetry** - Allow organic flow

---

## ✅ Design Rules (DO)

✅ **Use Geometric Shapes** - Circles, squares, diamonds
✅ **Maintain White Space** - 20-30% breathing room
✅ **Flat Colors Only** - No gradients or effects
✅ **Soft Corners** - 4px, 8px, 12px border radius
✅ **8px Spacing System** - 8, 16, 24, 32, 48, 64, 80px
✅ **Accessibility First** - WCAG AA minimum (4.5:1)

---

## 📐 Component Specifications

### Buttons

**Primary Button (Forest Green)**
```css
background: #2F4A2C;
color: #FAF6E8;
padding: 12px 24px;
border-radius: 4px;
font-weight: 600;
```

**Secondary Button (Olive Green)**
```css
background: #B9C98A;
color: #2B2B2B;
padding: 12px 24px;
border-radius: 4px;
font-weight: 600;
```

**CTA Button (Terracotta)**
```css
background: #C45A2A;
color: #FAF6E8;
padding: 16px 32px;
border-radius: 4px;
font-weight: 600;
```

### Cards
```css
background: #FFFFFF;
border-radius: 8-12px;
box-shadow: 0 2px 8px rgba(43, 43, 43, 0.1);
padding: 24px;
border-top: 4px solid [accent-color];
```

### Typography
```css
/* Headings */
h1: 48px, Bold (700)
h2: 32px, Bold (700)
h3: 24px, Semibold (600)

/* Body */
body: 16px, Regular (400), line-height 1.6

/* Button Text */
buttons: 14-16px, Semibold (600)
```

---

## 🎨 Color Combinations

### Energetic
- Slate Blue + Terracotta + Mustard Yellow

### Natural
- Forest Green + Olive Green + Warm Cream

### Professional
- Slate Blue + Charcoal + Warm Cream

### Warm & Inviting
- Terracotta + Mustard Yellow + Olive Green

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px)

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px)

/* Desktop */
@media (min-width: 1025px)
```

---

## 🔍 Accessibility Checklist

✅ **Contrast Ratios**
- Charcoal on Warm Cream: ✅ Pass
- Forest Green on White: ✅ Pass
- Warm Cream on Forest Green: ✅ Pass
- Terracotta on White: ✅ Pass

✅ **Text Sizes**
- Minimum body text: 16px
- Minimum small text: 12px

✅ **Interactive Elements**
- Minimum tap target: 48px x 48px
- Focus states: Visible outlines
- Hover states: Color changes

---

## 🎭 Geometric Shapes Meaning

| Shape | Meaning | Usage |
|-------|---------|-------|
| **Circle** | Community, wholeness, inclusion | Background accents, logos |
| **Square/Rectangle** | Structure, stability, continuity | Cards, containers |
| **Diamond** | Transformation, value, ideas | Decorative accents |
| **Triangle** | Movement, action, energy | Directional indicators |
| **Semi-circle** | Connection, transition | Bridges between sections |

---

## 🚀 Quick Start

### New Page Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="/assets/css/main.css">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <!-- Content with Warm Cream background automatically applied -->
</body>
</html>
```

### Add a New Button
```html
<!-- Primary CTA -->
<button class="btn btn-primary-large">
    <i class="fa-solid fa-arrow-right"></i>
    Get Started
</button>

<!-- Secondary Action -->
<button class="btn btn-secondary">
    Learn More
</button>
```

### Add a Card
```html
<div class="feature-card">
    <div class="feature-icon">
        <i class="fa-solid fa-house-user"></i>
    </div>
    <h3>Title</h3>
    <p>Description text...</p>
    <a href="#" class="feature-link">Learn More →</a>
</div>
```

---

## 📞 Support

**Brand Guidelines:** `/Users/sathya/Documents/GitHub/notf/CLAUDE.md`
**Redesign Summary:** `/Users/sathya/Documents/GitHub/notf/website/REDESIGN_SUMMARY.md`
**Main CSS:** `/website/public/assets/css/main.css`

---

**Remember:**
- ❌ No gradients
- ✅ Flat colors only
- 🎨 Warm Cream background
- 📐 8px spacing system
- ♿ Accessibility first
