# Playtest Fixes Implementation Plan

## Honest Assessment

The full list of fixes represents approximately 20-30 hours of work including:
- Sprite re-cutting and cleanup (3 frogs, 6+ animals, lily pad) = 3-4 hours
- Pointer Events refactor for all drags = 4-5 hours  
- Complex animations (sneeze gust, Pip flight, cloud puffs) = 4-5 hours
- Audio/timing coordination across all chapters = 3-4 hours
- Chapter transition system = 2-3 hours
- Comprehensive testing with touch simulation = 3-4 hours
- Iteration and polish = 3-4 hours

## Critical Path (Session 1 - Focus on Blockers)

### MUST FIX (Blocking Gameplay)
1. **Ch5 Crown Drag** - Pointer Events implementation so iPad can complete the chapter
2. **Ch3 AudioContext** - Create on user gesture so first notes are heard on iOS
3. **Ch2/Ch4 Drag** - Pointer Events for butterflies and animals

### SHOULD FIX (Major UX)
4. Chapter transitions (chapters flow into each other, not to picker)
5. Narrator text display (all spoken lines shown on screen)
6. Ch3 rounds (2-3-3 notes instead of 3-4-5)

### CAN DEFER (Requires Extensive Work)
- Sprite re-cutting (needs careful image editing, testing on backgrounds)
- Sneeze animation (needs asset creation and animation system)
- Complex hide-and-seek system with cloud puffs
- Firefly drift physics
- Animal matching spatial rework
- Pip flight animation along trail

## Recommendation

**Immediate Focus:** Fix the 3 critical blockers that prevent completion on iPad (pointer events for all drags, AudioContext). Add basic narrator text and chapter transitions.

**Next Session:** Tackle the visual polish items that require sprite work, complex animations, and extensive testing.

This approach ensures the game is completable on iPad immediately, with polish items addressed in follow-up work.
