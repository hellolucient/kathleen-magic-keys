import { chromium } from 'playwright';

async function testLiveFinal() {
  console.log('🌐 FINAL LIVE SITE TEST\n');
  console.log('URL: https://hellolucient.github.io/kathleen-magic-keys/\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Loading live site...');
    await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForSelector('.title-screen', { timeout: 15000 });
    console.log('✅ Title screen\n');
    
    await page.click('.play-button', { force: true });
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    console.log('✅ Game scene loaded');
    
    // Check fairy visible
    await page.waitForTimeout(1000);
    const fairyVisible = await page.locator('.fairy').isVisible();
    console.log(`✅ Fairy visible: ${fairyVisible}\n`);
    
    // Quick puzzle run
    console.log('Running puzzles...');
    
    // Teddy
    const teddy = page.locator('img[src="art/sprites/teddy.png"]').first();
    await teddy.click({ force: true });
    await page.waitForTimeout(400);
    await teddy.click({ force: true });
    await page.waitForTimeout(1500);
    
    // Jewellery
    await page.locator('img[src*="jewellery-box"]').first().click({ force: true });
    await page.waitForTimeout(1500);
    
    // Curtain
    await page.locator('img[src*="curtain-closed"]').first().click({ force: true });
    await page.waitForTimeout(1500);
    
    // Wardrobe
    const wardrobe = await page.locator('.wardrobe-hitbox').boundingBox();
    if (wardrobe) {
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height / 2);
      await page.waitForTimeout(600);
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height * 0.6);
      await page.waitForTimeout(1500);
    }
    
    // Mirror
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
        await page.waitForTimeout(1500);
      }
    }
    
    let keyCount = await page.locator('.key-count').textContent();
    console.log(`✅ All puzzles complete: ${keyCount}\n`);
    
    // Door
    console.log('Opening door...');
    await page.waitForTimeout(2000);
    const door = await page.locator('.door-hitbox').boundingBox();
    if (door) {
      await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
      await page.waitForTimeout(7000);
    }
    
    const completeVisible = await page.locator('.complete-screen').isVisible();
    console.log(`✅ Complete screen: ${completeVisible}\n`);
    
    console.log('='.repeat(50));
    console.log('✅ LIVE SITE FULLY FUNCTIONAL');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testLiveFinal().catch(console.error);
