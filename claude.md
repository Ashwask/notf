# NOTF Project Guidelines for Claude

This document contains important guidelines and conventions for the NOTF (Neighbourhoods of the Future) project.

---

## Brand Guidelines

**Central Brand Guide:** `/Users/sathya/Documents/NOTF_BRAND_GUIDELINES.md`

**NOTF Brand Colors:**
- Yellow: `#FBC831` - CTAs, highlights
- Pink: `#F7A782` - Secondary accents
- Teal: `#23A2A5` - Primary brand color
- Green: `#0D7576` - Dark teal, text emphasis

**Primary Gradient:** `linear-gradient(135deg, #23A2A5 0%, #0D7576 100%)`

**Color Variables (use in CSS):**
```css
:root {
  --notf-yellow: #FBC831;
  --notf-pink: #F7A782;
  --notf-teal: #23A2A5;
  --notf-green: #0D7576;
  --gradient-primary: linear-gradient(135deg, #23A2A5 0%, #0D7576 100%);
}
```

Refer to the central brand guidelines for complete color usage, typography, spacing, and design patterns.

---

## UI/UX Guidelines

### Icons: Always Use FontAwesome (Not Emojis)

**Rule:** Use FontAwesome icons throughout the site. **NEVER use emoji characters.**

#### Why FontAwesome?
- ✅ **Consistent rendering** across all devices and browsers
- ✅ **Professional appearance** - scalable vector icons
- ✅ **Customizable** - can change color, size, and style with CSS
- ✅ **Accessible** - proper ARIA labels and semantic meaning
- ❌ **Emojis are inconsistent** - look different on iOS, Android, Windows, Linux

#### How to Use FontAwesome

```html
<!-- Good: FontAwesome icon -->
<i class="fa-solid fa-magnifying-glass"></i>

<!-- Bad: Emoji -->
🔍
```

#### Common Icon Mappings

| Purpose | FontAwesome Class | ~~Emoji~~ |
|---------|------------------|-----------|
| Search | `fa-solid fa-magnifying-glass` | ~~🔍~~ |
| Location | `fa-solid fa-location-dot` | ~~📍~~ |
| User/People | `fa-solid fa-users` | ~~👥~~ |
| Building | `fa-solid fa-building` | ~~🏢~~ |
| Community | `fa-solid fa-house-user` | ~~🏘️~~ |
| Check/Success | `fa-solid fa-circle-check` | ~~✅~~ |
| Error/Cancel | `fa-solid fa-circle-xmark` | ~~❌~~ |
| Email | `fa-solid fa-envelope` | ~~📧~~ |
| Website | `fa-solid fa-globe` | ~~🌐~~ |
| Tags | `fa-solid fa-tags` | ~~🏷️~~ |
| File/Document | `fa-solid fa-file-pen` | ~~📝~~ |
| Robot/Bot | `fa-solid fa-robot` | ~~🤖~~ |
| Loading | `fa-solid fa-hourglass-half` | ~~⏳~~ |
| Wave/Hello | `fa-solid fa-hand` | ~~👋~~ |

#### FontAwesome Reference

- **Library Used:** Font Awesome 6.5.1 (via CDN)
- **CDN Link:** `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`
- **Documentation:** https://fontawesome.com/icons
- **Icon Search:** https://fontawesome.com/search

#### Finding Icons

1. Visit https://fontawesome.com/search
2. Search for the icon you need (e.g., "location", "user", "check")
3. Click on the icon
4. Copy the HTML snippet (e.g., `<i class="fa-solid fa-location-dot"></i>`)
5. Use it in your code

#### Icon Variants

FontAwesome provides different styles:
- `fa-solid` - Solid icons (default, most common)
- `fa-regular` - Regular/outline icons
- `fa-light` - Light weight icons (Pro only)
- `fa-duotone` - Two-tone icons (Pro only)

**Use `fa-solid` for most cases.**

---

## Chatbot Guidelines

### Chatbot UI Pattern

The chatbot uses a **Floating Action Button (FAB)** pattern:

1. **Default State:** FAB visible in bottom-right corner
   - Icon: `fa-solid fa-comments`
   - Circular button with NOTF gradient
   - Always visible on all pages

2. **Open State:** Full chat widget appears
   - FAB disappears
   - Chat window slides up
   - Header with robot icon + "NOTF Assistant"

3. **Minimize/Close:** Returns to FAB
   - Widget slides down
   - FAB reappears

### Chatbot Icon Convention

