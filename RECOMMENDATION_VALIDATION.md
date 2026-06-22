# Recommendation System Validation

## Changes Made

### 1. Wired `boostWithPSCFrequency()` into `computeTopicScores()`

**File:** `src/services/infinityScorer.ts:259`

**Before:** `computeTopicScores()` returned raw multi-factor scores sorted by finalScore. The PSC frequency boost existed as `boostWithPSCFrequency()` but was never called anywhere.

**After:** The scores array is passed through `boostWithPSCFrequency()` before returning, applying 80/20 weighting (80% learning need, 20% PSC historical frequency).

**Effect:** Topics with high PSC question counts (e.g., Constitution, Kerala Geography, Renaissance) receive a small increase relative to rarely-tested topics. The 80/20 blend ensures learning need dominates — the boost only changes ranking when two topics have nearly identical learning-need scores.

### 2. Fixed `getBlueprintBoost()` Default Value

**File:** `src/services/blueprintAlignment.ts:101`

**Before:** The function returned a hardcoded `1.5` when cache was null (no coverage data), which happened on every cold start because `load()` was never called eagerly.

**After:** Default return changed to `1.0` (no boost), and an eager `load()` call was added at module init (`blueprintAlignment.ts:22`).

**Effect:** When coverage data is unavailable (first launch, cleared storage), topics receive a neutral boost instead of an artificial 1.5x. After enough generations (`MIN_RECORDS_BOOST = 3`), the real coverage-vs-target calculation activates.

### 3. Fixed Scoring Consistency (Double-Count & Denominator Mismatch)

**File:** `src/services/infinityScorer.ts:221`, `src/services/revisionEngine.ts:24`

**Before:**
- `infinityScorer`: `importanceScore = (subjectWeight * topicWeight * catBoost) / 100`
- `revisionEngine`: `importance = (sw * tw * cb) / 50`

Both multiplied by `getCategoryBoost()` even though `getSubjectWeight()` already applies `CATEGORY_WEIGHTS[sub.category]`. The revision engine also used `/50` instead of `/100`.

**After:**
- `infinityScorer`: `importanceScore = (subjectWeight * topicWeight) / 100`
- `revisionEngine`: `importance = (sw * tw) / 100`

**Effect:**
- Category weight is no longer double-counted (was inflating importance by `catMul^2` instead of `catMul`)
- Revision engine importance denominator is now consistent with infinity scorer at `/100`

### 4. Added Debug Telemetry Fields

**File:** `src/services/infinityScorer.ts`, `src/services/pscFrequencyBoost.ts`

`TopicScore` now includes optional debug fields:
- `pscFrequencyWeight` — normalized PSC frequency (0–1) for the topic
- `scoreBeforePscBoost` — the raw final score before the 80/20 blend

Consumers can inspect these fields to understand how much the PSC frequency affected each topic's final score.

## How to Verify

### Verification 1: Default boost is 1.0 not 1.5

1. Clear AsyncStorage or run on fresh install
2. Generate a question
3. Check `getBlueprintBoost()` return value — should be `1.0`, not `1.5`
4. After 3+ generations, the real coverage-vs-target calculation should activate

### Verification 2: Category weight is applied once, not twice

Check importance scores for two subjects in different categories:

| Subject | Category | Old importance (sw × tw × catMul²) | New importance (sw × tw) |
|---------|----------|-----------------------------------|--------------------------|
| Kerala History | Kerala Specific (1.2) | `12 × tw × 1.44` | `12 × tw` |
| Science | Science (0.8) | `7 × tw × 0.64` | `7 × tw` |

The ratio between them should change from `(12 × 1.44) / (7 × 0.64) = 3.86` to `12 / 7 = 1.71`, reflecting the actual weight difference without category amplification.

### Verification 3: PSC frequency affects recommendations

1. Enable debug logging or inspect `TopicScore.pscFrequencyWeight` and `TopicScore.scoreBeforePscBoost`
2. Compare top-5 recommendations with and without the boost by temporarily reverting `boostWithPSCFrequency()` call
3. High-frequency PSC topics (Constitution, Kerala Geography) should appear slightly higher when tied with non-PSC topics of equal weakness

### Verification 4: Revision engine importance is consistent

Compare `getImportance()` output between `revisionEngine.ts` and `infinityScorer.ts` for the same subject+topic — they should now produce the same value (modulo the min/max clamp in revision engine).

## Expected Impact on Recommendations

| Scenario | Before Change | After Change |
|----------|--------------|--------------|
| Cold start, no coverage data | Blueprint boost = 1.5x for all | Blueprint boost = 1.0x for all |
| Topic in high-PSC category (Constitution) | No PSC influence | +0–3% final score from 20% blend |
| Topic in low-PSC category (IT & Cyber Laws) | No PSC influence | No change (freq ≈ 0) |
| Two equally weak topics | Tie broken by recency penalty | Tie broken by PSC frequency if mapped |
| Revision engine importance | Inflated by catMul², denominator /50 | Correct catMul, denominator /100 |
| Blueprint coverage-corrected gap | Never activated (always 1.5x) | Activates after 3 generations |
