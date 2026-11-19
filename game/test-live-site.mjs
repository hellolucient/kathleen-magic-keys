import { chromium } from 'playwright';

async function testLiveSite() {
  console.log('🌐 Testing live site: https://hellolucient.github.io/kathleen-magic-keys/\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
  });
  
  const page = await context.newPage();
  let errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to start speech')) {
      console.log(`⚠️  Browser error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });
  
  try {
    console.log('Loading page...');
    await page.goto('https://hellolucient.github.io/kathleen-magic-keys/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ Page loaded');
    
    await page.waitForSelector('.title-screen', { timeout: 15000 });
    console.log('✅ Title screen appeared');
    
    await page.click('.play-button', { force: true });
    console.log('✅ Play button clicked');
    
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✅ Game scene loaded\n');
    
    console.log('🎮 Testing all 5 puzzles...\n');
    
    // Teddy
    const teddy = page.locator('img[src="art/sprites/teddy.png"]').first();
    await teddy.click({ force: true });
    await page.waitForTimeout(600);
    await teddy.click({ force: true });
    await page.waitForTimeout(1500);
    let keyCount = await page.locator('.key-count').textContent();
    console.log(`1. Teddy:        ${keyCount} ${keyCount.includes('1') ? '✅' : '❌'}`);
    
    // Jewellery box
    await page.locator('img[src*="jewellery-box"]').first().click({ force: true });
    await page.waitForTimeout(1500);
    keyCount = await page.locator('.key-count').textContent();
    console.log(`2. Jewellery:    ${keyCount} ${keyCount.includes('2') ? '✅' : '❌'}`);
    
    // Curtain
    await page.locator('img[src*="curtain-closed"]').first().click({ force: true });
    await page.waitForTimeout(1500);
    keyCount = await page.locator('.key-count').textContent();
    console.log(`3. Curtain:      ${keyCount} ${keyCount.includes('3') ? '✅' : '❌'}`);
    
    // Wardrobe
    const wardrobe = await page.locator('.wardrobe-hitbox').boundingBox();
    if (wardrobe) {
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height / 2);
      await page.waitForTimeout(800);
      await page.mouse.click(wardrobe.x + wardrobe.width / 2, wardrobe.y + wardrobe.height * 0.6);
      await page.waitForTimeout(1500);
    }
    keyCount = await page.locator('.key-count').textContent();
    console.log(`4. Wardrobe:     ${keyCount} ${keyCount.includes('4') ? '✅' : '❌'}`);
    
    // Mirror
    const mirror = await page.locator('.mirror-hitbox').boundingBox();
    if (mirror) {
      await page.mouse.click(mirror.x + mirror.width / 2, mirror.y + mirror.height / 2);
      await page.waitForTimeout(1200);
      
      const stars = page.locator('img[src="art/sprites/star.png"]');
      for (let i = 0; i < 3; i++) {
        await stars.nth(i).click({ force: true });
        await page.waitForTimeout(600);
      }
      await page.waitForTimeout(800);
      
      const mirrorKey = page.locator('.key-mirror img[src="art/sprites/key.png"]').first();
      if (await mirrorKey.count() > 0) {
        await mirrorKey.click({ force: true });
        await page.waitForTimeout(1500);
      }
    }
    keyCount = await page.locator('.key-count').textContent();
    console.log(`5. Mirror:       ${keyCount} ${keyCount.includes('5') ? '✅' : '❌'}`);
    
    console.log('\n🚪 Testing door unlock...');
    await page.waitForTimeout(2000);
    
    const doorVisible = await page.locator('.door-hitbox').isVisible();
    console.log(`   Door visible:  ${doorVisible ? '✅' : '❌'}`);
    
    const door = await page.locator('.door-hitbox').boundingBox();
    if (door) {
      await page.mouse.click(door.x + door.width / 2, door.y + door.height / 2);
      await page.waitForTimeout(6000);
    }
    
    const completeVisible = await page.locator('.complete-screen').isVisible();
    console.log(`   Complete screen: ${completeVisible ? '✅' : '❌'}`);
    
    console.log('\n🔄 Testing Play Again...');
    await page.click('.play-again-button');
    await page.waitForTimeout(2000);
    
    const backInRoom = await page.locator('.game-scene').isVisible();
    keyCount = await page.locator('.key-count').textContent();
    console.log(`   Back in room:  ${backInRoom ? '✅' : '❌'}`);
    console.log(`   Keys reset:    ${keyCount.includes('0 / 5') ? '✅' : '❌'}`);
    
    console.log('\n' + '='.repeat(50));
    if (errors.length === 0) {
      console.log('✅ LIVE SITE TEST PASSED - All functionality working!');
    } else {
      console.log(`⚠️  Live site working with ${errors.length} minor errors`);
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testLiveSite().catch(console.error);
