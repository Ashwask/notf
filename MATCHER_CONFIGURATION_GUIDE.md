# NOTF Matcher Configuration Guide

**Version:** 1.0
**Last Updated:** January 2025
**Audience:** Administrators, System Operators

---

## Overview

The NOTF Matcher is a unified matching system that connects community needs (asks) with available resources (offers) using intelligent scoring across 6 components. The same matching algorithm powers both:

1. **Admin Ask/Offer Matcher** - Manual matching in `/admin/matcher.html`
2. **Public Chatbot Discovery** - Automatic discovery when users search

**Key Principle:** Configure once in the admin, applies everywhere.

---

## How It Works

### Architecture

```
┌─────────────────────────────────┐
│  Admin Matcher UI               │
│  /admin/matcher.html            │
│                                 │
│  [Sliders & Controls]           │
│  • Tag Weight: 40%              │
│  • Keyword Weight: 30%          │
│  • Proximity Weight: 30%        │
│  • Enable Proximity: ✓          │
│  • Max Distance: 50 km          │
│                                 │
│  [Apply Settings]               │
└────────────┬────────────────────┘
             │
             │ Saves to
             ▼
┌─────────────────────────────────┐
│  Browser localStorage            │
│  Key: 'matchingSettings'         │
│                                  │
│  {                               │
│    weights: {...},               │
│    proximityEnabled: true,       │
│    maxDistanceKm: 50,            │
│    ...                           │
│  }                               │
└────────────┬────────────────────┘
             │
             │ Read by both
             ▼
┌──────────────────┬──────────────┐
│                  │              │
▼                  ▼              │
Admin Matcher   Chatbot Discovery │
Uses config     Uses config       │
                                  │
Both use SmartMatcher class ◄─────┘
(same algorithm, same config)
```

### The SmartMatcher Class

SmartMatcher is a JavaScript class (code library) that implements the matching algorithm. Think of it like a calculator - you give it settings (config) and two items to compare, it returns a match score.

**Location:** `/website/public/assets/chat/smart-matcher.js`

**What it does:**
- Takes configuration (weights, thresholds, proximity settings)
- Compares two items (ask vs offer, query vs resource)
- Returns match score (0-100%) with detailed breakdown

**Important:** SmartMatcher itself doesn't store settings. It's a stateless tool that uses whatever config you pass to it.

---

## Configuration Settings

### Accessing the Settings Panel

1. Navigate to **Admin Dashboard** → **Ask/Offer Matcher**
2. Click the **gear icon** (⚙️) in bottom-right corner
3. Settings panel slides in from the right

### Settings Overview

#### 1. Semantic Model

**Purpose:** AI model for understanding text similarity

**Options:**
- `all-MiniLM-L6-v2` (Default) - Fast, 23MB, good accuracy
- `paraphrase-MiniLM-L3-v2` - Fastest, 17MB, basic accuracy
- `all-mpnet-base-v2` - Best, 438MB, slow loading

**When to change:**
- Use faster model if browser crashes or runs slow
- Use better model if you have fast internet and want higher accuracy

**Default:** `all-MiniLM-L6-v2` (recommended)

---

#### 2. Semantic Threshold

**Purpose:** Minimum text similarity required to count as a match

**Range:** 0.2 (loose) to 0.8 (strict)
**Default:** 0.4 (balanced)

**How it works:**
- Compares ask text vs offer text using AI embeddings
- Produces similarity score (0-1)
- Only counts if score ≥ threshold

**Example:**
```
Ask: "Need funding for waste management project"
Offer: "Grants available for environmental initiatives"

Similarity: 0.65

If threshold = 0.4 → ✅ Match (0.65 ≥ 0.4)
If threshold = 0.7 → ❌ No match (0.65 < 0.7)
```

**When to adjust:**
- **Lower (0.2-0.3):** More matches, less strict, may include loosely related items
- **Higher (0.6-0.8):** Fewer matches, very strict, only close semantic matches

**Recommended:** 0.4 for general use, 0.3 for discovery mode

---

#### 3. Score Weights

**Purpose:** Control how much each factor contributes to the final match score

**Available Weights:**