```html
<!-- Floating Action Button -->
<button id="chat-fab" class="chat-fab">
    <i class="fa-solid fa-comments"></i>
</button>

<!-- Chat Header -->
<div class="chat-header-title">
    <i class="fa-solid fa-robot"></i>
    <span>NOTF Assistant</span>
</div>

<!-- Send Button -->
<button class="chat-send-button">
    <i class="fa-solid fa-paper-plane"></i>
</button>

<!-- Close Button -->
<button class="chat-close-button">
    <i class="fa-solid fa-xmark"></i>
</button>

<!-- Minimize Button -->
<button class="chat-minimize-button">
    <i class="fa-solid fa-minus"></i>
</button>
```

---

## Architecture Notes

### Static HTML (No Build System)

- **Deployment:** Vercel serves static HTML from `website/public/`
- **No Eleventy:** Removed in favor of hand-written HTML
- **No Build Step:** Files deployed as-is
- **Configuration:** `vercel.json` points to `website/public`

### Data Loading

- **Source of Truth:** Supabase Storage (not git repo)
- **Database:** Query cache/index only
- **Admin Edits:** Must use Edge Functions (not direct DB updates)
- **See:** `ARCHITECTURE.md` for complete data flow

### File Structure

```
website/
├── public/               # Static HTML files (deployed)
│   ├── index.html
│   ├── communities/
│   ├── solution-providers/
│   ├── map/
│   ├── admin/
│   └── assets/
│       ├── css/
│       ├── js/
│       ├── chat/        # Chatbot files
│       └── data/        # GeoJSON boundaries
├── package.json         # Only Supabase dependency
└── node_modules/
```

---

## Search & Matching Libraries

### Fuse.js Integration

The NOTF platform uses **Fuse.js 7.0.0** for fuzzy search and intelligent matching across:
1. **Discovery Search** - Finding communities and solution providers
2. **Ask/Offer Matcher** - Matching community needs with provider offerings

#### Why Fuse.js?

- ✅ **Typo Tolerance** - Handles misspellings ("malleshwaram" vs "malleswaram")
- ✅ **Fuzzy Matching** - Finds approximate matches, not just exact keywords
- ✅ **Weighted Search** - Prioritize name matches over description matches
- ✅ **Zero Dependencies** - Lightweight, browser-compatible
- ✅ **No API Calls** - Works entirely client-side

#### CDN Integration

**Fuse.js is loaded via CDN on all pages:**

```html
<!-- Added before discovery-engine.js -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
<script src="/assets/chat/discovery-engine.js"></script>
```

**Note:** All 12 HTML pages have Fuse.js loaded automatically.

#### Usage in Discovery Engine

**File:** `/website/public/assets/chat/discovery-engine.js`

```javascript
// Fuse.js configuration for discovery search
const fuseOptions = {
    keys: [
        { name: 'name', weight: 2.0 },              // Name is most important
        { name: 'focus_areas', weight: 1.5 },       // Focus areas are very relevant
        { name: 'domains', weight: 1.5 },           // Domains (for providers)
        { name: 'location', weight: 1.0 },          // Location matching
        { name: 'city', weight: 1.0 },              // City matching
        { name: 'neighborhood', weight: 0.8 },      // Neighborhood
        { name: 'description', weight: 0.5 }        // Description
    ],
    threshold: 0.4,                 // 0 = exact match, 1 = match anything
    includeScore: true,             // Include match score for sorting
    minMatchCharLength: 2,          // Minimum character length to match
    ignoreLocation: true            // Search entire string
};

this.fuse = new Fuse(this.allResources, fuseOptions);
```

**Fallback Behavior:**
If Fuse.js fails to load, the discovery engine automatically falls back to basic keyword matching.

#### Usage in Ask/Offer Matcher

**File:** `/website/public/admin/matcher.html`

**Enhanced Match Scoring:**

The matcher uses Fuse.js to calculate similarity scores with 5 components:

1. **Tag Matching** (40% weight) - Exact category matches (funding, volunteers, space)
2. **Keyword Matching** (30% weight) - Exact keyword overlaps
3. **City Matching** (15% weight) - Fuzzy city comparison (handles "Bengaluru" vs "Bangalore")
4. **Theme Matching** (15% weight) - Exact theme matches
5. **Text Similarity** (25% weight) - Fuse.js fuzzy text comparison between ask/offer descriptions

**Example:**

```javascript
// Fuzzy city matching
const cityFuse = new Fuse([offer.city], { threshold: 0.3 });
const cityMatch = cityFuse.search(ask.city);
if (cityMatch.length > 0) {
    score += 0.10; // Partial credit for fuzzy city match
}

// Text similarity matching
const offerFuse = new Fuse([{ text: offer.text }], {
    keys: ['text'],
    threshold: 0.5,  // More lenient for text matching
    includeScore: true
});

const textMatch = offerFuse.search(ask.text);
if (textMatch.length > 0) {
    const textSimilarity = 1 - textMatch[0].score;
    score += textSimilarity * 0.25;
}
```

