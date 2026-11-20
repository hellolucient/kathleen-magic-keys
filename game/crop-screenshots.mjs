import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import { PNG } from 'pngjs';

async function cropScreenshots() {
  console.log('📸 Cropping screenshots to right third...\n');
  
  // Read the existing screenshots
  const peakData = await fs.readFile('/workspace/game/screenshots/door-glow-peak.png');
  const lowData = await fs.readFile('/workspace/game/screenshots/door-glow-low.png');
  
  const peakPng = PNG.sync.read(peakData);
  const lowPng = PNG.sync.read(lowData);
  
  const width = peakPng.width;
  const height = peakPng.height;
  
  // Calculate right third dimensions
  const cropWidth = Math.floor(width / 3);
  const cropX = width - cropWidth;
  
  // Create new PNGs for cropped images
  const peakCropped = new PNG({ width: cropWidth, height: height });
  const lowCropped = new PNG({ width: cropWidth, height: height });
  
  // Copy pixels from right third
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < cropWidth; x++) {
      const srcIdx = ((y * width) + (x + cropX)) * 4;
      const dstIdx = ((y * cropWidth) + x) * 4;
      
      // Copy RGBA values
      peakCropped.data[dstIdx] = peakPng.data[srcIdx];
      peakCropped.data[dstIdx + 1] = peakPng.data[srcIdx + 1];
      peakCropped.data[dstIdx + 2] = peakPng.data[srcIdx + 2];
      peakCropped.data[dstIdx + 3] = peakPng.data[srcIdx + 3];
      
      lowCropped.data[dstIdx] = lowPng.data[srcIdx];
      lowCropped.data[dstIdx + 1] = lowPng.data[srcIdx + 1];
      lowCropped.data[dstIdx + 2] = lowPng.data[srcIdx + 2];
      lowCropped.data[dstIdx + 3] = lowPng.data[srcIdx + 3];
    }
  }
  
  // Write cropped images
  await fs.writeFile('/workspace/game/screenshots/door-glow-peak.png', PNG.sync.write(peakCropped));
  await fs.writeFile('/workspace/game/screenshots/door-glow-low.png', PNG.sync.write(lowCropped));
  
  console.log('✅ Screenshots cropped successfully');
  console.log(`   Original: ${width}x${height}`);
  console.log(`   Cropped:  ${cropWidth}x${height} (right third)`);
}

cropScreenshots().catch(console.error);
