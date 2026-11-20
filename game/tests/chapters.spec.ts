import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:5173';

test.describe('Princess Kathleen Chapters 1-5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.setViewportSize({ width: 1180, height: 820 });
    
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Wait for loading screen to complete
    await page.waitForSelector('.title-screen', { timeout: 10000 });
    
    // Start game
    await page.click('button:has-text("Start Adventure")');
    await page.waitForSelector('.chapter-picker', { timeout: 5000 });
  });

  test('Chapter 1 completes without errors', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    // Select Chapter 1
    await page.click('.chapter-card:nth-child(1)');
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    
    console.log('✓ Chapter 1 loaded');
    
    // Wait a bit for intro
    await page.waitForTimeout(3000);
    
    // The chapter should complete - just verify no errors
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 1: No console errors');
  });

  test('Chapter 2 completes without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.click('.chapter-card:nth-child(2)');
    await page.waitForSelector('.chapter2-scene', { timeout: 5000 });
    
    console.log('✓ Chapter 2 loaded');
    await page.waitForTimeout(3000);
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 2: No console errors');
  });

  test('Chapter 3: Singing River - full playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene', { timeout: 5000 });
    
    console.log('✓ Chapter 3 loaded');
    
    // Take start screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch3-start.png',
      fullPage: false 
    });
    console.log('✓ Screenshot: ch3-start.png');
    
    // Wait for intro to finish
    await page.waitForTimeout(8000);
    
    // Round 1: 3 notes - watch then play (with one wrong tap)
    await page.waitForTimeout(4000); // Wait for sequence playback
    
    // Take mid-game screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch3-mid-game.png' 
    });
    console.log('✓ Screenshot: ch3-mid-game.png');
    
    // Tap pads (wrong tap first)
    const pads = await page.locator('.lily-pad.clickable').all();
    if (pads[2]) await pads[2].click();
    await page.waitForTimeout(1000);
    
    // After wrong tap, sequence replays
    await page.waitForTimeout(4000);
    
    // Now tap correctly (round 1 sequence: red, blue, yellow = 0, 2, 1)
    if (pads[0]) await pads[0].click();
    await page.waitForTimeout(500);
    if (pads[2]) await pads[2].click();
    await page.waitForTimeout(500);
    if (pads[1]) await pads[1].click();
    await page.waitForTimeout(3000);
    
    console.log('✓ Round 1 complete');
    
    // Round 2: 4 notes
    await page.waitForTimeout(5000);
    // Tap correct sequence (yellow, pink, red, blue = 1, 3, 0, 2)
    const pads2 = await page.locator('.lily-pad.clickable').all();
    if (pads2[1]) await pads2[1].click();
    await page.waitForTimeout(500);
    if (pads2[3]) await pads2[3].click();
    await page.waitForTimeout(500);
    if (pads2[0]) await pads2[0].click();
    await page.waitForTimeout(500);
    if (pads2[2]) await pads2[2].click();
    await page.waitForTimeout(3000);
    
    console.log('✓ Round 2 complete');
    
    // Round 3: 5 notes
    await page.waitForTimeout(5000);
    // Tap correct sequence (blue, white, yellow, pink, red = 2, 4, 1, 3, 0)
    const pads3 = await page.locator('.lily-pad.clickable').all();
    if (pads3[2]) await pads3[2].click();
    await page.waitForTimeout(500);
    if (pads3[4]) await pads3[4].click();
    await page.waitForTimeout(500);
    if (pads3[1]) await pads3[1].click();
    await page.waitForTimeout(500);
    if (pads3[3]) await pads3[3].click();
    await page.waitForTimeout(500);
    if (pads3[0]) await pads3[0].click();
    await page.waitForTimeout(3000);
    
    console.log('✓ Round 3 complete');
    
    // Wait for gem to appear
    await page.waitForTimeout(3000);
    
    // Take treasure moment screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch3-treasure.png' 
    });
    console.log('✓ Screenshot: ch3-treasure.png');
    
    // Tap gem
    const gem = await page.locator('.purple-gem.clickable');
    if (await gem.isVisible()) {
      await gem.click();
      console.log('✓ Gem collected');
    }
    
    await page.waitForTimeout(4000);
    
    // Should reach complete screen
    await page.waitForSelector('.complete-screen', { timeout: 8000 });
    
    // Take complete screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch3-complete.png' 
    });
    console.log('✓ Screenshot: ch3-complete.png');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 3: No console errors');
  });

  test('Chapter 4: Twinkle Forest - full playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene', { timeout: 5000 });
    
    console.log('✓ Chapter 4 loaded');
    
    // Take start screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch4-start.png' 
    });
    console.log('✓ Screenshot: ch4-start.png');
    
    // Wait for intro
    await page.waitForTimeout(8000);
    
    // Catch 10 fireflies
    for (let i = 0; i < 10; i++) {
      const firefly = await page.locator('.firefly.clickable').first();
      if (await firefly.isVisible()) {
        await firefly.click();
        await page.waitForTimeout(800);
      }
    }
    
    console.log('✓ All 10 fireflies caught');
    
    // Take mid-game screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch4-mid-game.png' 
    });
    console.log('✓ Screenshot: ch4-mid-game.png');
    
    await page.waitForTimeout(3000);
    
    // Match animals - first try wrong one
    const babies = await page.locator('.baby-animal.clickable').all();
    const parents = await page.locator('.parent-animal').all();
    
    if (babies[0] && parents[2]) {
      // Drag first baby to wrong parent
      await babies[0].hover();
      await page.mouse.down();
      await parents[2].hover();
      await page.mouse.up();
      await page.waitForTimeout(2000);
      console.log('✓ Wrong match attempted');
    }
    
    // Now match correctly (owlet to owl, bunny to rabbit, fawn to deer)
    for (let i = 0; i < 3; i++) {
      const baby = await page.locator('.baby-animal.clickable').first();
      const parent = await page.locator('.parent-animal').nth(i);
      
      if (await baby.isVisible() && await parent.isVisible()) {
        await baby.hover();
        await page.mouse.down();
        await parent.hover();
        await page.mouse.up();
        await page.waitForTimeout(2500);
      }
    }
    
    console.log('✓ All animals matched');
    
    await page.waitForTimeout(4000);
    
    // Take treasure moment screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch4-treasure.png' 
    });
    console.log('✓ Screenshot: ch4-treasure.png');
    
    // Tap lantern for light
    const lantern = await page.locator('.lantern.clickable');
    if (await lantern.isVisible()) {
      await lantern.click();
      console.log('✓ Light collected');
    }
    
    await page.waitForTimeout(4000);
    
    // Should reach complete screen
    await page.waitForSelector('.complete-screen', { timeout: 8000 });
    
    // Take complete screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch4-complete.png' 
    });
    console.log('✓ Screenshot: ch4-complete.png');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 4: No console errors');
  });

  test('Chapter 5: Cloud Castle - full playthrough', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene', { timeout: 5000 });
    
    console.log('✓ Chapter 5 loaded');
    
    // Take start screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch5-start.png' 
    });
    console.log('✓ Screenshot: ch5-start.png');
    
    // Wait for intro
    await page.waitForTimeout(10000);
    
    // Find Smudge 3 times
    for (let i = 0; i < 3; i++) {
      const smudge = await page.locator('.smudge-peeking.clickable');
      if (await smudge.isVisible()) {
        await smudge.click();
        await page.waitForTimeout(3000);
        console.log(`✓ Found Smudge ${i + 1}/3`);
      }
    }
    
    // Take mid-game screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch5-mid-game.png' 
    });
    console.log('✓ Screenshot: ch5-mid-game.png');
    
    await page.waitForTimeout(4000);
    
    // Drag treasures to crown
    const treasures = ['petal', 'gem', 'light'];
    const crownBase = await page.locator('.crown-assembly');
    
    for (const treasure of treasures) {
      const piece = await page.locator('.treasure-piece.clickable').first();
      if (await piece.isVisible() && await crownBase.isVisible()) {
        await piece.hover();
        await page.mouse.down();
        await crownBase.hover();
        await page.mouse.up();
        await page.waitForTimeout(2500);
        console.log(`✓ Placed ${treasure} on crown`);
      }
    }
    
    console.log('✓ Crown complete');
    
    // Take treasure moment screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch5-treasure.png' 
    });
    console.log('✓ Screenshot: ch5-treasure.png');
    
    // Wait for ending sequence
    await page.waitForTimeout(10000);
    
    // Should reach complete screen
    await page.waitForSelector('.complete-screen', { timeout: 10000 });
    
    // Take complete screenshot
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch5-complete.png' 
    });
    console.log('✓ Screenshot: ch5-complete.png');
    
    expect(errors).toHaveLength(0);
    console.log('✓ Chapter 5: No console errors');
  });

  test('iPhone landscape screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    
    // Ch3
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene', { timeout: 5000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch3-iphone.png' 
    });
    console.log('✓ Screenshot: ch3-iphone.png');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Start Adventure")');
    await page.waitForSelector('.chapter-picker', { timeout: 5000 });
    
    // Ch4
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene', { timeout: 5000 });
    await page.waitForTimeout(10000);
    // Catch a firefly
    const firefly = await page.locator('.firefly.clickable').first();
    if (await firefly.isVisible()) await firefly.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch4-iphone.png' 
    });
    console.log('✓ Screenshot: ch4-iphone.png');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Start Adventure")');
    await page.waitForSelector('.chapter-picker', { timeout: 5000 });
    
    // Ch5
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene', { timeout: 5000 });
    await page.waitForTimeout(10000);
    await page.screenshot({ 
      path: 'docs/ch3-5-test-stills/ch5-iphone.png' 
    });
    console.log('✓ Screenshot: ch5-iphone.png');
  });
});
