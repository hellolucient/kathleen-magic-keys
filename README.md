# Princess Kathleen and the Five Magic Keys: Chapter 1, The Princess's Bedroom

Art and narration assets for an iPad (landscape, 16:9) hidden-object storybook game. **No app code here.** The game is built separately.
All art is original AI-generated, soft gouache / watercolour picture-book style. The heroine is the approved cartoon `art/kathleen-princess-v1.jpg`. No real photos are included.

## Folder map
```
art/
  bg-bedroom.jpg                 1920x1080 main scene (curtains tied back, door closed with 5 empty keyholes, wardrobe closed)
  bg-bedroom-door-open-full.jpg  1920x1080 same scene with the golden door open (full-frame alternative to the door overlay)
  title.jpg                      1920x1080 cover: Kathleen + fairy before the pink castle. No text, open sky upper-left/centre for the title
  complete.jpg                   1920x1080 chapter complete: Kathleen + fairy celebrating at the open glowing door. No text
  kathleen-princess-v1.jpg       approved character reference
  preview-layout-start.jpg       layout.json composited: start state (for checking positions)
  preview-layout-solved.jpg      layout.json composited: everything opened/revealed
  sprites/*.png                  transparent PNG sprites (trimmed, max 768px; overlays at 1080p frame scale)
audio/
  *.mp3 + lines.json             narration and fairy lines (id -> text, speaker, file)
  sfx/*.mp3                      sound effects
  CREDITS.md                     sources and licences
layout.json                      sprite positions as % of the 16:9 frame
```

## How the layering works
- `bg-bedroom.jpg` is the base. Big furniture (bed, dressing table + oval mirror, closed wardrobe, bookshelf, golden door) is painted into it.
- **Pixel-aligned overlays** (`curtain-closed-overlay.png`, `door-open-overlay.png`) were cut from edited versions of the same painting, so they sit exactly at their `layout.json` box with no seam. `curtain-closed` starts visible over the window; removing it reveals the tied-back curtains in the bg.
- `wardrobe-open.png` and `mirror-glow.png` are separately painted, sized to cover the bg wardrobe / mirror (wardrobe doors swing out past the body, which is intended).
- Positions: `x,y` = top-left, `w,h` = box size, all in % of frame width/height. Fit each sprite with `object-fit: contain` bottom-centred in its box (overlays: `fill`). `z` = suggested stacking order. `rotate` is degrees, for keys.
- Door keyholes: `door-lock-1..5` give centre (`cx,cy`) and diameter `d` for the keys-fly-into-locks animation (top to bottom).

## The five key puzzles
1. **key-teddy**: `teddy.png` on the floor. Tap = wiggle (`wiggle-boing`), next tap slides him aside, revealing `key-teddy` on the floor.
2. **key-jewellery**: `jewellery-box-closed.png` on the dressing table, swap to `jewellery-box-open.png` (`lid-click`), key rises from the velvet slot.
3. **key-curtain**: tap/swipe `curtain-closed` (`curtain-swish`), which slides away and shows a key hanging on the window latch.
4. **key-wardrobe**: tap the wardrobe, `wardrobe-open.png` fades in, then tap the pink dress pocket in the middle and the key peeks out.
5. **key-mirror**: tap mirror, `mirror-glow.png` + three `star.png` appear. Tap 1, 2, 3 top to bottom (`star-1..3`). A wrong order plays `star-reset` and `hint-mirror-5`. Then the key floats out.
Each find: `sparkle` + `key-found` + `fairy-found-N` (N = number found so far, any order).
Ending: 5/5 plays `fairy-door-glow` + `door-glow-loop`. Tapping the door plays `narr-unlock`, the keys fly into locks (`lock-click` x5), then `door-open` overlay + `door-open-magic` + `celebration-fanfare`, `fairy-final`, then `complete.jpg` + `narr-complete`.

## Playful extras (no keys)
`music-box.png` (ballerina spins, `music-box-loop`, `curious-musicbox`), `kitten-sit.png` to `kitten-play.png` (`kitten-meow-1/2`, `curious-kitten`), `toy-chest-closed.png` to `toy-chest-open.png` (`curious-chest`), `dragon.png` on the bed (`curious-dragon`), chandelier / bed / bookshelf hitboxes (`curious-chandelier`, `curious-bed`, `curious-books`), locked door before 5/5 (`curious-door-locked`).

## Characters
- `fairy-talk.png` (default, waving + wand) and `fairy-cheer.png` (arms up, for key found / finale).
- `kathleen.png` (approved pose, finger on cheek) and `kathleen-cheer.png` (jumping, arms up), for intro/outro or a corner avatar.