| Component | Default | Range | What It Measures |
|-----------|---------|-------|------------------|
| **Tags** | 40% | 0-100% | Category matches (funding, volunteers, space, etc.) |
| **Keywords** | 30% | 0-100% | Word overlap between ask and offer |
| **City** | 15% | 0-100% | City name matching (typo-tolerant) |
| **Theme** | 15% | 0-100% | Theme/focus area matches |
| **Semantic** | 25% | 0-100% | AI-powered text similarity |
| **Proximity** | 30% | 0-50% | Geographical distance (km) |

**Total Weight:** Can exceed 100% - scores are normalized automatically

**How weights work:**
```
Example Match:
- Tags: Perfect match → Gets full 40%
- Keywords: 3 common words → Gets ~20%
- City: Bengaluru = Bangalore → Gets 15%
- Theme: No match → Gets 0%
- Semantic: 0.65 similarity → Gets 16% (0.65 × 25%)
- Proximity: 5km distance → Gets 25% (high proximity score)

Total: 40 + 20 + 15 + 0 + 16 + 25 = 116%
Normalized: 116% / (total weight sum) = ~70% Final Score
```

**When to adjust weights:**

**Scenario 1: Emphasize local matches**
- Increase Proximity: 40-50%
- Decrease Keywords: 20%
- Result: Nearby resources ranked higher

**Scenario 2: Emphasize category matching**
- Increase Tags: 50-60%
- Decrease Proximity: 20%
- Result: Same-category matches ranked higher, distance less important

**Scenario 3: Emphasize semantic understanding**
- Increase Semantic: 35-40%
- Decrease Keywords: 20%
- Result: AI understanding matters more than exact word matches

**Best Practice:** Total weights between 100-150% works well. Over 200% may make scoring less intuitive.

---

#### 4. City Matching Mode

**Purpose:** How to compare city names (handles typos, variations)

**Options:**

| Mode | How It Works | Example | When to Use |
|------|-------------|---------|-------------|
| **Exact** | Must match exactly | Bengaluru = Bengaluru ✅<br>Bengaluru ≠ Bangalore ❌ | Clean, standardized data |
| **Fuse.js** (Default) | Fuzzy matching, typo-tolerant | Bengaluru ≈ Bangalore ✅<br>Malleswaram ≈ Malleshwaram ✅ | Real-world data with typos |
| **Semantic** | AI understanding | Bengaluru ≈ Bangalore ✅<br>Uses embeddings | Experimental, slower |
| **Normalized** | Hardcoded city map | Bengaluru = Bangalore ✅<br>Mumbai = Bombay ✅ | Only works for predefined cities |

**Recommended:** `Fuse.js` - Best balance of accuracy and performance

---

#### 5. Proximity Scoring

**Purpose:** Score matches by geographical distance

**Settings:**

**Enable Proximity Scoring** (Checkbox)
- ✅ Enabled (default): Distance affects match score
- ❌ Disabled: Distance shown but doesn't affect score

**Max Distance** (Slider: 10-100 km)
- Default: 50 km
- Resources beyond max distance get 0 proximity score
- Resources within max distance get score based on distance

**How proximity scoring works:**

```
Distance-to-Score Formula (Exponential Decay):
- 0 km   → 100% proximity score
- 5 km   → ~85% proximity score
- 10 km  → ~70% proximity score
- 25 km  → ~40% proximity score
- 50 km  → ~10% proximity score
- 100 km → 0% proximity score (if maxDistance = 50km)
```

**Example:**
```
Ask: "Need funding in Malleswaram"
Offer 1: "Funding in Rajajinagar" (3 km away)
Offer 2: "Funding in Whitefield" (15 km away)
Offer 3: "Funding in Mysore" (140 km away)

With Proximity Enabled (weight=30%, maxDistance=50km):
- Offer 1: Proximity score = ~90% × 30% = 27 points
- Offer 2: Proximity score = ~55% × 30% = 16 points
- Offer 3: Proximity score = 0% × 30% = 0 points (beyond 50km)

With Proximity Disabled:
- All offers: Proximity score = 0 points (distance still shown)
```

**When to enable:**
- ✅ When location matters (local services, community events)
- ✅ When asks/offers have good location data
- ❌ When many resources lack location data
- ❌ When matching nationwide/online resources

**Max Distance Guidelines:**
- **10-20 km:** Hyper-local (same neighborhood)
- **30-50 km:** City-wide (default)
- **80-100 km:** Regional (metro area + suburbs)

