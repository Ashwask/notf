# Scoring Algorithm Analysis

## Current Formula

```javascript
categoryScore += matchQuality * keywordWeight
```

Where:
- `matchQuality = 1 - fuseScore` (0 to 1, higher = better match)
- `keywordWeight = keyword.split(' ').length` (1, 2, 3, etc.)

## Potential Issues

### Issue 1: Multiple Weak Matches Beat One Strong Match

**Example:**
- Category A: 5 keywords match at 0.5 quality each (1 word each)
  - Score: `5 × (0.5 × 1) = 2.5`

- Category B: 1 keyword matches perfectly (1 word)
  - Score: `1 × (1.0 × 1) = 1.0`

**Result:** Category A wins even though its matches are weak!

### Issue 2: Multi-word Phrase Weight May Be Too Aggressive

**Example for "streetlight broken":**

- Keyword "light not working" (3 words) matches "light" at 0.4 quality
  - Score: `0.4 × 3 = 1.2`

- Keyword "broken" (1 word) matches perfectly at 1.0 quality
  - Score: `1.0 × 1 = 1.0`

**Question:** Should a weak 3-word match (1.2) beat a perfect 1-word match (1.0)?

### Issue 3: Compound Word Matching

**Example for "streetlite not working":**

- Fuse.js might match "streetlite" to "streetlight" at 0.2 distance (80% similar)
  - Score: `0.8 × 1 = 0.8`

- Fuse.js might also match to "light not working" at 0.3 distance (70% similar)
  - Score: `0.7 × 3 = 2.1`

**Result:** Weak multi-word match (2.1) beats strong single-word match (0.8)

## Real-World Test: "broken drain"

### Blocked Drain Category
Keywords: `['blocked', 'clogged', 'drain block', 'choked drain', 'overflow']`

**Potential matches:**
1. "blocked" fuzzy matches "broken" (~70% similar, 0.3 distance)
   - Score: `0.7 × 1 = 0.7`

2. "drain block" contains "drain" (exact) and "block" (similar to "broken")
   - If Fuse matches at 0.2 distance (80% similar)
   - Score: `0.8 × 2 = 1.6`

**Total category score: 0.7 + 1.6 = 2.3**

### Sewage Overflow Category
Keywords: `['sewage', 'overflow', 'sewage leak', 'sewage smell', 'manhole']`

**Potential matches:**
1. "overflow" doesn't match anything in "broken drain" (no match)

**Total category score: 0**

**Result:** "Blocked Drain" wins ✓ (correct!)

---

## Proposed Alternatives

### Alternative 1: Penalize Weak Matches (Square Root)

```javascript
categoryScore += matchQuality * Math.sqrt(keywordWeight)
```

**Effect:**
- Single word perfect: `1.0 × 1 = 1.0`
- 3-word weak (0.5): `0.5 × 1.73 = 0.87` (now loses to perfect match)
- 3-word strong (0.9): `0.9 × 1.73 = 1.56` (still gets boost)

### Alternative 2: Quality-Gated Boost

```javascript
categoryScore += matchQuality * (1 + (keywordWeight - 1) * matchQuality)
```

**Effect:**
- Single word perfect: `1.0 × 1 = 1.0`
- 3-word weak (0.5): `0.5 × (1 + 2 × 0.5) = 0.5 × 2 = 1.0` (tied)
- 3-word strong (0.9): `0.9 × (1 + 2 × 0.9) = 0.9 × 2.8 = 2.52` (big boost)

**Logic:** Only boost multi-word matches if the quality is high.

### Alternative 3: Exponential Quality Penalty

```javascript
categoryScore += Math.pow(matchQuality, 1.5) * keywordWeight
```

**Effect:**
- Single word perfect: `1.0^1.5 × 1 = 1.0`
- 3-word weak (0.5): `0.35 × 3 = 1.05` (slight advantage)
- 3-word strong (0.9): `0.85 × 3 = 2.55` (strong advantage)

**Logic:** Penalize low-quality matches more aggressively.

---

## Recommendation

### Option A: Keep Current (Simple)

**Pros:**
- Simple and predictable
- Works for most cases
- Multi-word phrases should get priority (more specific)

**Cons:**
- Multiple weak matches can outscore strong matches
- May produce false positives

### Option B: Use Alternative 2 (Quality-Gated Boost)

**Pros:**
- Balanced approach
- Weak matches don't get unfair boost
- Strong multi-word matches still prioritized
- Intuitive: "boost only if you're confident"

**Cons:**
- Slightly more complex
- Harder to tune

### Option C: Use Alternative 1 (Square Root)

**Pros:**
- Simple modification
- Reduces multi-word advantage without eliminating it
- Mathematical elegance

**Cons:**
- Less intuitive
- May not differentiate enough

---

## Testing Required

We need to test these scenarios:

1. **"broken drain"** → Should match "Blocked Drain"
2. **"streetlite not working"** → Should match "Street Light Not Working"
3. **"garbge dumping"** → Should match "Illegal Garbage Dump"
4. **"light is broken"** → Should match "Street Light" not "Tree Pruning" (even if it has "light" keyword)
5. **"pothole big"** → Should match "Pothole" strongly (even with extra word)

For each test, compare:
- Current scoring
- Alternative 1 (sqrt)
- Alternative 2 (quality-gated)
- Alternative 3 (exponential)

---

## Questions to Answer

1. **Is the current scoring producing wrong results?**
   - If yes → we need to fix it
   - If no → we should document it and move on

2. **What behavior do we want?**
   - Should "light not working" (weak match) beat "light" (perfect match)?
   - Should 5 weak matches beat 1 perfect match?

3. **What's the actual Fuse.js behavior?**
   - Does it correctly find "blocked" in "broken drain"?
   - What scores does it return for partial matches?

---

## Next Steps

1. Run `test-fuse-behavior.html` to understand Fuse.js matching
2. Run `test-scoring-analysis.html` to see actual scores
3. Compare results with expected behavior
4. Decide if scoring formula needs adjustment
5. Implement and test any changes
