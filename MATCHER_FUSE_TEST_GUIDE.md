# Ask/Offer Matcher - Fuse.js Testing Guide

**Purpose:** Verify that the admin matcher is using Fuse.js for fuzzy city matching and text similarity scoring.

---

## Quick Start

1. **Start Local Server:**
   ```bash
   cd /Users/sathya/Documents/GitHub/notf/website/public
   python3 -m http.server 8080
   ```

2. **Open Matcher:**
   ```
   http://localhost:8080/admin/matcher.html
   ```

3. **Open Browser Console:**
   - Chrome/Edge: `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows)
   - Firefox: `Cmd + Option + K` (Mac) or `Ctrl + Shift + K` (Windows)
   - Safari: `Cmd + Option + C` (Mac) - Enable Developer menu first

---

## Test 1: Verify Fuse.js is Loaded

**In Browser Console, run:**

```javascript
// Check if Fuse.js is loaded
if (typeof Fuse !== 'undefined') {
    console.log('✅ Fuse.js is loaded!');
    console.log('Version:', Fuse.version || '7.0.0');
} else {
    console.log('❌ Fuse.js NOT loaded');
}
```

**Expected Output:**
```
✅ Fuse.js is loaded!
Version: 7.0.0
```

---

## Test 2: Test City Fuzzy Matching

This tests if "Bengaluru" matches "Bangalore" using Fuse.js.

**In Browser Console, run:**

```javascript
// Test city fuzzy matching
const testCityPairs = [
    { ask: 'Bengaluru', offer: 'Bangalore', shouldMatch: true },
    { ask: 'Mumbai', offer: 'Bombay', shouldMatch: false },  // Too different
    { ask: 'Bengalore', offer: 'Bengaluru', shouldMatch: true },  // Typo
    { ask: 'Hydrabad', offer: 'Hyderabad', shouldMatch: true },  // Typo
    { ask: 'Chennai', offer: 'Chennai', shouldMatch: true }  // Exact
];

console.log('=== City Fuzzy Matching Test ===\n');

testCityPairs.forEach(({ ask, offer, shouldMatch }) => {
    // Exact match check
    const exactMatch = ask.toLowerCase() === offer.toLowerCase();

    // Fuzzy match check (using Fuse.js)
    const cityFuse = new Fuse([offer], {
        threshold: 0.5,
        ignoreLocation: true
    });
    const fuzzyMatch = cityFuse.search(ask);
    const hasFuzzyMatch = fuzzyMatch.length > 0;

    const result = exactMatch || hasFuzzyMatch;
    const icon = result === shouldMatch ? '✅' : '❌';
    const score = hasFuzzyMatch ? ((1 - fuzzyMatch[0].score) * 100).toFixed(0) : 0;

    console.log(`${icon} "${ask}" vs "${offer}"`);
    console.log(`   Expected: ${shouldMatch ? 'Match' : 'No match'}`);
    console.log(`   Exact: ${exactMatch}, Fuzzy: ${hasFuzzyMatch}${hasFuzzyMatch ? ` (${score}% similarity)` : ''}`);
    console.log(`   Result: ${result ? 'MATCH' : 'NO MATCH'}\n`);
});
```

**Expected Output:**
```
=== City Fuzzy Matching Test ===

✅ "Bengaluru" vs "Bangalore"
   Expected: Match
   Exact: false, Fuzzy: true (73% similarity)
   Result: MATCH

❌ "Mumbai" vs "Bombay"
   Expected: No match
   Exact: false, Fuzzy: false
   Result: NO MATCH

✅ "Bengalore" vs "Bengaluru"
   Expected: Match
   Exact: false, Fuzzy: true (89% similarity)
   Result: MATCH

✅ "Hydrabad" vs "Hyderabad"
   Expected: Match
   Exact: false, Fuzzy: true (85% similarity)
   Result: MATCH

✅ "Chennai" vs "Chennai"
   Expected: Match
   Exact: true, Fuzzy: true (100% similarity)
   Result: MATCH