## Sprite / overlay table (from layout.json)
| id | file | puzzle | box (%) | note |
|---|---|---|---|---|
| `curtain-closed` | `art/sprites/curtain-closed-overlay.png` | key-curtain | x 0, y 0, w 18.96, h 97.04 | Pixel-aligned overlay. Starts visible. On tap, fade/slide left to reveal the window and bg's tied-back curtains. |
| `key-curtain` | `art/sprites/key.png` | key-curtain | x 8.6, y 36, w 2.6, h 9.5 | Key hanging on the window latch, hidden under curtain-closed. |
| `mirror-glow` | `art/sprites/mirror-glow.png` | key-mirror | x 16.0, y 29.2, w 9.7, h 30.8 | Hidden at start. Fades in over the bg mirror when tapped. |
| `mirror-star-1` | `art/sprites/star.png` | key-mirror | x 18.0, y 34.0, w 3.2, h 5.7 |  |
| `mirror-star-2` | `art/sprites/star.png` | key-mirror | x 21.6, y 42.0, w 3.2, h 5.7 |  |
| `mirror-star-3` | `art/sprites/star.png` | key-mirror | x 18.2, y 50.0, w 3.2, h 5.7 |  |
| `key-mirror` | `art/sprites/key.png` | key-mirror | x 19.6, y 40.0, w 2.6, h 9.5 | Appears (float out of glass) after stars tapped 1-2-3. |
| `jewellery-box-closed` | `art/sprites/jewellery-box-closed.png` | key-jewellery | x 18.6, y 52.4, w 6.4, h 9.6 |  |
| `jewellery-box-open` | `art/sprites/jewellery-box-open.png` | key-jewellery | x 18.6, y 50.0, w 6.4, h 12.0 | Swap in on tap, same bottom-center anchor. |
| `key-jewellery` | `art/sprites/key.png` | key-jewellery | x 20.8, y 53.6, w 1.9, h 6.8 | Rises out of the velvet slot. |
| `music-box` | `art/sprites/music-box.png` | - | x 25.4, y 50.4, w 4.4, h 11.2 | Playful: tap = ballerina spins + music box tune. |
| `wardrobe-open` | `art/sprites/wardrobe-open.png` | key-wardrobe | x 55.1, y 28.4, w 22.4, h 50.0 | Hidden at start; bg shows closed wardrobe. Fade/scale in on tap. |
| `key-wardrobe` | `art/sprites/key.png` | key-wardrobe | x 65.5, y 54.2, w 1.7, h 6.0 | Peeks from the pink dress pocket after wardrobe opens; needs a second tap on the dress/pocket. |
| `teddy` | `art/sprites/teddy.png` | key-teddy | x 27.0, y 67.5, w 8.2, h 17.5 | Tap 1 = wiggle; tap 2 (or swipe) = slides aside (+7% x) revealing key. |
| `key-teddy` | `art/sprites/key.png` | key-teddy | x 29.8, y 76.0, w 2.4, h 8.6 | On the floor behind teddy. |
| `toy-chest-closed` | `art/sprites/toy-chest-closed.png` | - | x 3.5, y 77.0, w 12.5, h 16.5 |  |
| `toy-chest-open` | `art/sprites/toy-chest-open.png` | - | x 4.0, y 72.0, w 11.5, h 21.5 | Playful swap; bottom-aligned with closed chest. Toys bounce. |
| `dragon-toy` | `art/sprites/dragon.png` | - | x 47.0, y 51.5, w 6.0, h 12.2 | On the bed. Playful: wiggle + tiny puff of sparkles. |
| `kitten-sit` | `art/sprites/kitten-sit.png` | - | x 61.5, y 76.0, w 5.8, h 15.0 | Tap = meow + swap to kitten-play for ~2s. |
| `kitten-play` | `art/sprites/kitten-play.png` | - | x 60.2, y 75.4, w 8.4, h 16.4 |  |
| `door` | hitbox | - | x 84.0, y 12.0, w 14.5, h 73.0 | Golden door is part of the bg. Glow via CSS when 5/5. |
| `door-lock-1` | lock centre | - | cx 90.9, cy 31.8, d 4.2 |  |
| `door-lock-2` | lock centre | - | cx 90.9, cy 40.8, d 4.2 |  |
| `door-lock-3` | lock centre | - | cx 90.9, cy 50.0, d 4.2 |  |
| `door-lock-4` | lock centre | - | cx 90.9, cy 59.0, d 4.2 |  |
| `door-lock-5` | lock centre | - | cx 90.9, cy 68.2, d 4.2 | Keyhole centres (cx,cy) and diameter d in %, for the keys-fly-into-locks animation. |
| `door-open` | `art/sprites/door-open-overlay.png` | - | x 74.37, y 0, w 25.63, h 100 | Pixel-aligned overlay of the opened door + light. Crossfade in after the 5 keys turn. Full-frame alternative: art/bg-bedroom-door-open-full.jpg |
| `fairy` | `art/sprites/fairy-talk.png` | - | x 33.0, y 6.0, w 9.5, h 21.0 | Default perch near the canopy; gently bobs. Swap to cheer on key found. Can fly to hint targets. |
| `kathleen` | `art/sprites/kathleen.png` | - | x 41.0, y 52.0, w 13.0, h 40.0 | Optional on-scene avatar (intro/outro); hide during play if it blocks taps. |