---

## Step-by-Step: Configuring the Matcher

### Scenario 1: Local Community Matching (Neighborhood Focus)

**Goal:** Match asks/offers within the same neighborhood, prioritize proximity

**Steps:**
1. Open Settings Panel
2. Set weights:
   - Tags: 35%
   - Keywords: 25%
   - City: 10%
   - Theme: 10%
   - Semantic: 20%
   - **Proximity: 40%** ← Higher priority
3. Enable Proximity Scoring: ✅
4. Set Max Distance: **20 km** ← Neighborhood radius
5. City Match Mode: **Fuse.js**
6. Semantic Threshold: **0.35** ← More inclusive
7. Click **Apply Settings**

**Result:** Nearby resources ranked much higher, matches limited to 20km radius

---

### Scenario 2: Category-Based Matching (Ignore Location)

**Goal:** Match by category/theme, location doesn't matter

**Steps:**
1. Open Settings Panel
2. Set weights:
   - **Tags: 50%** ← Highest priority
   - Keywords: 25%
   - City: 5%
   - **Theme: 20%** ← Secondary priority
   - Semantic: 25%
   - Proximity: 0%
3. Enable Proximity Scoring: ❌ ← Disabled
4. City Match Mode: **Fuse.js**
5. Semantic Threshold: **0.4**
6. Click **Apply Settings**

**Result:** Category matches dominate, proximity irrelevant

---

### Scenario 3: Semantic Understanding Focus

**Goal:** Use AI to find conceptually similar asks/offers

**Steps:**
1. Open Settings Panel
2. Set weights:
   - Tags: 25%
   - Keywords: 15%
   - City: 10%
   - Theme: 10%
   - **Semantic: 40%** ← Highest priority
   - Proximity: 25%
3. Semantic Model: **all-MiniLM-L6-v2**
4. Semantic Threshold: **0.3** ← Lower for more matches
5. Click **Apply Settings**

**Result:** AI understanding drives matching, finds conceptual similarities

---

## Understanding Match Results

### Match Score Breakdown

When you expand "Show Details" on a match, you see:

```
🟢 85% Match  📍 7.8 km  EXCELLENT

┌─────────────┬──────────────────────────┬────────┐
│ Component   │ Details                  │ Score  │
├─────────────┼──────────────────────────┼────────┤
│ 🏷️ Tags     │ funding, volunteers      │ +40%   │
│ 🔑 Keywords │ 5 common words           │ +25%   │
│ 📍 City     │ Bengaluru = Bangalore    │ +15%   │
│ 🎨 Theme    │ No match                 │ +0%    │
│ 🧠 Semantic │ Cosine: 0.68             │ +17%   │
│ 📍 Proximity│ 7.8 km away              │ +23%   │
├─────────────┴──────────────────────────┼────────┤
│ Total Score                            │ 85%    │
└────────────────────────────────────────┴────────┘
```

**How to interpret:**

- **Tags +40%:** Both ask and offer involve "funding" and "volunteers"
- **Keywords +25%:** 5 words appear in both (e.g., "community", "project", "support")
- **City +15%:** City names match (even with variation)
- **Theme +0%:** Themes don't match
- **Semantic +17%:** AI similarity is 0.68, above threshold (0.4), contributes 0.68 × 25% = 17%
- **Proximity +23%:** 7.8 km distance scores ~77% proximity, contributes 0.77 × 30% = 23%

**Total:** 120% before normalization → 85% after normalization

---

### Match Confidence Levels

| Level | Score Range | Meaning | Action |
|-------|-------------|---------|--------|
| 🟢 **Excellent** | 85-100% | Strong match across multiple components | Highly recommend connecting |
| 🟡 **Good** | 70-84% | Solid match with some gaps | Worth exploring |
| 🟠 **Potential** | 50-69% | Partial match, may work depending on context | Review case-by-case |

**Filters:**
- Use "Min Confidence" dropdown to show only high-quality matches
- Default: 50%+ (Potential and above)

---

## How Chatbot Discovery Uses Your Settings

When users search in the public chatbot (homepage), it uses **the exact same configuration** you set in the admin.

### Example Flow