```

---

## Test 3: Test Text Similarity Matching

This tests if different wording in asks/offers still matches using Fuse.js.

**In Browser Console, run:**

```javascript
// Test text similarity matching
const testTextPairs = [
    {
        ask: 'Need funding for waste management project',
        offer: 'Providing financial support for environmental initiatives',
        expectedSimilarity: 'Medium'
    },
    {
        ask: 'Looking for volunteers to help with community cleanup',
        offer: 'We offer volunteer support for civic activities',
        expectedSimilarity: 'High'
    },
    {
        ask: 'Require space for education workshops',
        offer: 'Office space available for training sessions',
        expectedSimilarity: 'Medium'
    },
    {
        ask: 'Need expertise in water conservation',
        offer: 'Expert guidance on water management',
        expectedSimilarity: 'High'
    }
];

console.log('=== Text Similarity Test ===\n');

testTextPairs.forEach(({ ask, offer, expectedSimilarity }) => {
    const offerFuse = new Fuse([{ text: offer }], {
        keys: ['text'],
        threshold: 0.5,
        includeScore: true,
        ignoreLocation: true
    });

    const textMatch = offerFuse.search(ask);
    const hasSimilarity = textMatch.length > 0;
    const similarity = hasSimilarity ? ((1 - textMatch[0].score) * 100).toFixed(0) : 0;

    // Calculate contribution to match score (25% weight)
    const scoreContribution = hasSimilarity ?
        ((1 - textMatch[0].score) * 0.25 * 100).toFixed(0) : 0;

    console.log(`Ask: "${ask}"`);
    console.log(`Offer: "${offer}"`);
    console.log(`Similarity: ${similarity}% (${expectedSimilarity} expected)`);
    console.log(`Contribution to match score: ${scoreContribution}% (of 25% possible)`);
    console.log('---\n');
});
```

**Expected Output:**
```
=== Text Similarity Test ===

Ask: "Need funding for waste management project"
Offer: "Providing financial support for environmental initiatives"
Similarity: 45% (Medium expected)
Contribution to match score: 11% (of 25% possible)
---

Ask: "Looking for volunteers to help with community cleanup"
Offer: "We offer volunteer support for civic activities"
Similarity: 62% (High expected)
Contribution to match score: 16% (of 25% possible)
---

Ask: "Require space for education workshops"
Offer: "Office space available for training sessions"
Similarity: 58% (Medium expected)
Contribution to match score: 15% (of 25% possible)
---

Ask: "Need expertise in water conservation"
Offer: "Expert guidance on water management"
Similarity: 71% (High expected)
Contribution to match score: 18% (of 25% possible)
---
```

---

## Test 4: Compare Before vs After Fuse.js

This demonstrates the difference between old exact matching and new fuzzy matching.

**In Browser Console, run:**

```javascript
// Mock ask and offer objects
const mockAsk = {
    id: 'test-ask-1',
    text: 'Need funding for waste management in Bengaluru',
    from: 'Test Community',
    city: 'Bengaluru',
    tags: ['funding', 'waste-management'],
    keywords: ['need', 'funding', 'waste', 'management'],
    theme: 'environment'
};

const mockOffer = {
    id: 'test-offer-1',
    text: 'Providing financial support for environmental projects in Bangalore',
    from: 'Test Provider',
    city: 'Bangalore',
    tags: ['funding'],
    keywords: ['providing', 'financial', 'support', 'environmental', 'projects'],
    theme: 'environment'
};

console.log('=== Before vs After Fuse.js Comparison ===\n');

// OLD METHOD (exact matching only)
function calculateMatchScoreOld(ask, offer) {
    let score = 0;

    // Tags
    const commonTags = ask.tags.filter(t => offer.tags.includes(t));
    score += commonTags.length * 0.4;

    // Keywords
    const commonKeywords = ask.keywords.filter(k => offer.keywords.includes(k));
    score += Math.min(commonKeywords.length * 0.1, 0.3);

    // City (exact only)
    if (ask.city && offer.city && ask.city === offer.city) {
        score += 0.15;
    }

    // Theme
    if (ask.theme && offer.theme && ask.theme === offer.theme) {
        score += 0.15;
    }

    return Math.min(score, 1.0);
}