## Narration lines (audio/lines.json)
Narrator = en-GB-SoniaNeural (slow, warm). Fairy = en-GB-MaisieNeural (young, light).
| id | speaker | text |
|---|---|---|
| `narr-intro` | narrator | Once upon a time, in a sparkling pink castle, Princess Kathleen woke up in her beautiful bedroom. The sun was peeking through the curtains... and something magical was about to happen. |
| `narr-fairy-arrives` | narrator | Suddenly, with a twinkle and a shimmer, a little fairy appeared! |
| `fairy-intro` | fairy | Oh, Princess Kathleen! The five magic keys have disappeared! Without them, we can't open the castle's enchanted door. Can you help me find them? |
| `fairy-start` | fairy | Let's look all around your room. Tap on things to see what's hiding! |
| `fairy-found-1` | fairy | You found one! Hooray! Four more to go! |
| `fairy-found-2` | fairy | Another magic key! Two keys! You're so clever, Kathleen! |
| `fairy-found-3` | fairy | Three keys! Wow, you're a wonderful explorer! Only two more! |
| `fairy-found-4` | fairy | Four keys! Just one more to find. I know you can do it! |
| `fairy-found-5` | fairy | Five keys! You found them all, Princess Kathleen! |
| `hint-teddy-1` | fairy | I think Teddy is hiding something... |
| `hint-teddy-2` | fairy | Teddy looks a little bit wiggly. Maybe give him a tap? |
| `hint-teddy-3` | fairy | What could be behind Teddy? Let's ask him to move over! |
| `hint-teddy-4` | fairy | Teddy is sitting on something shiny! |
| `hint-jewellery-1` | fairy | Something sparkly is in the jewellery box... |
| `hint-jewellery-2` | fairy | Ooh, the pretty pink box on your dressing table... I wonder what's inside? |
| `hint-jewellery-3` | fairy | Princesses keep their treasures in a jewellery box. Try opening the lid! |
| `hint-jewellery-4` | fairy | I can hear something jingling in the little pink box! |
| `hint-curtain-1` | fairy | The curtains are moving in the breeze... |
| `hint-curtain-2` | fairy | Something is twinkling behind the curtains by the window! |
| `hint-curtain-3` | fairy | Let's open the curtains and let the starlight in! |
| `hint-curtain-4` | fairy | Peek behind the big pink curtains, Kathleen! |
| `hint-wardrobe-1` | fairy | Have you looked inside the wardrobe? |
| `hint-wardrobe-2` | fairy | So many pretty dresses live in your wardrobe... Let's open the doors! |
| `hint-wardrobe-3` | fairy | One of the dresses has a little pocket. What's in it? |
| `hint-wardrobe-4` | fairy | Look closely at the pink dress in the middle! |
| `hint-mirror-1` | fairy | The mirror is twinkling... |
| `hint-mirror-2` | fairy | Magic mirror, magic mirror! Try giving it a tap. |
| `hint-mirror-3` | fairy | The mirror is twinkling... tap the stars! |
| `hint-mirror-4` | fairy | Tap the stars one, two, three, from the top to the bottom! |
| `hint-mirror-5` | fairy | Oops, let's try the stars again. Start with the top star! |
| `hint-general-1` | fairy | Keep exploring! Magic keys love to hide. |
| `hint-general-2` | fairy | Tap on anything that looks interesting! |
| `hint-general-3` | fairy | Hmm... where haven't we looked yet? |
| `curious-musicbox` | fairy | Ooh, what a lovely song! Look at the little ballerina dance! |
| `curious-kitten` | fairy | Hello, kitty! She wants to play! |
| `curious-chest` | fairy | Your toys are saying hello! |
| `curious-dragon` | fairy | The little dragon is giggling! That tickles! |
| `curious-chandelier` | fairy | Sparkle, sparkle! Isn't it beautiful? |
| `curious-bed` | fairy | What a cosy bed! But no keys under the pillows. |
| `curious-door-locked` | fairy | The golden door is locked tight. We need all five magic keys! |
| `curious-books` | fairy | So many storybooks! Maybe we'll read one later. |
| `fairy-door-glow` | fairy | Look! The golden door is glowing! Tap the door, Kathleen! |
| `narr-unlock` | narrator | One by one, the five magic keys flew into the golden locks... click, click, click, click, click! And the enchanted door swung open. |
| `fairy-final` | fairy | You did it, Princess Kathleen! You're a wonderful treasure hunter! Now our magical adventure can begin! |
| `narr-complete` | narrator | And so, Princess Kathleen and her fairy friend stepped through the glowing door... To be continued! |
| `narr-title` | narrator | Princess Kathleen and the Five Magic Keys. Chapter One: The Princess's Bedroom. |

Hints: play `hint-<puzzle>-1` after about 25 s of no progress, then escalate through -2, -3 and -4 on later idle periods. Pick the puzzle nearest to completion or the one not yet touched. `hint-general-*` are for when nothing is in progress.
