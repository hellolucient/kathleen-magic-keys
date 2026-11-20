#!/usr/bin/env python3
"""
Cut sprites from sprite sheets with transparent backgrounds.
Flood-fill cream background from edges, preserve soft glows, trim to content.
"""

from PIL import Image, ImageChops
import os
import sys

def flood_fill_background(img, tolerance=30):
    """
    Flood fill the cream background (~#FBF3E4) from all edges with transparency.
    Keeps soft glows as partial alpha.
    """
    img = img.convert('RGBA')
    width, height = img.size
    pixels = img.load()
    
    # Sample background color from corners (average)
    corners = [
        pixels[0, 0][:3],
        pixels[width-1, 0][:3],
        pixels[0, height-1][:3],
        pixels[width-1, height-1][:3],
    ]
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4
    
    print(f"  Background color: RGB({bg_r}, {bg_g}, {bg_b})")
    
    # Flood fill from edges
    visited = set()
    to_visit = []
    
    # Add all edge pixels
    for x in range(width):
        to_visit.append((x, 0))
        to_visit.append((x, height-1))
    for y in range(height):
        to_visit.append((0, y))
        to_visit.append((width-1, y))
    
    while to_visit:
        x, y = to_visit.pop(0)
        if (x, y) in visited or x < 0 or x >= width or y < 0 or y >= height:
            continue
        
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        
        # Check if this pixel is close to background color
        dist = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
        if dist <= tolerance:
            # Make it transparent
            pixels[x, y] = (r, g, b, 0)
            # Add neighbors
            to_visit.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])
        elif dist <= tolerance * 2:
            # Partial transparency for soft edges/glows
            alpha_factor = 1.0 - (dist - tolerance) / tolerance
            new_alpha = int(a * alpha_factor)
            pixels[x, y] = (r, g, b, new_alpha)
    
    return img

def trim_transparent(img):
    """Trim transparent pixels from edges."""
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def cut_sprite(sheet_path, output_path, x, y, w, h, name, tolerance=30):
    """Cut a sprite from a sheet at given coordinates."""
    print(f"  Cutting {name} from ({x}, {y}) size ({w}x{h})")
    
    sheet = Image.open(sheet_path).convert('RGBA')
    
    # Crop the sprite
    sprite = sheet.crop((x, y, x + w, y + h))
    
    # Flood fill background
    sprite = flood_fill_background(sprite, tolerance)
    
    # Trim transparent edges
    sprite = trim_transparent(sprite)
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sprite.save(output_path, 'PNG')
    print(f"  Saved: {output_path} ({sprite.size[0]}x{sprite.size[1]})")

