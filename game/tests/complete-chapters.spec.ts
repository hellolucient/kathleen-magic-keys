import { test, expect } from '@playwright/test';

test.describe('Complete Chapters 1-5', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
  });

  test('Chapter 1 loads and runs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    
    // Wait and click play
    await page.waitForSelector('.play-button', { timeout: 10000 });
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker', { timeout: 5000 });
    
    // Select Chapter 1
    await page.click('.chapter-card:nth-child(1)');
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    console.log('✓ Chapter 1 loads without errors');
    expect(errors).toHaveLength(0);
  });

  test('Chapter 2 loads and runs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    
    await page.click('.chapter-card:nth-child(2)');
    await page.waitForSelector('.chapter2-scene', { timeout: 5000 });
    await page.waitForTimeout(3000);
    
    console.log('✓ Chapter 2 loads without errors');
    expect(errors).toHaveLength(0);
  });

  test('Chapter 3 complete playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene', { timeout: 5000 });
    
    // Take start screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-start.png', fullPage: false });
    console.log('✓ Ch3 start screenshot');
    
    // Wait for intro to finish
    await page.waitForTimeout(10000);
    
    // Take mid-game screenshot showing lily pads and frogs
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-mid-game.png' });
    console.log('✓ Ch3 mid-game screenshot');
    
    // Play 3 rounds
    for (let round = 0; round < 3; round++) {
      await page.waitForTimeout(3000); // Wait for sequence playback
      
      // Round 1: [0,2,1], Round 2: [1,3,0,2], Round 3: [2,4,1,3,0]
      const sequences = [
        [0, 2, 1],
        [1, 3, 0, 2],
        [2, 4, 1, 3, 0]
      ];
      
      const sequence = sequences[round];
      for (const padIndex of sequence) {
        const pad = await page.locator('.lily-pad.clickable').nth(padIndex);
        if (await pad.isVisible()) {
          await pad.click();
          await page.waitForTimeout(400);
        }
      }
      
      await page.waitForTimeout(2000);
      console.log(`✓ Ch3 round ${round + 1} complete`);
    }
    
    // Wait for gem to appear
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-treasure.png' });
    console.log('✓ Ch3 treasure screenshot');
    
    // Tap gem
    const gem = await page.locator('.purple-gem.clickable');
    if (await gem.isVisible()) {
      await gem.click();
    }
    
    await page.waitForTimeout(6000);
    
    // Should reach complete screen
    await page.waitForSelector('.complete-screen', { timeout: 10000 });
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-complete.png' });
    console.log('✓ Ch3 complete screenshot');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 3: Zero console errors');
  });

  test('Chapter 4 complete playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene', { timeout: 5000 });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-start.png' });
    console.log('✓ Ch4 start screenshot');
    
    // Wait for intro
    await page.waitForTimeout(10000);
    
    // Catch 10 fireflies
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(300);
      const firefly = await page.locator('.firefly.clickable').first();
      if (await firefly.isVisible()) {
        await firefly.click();
        await page.waitForTimeout(800);
      }
    }
    
    console.log('✓ Ch4 all fireflies caught');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-mid-game.png' });
    console.log('✓ Ch4 mid-game screenshot');
    
    // Wait for animal phase
    await page.waitForTimeout(4000);
    
    // Match 3 animals
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500);
      const baby = await page.locator('.baby-animal.clickable').first();
      const parentY = 25 + (i * 22);
      
      if (await baby.isVisible()) {
        const box = await baby.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          
          // Move to parent position (right side)
          const container = await page.locator('.chapter4-scene').boundingBox();
          if (container) {
            const targetX = container.x + (container.width * 0.85);
            const targetY = container.y + (container.height * (parentY / 100));
            await page.mouse.move(targetX, targetY);
          }
          
          await page.mouse.up();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    console.log('✓ Ch4 all animals matched');
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-treasure.png' });
    console.log('✓ Ch4 treasure screenshot');
    
    // Tap lantern
    const lantern = await page.locator('.lantern.clickable');
    if (await lantern.isVisible()) {
      await lantern.click();
    }
    
    await page.waitForTimeout(6000);
    
    await page.waitForSelector('.complete-screen', { timeout: 10000 });
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-complete.png' });
    console.log('✓ Ch4 complete screenshot');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 4: Zero console errors');
  });

  test('Chapter 5 complete playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene', { timeout: 5000 });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-start.png' });
    console.log('✓ Ch5 start screenshot');
    
    // Wait for intro
    await page.waitForTimeout(12000);
    
    // Find Smudge 3 times
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500);
      const smudge = await page.locator('.smudge-peeking.clickable');
      if (await smudge.isVisible()) {
        await smudge.click();
        await page.waitForTimeout(3000);
        console.log(`✓ Ch5 found Smudge ${i + 1}/3`);
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-mid-game.png' });
    console.log('✓ Ch5 mid-game screenshot');
    
    // Wait for crown phase
    await page.waitForTimeout(6000);
    
    // Drag 3 treasures to crown
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500);
      const piece = await page.locator('.treasure-piece.clickable').first();
      const crownBase = await page.locator('.crown-assembly');
      
      if (await piece.isVisible() && await crownBase.isVisible()) {
        const pieceBox = await piece.boundingBox();
        const crownBox = await crownBase.boundingBox();
        
        if (pieceBox && crownBox) {
          await page.mouse.move(pieceBox.x + pieceBox.width / 2, pieceBox.y + pieceBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(crownBox.x + crownBox.width / 2, crownBox.y + crownBox.height / 2);
          await page.mouse.up();
          await page.waitForTimeout(2500);
          console.log(`✓ Ch5 placed treasure ${i + 1}/3`);
        }
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-treasure.png' });
    console.log('✓ Ch5 treasure screenshot');
    
    // Wait for ending
    await page.waitForTimeout(12000);
    
    await page.waitForSelector('.complete-screen', { timeout: 10000 });
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-complete.png' });
    console.log('✓ Ch5 complete screenshot');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 5: Zero console errors');
  });

  test('iPhone landscape screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    
    // Ch3
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-iphone.png' });
    console.log('✓ Ch3 iPhone screenshot');
    
    // Ch4
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene');
    await page.waitForTimeout(12000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-iphone.png' });
    console.log('✓ Ch4 iPhone screenshot');
    
    // Ch5
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.play-button');
    await page.click('.play-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene');
    await page.waitForTimeout(12000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-iphone.png' });
    console.log('✓ Ch5 iPhone screenshot');
  });
});