```
1. Admin sets:
   - Proximity: 35%
   - Max Distance: 30 km
   - Proximity Enabled: ✅

2. User opens chatbot on homepage

3. User searches: "waste management in malleswaram"

4. Chatbot:
   - Loads config from localStorage (your admin settings)
   - Creates SmartMatcher with YOUR config
   - Searches for matches
   - Orders by proximity (within 30 km)

5. User sees results ordered by distance
```

**Console Logs (Visible in Browser DevTools):**
```
[Discovery] SmartMatcher initialized with config: {...}
[Discovery] Using admin settings: YES
[SmartMatcher] Proximity: Community A to Provider B = 5.2km (score: 0.85)
```

**When settings change:**
```
1. Admin changes Proximity to 0%, disables proximity
2. Admin clicks "Apply Settings"
3. Event broadcast: 'matchingSettingsChanged'
4. Chatbot hears event (if open)
5. Chatbot reloads config
6. Next search ignores proximity

Console logs:
[Discovery] Detected config change from admin
[Discovery] Matcher config refreshed
[Discovery] Using admin settings: YES
```

---

## Best Practices

### 1. Start with Defaults

The default settings work well for most cases:
- Tags: 40%, Keywords: 30%, City: 15%, Theme: 15%, Semantic: 25%, Proximity: 30%
- Proximity enabled, 50 km radius
- Fuse.js city matching
- 0.4 semantic threshold

**Only adjust if you have specific needs.**

---

### 2. Test After Major Changes

After changing weights significantly:
1. Click **Apply Settings**
2. Run matching on known asks/offers
3. Review top matches - do they make sense?
4. Adjust if needed

---

### 3. Monitor Console Logs

Open browser DevTools (F12) → Console tab

**Useful logs:**
```
[Matcher] SmartMatcher initialized with settings: {...}
[Discovery] Using admin settings: YES
[SmartMatcher] Proximity: Item1 to Item2 = 12.5km (score: 0.65)
```

---

### 4. Document Your Changes

When you make significant configuration changes, note:
- Date changed
- What you changed
- Why (use case)
- Result (did it improve matches?)

**Example:**
```
Date: 2025-01-20
Changed: Proximity 30% → 45%, Max Distance 50km → 30km
Why: Focusing on hyper-local neighborhood connections
Result: Excellent - users report more relevant local matches
```

---

### 5. Coordinate with Team

If multiple admins manage the matcher:
- **Settings are global** - changes affect all users immediately
- Communicate before making major changes
- Test in low-traffic times if possible

---

## Troubleshooting

### Issue: No Matches Appearing

**Possible Causes:**

1. **Min Confidence too high**
   - Solution: Lower confidence filter to 0% (show all)

2. **Semantic threshold too strict**
   - Solution: Lower to 0.3 or 0.2

3. **Proximity enabled but no location data**
   - Solution: Disable proximity or ensure asks/offers have locations

4. **Weights sum too high with strict scoring**
   - Solution: Lower total weight sum to ~125%

---

### Issue: Chatbot Not Using Admin Settings

**Symptoms:**
- Console shows: "Using admin settings: NO (defaults)"

**Possible Causes:**

1. **Settings not saved**
   - Solution: Click "Apply Settings" in admin matcher

2. **Different browser/incognito mode**
   - Solution: Settings stored in localStorage, not shared across browsers

3. **localStorage cleared**
   - Solution: Reapply settings in admin

**How to verify:**
1. Open browser DevTools (F12) → Console
2. Type: `localStorage.getItem('matchingSettings')`
3. Should return JSON object with your settings
4. If null, settings not saved

---

### Issue: Proximity Scores Always 0

**Possible Causes:**

1. **Proximity disabled**
   - Solution: Enable "Proximity Scoring" checkbox

2. **No location data in asks/offers**
   - Solution: Ensure items have `city`, `location`, or `lat`/`lon` fields

3. **Cities not in coordinate database**
   - Solution: SmartMatcher has ~80 Indian cities. Unknown cities get 0 proximity
   - Check: `/website/public/assets/chat/smart-matcher.js` lines 47-79 for supported cities

**Debug:**
```javascript
// In console:
const matcher = new SmartMatcher({proximityEnabled: true});
matcher.extractCoordinates('Malleswaram'); // Should return {lat, lon}
matcher.extractCoordinates('Unknown City'); // Returns null
```

