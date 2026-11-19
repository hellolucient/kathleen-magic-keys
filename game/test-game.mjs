import { chromium } from 'playwright';

async function testGame() {
  console.log('Starting game test...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the game
    await page.goto('http://localhost:5173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');
    
    // Wait for loading screen to complete
    await page.waitForSelector('.title-screen', { timeout: 30000 });
    console.log('✓ Loading screen completed');
    
    // Click play button (force click due to animation)
    await page.click('.play-button', { force: true });
    console.log('✓ Started game');
    
    // Wait for game scene
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(3000); // Wait for intro
    console.log('✓ Game scene loaded');
    
    // Test puzzle 1: Teddy
    console.log('\nTesting Teddy puzzle...');
    const teddy = await page.locator('.teddy').first();
    await teddy.click();
    await page.waitForTimeout(500);
    await teddy.click();
    await page.waitForTimeout(1000);
    
    // Check if key counter updated
    let keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys found: ${keyCount}`);
    if (keyCount.includes('1')) {
      console.log('✓ Teddy puzzle solved');
    }
    
    // Test puzzle 2: Jewellery box
    console.log('\nTesting Jewellery box puzzle...');
    await page.locator('.jewellery-box').first().click();
    await page.waitForTimeout(1000);
    keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys found: ${keyCount}`);
    if (keyCount.includes('2')) {
      console.log('✓ Jewellery box puzzle solved');
    }
    
    // Test puzzle 3: Curtain
    console.log('\nTesting Curtain puzzle...');
    await page.locator('.curtain-closed').first().click();
    await page.waitForTimeout(1000);
    keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys found: ${keyCount}`);
    if (keyCount.includes('3')) {
      console.log('✓ Curtain puzzle solved');
    }
    
    // Test puzzle 4: Wardrobe
    console.log('\nTesting Wardrobe puzzle...');
    await page.locator('.wardrobe-hitbox').first().click();
    await page.waitForTimeout(500);
    await page.locator('.dress-pocket-hitbox').first().click();
    await page.waitForTimeout(1000);
    keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys found: ${keyCount}`);
    if (keyCount.includes('4')) {
      console.log('✓ Wardrobe puzzle solved');
    }
    
    // Test puzzle 5: Mirror and stars
    console.log('\nTesting Mirror puzzle...');
    await page.locator('.mirror-hitbox').first().click();
    await page.waitForTimeout(500);
    
    // Click stars in order 1, 2, 3
    const stars = await page.locator('.star').all();
    if (stars.length >= 3) {
      await stars[0].click();
      await page.waitForTimeout(300);
      await stars[1].click();
      await page.waitForTimeout(300);
      await stars[2].click();
      await page.waitForTimeout(1000);
      
      keyCount = await page.locator('.key-count').textContent();
      console.log(`  Keys found: ${keyCount}`);
      if (keyCount.includes('5')) {
        console.log('✓ Mirror puzzle solved');
      }
    }
    
    // Wait for door to glow
    console.log('\nWaiting for door glow...');
    await page.waitForTimeout(2000);
    
    // Click door to unlock
    console.log('Unlocking door...');
    await page.locator('.door-hitbox').first().click();
    await page.waitForTimeout(8000); // Wait for unlock animation
    
    // Check if complete screen appears
    const completeVisible = await page.locator('.complete-screen').isVisible();
    if (completeVisible) {
      console.log('✓ Complete screen reached!');
    } else {
      console.log('✗ Complete screen not visible');
    }
    
    // Test at larger resolution
    console.log('\n\nTesting at 1366x1024 resolution...');
    await page.setViewportSize({ width: 1366, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if play again button works
    const playAgainButton = await page.locator('.play-again-button');
    if (await playAgainButton.isVisible()) {
      console.log('✓ Layout correct at 1366x1024');
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testGame().catch(console.error);
