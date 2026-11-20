import { chromium } from 'playwright';
import { promises as fs } from 'fs';

async function testFinalePolish() {
  console.log('🎨 FINALE POLISH VERIFICATION\n');
  console.log('Testing: Key chime, door glow, fairy animation\n');
  console.log('Door tap timings: 0.5s, 1s, 3s, 14s, muted\n');
  
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  
  await fs.mkdir('/workspace/game/screenshots', { recursive: true });
  
  // Helper to solve puzzles quickly
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
  
  // ===== TEST 1: Door tap at 0.5s =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Door tap at 0.5s after 5th key');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  let page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ test: 'Test 1 (0.5s)', error: msg.text() });
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected, waiting 0.5s...');
  await page.waitForTimeout(500);
  
  const door = await page.locator('.door-hitbox').boundingBox();
  if (door) {
    await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
    console.log('Door tapped at 0.5s\n');
    await page.waitForTimeout(18000);
  }
  
  const complete1 = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${complete1 ? 'YES' : 'NO'}\n`);
  
  await context.close();
  
  // ===== TEST 2: Door tap at 1s =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Door tap at 1s after 5th key');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ test: 'Test 2 (1s)', error: msg.text() });
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected, waiting 1s...');
  await page.waitForTimeout(1000);
  
  const door2 = await page.locator('.door-hitbox').boundingBox();
  if (door2) {
    await page.mouse.click(door2.x + door2.width / 2, door2.y + door2.height / 2);
    console.log('Door tapped at 1s\n');
    await page.waitForTimeout(18000);
  }
  
  const complete2 = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${complete2 ? 'YES' : 'NO'}\n`);
  
  await context.close();
  
  // ===== TEST 3: Door tap at 3s with screenshots =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Door tap at 3s (with screenshots)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ test: 'Test 3 (3s)', error: msg.text() });
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected\n');
  
  // Screenshot door glow
  console.log('Waiting for door glow and fairy at door...');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/workspace/game/screenshots/door-glow-strong.png', fullPage: true });
  console.log('📸 Screenshot: door-glow-strong.png\n');
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/workspace/game/screenshots/fairy-at-door.png', fullPage: true });
  console.log('📸 Screenshot: fairy-at-door.png\n');
  
  const door3 = await page.locator('.door-hitbox').boundingBox();
  if (door3) {
    await page.mouse.click(door3.x + door3.width / 2, door3.y + door3.height / 2);
    console.log('Door tapped at ~3.5s\n');
    await page.waitForTimeout(18000);
  }
  
  const complete3 = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${complete3 ? 'YES' : 'NO'}\n`);
  
  await context.close();
  
  // ===== TEST 4: Door tap at 14s =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Door tap at 14s after 5th key');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ test: 'Test 4 (14s)', error: msg.text() });
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected, waiting 14s...');
  await page.waitForTimeout(14000);
  
  const door4 = await page.locator('.door-hitbox').boundingBox();
  if (door4) {
    await page.mouse.click(door4.x + door4.width / 2, door4.y + door4.height / 2);
    console.log('Door tapped at 14s\n');
    await page.waitForTimeout(18000);
  }
  
  const complete4 = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${complete4 ? 'YES' : 'NO'}\n`);
  
  await context.close();
  
  // ===== TEST 5: Muted =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Muted during finale');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ test: 'Test 5 (muted)', error: msg.text() });
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  await solvePuzzles(page);
  
  console.log('5th key collected\n');
  await page.waitForTimeout(2000);
  
  console.log('Muting audio...');
  await page.click('.mute-button');
  await page.waitForTimeout(500);
  
  const door5 = await page.locator('.door-hitbox').boundingBox();
  if (door5) {
    await page.mouse.click(door5.x + door5.width / 2, door5.y + door5.height / 2);
    console.log('Door tapped while muted\n');
    await page.waitForTimeout(15000);
  }
  
  const complete5 = await page.locator('.complete-screen').isVisible();
  console.log(`✅ Complete screen: ${complete5 ? 'YES' : 'NO'}\n`);
  
  await context.close();
  
  // ===== Summary =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (consoleErrors.length === 0) {
    console.log('✅ NO CONSOLE ERRORS\n');
  } else {
    console.log('⚠️  CONSOLE ERRORS DETECTED:\n');
    consoleErrors.forEach(({ test, error }) => {
      console.log(`${test}:`);
      console.log(`  ${error}\n`);
    });
  }
  
  console.log('Test Results:');
  console.log(`  Door tap at 0.5s: ${complete1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Door tap at 1s:   ${complete2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Door tap at 3s:   ${complete3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Door tap at 14s:  ${complete4 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Muted finale:     ${complete5 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nScreenshots saved:');
  console.log('  📸 door-glow-strong.png');
  console.log('  📸 fairy-at-door.png');
  
  await browser.close();
}

testFinalePolish().catch(console.error);
