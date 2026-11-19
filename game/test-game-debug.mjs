import { chromium } from 'playwright';

async function testGame() {
  console.log('Starting game debug test...\n');
  
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
    
    // Take screenshot of loading screen
    await page.screenshot({ path: '/tmp/01-loading.png', fullPage: true });
    console.log('✓ Screenshot: loading');
    
    // Wait for loading screen to complete
    await page.waitForSelector('.title-screen', { timeout: 30000 });
    await page.screenshot({ path: '/tmp/02-title.png', fullPage: true });
    console.log('✓ Screenshot: title screen');
    
    // Click play button
    await page.click('.play-button', { force: true });
    console.log('✓ Started game');
    
    // Wait for game scene
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(5000); // Wait for intro
    await page.screenshot({ path: '/tmp/03-game-start.png', fullPage: true });
    console.log('✓ Screenshot: game start');
    
    // Log what elements are present
    const html = await page.content();
    console.log('\nChecking for sprite elements...');
    
    // Check for specific sprites using different selectors
    const spriteCount = await page.locator('.sprite').count();
    console.log(`Found ${spriteCount} .sprite elements`);
    
    // Try clicking by image src
    console.log('\nAttempting Teddy puzzle by image...');
    const teddyImg = page.locator('img[src*="teddy.png"]').first();
    const teddyCount = await teddyImg.count();
    console.log(`Found ${teddyCount} teddy images`);
    
    if (teddyCount > 0) {
      await teddyImg.click({ force: true });
      await page.waitForTimeout(500);
      await teddyImg.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/04-teddy-moved.png', fullPage: true });
      console.log('✓ Clicked teddy');
      
      let keyCount = await page.locator('.key-count').textContent();
      console.log(`Keys found: ${keyCount}`);
    }
    
    // Try jewellery box
    console.log('\nAttempting Jewellery box...');
    const jewelBox = page.locator('img[src*="jewellery-box"]').first();
    const boxCount = await jewelBox.count();
    console.log(`Found ${boxCount} jewellery box images`);
    
    if (boxCount > 0) {
      await jewelBox.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/05-jewellery-opened.png', fullPage: true });
      
      let keyCount = await page.locator('.key-count').textContent();
      console.log(`Keys found: ${keyCount}`);
    }
    
    // Try curtain
    console.log('\nAttempting Curtain...');
    const curtain = page.locator('img[src*="curtain-closed"]').first();
    const curtainCount = await curtain.count();
    console.log(`Found ${curtainCount} curtain images`);
    
    if (curtainCount > 0) {
      await curtain.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/06-curtain-opened.png', fullPage: true });
      
      let keyCount = await page.locator('.key-count').textContent();
      console.log(`Keys found: ${keyCount}`);
    }
    
    // Try wardrobe
    console.log('\nAttempting Wardrobe...');
    const wardrobe = page.locator('img[src*="wardrobe-open"]').first();
    
    // First open wardrobe - click on background where it should be
    await page.mouse.click(700, 400); // Approximate wardrobe position
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/07-wardrobe-opened.png', fullPage: true });
    
    // Click in dress area
    await page.mouse.click(700, 450);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/08-wardrobe-key.png', fullPage: true });
    
    let keyCount = await page.locator('.key-count').textContent();
    console.log(`Keys found: ${keyCount}`);
    
    // Try mirror
    console.log('\nAttempting Mirror...');
    await page.mouse.click(200, 400); // Approximate mirror position
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/09-mirror-glow.png', fullPage: true });
    
    // Click stars
    const stars = page.locator('img[src*="star.png"]');
    const starCount = await stars.count();
    console.log(`Found ${starCount} star images`);
    
    if (starCount >= 3) {
      for (let i = 0; i < 3; i++) {
        await stars.nth(i).click({ force: true });
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/10-mirror-complete.png', fullPage: true });
      
      keyCount = await page.locator('.key-count').textContent();
      console.log(`Keys found: ${keyCount}`);
    }
    
    // Wait and click door
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/11-door-glow.png', fullPage: true });
    
    await page.mouse.click(1000, 400); // Door position
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/12-complete.png', fullPage: true });
    
    const completeVisible = await page.locator('.complete-screen').isVisible();
    console.log(`\nComplete screen visible: ${completeVisible}`);
    
    console.log('\n✅ Debug test completed!');
    console.log('Screenshots saved to /tmp/');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testGame().catch(console.error);