---

### Issue: Settings Reset After Page Refresh

**Cause:** JavaScript error preventing settings save

**Solution:**
1. Open Console (F12) - look for errors
2. Common errors:
   - SmartMatcher not loaded: Check if `smart-matcher.js` loaded
   - localStorage blocked: Check browser privacy settings
3. Report error to technical team

---

## Technical Details (For Developers)

### localStorage Schema

**Key:** `matchingSettings`

**Value (JSON):**
```json
{
  "model": "Xenova/all-MiniLM-L6-v2",
  "semanticThreshold": 0.4,
  "weights": {
    "tags": 40,
    "keywords": 30,
    "city": 15,
    "theme": 15,
    "semantic": 25,
    "proximity": 30
  },
  "cityMatchMode": "fuse",
  "proximityEnabled": true,
  "maxDistanceKm": 50,
  "lastUpdated": "2025-01-20T10:30:00Z"
}
```

---

### Event Broadcasting

**Event Name:** `matchingSettingsChanged`

**Payload:** Full settings object

**Example:**
```javascript
// Admin matcher dispatches:
window.dispatchEvent(new CustomEvent('matchingSettingsChanged', {
  detail: currentSettings
}));

// Discovery engine listens:
window.addEventListener('matchingSettingsChanged', (e) => {
  console.log('Config changed:', e.detail);
  this.refreshMatcherConfig();
});
```

---

### Files Involved

| File | Purpose | Editable by Admin? |
|------|---------|-------------------|
| `/admin/matcher.html` | Admin UI, settings controls | ❌ (code only) |
| `/assets/chat/smart-matcher.js` | Matching algorithm | ❌ (code only) |
| `/assets/chat/discovery-engine.js` | Chatbot discovery | ❌ (code only) |
| `localStorage['matchingSettings']` | Your configuration | ✅ (via UI) |

**Admin Control:** You control the configuration via UI, not code.

---

## FAQ

### Q: Do I need to configure both admin and chatbot separately?

**A:** No! Configure once in admin, it applies to both automatically.

---

### Q: Can different users have different settings?

**A:** No. Settings are global (stored in browser localStorage). All users on the same browser see the same settings.

---

### Q: What happens if I clear browser cache?

**A:** Settings are lost. They'll reset to defaults. You'll need to reconfigure.

---

### Q: Can I export/import settings?

**A:** Not currently in the UI. Developers can:
```javascript
// Export
const settings = localStorage.getItem('matchingSettings');
console.log(settings); // Copy this JSON

// Import (paste JSON)
localStorage.setItem('matchingSettings', '{"weights":{...}}');
location.reload();
```

---

### Q: Why are total weights over 100%?

**A:** Weights are normalized automatically. 150% total weight works fine - each component's contribution is scaled proportionally.

**Example:**
- Total weights: 150%
- Tags score: 40% → Normalized: 40/150 = 26.7%
- Proximity score: 30% → Normalized: 30/150 = 20%

---

### Q: How do I add a new city to proximity scoring?

**A:** Contact technical team. They need to add coordinates to `smart-matcher.js`:

```javascript
// In smart-matcher.js, add to cityCoordinates object:
'yourcity': { lat: 12.9716, lon: 77.5946 },
```

---

### Q: Can I disable semantic matching entirely?

**A:** Yes! Set Semantic weight to 0%. The AI model won't be used for matching.

---

### Q: How often should I adjust settings?

**A:** Rarely. Default settings work well. Only adjust if:
- User feedback indicates poor matches
- You're launching a new matching campaign with specific needs
- Data characteristics change (e.g., more location data available)

---

## Support

**For configuration questions:** Refer to this guide

**For technical issues:**
- Check browser console for errors (F12 → Console)
- Verify settings saved: `localStorage.getItem('matchingSettings')`
- Contact technical team with:
  - What you changed
  - What you expected
  - What actually happened
  - Console errors (if any)

**For feature requests:**
- Submit via GitHub issues or internal ticketing system
- Include use case and expected behavior

---

## Changelog

### Version 1.0 (January 2025)
- Initial unified matching system
- Added proximity scoring
- Synchronized admin and chatbot configuration
- Real-time settings propagation

---

**Last Review:** January 2025
**Next Review:** July 2025
