# Audio credits & licences

## Narration and Pip's voice (audio/*.mp3)
Generated with Microsoft Edge neural text-to-speech via the open-source `edge-tts` tool (https://github.com/rany2/edge-tts).
- Narrator: `en-GB-SoniaNeural`, rate -12%, pitch -2Hz
- Fairy (Pip): `en-GB-MaisieNeural`, rate -6%, pitch +4Hz
Generated for a private, non-commercial family game. Text in `lines.json`; regenerate any line with `gen.py`.

## Sound effects (audio/sfx/)
- `birdsong-loop.mp3`: trimmed, lightly crossfaded 20 s loop, normalised from
  "Birds singing in garden.ogg" by ezwa, originally published on pdsounds.org and
  transferred to Wikimedia Commons, **Public domain**.
  https://commons.wikimedia.org/wiki/File:Birds_singing_in_garden.ogg
  Recording: a sunny afternoon in a Belgian countryside garden, 18 April 2007.
- All other SFX (`butterfly-flutter`, `correct-match`, `wrong-boop`, `colour-burst`):
  synthesised from scratch in Python (`synth.py`, additive bell synthesis + filtered noise).
  Original work, released **CC0**.

Note: MP3 adds a few ms of encoder padding, so for a gapless `birdsong-loop` or `butterfly-flutter`
play them through the Web Audio API (AudioBufferSourceNode with loop=true, trim ~25 ms at each end)
rather than `<audio loop>`.