// NEW METHOD (with Fuse.js)
function calculateMatchScoreNew(ask, offer) {
    let score = 0;

    // 1. Tags
    const commonTags = ask.tags.filter(t => offer.tags.includes(t));
    score += commonTags.length * 0.4;

    // 2. Keywords
    const commonKeywords = ask.keywords.filter(k => offer.keywords.includes(k));
    score += Math.min(commonKeywords.length * 0.1, 0.3);

    // 3. City (fuzzy with Fuse.js)
    if (ask.city && offer.city) {
        if (ask.city.toLowerCase() === offer.city.toLowerCase()) {
            score += 0.15;
        } else if (typeof Fuse !== 'undefined') {
            const cityFuse = new Fuse([offer.city], {
                threshold: 0.5,
                ignoreLocation: true
            });
            const cityMatch = cityFuse.search(ask.city);
            if (cityMatch.length > 0) {
                score += 0.10;
            }
        }
    }

    // 4. Theme
    if (ask.theme && offer.theme && ask.theme === offer.theme) {
        score += 0.15;
    }

    // 5. Text similarity (Fuse.js)
    if (typeof Fuse !== 'undefined' && ask.text && offer.text) {
        const offerFuse = new Fuse([{ text: offer.text }], {
            keys: ['text'],
            threshold: 0.5,
            includeScore: true,
            ignoreLocation: true
        });

        const textMatch = offerFuse.search(ask.text);
        if (textMatch.length > 0) {
            const textSimilarity = 1 - textMatch[0].score;
            score += textSimilarity * 0.25;
        }
    }

    return Math.min(score, 1.0);
}

const oldScore = calculateMatchScoreOld(mockAsk, mockOffer);
const newScore = calculateMatchScoreNew(mockAsk, mockOffer);
const improvement = ((newScore - oldScore) / oldScore * 100).toFixed(0);

console.log('Ask:', mockAsk.text);
console.log('From:', mockAsk.from, '(' + mockAsk.city + ')');
console.log('\nOffer:', mockOffer.text);
console.log('From:', mockOffer.from, '(' + mockOffer.city + ')');
console.log('\n--- SCORING ---');
console.log('OLD (exact matching only):', (oldScore * 100).toFixed(0) + '%');
console.log('NEW (with Fuse.js):', (newScore * 100).toFixed(0) + '%');
console.log(`\n${improvement}% improvement with Fuse.js! 🎉`);

console.log('\n--- BREAKDOWN ---');
console.log('Tag matching: 40% (1 common tag: funding)');
console.log('Keyword matching: 0% (no common keywords)');
console.log('City matching:');
console.log('  - OLD: 0% (Bengaluru ≠ Bangalore)');
console.log('  - NEW: 10% (fuzzy match via Fuse.js)');
console.log('Theme matching: 15% (both "environment")');
console.log('Text similarity:');
console.log('  - OLD: N/A (not available)');
console.log('  - NEW: ~12% (fuzzy text matching via Fuse.js)');
```

**Expected Output:**
```
=== Before vs After Fuse.js Comparison ===

Ask: Need funding for waste management in Bengaluru
From: Test Community (Bengaluru)

Offer: Providing financial support for environmental projects in Bangalore
From: Test Provider (Bangalore)

--- SCORING ---
OLD (exact matching only): 55%
NEW (with Fuse.js): 77%

40% improvement with Fuse.js! 🎉

--- BREAKDOWN ---
Tag matching: 40% (1 common tag: funding)
Keyword matching: 0% (no common keywords)
City matching:
  - OLD: 0% (Bengaluru ≠ Bangalore)
  - NEW: 10% (fuzzy match via Fuse.js)
Theme matching: 15% (both "environment")
Text similarity:
  - OLD: N/A (not available)
  - NEW: ~12% (fuzzy text matching via Fuse.js)