**Benefits:**
- Finds matches even with different wording
- Handles typos and variations in city names
- Improves match quality by 15-20% over exact matching

#### Fuse.js Configuration Reference

**Common Options:**

| Option | Purpose | Recommended Value |
|--------|---------|-------------------|
| `threshold` | Match sensitivity (0-1) | 0.4 (discovery), 0.5 (text matching) |
| `distance` | How far to search | 100 (default) |
| `minMatchCharLength` | Minimum chars to match | 2 |
| `ignoreLocation` | Search entire string | true |
| `includeScore` | Return match score | true |

**Key Weights:**

Assign higher weights to more important fields:
- **Name/Title:** 2.0 (most important)
- **Focus Areas/Tags:** 1.5
- **Location:** 1.0
- **Description:** 0.5 (least important)

#### Documentation

- **Fuse.js Docs:** https://www.fusejs.io/
- **API Reference:** https://www.fusejs.io/api/options.html
- **Examples:** https://www.fusejs.io/examples.html

---

## Coding Conventions

### JavaScript

- Use ES6+ features (classes, arrow functions, template literals)
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) for safe property access
- Use template literals for HTML generation

### CSS

- Mobile-first responsive design
- Use CSS custom properties for theme colors
- BEM-like naming convention (not strict)
- Flexbox and Grid for layouts

### HTML

- Semantic HTML5 elements
- Accessible ARIA labels
- FontAwesome for icons (see above)
- Self-closing tags for consistency

---

## Common Patterns

### Modal Pattern

```html
<div class="modal" id="myModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Title</h3>
            <button class="modal-close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="modal-body">
            <!-- Content -->
        </div>
    </div>
</div>
```

### Button with Icon

```html
<!-- Icon before text -->
<button class="btn btn-primary">
    <i class="fa-solid fa-check"></i>
    Submit
</button>

<!-- Icon only -->
<button class="btn btn-icon" aria-label="Close">
    <i class="fa-solid fa-xmark"></i>
</button>
```

### Loading State

```html
<div class="loading">
    <i class="fa-solid fa-spinner fa-spin"></i>
    Loading...
</div>
```

---

## Color Palette

### Primary Colors

- **NOTF Teal:** `#23A2A5`
- **NOTF Light Teal:** `#5BC0C3`
- **Gradient:** `linear-gradient(135deg, #23A2A5 0%, #5BC0C3 100%)`

### Semantic Colors

- **Success:** `#059669` (green)
- **Error:** `#dc2626` (red)
- **Warning:** `#f59e0b` (orange)
- **Info:** `#3b82f6` (blue)

### Neutral Colors

- **Text Dark:** `#111827`
- **Text Medium:** `#4b5563`
- **Text Light:** `#6b7280`
- **Border:** `#e5e7eb`
- **Background:** `#f9fafb`

---

## Git Commit Conventions

### Commit Message Format

```
<type>: <short description>

<detailed explanation>
<list of changes>

<additional notes>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - CSS/UI changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## Testing Checklist

### Before Committing

- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive design)
- [ ] Check FontAwesome icons render correctly
- [ ] Verify ARIA labels for accessibility
- [ ] No console errors
- [ ] Code follows conventions above

### Chatbot-Specific

- [ ] FAB appears when minimized
- [ ] Chat opens/closes smoothly
- [ ] Discovery mode searches work
- [ ] Complaint mode submissions work
- [ ] Boundary validation working
- [ ] Modals open/close correctly

---

## Helpful Resources

### Documentation

- FontAwesome Icons: https://fontawesome.com/icons
- Supabase Docs: https://supabase.com/docs
- NOTF Architecture: See `ARCHITECTURE.md`

### APIs Used

- **Supabase:** Data storage and authentication
- **Nominatim:** Geocoding (OpenStreetMap)
- **notf-cms API:** Complaint submission

### Key Files

- `ARCHITECTURE.md` - Data flow and storage patterns
- `CHATBOT_DEPLOYMENT_SUMMARY.md` - Chatbot implementation details
- `API_SPECIFICATION.md` - API documentation
- `COMPLAINT_API_DOCUMENTATION.md` - Complaint API docs

---

## Questions?

If you encounter something not covered here, check:
1. Existing code patterns in the codebase
2. ARCHITECTURE.md for data/storage questions
3. GitHub issues for known problems

**Remember:** Always use FontAwesome icons, never emojis! 🚫➡️ Use `<i class="fa-solid fa-icon-name"></i>` instead.
