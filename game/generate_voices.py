#!/usr/bin/env python3
"""Generate voice lines using edge-tts for chapters 3, 4, and 5."""

import asyncio
import edge_tts
import json
import os
import subprocess

# Voice configurations
NARRATOR_VOICE = "en-GB-SoniaNeural"
NARRATOR_RATE = "-12%"
NARRATOR_PITCH = "-2Hz"

PIP_VOICE = "en-GB-MaisieNeural"
PIP_RATE = "-6%"
PIP_PITCH = "+4Hz"

SMUDGE_VOICE = "en-GB-MaisieNeural"
SMUDGE_RATE = "-2%"
SMUDGE_PITCH = "-8Hz"

def get_mp3_duration(mp3_path):
    """Get duration of an mp3 file in milliseconds using ffprobe."""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries', 
            'format=duration', '-of', 
            'default=noprint_wrappers=1:nokey=1', mp3_path
        ], capture_output=True, text=True, check=True)
        duration_seconds = float(result.stdout.strip())
        return int(duration_seconds * 1000)
    except Exception as e:
        print(f"  Warning: Could not get duration for {mp3_path}: {e}")
        return 5000

async def generate_line(line_id, text, voice, rate, pitch, output_path):
    """Generate a single voice line with retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await communicate.save(output_path)
            duration = get_mp3_duration(output_path)
            print(f"  {line_id}: {duration}ms - {text[:50]}...")
            return line_id, text, voice, output_path, duration
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"  Retry {attempt + 1} for {line_id}: {e}")
                await asyncio.sleep(2 * (attempt + 1))
            else:
                print(f"  Failed {line_id} after {max_retries} attempts: {e}")
                raise

async def generate_chapter3():
    """Generate Chapter 3 voice lines."""
    print("\n=== Generating Chapter 3 Voices ===")
    base = "game/public/ch3/audio"
    os.makedirs(base, exist_ok=True)
    
    lines = [
        ("narr-title", "Chapter Three: The Singing River.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("narr-intro", "The dragon footprints led Princess Kathleen and Pip to a sparkling river. Three little frogs sat on the lily pads, singing.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("fairy-intro", "Listen, Kathleen! The frogs are singing a song. Can you sing it back?", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-howto", "Watch the flowers light up, then tap them in the same order!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-good-1", "Ribbit! You got it!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-good-2", "Perfect! The frogs love it!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-good-3", "Wow, you remembered them all!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-tryagain", "Oops! Let's listen one more time.", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-gem", "Look! Something purple is floating in the water. Tap it, Kathleen!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-gem-got", "A Purple Dragon Gem! Just like the little dragon's purple scales. Let's keep it safe!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("narr-complete", "The frogs croaked goodbye. Far away, in the Twinkle Forest, tiny lights began to glow... To be continued!", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
    ]
    
    tasks = []
    for line_id, text, voice, rate, pitch in lines:
        output = f"{base}/{line_id}.mp3"
        tasks.append(generate_line(line_id, text, voice, rate, pitch, output))
    
    results = await asyncio.gather(*tasks)
    
    # Create lines.json
    lines_dict = {}
    for line_id, text, voice, file_path, duration in results:
        speaker = "Narrator" if voice == NARRATOR_VOICE else "Pip"
        lines_dict[line_id] = {
            "text": text,
            "voice": voice,
            "speaker": speaker,
            "file": file_path.replace("game/public/", "")
        }
    
    with open(f"{base}/lines.json", 'w') as f:
        json.dump(lines_dict, f, indent=2)
    
    print(f"\n✓ Chapter 3: {len(results)} lines generated")

async def generate_chapter4():
    """Generate Chapter 4 voice lines."""
    print("\n=== Generating Chapter 4 Voices ===")
    base = "game/public/ch4/audio"
    os.makedirs(base, exist_ok=True)
    
    lines = [
        ("narr-title", "Chapter Four: The Twinkle Forest.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("narr-intro", "Princess Kathleen and Pip walked into the Twinkle Forest. It was getting dark, and the fireflies were all mixed up.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("fairy-intro", "Let's catch the fireflies in our lantern, so we can see the way. Tap each one, and we'll count together!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-ten", "Ten fireflies! Our lantern is glowing!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-animals", "Oh no, three baby animals are lost! Can you take each baby to its mummy?", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-match-owl", "The baby owl found its mummy! Hoo hoo!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-match-rabbit", "The bunny is home with its mummy!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-match-deer", "The little fawn found its mummy deer!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-wrong", "Hmm, that's not its mummy. Try another one!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("narr-cry", "Then, from far away, they heard a sound. Someone was crying... high up in a cave on Cloud Mountain.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("fairy-light", "Let's take a firefly light with us. Tap the lantern, Kathleen!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-light-got", "A magic Firefly Light! Now let's find out who is crying.", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("narr-complete", "So Princess Kathleen, Pip and their little light set off for Cloud Mountain... To be continued!", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
    ]
    
    # Add counting lines 1-10
    for i in range(1, 11):
        lines.append((f"count-{i}", f"{i}!", PIP_VOICE, PIP_RATE, PIP_PITCH))
    
    tasks = []
    for line_id, text, voice, rate, pitch in lines:
        output = f"{base}/{line_id}.mp3"
        tasks.append(generate_line(line_id, text, voice, rate, pitch, output))
    
    results = await asyncio.gather(*tasks)
    
    # Create lines.json
    lines_dict = {}
    for line_id, text, voice, file_path, duration in results:
        speaker = "Narrator" if voice == NARRATOR_VOICE else "Pip"
        lines_dict[line_id] = {
            "text": text,
            "voice": voice,
            "speaker": speaker,
            "file": file_path.replace("game/public/", "")
        }
    
    with open(f"{base}/lines.json", 'w') as f:
        json.dump(lines_dict, f, indent=2)
    
    print(f"\n✓ Chapter 4: {len(results)} lines generated")

async def generate_chapter5():
    """Generate Chapter 5 voice lines."""
    print("\n=== Generating Chapter 5 Voices ===")
    base = "game/public/ch5/audio"
    os.makedirs(base, exist_ok=True)
    
    lines = [
        ("narr-title", "Chapter Five: Smudge's Cloud Castle.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("narr-intro", "High on Cloud Mountain stood a little castle made of clouds. And inside, someone was crying.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("smudge-cry", "Boo hoo... Nobody ever wants to play with me.", SMUDGE_VOICE, SMUDGE_RATE, SMUDGE_PITCH),
        ("fairy-intro", "It's the little purple dragon! He's shy. He's hiding in the clouds. Can you find him, Kathleen?", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-found-1", "There he is!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-found-2", "You found him again!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-found-3", "Peekaboo! You're so good at this!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("smudge-sorry", "I'm Smudge. I took the magic keys, and I sneezed the colours away. I'm sorry. I just wanted a friend.", SMUDGE_VOICE, SMUDGE_RATE, SMUDGE_PITCH),
        ("fairy-crown", "Kathleen, let's make Smudge a friendship crown, with all the treasures we found!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-place-petal", "The Rainbow Petal!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-place-gem", "The Purple Dragon Gem!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("fairy-place-light", "The Firefly Light!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("smudge-happy", "A crown, for me? Thank you, Kathleen! Will you be my friend?", SMUDGE_VOICE, SMUDGE_RATE, SMUDGE_PITCH),
        ("fairy-friends", "Of course we will! Friends forever!", PIP_VOICE, PIP_RATE, PIP_PITCH),
        ("narr-rainbow", "Smudge laughed for the very first time, and a big, beautiful rainbow came back across the sky.", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
        ("smudge-ride", "Climb on! I'll fly you home!", SMUDGE_VOICE, SMUDGE_RATE, SMUDGE_PITCH),
        ("narr-end", "And so Smudge flew Princess Kathleen and Pip all the way home. The End... of book one. But Smudge will be back for more adventures!", NARRATOR_VOICE, NARRATOR_RATE, NARRATOR_PITCH),
    ]
    
    tasks = []
    for line_id, text, voice, rate, pitch in lines:
        output = f"{base}/{line_id}.mp3"
        tasks.append(generate_line(line_id, text, voice, rate, pitch, output))
    
    results = await asyncio.gather(*tasks)
    
    # Create lines.json
    lines_dict = {}
    for line_id, text, voice, file_path, duration in results:
        if voice == NARRATOR_VOICE:
            speaker = "Narrator"
        elif voice == PIP_VOICE:
            speaker = "Pip"
        else:
            speaker = "Smudge"
        
        lines_dict[line_id] = {
            "text": text,
            "voice": voice,
            "speaker": speaker,
            "file": file_path.replace("game/public/", "")
        }
    
    with open(f"{base}/lines.json", 'w') as f:
        json.dump(lines_dict, f, indent=2)
    
    print(f"\n✓ Chapter 5: {len(results)} lines generated")

async def main():
    await generate_chapter3()
    await generate_chapter4()
    await generate_chapter5()
    print("\n✓ All voice lines generated!")

if __name__ == '__main__':
    asyncio.run(main())
