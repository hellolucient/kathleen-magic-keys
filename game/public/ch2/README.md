# Princess Kathleen and the Five Magic Keys: Chapter 2, The Rainbow Garden

Art and narration assets for an iPad (landscape, 16:9) storybook game. **No app code here.** The game is built separately.
All art is original AI-generated, soft gouache / watercolour picture-book style, matching Chapter 1. The heroine is the approved cartoon from Chapter 1 (`../art/kathleen-princess-v1.jpg`). No real photos are included. The fairy from Chapter 1 is now named **Pip**.

## Folder map
```
art/
  bg-garden-colour.jpg           1920x1080 full-colour castle garden (the solved background)
  bg-garden-grey.jpg             1920x1080 same painting, pixel-aligned, grey-washed but still pretty
  title-ch2.jpg                  1920x1080 cover: Kathleen + Pip leaving the golden door. No text, open sky upper-left/centre for the title
  complete-ch2.jpg               1920x1080 chapter complete: Kathleen holds the Rainbow Petal, Pip points to tiny purple footprints leading to the river. No text
  preview-layout-start.jpg       layout.json composited: start state (grey garden, butterflies in the air)
  preview-layout-solved.jpg      layout.json composited: garden in colour, footprints + petal
  contact-sheet.jpg              every deliverable image on one sheet
  sprites/*.png                  transparent PNG sprites (trimmed; flower overlays at 1080p frame scale)
audio/
  *.mp3 + lines.json             narration and Pip's lines (id -> text, speaker, file)
  sfx/*.mp3                      sound effects
  CREDITS.md                     sources and licences
layout.json                      sprite positions as % of the 16:9 frame
```

## How the layering works
- `bg-garden-grey.jpg` is the base at the start. The six game flowers are painted into it, drained of colour, along with the golden door (left, five keyholes, same door as Chapter 1), the path, the river and the distant castle.
- **Pixel-aligned colour overlays** (`flower-red-colour.png` … `flower-purple-colour.png`) were cut from `bg-garden-colour.jpg` with a soft feathered ellipse, so they sit exactly at their `layout.json` box with no seam. Each one is hidden at the start. On a correct match, fade it in over the grey flower; a little colour spreads softly into the nearby grass, which is intended.
- Matching grey overlays (`flower-*-grey.png`) are also provided, cut with the same mask. They are already painted into the grey background, so they can be ignored if that background is used as the base.
- When all six flowers are restored, crossfade the whole background to `bg-garden-colour.jpg`, play `colour-burst` + `narr-burst`, then reveal the footprints and the Rainbow Petal.
- Positions: `x,y` = top-left, `w,h` = box size, all in % of frame width/height. Fit flower overlays with `object-fit: fill`. Fit other sprites with `object-fit: contain` (Kathleen: bottom-centred in her box). `z` = suggested stacking order.

## The colour-matching game
Six butterflies start in the air (one of each colour: red, orange, yellow, green, blue, purple). Catch one and drag it to the flower of the same colour.

| colour | flower (in the painting) | butterfly |
|---|---|---|
| red | rose bush, lower left | `butterfly-red.png` / `butterfly-red-flap.png` |
| orange | tulips, left of path | `butterfly-orange.png` / `butterfly-orange-flap.png` |
| yellow | daffodils, centre foreground | `butterfly-yellow.png` / `butterfly-yellow-flap.png` |
| green | lime hydrangea-like blossoms, centre mid-ground | `butterfly-green.png` / `butterfly-green-flap.png` |
| blue | blue hydrangeas, right of path | `butterfly-blue.png` / `butterfly-blue-flap.png` |
| purple | irises, on the river bank | `butterfly-purple.png` / `butterfly-purple-flap.png` |

- While a butterfly is in the air or being dragged, swap to the `-flap` pose and play `butterfly-flutter`.
- Correct drop: `correct-match` + fade in that flower's colour overlay + `fairy-match-<colour>`.
- Wrong flower: `wrong-boop` + `fairy-wrong-1..3` (never negative) and the butterfly returns.
- After the sixth match: `colour-burst` + `narr-burst`, crossfade to the colour background, then show `footprints` (leading toward the river) and `rainbow-petal`. Play `fairy-footprints`. Then `complete-ch2.jpg` + `narr-complete`.
- The Rainbow Petal is kept for Chapter 5. A little dragon (Smudge) is **not shown** in this chapter — only his tiny purple footprints and a leftover puff of purple sneeze-smoke.

## Characters
- `fairy-talk.png` and `fairy-cheer.png` are reused from Chapter 1 so Pip looks the same. Default: waving + wand. Cheer: arms up, for a correct match / finale.
- `kathleen.png` and `kathleen-cheer.png` are reused from Chapter 1 so Kathleen looks the same. Use the talk pose for the intro (standing just outside the golden door); hide her during play so she does not block flower taps; swap to cheer for the colour-burst / complete beat.

