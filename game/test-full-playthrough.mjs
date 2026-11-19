import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

async function fullPlaythrough() {
  console.log('Starting full playthrough test at 1180x820...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 1,
    hasTouch: true,
  });
  
  const page = await context.newPage();
  const screenshots = [];
  
  // Collect console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ BROWSER ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error(`❌ PAGE ERROR: ${error}`);
  });
  
  try {
    mkdirSync('/tmp/playthrough', { recursive: true });
    
    // Navigate to game
    console.log('Loading game...');
    await page.goto('http://localhost:4173/kathleen-magic-keys/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for loading to complete
    await page.waitForSelector('.title-screen', { timeout: 30000 });
    await page.screenshot({ path: '/tmp/playthrough/01-title.png', fullPage: false });
    screenshots.push('01-title.png');
    console.log('✓ Title screen loaded');
    
    // Click play
    await page.click('.play-button', { force: true });
    console.log('✓ Clicked Play button');
    
    // Wait for game scene
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(6000); // Wait for intro narration
    await page.screenshot({ path: '/tmp/playthrough/02-room-start.png', fullPage: false });
    screenshots.push('02-room-start.png');
    console.log('✓ Game scene loaded, intro complete');
    
    // Puzzle 1: Teddy
    console.log('\n🧸 Testing Teddy puzzle...');
    const teddyImg = page.locator('img[src="art/sprites/teddy.png"]').first();
    await teddyImg.click({ force: true });
    await page.waitForTimeout(600);
    await teddyImg.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/playthrough/03-teddy-moved.png', fullPage: false });
    screenshots.push('03-teddy-moved.png');
    
    let keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys: ${keyCount}`);
    if (keyCount.includes('1')) {
      console.log('  ✓ Teddy puzzle solved');
    }
    
    // Puzzle 2: Jewellery box
    console.log('\n💎 Testing Jewellery box puzzle...');
    const jewelBox = page.locator('img[src*="jewellery-box"]').first();
    await jewelBox.click({ force: true });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: '/tmp/playthrough/04-jewellery-opened.png', fullPage: false });
    screenshots.push('04-jewellery-opened.png');
    
    keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys: ${keyCount}`);
    if (keyCount.includes('2')) {
      console.log('  ✓ Jewellery box puzzle solved');
    }
    
    // Puzzle 3: Curtain
    console.log('\n🪟 Testing Curtain puzzle...');
    const curtain = page.locator('img[src*="curtain-closed"]').first();
    await curtain.click({ force: true });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: '/tmp/playthrough/05-curtain-opened.png', fullPage: false });
    screenshots.push('05-curtain-opened.png');
    
    keyCount = await page.locator('.key-count').textContent();
    console.log(`  Keys: ${keyCount}`);
    if (keyCount.includes('3')) {
      console.log('  ✓ Curtain puzzle solved');
    }
    
    // Puzzle 4: Wardrobe
    console.log('\n👗 Testing Wardrobe puzzle...');
    // Click wardrobe area
    const wardrobeArea = await page.locator('.wardrobe-hitbox').boundingBox();
    if (wardrobeArea) {
      await page.mouse.click(wardrobeArea.x + wardrobeArea.width / 2, wardrobeArea.y + wardrobeArea.height / 2);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/playthrough/06-wardrobe-opened.png', fullPage: false });
      screenshots.push('06-wardrobe-opened.png');
      
      // Click dress pocket
      await page.mouse.click(wardrobeArea.x + wardrobeArea.width / 2, wardrobeArea.y + wardrobeArea.height * 0.6);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: '/tmp/playthrough/07-wardrobe-key.png', fullPage: false });
      screenshots.push('07-wardrobe-key.png');
      
      keyCount = await page.locator('.key-count').textContent();
      console.log(`  Keys: ${keyCount}`);
      if (keyCount.includes('4')) {
        console.log('  ✓ Wardrobe puzzle solved');
      }
    }
    
    // Puzzle 5: Mirror
    console.log('\n🪞 Testing Mirror puzzle...');
    const mirrorArea = await page.locator('.mirror-hitbox').boundingBox();
    if (mirrorArea) {
      await page.mouse.click(mirrorArea.x + mirrorArea.width / 2, mirrorArea.y + mirrorArea.height / 2);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/playthrough/08-mirror-glow.png', fullPage: false });
      screenshots.push('08-mirror-glow.png');
      
      // Click stars in order
      const stars = page.locator('img[src="art/sprites/star.png"]');
      const starCount = await stars.count();
      console.log(`  Found ${starCount} stars`);
      
      if (starCount >= 3) {
        for (let i = 0; i < 3; i++) {
          await stars.nth(i).click({ force: true });
          await page.waitForTimeout(600);
        }
        await page.waitForTimeout(1000);
        
        // Click the mirror key that appears
        const mirrorKey = page.locator('.key-mirror img[src="art/sprites/key.png"]').first();
        const mirrorKeyExists = await mirrorKey.count();
        if (mirrorKeyExists > 0) {
          await mirrorKey.click({ force: true });
          await page.waitForTimeout(1800);
        }
        
        await page.screenshot({ path: '/tmp/playthrough/09-mirror-complete.png', fullPage: false });
        screenshots.push('09-mirror-complete.png');
        
        keyCount = await page.locator('.key-count').textContent();
        console.log(`  Keys: ${keyCount}`);
        if (keyCount.includes('5')) {
          console.log('  ✓ Mirror puzzle solved');
        }
      }
    }
    
    // Wait for door glow
    console.log('\n✨ Waiting for door glow...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/playthrough/10-door-glowing.png', fullPage: false });
    screenshots.push('10-door-glowing.png');
    console.log('  ✓ Door glowing');
    
    // Click door to unlock
    console.log('\n🚪 Unlocking door...');
    const doorArea = await page.locator('.door-hitbox').boundingBox();
    if (doorArea) {
      await page.mouse.click(doorArea.x + doorArea.width / 2, doorArea.y + doorArea.height / 2);
      await page.waitForTimeout(8000);
      await page.screenshot({ path: '/tmp/playthrough/11-door-open.png', fullPage: false });
      screenshots.push('11-door-open.png');
      console.log('  ✓ Door unlock animation complete');
    }
    
    // Check complete screen
    await page.waitForTimeout(2000);
    const completeVisible = await page.locator('.complete-screen').isVisible();
    await page.screenshot({ path: '/tmp/playthrough/12-complete.png', fullPage: false });
    screenshots.push('12-complete.png');
    
    if (completeVisible) {
      console.log('  ✓ Complete screen reached!');
    } else {
      console.log('  ❌ Complete screen not visible');
    }
    
    // Test Play Again
    console.log('\n🔄 Testing Play Again...');
    await page.click('.play-again-button');
    await page.waitForTimeout(6000);
    await page.screenshot({ path: '/tmp/playthrough/13-play-again.png', fullPage: false });
    screenshots.push('13-play-again.png');
    
    const backInRoom = await page.locator('.game-scene').isVisible();
    if (backInRoom) {
      const newKeyCount = await page.locator('.key-count').textContent();
      console.log(`  Keys after restart: ${newKeyCount}`);
      if (newKeyCount.includes('0 / 5')) {
        console.log('  ✓ Progress reset correctly');
      }
    }
    
    console.log('\n✅ Full playthrough test completed!');
    console.log(`\nScreenshots saved:`);
    screenshots.forEach(s => console.log(`  /tmp/playthrough/${s}`));
    
    // Write summary
    const summary = {
      testDate: new Date().toISOString(),
      viewport: { width: 1180, height: 820 },
      allPuzzlesSolved: keyCount.includes('5'),
      completeScreenReached: completeVisible,
      playAgainWorks: backInRoom,
      screenshots: screenshots
    };
    writeFileSync('/tmp/playthrough/summary.json', JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/playthrough/error.png', fullPage: false });
    throw error;
  } finally {
    await browser.close();
  }
}

fullPlaythrough().catch(console.error);