def process_chapter3():
    """Process Chapter 3 sprites."""
    print("\n=== Processing Chapter 3 Sprites ===")
    base = 'game/public/ch3/art'
    sprites_dir = f'{base}/sprites'
    
    # Props sheet: lily pads (top row), frogs (middle row), music note (bottom right)
    props = Image.open(f'{base}/raw/props-sheet.jpg')
    w, h = props.size
    
    # Lily pads - top row, 5 items
    pad_w = w // 5
    pad_h = h // 3
    colors = ['red', 'yellow', 'blue', 'pink', 'white']
    for i, color in enumerate(colors):
        cut_sprite(f'{base}/raw/props-sheet.jpg', 
                   f'{sprites_dir}/lily-pad-{color}.png',
                   i * pad_w, 0, pad_w, pad_h, f'lily-pad-{color}')
    
    # Frogs - middle row, 3 items
    frog_w = w // 3
    frog_names = ['frog-closed', 'frog-singing', 'frog-happy']
    for i, name in enumerate(frog_names):
        cut_sprite(f'{base}/raw/props-sheet.jpg',
                   f'{sprites_dir}/{name}.png',
                   i * frog_w, pad_h, frog_w, pad_h, name)
    
    # Music note - bottom right
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/music-note.png',
               w // 2, pad_h * 2, w // 2, pad_h, 'music-note')
    
    # Purple gem - from gem-and-doe-sheet, right side
    gem_sheet = Image.open(f'{base}/raw/gem-and-doe-sheet.jpg')
    gw, gh = gem_sheet.size
    cut_sprite(f'{base}/raw/gem-and-doe-sheet.jpg',
               f'{sprites_dir}/purple-gem.png',
               gw // 2, 0, gw // 2, gh, 'purple-gem')

def process_chapter4():
    """Process Chapter 4 sprites."""
    print("\n=== Processing Chapter 4 Sprites ===")
    base = 'game/public/ch4/art'
    sprites_dir = f'{base}/sprites'
    
    # Props sheet
    props = Image.open(f'{base}/raw/props-sheet.jpg')
    w, h = props.size
    row_h = h // 3
    
    # Top row: owl, rabbit (ignore deer top-right)
    col_w = w // 3
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/owl.png',
               0, 0, col_w, row_h, 'owl')
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/rabbit.png',
               col_w, 0, col_w, row_h, 'rabbit')
    
    # Middle row: owlet, bunny, fawn
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/owlet.png',
               0, row_h, col_w, row_h, 'owlet')
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/bunny.png',
               col_w, row_h, col_w, row_h, 'bunny')
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/fawn.png',
               col_w * 2, row_h, col_w, row_h, 'fawn')
    
    # Bottom row: lantern (left half), fireflies (right half - use middle one)
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/lantern.png',
               0, row_h * 2, w // 2, row_h, 'lantern')
    cut_sprite(f'{base}/raw/props-sheet.jpg',
               f'{sprites_dir}/firefly.png',
               w // 2 + w // 6, row_h * 2, w // 6, row_h, 'firefly', tolerance=40)
    
    # Mother deer - from doe-sheet, left side (tall deer)
    doe_sheet = Image.open(f'{base}/raw/doe-sheet.jpg')
    dw, dh = doe_sheet.size
    cut_sprite(f'{base}/raw/doe-sheet.jpg',
               f'{sprites_dir}/deer.png',
               0, 0, dw // 2, dh, 'deer (mother)')

def process_chapter5():
    """Process Chapter 5 sprites."""
    print("\n=== Processing Chapter 5 Sprites ===")
    base = 'game/public/ch5/art'
    sprites_dir = f'{base}/sprites'
    
    # Smudge sheet
    smudge = Image.open(f'{base}/raw/smudge-sheet.jpg')
    w, h = smudge.size
    row_h = h // 2
    col_w = w // 3
    
    # Top row: crying, peeking, shy smile
    sprites = [
        ('smudge-crying', 0, 0),
        ('smudge-peeking', col_w, 0),
        ('smudge-shy', col_w * 2, 0),
        # Bottom row: laughing, flying, crown
        ('smudge-laughing', 0, row_h),
        ('smudge-flying', col_w, row_h),
        ('crown', col_w * 2, row_h),
    ]
    
    for name, x, y in sprites:
        cut_sprite(f'{base}/raw/smudge-sheet.jpg',
                   f'{sprites_dir}/{name}.png',
                   x, y, col_w, row_h, name)

def copy_reused_sprites():
    """Copy sprites from ch2 that are reused in chapters 3-5."""
    print("\n=== Copying Reused Sprites ===")
    import shutil
    
    reused = [
        'fairy-talk.png',
        'fairy-cheer.png',
        'kathleen.png',
        'kathleen-cheer.png',
        'rainbow-petal.png',
    ]
    
    for filename in reused:
        src = f'game/public/ch2/art/sprites/{filename}'
        for ch in ['ch3', 'ch4', 'ch5']:
            dst = f'game/public/{ch}/art/sprites/{filename}'
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.exists(src):
                shutil.copy(src, dst)
                print(f"  Copied {filename} to {ch}")

if __name__ == '__main__':
    try:
        process_chapter3()
        process_chapter4()
        process_chapter5()
        copy_reused_sprites()
        print("\n✓ All sprites processed successfully!")
    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
