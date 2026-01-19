# NOTF Brand Guidelines Checklist

Use this checklist when creating new components or modifying existing ones to ensure brand consistency.

---

## Colors

### Brand Colors
- [ ] Uses CSS variables (no hardcoded hex values)
- [ ] Only uses approved brand colors:
  - **Primary:** Teal (#23A2A5) - `var(--notf-teal)`
  - **Accent:** Green (#0D7576) - `var(--notf-green)`
  - **Secondary:** Yellow (#FBC831) - `var(--notf-yellow)`
  - **Tertiary:** Pink (#F7A782) - `var(--notf-pink)`

### Gradients
- [ ] Uses gradient variables when needed:
  - `var(--gradient-primary)` - Teal to Green
  - `var(--gradient-warm)` - Yellow to Pink
  - `var(--gradient-full)` - Teal to Green to Yellow

### Color Contrast
- [ ] Text on white background: ≥ 4.5:1 contrast ratio
- [ ] White text on teal gradient: verified for readability
- [ ] Decorative elements (yellow highlights): no contrast requirement

---

## Typography

### Heading Sizes
- [ ] H1: `font-size: 3rem` (48px), `font-weight: 700`
- [ ] H2: `font-size: 2rem` (32px), `font-weight: 600`
- [ ] H3: `font-size: 1.5rem` (24px), `font-weight: 600`
- [ ] H4: `font-size: 1.25rem` (20px), `font-weight: 600`
- [ ] Body: `font-size: 1rem` (16px), `font-weight: 400`

### Mobile Responsive
- [ ] H1 reduces to `2rem` on mobile (≤768px)
- [ ] H2 reduces to `1.5rem` on mobile
- [ ] H3 reduces to `1.25rem` on mobile

### Font Weights
- [ ] Headings use 700 (H1) or 600 (H2-H6)
- [ ] Body text uses 400 (normal) or 500 (medium)
- [ ] No ultra-bold (800+) weights except legacy cases

---

## Spacing (8px Grid)

### Standard Spacing Variables
- [ ] All spacing is a multiple of 8px
- [ ] Uses spacing variables:
  - `--space-xs`: 0.5rem (8px)
  - `--space-sm`: 1rem (16px)
  - `--space-md`: 1.5rem (24px)
  - `--space-lg`: 2.5rem (40px)
  - `--space-xl`: 3.75rem (60px)
  - `--space-2xl`: 4rem (64px)
  - `--space-3xl`: 6rem (96px)

### Component Spacing
- [ ] Cards: `padding: var(--space-md)` or `var(--space-lg)`
- [ ] Sections: `padding: var(--space-xl) 0` (60px vertical)
- [ ] Buttons: `padding: 1rem 2.5rem` (16px × 40px)
- [ ] Large buttons: `padding: 1.5rem 3rem` (24px × 48px)

### Common Patterns
- [ ] Margins between sections: `2.5rem` or `3.75rem`
- [ ] Gap in grids: `1rem`, `1.5rem`, or `2rem`
- [ ] Card spacing: multiples of 8px only

---

## Shadows

### Simplified Shadow System
- [ ] Uses one of three shadow variables:
  - `--shadow-sm`: Subtle shadow for cards
  - `--shadow-md`: Medium shadow for buttons
  - `--shadow-lg`: Large shadow for modals/elevated elements

### Shadow Usage
- [ ] Cards use `var(--shadow-sm)`
- [ ] Buttons use `var(--shadow-md)`
- [ ] Modals/dialogs use `var(--shadow-lg)`
- [ ] No custom shadow values (use variables)

---

## Border Radius

### Standard Radius Values
- [ ] Uses approved radius variables:
  - `--radius-sm`: 0.25rem (4px) - badges, tags
  - `--radius-md`: 0.5rem (8px) - cards, inputs
  - `--radius-lg`: 0.75rem (12px) - modals, sections
  - `--radius-xl`: 1.25rem (20px) - pills, rounded buttons
  - `--radius-full`: 9999px - circular elements

### Component Radius
- [ ] Buttons: `var(--radius-md)` (8px)
- [ ] Cards: `var(--radius-md)` or `var(--radius-lg)`
- [ ] Inputs: `var(--radius-md)` (8px)
- [ ] Modals: `var(--radius-lg)` (12px)
- [ ] Pills/badges: `var(--radius-xl)` (20px)

---

## Icons

### FontAwesome Required
- [ ] **NO emoji characters** (📍 🏷️ ✅ ❌ etc.)
- [ ] Uses FontAwesome icons only
- [ ] Icons loaded via CDN (Font Awesome 6.5.1)

### Icon Usage
- [ ] Icon-only buttons have `aria-label` attributes
- [ ] Icons use `fa-solid` class (default)
- [ ] Icon color matches brand colors when appropriate

### Common Icon Mappings
- [ ] Location: `<i class="fa-solid fa-location-dot"></i>`
- [ ] Success: `<i class="fa-solid fa-circle-check"></i>`
- [ ] Error: `<i class="fa-solid fa-circle-xmark"></i>`
- [ ] Users: `<i class="fa-solid fa-users"></i>`
- [ ] Tags: `<i class="fa-solid fa-tags"></i>`
- [ ] Robot/Bot: `<i class="fa-solid fa-robot"></i>`

---

## Buttons

### Button Styles
- [ ] Primary: Teal background, white text
- [ ] Primary Large (Hero CTA): Uses `var(--gradient-primary)`
- [ ] Secondary: Yellow background, dark text
- [ ] Accent: Pink background, white text
- [ ] Success: Green background, white text

### Button Modifiers
- [ ] `.gradient` modifier available for gradient backgrounds
- [ ] Hover states use darker shade or opacity change
- [ ] Transitions use `0.3s ease` or similar

### Button Spacing
- [ ] Regular buttons: `padding: 1rem 2.5rem`
- [ ] Large buttons: `padding: 1.5rem 3rem`
- [ ] Small buttons: `padding: 0.5rem 1rem`

---

## Chatbot

### Chatbot Styling
- [ ] Header uses `var(--gradient-primary)` (teal to green)
- [ ] Header text is white (for contrast)
- [ ] FAB button uses gradient or teal
- [ ] Icons are FontAwesome (not emojis)

### Chatbot Components
- [ ] Success messages use green checkmark icon
- [ ] Error messages use red X icon
- [ ] Location indicators use location-dot icon

---

## Accessibility

### Color Contrast
- [ ] All text meets WCAG AA standards (≥ 4.5:1)
- [ ] Interactive elements have visible focus states
- [ ] Gradients maintain sufficient contrast with text

### ARIA Labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Modal dialogs have `role="dialog"`
- [ ] Form inputs have associated labels

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible

---

## Responsive Design

### Breakpoints
- [ ] Mobile-first approach
- [ ] Tablet: 768px
- [ ] Desktop: 1024px and above

### Mobile Adjustments
- [ ] Typography scales down appropriately
- [ ] Padding/margins reduce on mobile
- [ ] Grid layouts stack vertically on mobile

---

## CSS Best Practices

### Variables
- [ ] Uses CSS custom properties (variables)
- [ ] No hardcoded colors (except in variable definitions)
- [ ] No hardcoded spacing values (prefer variables)

### Naming Conventions
- [ ] Class names are descriptive and semantic
- [ ] BEM-like naming for component variants
- [ ] No overly generic class names

### Code Quality
- [ ] No `!important` unless absolutely necessary
- [ ] Consistent indentation (2 or 4 spaces)
- [ ] Comments for complex logic

---

## Testing Checklist

### Visual Testing
- [ ] Tested on Chrome (Mac & Windows)
- [ ] Tested on Firefox
- [ ] Tested on Safari (Mac & iOS)
- [ ] Tested on mobile devices (375px, 414px widths)

### Functional Testing
- [ ] All buttons clickable and functional
- [ ] Hover states work correctly
- [ ] Gradients display smoothly (no banding)
- [ ] Icons render correctly (FontAwesome loaded)

### Accessibility Testing
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

---

## Common Mistakes to Avoid

### ❌ Don't Do This
- ~~Using emoji characters~~ → Use FontAwesome icons
- ~~Hardcoded colors like `#23A2A5`~~ → Use `var(--notf-teal)`
- ~~Random spacing like `1.25rem`~~ → Use 8px grid multiples
- ~~Custom shadow values~~ → Use shadow variables
- ~~Font weight 800+~~ → Use 700 max for headings

### ✅ Do This Instead
- Use `<i class="fa-solid fa-location-dot"></i>` for location icons
- Use `background: var(--notf-teal)` for colors
- Use `padding: var(--space-md)` for spacing
- Use `box-shadow: var(--shadow-md)` for shadows
- Use `font-weight: 700` for primary headings

---

## Quick Reference

### Most Common CSS Variables
```css
/* Colors */
--notf-teal: #23A2A5;
--notf-green: #0D7576;
--notf-yellow: #FBC831;
--notf-pink: #F7A782;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #23A2A5 0%, #0D7576 100%);
--gradient-warm: linear-gradient(135deg, #FBC831 0%, #F7A782 100%);

/* Spacing */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 2.5rem;   /* 40px */
--space-xl: 3.75rem;  /* 60px */

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.15);

/* Border Radius */
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1.25rem;  /* 20px */
```

---

## Resources

- **Main Brand Guidelines:** `/Users/sathya/Documents/NOTF_BRAND_GUIDELINES.md`
- **Project Guidelines:** `/Users/sathya/Documents/GitHub/notf/CLAUDE.md`
- **FontAwesome Search:** https://fontawesome.com/search
- **CSS Variables Reference:** `website/public/assets/css/main.css` (lines 14-103)

---

**Last Updated:** 2026-01-19
**Version:** 1.0
