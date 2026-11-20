import { chromium } from 'playwright';
import { promises as fs } from 'fs';

async function testGlowAndFairy() {
  console.log('🎨 GLOW & FAIRY FIX VERIFICATION\n');
  
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  
  await fs.mkdir('/workspace/game/screenshots', { recursive: true });
  
  // Helper to solve puzzles
  const solvePuzzles = async (page) => {
    const teddy = page.locator('img[src="art/sprites/teddy.png"]').first();
    await teddy.click({ force: true });
    await page.waitForTimeout(400);
    await teddy.click({ force: true });
    await page.waitForTimeout(3500);
    
    await page.locator('img[src*="jewellery-box"]').first().click({ force: true });
    await page.waitForTimeout(3500);
    
    await page.locator('img[src*="curtain-closed"]').first().click({ force: true });
    await page.waitForTimeout(3500);
    
    const wardrobe = await page.locator('.wardrobe-hitbox').boundingBox();
    if (wardrobe) {
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height / 2);
      await page.waitForTimeout(600);
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height * 0.6);
      await page.waitForTimeout(3500);
    }
    
    const mirror = await page.locator('.mirror-hitbox').boundingBox();
    if (mirror) {
      await page.mouse.click(mirror.x + mirror.width / 2, mirror.y + mirror.height / 2);
      await page.waitForTimeout(1200);
      
      const stars = page.locator('img[src="art/sprites/star.png"]');
      for (let i = 0; i < 3; i++) {
        await stars.nth(i).click({ force: true });
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(600);
      
      const mirrorKey = page.locator('.key-mirror img[src="art/sprites/key.png"]').first();
      if (await mirrorKey.count() > 0) {
        await mirrorKey.click({ force: true });
      }
    }
  };
  
  // ===== Screenshot Test =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SCREENSHOT TEST: Door glow & fairy position');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  let page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected, waiting for glow...\n');
  await page.waitForTimeout(2500);
  
  // Screenshot 1: Door glow at peak (wait for peak of pulse)
  await page.waitForTimeout(500); // Sync with 1s pulse at peak
  await page.screenshot({ path: '/workspace/game/screenshots/door-glow-peak.png', fullPage: true });
  console.log('📸 Screenshot 1: door-glow-peak.png\n');
  
  // Screenshot 2: Door glow at low point
  await page.waitForTimeout(500); // Half a second later = low point
  await page.screenshot({ path: '/workspace/game/screenshots/door-glow-low.png', fullPage: true });
  console.log('📸 Screenshot 2: door-glow-low.png\n');
  
  // Screenshot 3: Fairy beside door (should have flown there by now)
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/workspace/game/screenshots/fairy-beside-door.png', fullPage: true });
  console.log('📸 Screenshot 3: fairy-beside-door.png\n');
  
  console.log('Verifying fairy position...');
  const fairyBox = await page.locator('.fairy').boundingBox();
  if (fairyBox) {
    const viewportWidth = 1180;
    const fairyLeftPercent = (fairyBox.x / viewportWidth * 100).toFixed(1);
    console.log(`  Fairy left position: ${fairyLeftPercent}% (should be ~73-78%)\n`);
  }
  
  await context.close();
  
  // ===== Timing Tests =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DOOR TAP TIMING TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const timings = [
    { delay: 500, name: '0.5s' },
    { delay: 1000, name: '1s' },
    { delay: 3000, name: '3s' },
    { delay: 14000, name: '14s' }
  ];
  
  const results = {};
  
  for (const timing of timings) {
    context = await browser.newContext({
      viewport: { width: 1180, height: 820 },
      hasTouch: true,
    });
    
    page = await context.newPage();
    
    await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
    await page.click('.play-button', { force: true });
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    await solvePuzzles(page);
    
    // Wait for the door to start glowing (5th key landed)
    await page.waitForSelector('.door-hitbox.glow-pulse', { timeout: 5000 });
    
    console.log(`Test: Door tap at ${timing.name}...`);
    await page.waitForTimeout(timing.delay);
    
    const door = await page.locator('.door-hitbox').boundingBox();
    if (door) {
      await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
      await page.waitForTimeout(35000);
    }
    
    const complete = await page.locator('.complete-screen').isVisible();
    results[timing.name] = complete;
    console.log(`  Result: ${complete ? '✅ PASS' : '❌ FAIL'}\n`);
    
    await context.close();
  }
  
  // ===== Muted Test =====
  console.log('Test: Muted during finale...');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  // Wait for the door to start glowing (5th key landed)
  await page.waitForSelector('.door-hitbox.glow-pulse', { timeout: 5000 });
  await page.waitForTimeout(2000);
  
  await page.click('.mute-button');
  await page.waitForTimeout(500);
  
  const door = await page.locator('.door-hitbox').boundingBox();
  if (door) {
    await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
    await page.waitForTimeout(15000);
  }
  
  const completeMuted = await page.locator('.complete-screen').isVisible();
  results['muted'] = completeMuted;
  console.log(`  Result: ${completeMuted ? '✅ PASS' : '❌ FAIL'}\n`);
  
  await context.close();
  
  // ===== Summary =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (consoleErrors.length === 0) {
    console.log('✅ NO CONSOLE ERRORS\n');
  } else {
    console.log('⚠️  CONSOLE ERRORS:\n');
    consoleErrors.forEach(err => console.log(`  ${err}`));
    console.log('');
  }
  
  console.log('Door Tap Timing Results:');
  console.log(`  0.5s: ${results['0.5s'] ? '✅' : '❌'}`);
  console.log(`  1s:   ${results['1s'] ? '✅' : '❌'}`);
  console.log(`  3s:   ${results['3s'] ? '✅' : '❌'}`);
  console.log(`  14s:  ${results['14s'] ? '✅' : '❌'}`);
  console.log(`  Muted: ${results['muted'] ? '✅' : '❌'}`);
  
  console.log('\nScreenshots saved:');
  console.log('  📸 door-glow-peak.png');
  console.log('  📸 door-glow-low.png');
  console.log('  📸 fairy-beside-door.png');
  
  await browser.close();
}

testGlowAndFairy().catch(console.error);
