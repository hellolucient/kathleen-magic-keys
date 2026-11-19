import { chromium } from 'playwright';

async function testLiveAudioTimeline() {
  console.log('🌐 LIVE PRODUCTION AUDIO TIMELINE TEST\n');
  console.log('URL: https://hellolucient.github.io/kathleen-magic-keys/');
  console.log('Build: d9133a8\n');
  
  const browser = await chromium.launch({ headless: true });
  
  // ===== TEST A: Clean Run =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST A: CLEAN RUN (NO TAPS)');
  console.log('Expected: Full intro (~42s) + hint at ~67s');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  let page = await context.newPage();
  const startTime = Date.now();
  
  await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  const gameStartTime = Date.now();
  console.log(`00:00 - Game started\n`);
  
  console.log('Waiting for intro to complete...');
  await page.waitForTimeout(45000);
  
  const elapsed = ((Date.now() - gameStartTime) / 1000).toFixed(1);
  const fairyText = await page.locator('.speech-bubble').count();
  const introComplete = fairyText === 0;
  console.log(`${elapsed}s - Intro complete: ${introComplete}`);
  console.log(`       Fairy speaking: ${fairyText > 0 ? 'Yes (ISSUE)' : 'No (OK)'}\n`);
  
  console.log('Waiting for first hint...');
  await page.waitForTimeout(27000);
  
  const elapsed2 = ((Date.now() - gameStartTime) / 1000).toFixed(1);
  const hintText = await page.locator('.speech-bubble').count();
  console.log(`${elapsed2}s - First hint: ${hintText > 0 ? 'Yes (OK)' : 'No (ISSUE)'}\n`);
  
  await context.close();
  
  // ===== TEST B: Door Tap Immediately =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST B: DOOR TAP IMMEDIATELY AFTER 5TH KEY');
  console.log('Expected: Door opens, finale, complete screen');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  
  await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  console.log('✅ Game started (intro skipped)\n');
  
  // Solve puzzles
  console.log('Solving puzzles...');
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
      console.log('✅ 5th key collected\n');
      
      // Tap door IMMEDIATELY
      await page.waitForTimeout(1000);
      console.log('🚪 Tapping door immediately (1s after 5th key)...');
      
      const door = await page.locator('.door-hitbox').boundingBox();
      if (door) {
        await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
        console.log('   Door tapped, waiting for finale...\n');
        await page.waitForTimeout(15000);
      }
    }
  }
  
  const completeVisible = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${completeVisible ? 'YES (OK)' : 'NO (ISSUE)'}\n`);
  
  if (!completeVisible) {
    const doorOpen = await page.locator('.door-open-overlay').isVisible();
    const fairySpeaking = await page.locator('.speech-bubble').count();
    console.log(`⚠️  ISSUE DETECTED:`);
    console.log(`   Door open: ${doorOpen}`);
    console.log(`   Fairy speaking: ${fairySpeaking > 0}\n`);
  }
  
  await context.close();
  
  // ===== TEST C: Mute During Finale =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST C: MUTE DURING FINALE');
  console.log('Expected: Complete screen despite mute');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  
  await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  console.log('✅ Game started\n');
  
  console.log('Solving puzzles...');
  const teddy2 = page.locator('img[src="art/sprites/teddy.png"]').first();
  await teddy2.click({ force: true });
  await page.waitForTimeout(400);
  await teddy2.click({ force: true });
  await page.waitForTimeout(3500);
  
  await page.locator('img[src*="jewellery-box"]').first().click({ force: true });
  await page.waitForTimeout(3500);
  
  await page.locator('img[src*="curtain-closed"]').first().click({ force: true });
  await page.waitForTimeout(3500);
  
  const wardrobe2 = await page.locator('.wardrobe-hitbox').boundingBox();
  if (wardrobe2) {
    await page.mouse.click(wardrobe2.x + wardrobe2.width / 2, wardrobe2.y + wardrobe2.height / 2);
    await page.waitForTimeout(600);
    await page.mouse.click(wardrobe2.x + wardrobe2.width / 2, wardrobe2.y + wardrobe2.height * 0.6);
    await page.waitForTimeout(3500);
  }
  
  const mirror2 = await page.locator('.mirror-hitbox').boundingBox();
  if (mirror2) {
    await page.mouse.click(mirror2.x + mirror2.width / 2, mirror2.y + mirror2.height / 2);
    await page.waitForTimeout(1200);
    
    const stars2 = page.locator('img[src="art/sprites/star.png"]');
    for (let i = 0; i < 3; i++) {
      await stars2.nth(i).click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(600);
    
    const mirrorKey2 = page.locator('.key-mirror img[src="art/sprites/key.png"]').first();
    if (await mirrorKey2.count() > 0) {
      await mirrorKey2.click({ force: true });
      console.log('✅ 5th key collected\n');
      
      await page.waitForTimeout(4000);
      
      console.log('🔇 Muting...');
      await page.click('.mute-button');
      await page.waitForTimeout(500);
      
      console.log('🚪 Opening door while muted...\n');
      const door2 = await page.locator('.door-hitbox').boundingBox();
      if (door2) {
        await page.mouse.click(door2.x + door2.width / 2, door2.y + door2.height / 2);
        await page.waitForTimeout(12000);
      }
    }
  }
  
  const completeMuted = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen (muted): ${completeMuted ? 'YES (OK)' : 'NO (ISSUE)'}\n`);
  
  await context.close();
  
  // ===== TEST D: Rapid Keys =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST D: RAPID KEY COLLECTION');
  console.log('Expected: No cut-offs, all keys collected');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  
  await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  console.log('✅ Game started\n');
  
  console.log('Rapidly collecting keys...');
  const teddy3 = page.locator('img[src="art/sprites/teddy.png"]').first();
  await teddy3.click({ force: true });
  await page.waitForTimeout(200);
  await teddy3.click({ force: true });
  await page.waitForTimeout(1000);
  
  await page.locator('img[src*="jewellery-box"]').first().click({ force: true });
  await page.waitForTimeout(1000);
  
  await page.locator('img[src*="curtain-closed"]').first().click({ force: true });
  await page.waitForTimeout(1000);
  
  const wardrobe3 = await page.locator('.wardrobe-hitbox').boundingBox();
  if (wardrobe3) {
    await page.mouse.click(wardrobe3.x + wardrobe3.width / 2, wardrobe3.y + wardrobe3.height / 2);
    await page.waitForTimeout(300);
    await page.mouse.click(wardrobe3.x + wardrobe3.width / 2, wardrobe3.y + wardrobe3.height * 0.6);
    await page.waitForTimeout(1000);
  }
  
  const mirror3 = await page.locator('.mirror-hitbox').boundingBox();
  if (mirror3) {
    await page.mouse.click(mirror3.x + mirror3.width / 2, mirror3.y + mirror3.height / 2);
    await page.waitForTimeout(600);
    
    const stars3 = page.locator('img[src="art/sprites/star.png"]');
    for (let i = 0; i < 3; i++) {
      await stars3.nth(i).click({ force: true });
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(300);
    
    const mirrorKey3 = page.locator('.key-mirror img[src="art/sprites/key.png"]').first();
    if (await mirrorKey3.count() > 0) {
      await mirrorKey3.click({ force: true });
    }
  }
  
  await page.waitForTimeout(2000);
  
  const keyCount = await page.locator('.key-count').textContent();
  console.log(`✅ Final count: ${keyCount}\n`);
  
  await context.close();
  
  // ===== Summary =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('LIVE PRODUCTION AUDIO TIMELINE SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Expected Audio Timeline (Clean Run):');
  console.log('  00:00 - Game starts');
  console.log('  00:05 - narr-intro (12.5s)');
  console.log('  13:00 - narr-fairy-arrives (5.5s)');
  console.log('  18:8s - fairy-intro (14.0s)');
  console.log('  34:3s - fairy-start (6.5s)');
  console.log('  42:3s - Intro complete');
  console.log('  67:3s - First hint');
  console.log('\nAll tests completed. Check results above.');
  
  await browser.close();
}

testLiveAudioTimeline().catch(console.error);
