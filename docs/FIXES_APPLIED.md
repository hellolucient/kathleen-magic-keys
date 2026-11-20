# Chapter 2 Fixes Applied

All critical issues have been resolved. The PR is now ready for review.

## 1. ✅ Chapter 1 Restoration (CRITICAL)

**Problem**: Merge of origin/main had reverted Chapter 1 changes
- Missing `door-glow.png`
- Old audio files restored (wrong fairy-intro.mp3, narr-complete.mp3)
- Old lines.json text (missing "I'm Pip")
- Lost GameScene.tsx improvements (door glow, fairy flying, etc.)

**Fix Applied**:
- Restored ALL Chapter 1 files from origin/main using `git checkout origin/main`
- Applied ONLY minimal changes for Chapter 2 (progress.chapter1.* structure)
- Migrated Chapter 1 to use reusable `LookForPreview` component
- Verified: `git diff origin/main -- game/public/audio game/public/art` shows **zero changes**

**Verification**: All Chapter 1 features from main (56bc6e4) are present:
- ✅ door-glow.png sprite
- ✅ Updated audio files with "I'm Pip"
- ✅ Door glow halo overlay
- ✅ Pip flies to door after 5th key
- ✅ Key-found chime with 800ms gap
- ✅ showKeyPreview with LookForPreview component
- ✅ Scene-level speech bubble positioning

## 2. ✅ Repository Root Cleanup

**Problem**: Junk files committed at repo root
- node_modules/
- package.json & package-lock.json
- playwright-report/
- test-results/
- playwright.config.ts

**Fix Applied**:
- Removed all junk from repo root
- Moved tests to `game/tests/`
- Added entries to `.gitignore`
- Moved playwright.config.ts to `game/`

## 3. ✅ Chapter 2 Speech Bubble Positioning

**Problem**: Speech bubble squashed as thin strip under flower counter, unreadable

**Fix Applied**:
- Changed top position from 12% to 20% (below counter)
- Maintained proper padding: 1.2rem
- Maintained readable text size: 1.3rem
- Maintained max-width: 34%
- Two position classes:
  - `pos-top-left`: Early game, clear of Pip and butterflies
  - `pos-bottom-right`: After completion, clear of petal/footprints

**Verification**: Screenshots show readable speech bubble never overlapping counter, Pip, butterflies, or flowers

## 4. ✅ Butterfly Sizes

**Problem**: 
- Butterflies too big when settled on flowers
- Covered flowers completely
- Free-flying butterflies also too large

**Fix Applied**:
- Free-flying butterflies: scaled to 0.7 (70% of original)
- Settled butterflies: scaled to 0.35 (about 1/3 of flower width)
- Positioned above flowers so colored flower stays visible
- Butterflies perch on top, not covering the flower

**Verification**: Screenshots show:
- Free butterflies float in open sky/path space
- Settled butterflies are small, perched on flowers
- Colored flowers clearly visible under butterflies

## 5. ✅ Chapter 1 Complete Screen

**Problem**: Needed clear "Next Chapter" button visible

**Fix Applied**:
- Chapter 1 complete screen shows three buttons:
  - "Play Again" (pink)
  - "Next Chapter ✨" (purple, prominent)
  - "Chapter Picker" (gold)
- Next Chapter button enabled for Chapter 1
- Disabled for Chapter 2 (shown as "Coming Soon")

**Verification**: Screenshot `ch1-complete-with-next-button.png` shows all three buttons clearly

## 6. ✅ Comprehensive Playwright Test

**Test Coverage**:
- Full Chapter 1 playthrough to completion
- All 5 keys collected (teddy, jewellery, curtain, wardrobe, mirror)
- Door glow sequence with Pip at door
- Next Chapter button click
- Full Chapter 2 playthrough
- All 6 butterfly-flower matches
- One wrong drop with feedback
- Completion sequence with footprints and petal
- Zero console errors (audio warnings filtered)

**Test Duration**: ~2 minutes at 1180x820 (iPad landscape)

**Test Status**: ✅ **PASSING**

## Screenshots Generated

All screenshots saved to `docs/ch2-test-stills/`:

### Chapter 1:
1. **ch1-door-glow-pip-at-door.png**
   - Shows glowing door (bright area visible)
   - Pip positioned at the door
   - Speech bubble bottom-left: "Five keys! You found them all, Princess Kathleen!"
   - All 5 keys in counter

2. **ch1-complete-with-next-button.png**
   - "Chapter 1 Complete!" title
   - Three buttons clearly visible: Play Again, Next Chapter ✨, Chapter Picker
   - Beautiful completion art with Pip and Kathleen

### Chapter 2:
3. **01-grey-garden-start.png**
   - Grey garden background
   - 6 colorful butterflies floating (properly sized)
   - Pip floating center-top
   - Flower counter showing 0/6
   - Butterflies in open sky, not over flowers

4. **03-mid-game-three-flowers.png**
   - 3 flowers colored (red, orange, yellow)
   - 3 butterflies settled on flowers (properly sized, ~1/3 flower width)
   - 3 butterflies still floating
   - Colored flowers clearly visible under settled butterflies
   - Counter shows 3/6

5. **04-wrong-drop-moment.png**
   - Captured during wrong butterfly drop
   - Shows gentle feedback without penalty
   - Butterfly floating back

6. **05-full-color-garden.png**
   - Full color garden background
   - All 6 flowers colored
   - All 6 butterflies settled
   - Dragon footprints visible on path
   - Rainbow petal visible
   - Speech bubble bottom-right: "The little footprints led towards the river..."
   - Counter shows 6/6

7. **06-ch2-complete-screen.png**
   - "Chapter 2 Complete!" title
   - Beautiful completion art
   - Three buttons visible

## Visual Verification Completed

Personally reviewed all screenshots:
- ✅ Speech bubbles readable and well-positioned
- ✅ Butterflies properly sized (not covering flowers)
- ✅ Flowers clearly visible when colored
- ✅ Pip always visible and not covered
- ✅ Interactive elements never obscured
- ✅ Counter clear and readable
- ✅ Next Chapter button prominent
- ✅ No clipping or misalignment
- ✅ Professional appearance throughout

## Test Execution Summary

```bash
cd game && npx playwright test full-playthrough --project=chromium
```

**Result**: 
```
1 passed (1.9m)
```

**Console Errors**: 0 (audio loading warnings filtered as expected)

## Ready for Merge

All issues addressed:
1. ✅ Chapter 1 completely restored from origin/main
2. ✅ Repository root cleaned up
3. ✅ Speech bubble readable and positioned correctly
4. ✅ Butterflies properly sized
5. ✅ Next Chapter button working and visible
6. ✅ Comprehensive test passing with screenshots
7. ✅ Zero console errors
8. ✅ All screenshots reviewed and verified

The PR is now ready for final review and merge to main.
