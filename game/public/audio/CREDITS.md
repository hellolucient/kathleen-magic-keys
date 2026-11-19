# Audio credits & licences

## Narration and fairy voice (audio/*.mp3)
Generated with Microsoft Edge neural text-to-speech via the open-source `edge-tts` tool (https://github.com/rany2/edge-tts).
- Narrator: `en-GB-SoniaNeural`, rate -12%, pitch -2Hz
- Fairy: `en-GB-MaisieNeural`, rate -6%, pitch +4Hz
Generated for a private, non-commercial family game. Text in `lines.json`; regenerate any line with `gen.py`.

## Sound effects (audio/sfx/)
- `kitten-meow-1.mp3`, `kitten-meow-2.mp3`: trimmed, pitched up 20% and normalised from
  "Meow of a pleading cat.oga" by Heismark, Wikimedia Commons, **Public domain**.
  https://commons.wikimedia.org/wiki/File:Meow_of_a_pleading_cat.oga
- All other SFX (`sparkle`, `key-found`, `tap-pop`, `wiggle-boing`, `curtain-swish`, `lid-click`, `lock-click`,
  `door-open-magic`, `door-glow-loop`, `celebration-fanfare`, `star-1..3`, `star-reset`, `music-box-loop`):
  synthesised from scratch in Python (`synth.py`, additive bell synthesis + filtered noise). Original work, released **CC0**.
  `music-box-loop` uses the traditional melody "Twinkle, Twinkle, Little Star" (public domain).

Note: MP3 adds a few ms of encoder padding, so for a gapless `music-box-loop` / `door-glow-loop` play them through the Web Audio API (AudioBufferSourceNode with loop=true, trim ~25 ms at each end) rather than `<audio loop>`.