## Sprite / overlay table (from layout.json)
| id | file | puzzle | box (%) | note |
|---|---|---|---|---|
| `flower-red` | `art/sprites/flower-red-colour.png` | match-red | x 0, y 52.04, w 27.97, h 47.96 | Pixel-aligned overlay. Hidden at start; fade in on a correct red match. |
| `flower-orange` | `art/sprites/flower-orange-colour.png` | match-orange | x 22.5, y 45.56, w 21.82, h 36.57 |  |
| `flower-yellow` | `art/sprites/flower-yellow-colour.png` | match-yellow | x 34.48, y 55.74, w 29.01, h 44.26 |  |
| `flower-green` | `art/sprites/flower-green-colour.png` | match-green | x 47.19, y 34.72, w 22.24, h 36.48 |  |
| `flower-blue` | `art/sprites/flower-blue-colour.png` | match-blue | x 59.79, y 47.5, w 23.49, h 38.98 |  |
| `flower-purple` | `art/sprites/flower-purple-colour.png` | match-purple | x 77.24, y 52.22, w 22.76, h 47.78 |  |
| `butterfly-red` | `art/sprites/butterfly-red.png` | match-red | x 21.8, y 23.5, w 8.4, h 15.6 | Alt: `butterfly-red-flap.png`. Drag onto the red roses. |
| `butterfly-orange` | `art/sprites/butterfly-orange.png` | match-orange | x 28.2, y 6.5, w 8.4, h 15.6 |  |
| `butterfly-yellow` | `art/sprites/butterfly-yellow.png` | match-yellow | x 41.0, y 18.5, w 8.4, h 15.6 |  |
| `butterfly-green` | `art/sprites/butterfly-green.png` | match-green | x 54.8, y 4.5, w 8.4, h 15.6 |  |
| `butterfly-blue` | `art/sprites/butterfly-blue.png` | match-blue | x 68.2, y 17.0, w 8.4, h 15.6 |  |
| `butterfly-purple` | `art/sprites/butterfly-purple.png` | match-purple | x 82.0, y 6.0, w 8.4, h 15.6 |  |
| `sneeze-puff` | `art/sprites/sneeze-puff.png` | - | x 47.0, y 11.0, w 16.5, h 20.0 | Leftover purple sneeze-smoke in the sky at the start. Fade out on the colour burst. |
| `footprints` | `art/sprites/footprints.png` | - | x 53.5, y 71.0, w 24.5, h 23.0 | Hidden until the end. Tiny purple dragon footprints on the path, leading toward the river. |
| `rainbow-petal` | `art/sprites/rainbow-petal.png` | - | x 55.5, y 68.0, w 8.8, h 15.5 | Hidden until the end. The magic Rainbow Petal; collect after `fairy-footprints`. Needed in Chapter 5. |
| `kathleen` | `art/sprites/kathleen.png` | - | x 14.2, y 36.5, w 11.0, h 35.5 | Intro avatar by the door. Hide during play. Alt: `kathleen-cheer.png`. |
| `fairy` | `art/sprites/fairy-talk.png` | - | x 36.5, y 3.5, w 9.5, h 22.0 | Pip. Default perch in the sky; gently bobs. Alt: `fairy-cheer.png`. Can fly to an unmatched flower or butterfly as a hint. |

Optional `flower-*-grey` overlays use the same boxes as the colour flowers (see `layout.json`).

## Narration lines (audio/lines.json)
Narrator = en-GB-SoniaNeural (slow, warm). Pip = en-GB-MaisieNeural (young, light).
| id | speaker | text |
|---|---|---|
| `narr-title` | narrator | Princess Kathleen and the Five Magic Keys. Chapter Two: The Rainbow Garden. |
| `narr-intro` | narrator | Princess Kathleen and her fairy friend Pip stepped through the golden door... and into the castle garden. But oh! The garden had turned grey. All the pretty colours had gone. |
| `fairy-intro` | fairy | Oh, Princess Kathleen! A little dragon's sneezes blew all the colours away. The flowers look so sad and grey. |
| `fairy-start` | fairy | Look! Colourful butterflies! Catch a butterfly and take it to the flower that matches its colour. That will bring the colours back! |
| `fairy-match-red` | fairy | The red flower is blooming again! Beautiful, Kathleen! |
| `fairy-match-orange` | fairy | Orange! What a lovely sunny colour! |
| `fairy-match-yellow` | fairy | Yellow as sunshine! Well done, Kathleen! |
| `fairy-match-green` | fairy | Green is back! The garden is waking up! |
| `fairy-match-blue` | fairy | Blue as the sky! You're so clever, Kathleen! |
| `fairy-match-purple` | fairy | Purple! My favourite! Hooray! |
| `fairy-wrong-1` | fairy | Oops, not that flower. Let's find the one that matches the butterfly's colour! |
| `fairy-wrong-2` | fairy | Almost! Try a flower the same colour as your butterfly. |
| `fairy-wrong-3` | fairy | Hmm, that butterfly wants a different flower. You can do it! |
| `hint-1` | fairy | Try catching a colourful butterfly, Kathleen! |
| `hint-2` | fairy | Drag the butterfly to the flower that is the same colour. |
| `hint-3` | fairy | Look carefully... which flower matches your butterfly? |
| `narr-burst` | narrator | And then, with a shimmer and a sparkle, the whole garden burst back into colour! |
| `fairy-footprints` | fairy | Kathleen, look! Tiny purple footprints... and a magic Rainbow Petal! Let's keep the petal safe. |
| `narr-complete` | narrator | The little footprints led towards the river. Princess Kathleen and Pip followed them... To be continued! |

Hints: play `hint-1` after about 25 s of no progress, then escalate through `hint-2` and `hint-3` on later idle periods. Pip can fly toward an unused butterfly or an unmatched grey flower.
