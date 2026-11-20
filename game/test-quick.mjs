import { chromium } from 'playwright';

async function quickTest() {
  console.log('🎨 QUICK TEST\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`ERROR: ${msg.text()}`);
    }
  });
  
  await page.goto('http://localhost:4173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  await page.waitForTimeout(3000);
  
  console.log('Solving puzzles...\n');
  
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
  
  console.log('Waiting for door glow (6s)...');
  await page.waitForTimeout(6000);
  
  console.log('Tapping door...\n');
  const door = await page.locator('.door-hitbox').boundingBox();
  if (door) {
    await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
    console.log('Waiting for finale (35s to ensure failsafe)...\n');
    await page.waitForTimeout(35000);
  }
  
  const complete = await page.locator('.complete-screen').isVisible();
  const doorOpen = await page.locator('.door-open-overlay').isVisible();
  
  console.log(`Door open: ${doorOpen}`);
  console.log(`Complete screen: ${complete}\n`);
  
  if (complete) {
    console.log('TEST PASSED');
  } else {
    console.log('TEST FAILED - checking what is blocking...');
    const fairyVisible = await page.locator('.fairy').isVisible();
    const fairyText = await page.locator('.speech-bubble').count();
    console.log(`  Fairy visible: ${fairyVisible}`);
    console.log(`  Fairy speaking: ${fairyText > 0}`);
  }
  
  await browser.close();
}

quickTest().catch(console.error);