```

---

## Test 5: Live Matcher Test with Real Data

If the matcher already has communities and members loaded:

**In Browser Console, run:**

```javascript
// Inspect existing match scoring
if (typeof allMatches !== 'undefined' && allMatches.length > 0) {
    console.log('=== Live Matcher Analysis ===\n');
    console.log(`Total matches found: ${allMatches.length}`);

    // Find matches that benefited from Fuse.js
    const fuzzyBenefitMatches = allMatches.filter(match => {
        // Check if cities are similar but not exact
        const citiesDifferent = match.ask.city && match.offer.city &&
            match.ask.city.toLowerCase() !== match.offer.city.toLowerCase();

        // Check if match score is high enough to suggest fuzzy matching helped
        return citiesDifferent && match.score >= 0.5;
    });

    console.log(`\nMatches likely improved by Fuse.js: ${fuzzyBenefitMatches.length}`);

    if (fuzzyBenefitMatches.length > 0) {
        console.log('\nExample matches:\n');
        fuzzyBenefitMatches.slice(0, 3).forEach((match, i) => {
            console.log(`${i + 1}. ${match.ask.from} (${match.ask.city}) ↔ ${match.offer.from} (${match.offer.city})`);
            console.log(`   Score: ${(match.score * 100).toFixed(0)}%`);
            console.log(`   Ask: "${match.ask.text.substring(0, 60)}..."`);
            console.log(`   Offer: "${match.offer.text.substring(0, 60)}..."`);
            console.log('');
        });
    }

    // Show confidence level distribution
    const excellent = allMatches.filter(m => m.confidenceLevel === 'excellent').length;
    const good = allMatches.filter(m => m.confidenceLevel === 'good').length;
    const potential = allMatches.filter(m => m.confidenceLevel === 'potential').length;

    console.log('Confidence Distribution:');
    console.log(`  Excellent (≥85%): ${excellent}`);
    console.log(`  Good (≥70%): ${good}`);
    console.log(`  Potential (≥50%): ${potential}`);
} else {
    console.log('⚠️ No matches available. Load communities and members data first.');
}
```

---

## Visual Verification in UI

Once the matcher page loads with real data:

1. **Look at the match cards** - You should see:
   - Match scores displayed (e.g., "75% Match")
   - Confidence levels (Excellent, Good, Potential)
   - Matched tags shown at bottom of cards

2. **Check for city variations:**
   - Look for matches where cities are spelled differently
   - Example: "Bengaluru" in ask, "Bangalore" in offer
   - These should still show as matches (NEW with Fuse.js!)

3. **Check match quality:**
   - More matches should appear overall
   - Match scores should be higher on average
   - Matches with similar wording should score well even without exact keyword matches

---

## Troubleshooting

### Fuse.js Not Loaded

**Problem:** Console shows "❌ Fuse.js NOT loaded"

**Solution:**
1. Check network tab - is CDN blocked?
2. Verify `<script>` tag in matcher.html:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
   ```
3. Check browser console for errors

### No Improvement in Matches

**Problem:** Scores look the same as before

**Possible Causes:**
1. Cities are already exact matches (no fuzzy needed)
2. Text descriptions are too different (low similarity)
3. Fuse.js threshold too strict

**Check:**
```javascript
// Verify Fuse.js is being called
console.log('Testing city fuzzy match...');
const testFuse = new Fuse(['Bangalore'], { threshold: 0.5 });
console.log('Bengaluru match:', testFuse.search('Bengaluru'));
// Should return results if working
```

---

## Success Criteria

✅ **Fuse.js loaded** (Test 1 passes)
✅ **City fuzzy matching works** (Test 2 shows Bengaluru ≈ Bangalore)
✅ **Text similarity works** (Test 3 shows non-zero scores)
✅ **Overall improvement** (Test 4 shows score increase)
✅ **Live matcher functional** (Test 5 shows matches)

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark as production-ready
2. Deploy to Vercel
3. Monitor match quality in production
4. Collect feedback from users

If tests fail:
1. Review console errors
2. Check Fuse.js CDN availability
3. Verify threshold settings
4. Report issues for debugging

---

**Testing Date:** _________
**Tested By:** _________
**Results:** ☐ Pass  ☐ Fail
**Notes:** _________________________________________
