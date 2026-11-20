import { test, expect } from '@playwright/test';

test.describe('Full Chapter 1 + 2 Playthrough', () => {
  test('Complete Chapter 1 and 2 with zero console errors', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    await page.setViewportSize({ width: 1180, height: 820 });
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore audio loading errors (expected in headless mode)
        if (!text.includes('Failed to play speech') && !text.includes('audio')) {
          consoleErrors.push(text);
        }
      }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // === START ===
    await page.click('.play-button', { force: true });
    await page.waitForTimeout(2000);
    
    // Select Chapter 1
    await page.click('.chapter-card:has-text("Chapter 1")');
    await page.waitForTimeout(4000);
    
    // === CHAPTER 1 GAMEPLAY ===
    // Teddy
    await page.click('.sprite.teddy', { force: true });
    await page.waitForTimeout(800);
    await page.click('.sprite.teddy', { force: true });
    await page.waitForTimeout(2500);
    
    // Jewellery box
    await page.click('.sprite.jewellery-box', { force: true });
    await page.waitForTimeout(2500);
    
    // Curtain
    await page.click('.sprite.curtain-closed', { force: true });
    await page.waitForTimeout(2500);
    
    // Wardrobe
    await page.click('.sprite.wardrobe-hitbox', { force: true });
    await page.waitForTimeout(1500);
    await page.click('.dress-pocket-hitbox', { force: true });
    await page.waitForTimeout(2500);
    
    // Mirror and stars
    await page.click('.sprite.mirror-hitbox', { force: true });
    await page.waitForTimeout(3500);
    
    await page.locator('.sprite.star').nth(0).click({ force: true });
    await page.waitForTimeout(1200);
    await page.locator('.sprite.star').nth(1).click({ force: true });
    await page.waitForTimeout(1200);
    await page.locator('.sprite.star').nth(2).click({ force: true });
    await page.waitForTimeout(2000);
    
    // Click the mirror key that appears
    try {
      await page.click('.key-mirror', { force: true, timeout: 3000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Mirror key not found, continuing...');
    }
    
    // Wait for all 5 keys
    await page.waitForSelector('.key-count:has-text("5 / 5")', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Screenshot: Door glow with Pip at the door
    await page.screenshot({ path: '../docs/ch2-test-stills/ch1-door-glow-pip-at-door.png' });
    
    // Click door to unlock
    await page.click('.sprite.door-hitbox', { force: true });
    await page.waitForTimeout(22000); // Wait for full unlock sequence
    
    // Wait for complete screen
    await expect(page.locator('.complete-title')).toContainText('Chapter 1 Complete', { timeout: 12000 });
    
    // Screenshot: Chapter 1 complete with Next button
    await page.screenshot({ path: '../docs/ch2-test-stills/ch1-complete-with-next-button.png' });
    
    // === CHAPTER 2 ===
    await page.click('button:has-text("Next Chapter")');
    await page.waitForTimeout(4000);
    
    await expect(page.locator('.chapter2-scene')).toBeVisible({ timeout: 5000 });
    
    // Screenshot: Grey garden start
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '../docs/ch2-test-stills/01-grey-garden-start.png' });
    
    // Wait for butterfly preview
    await page.waitForTimeout(6000);
    const hasPreview = await page.locator('.look-for-preview').count();
    if (hasPreview > 0) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: '../docs/ch2-test-stills/02-butterfly-preview-showing.png' });
    }
    
    await page.waitForTimeout(4000);
    
    // Butterfly positions (approximate flower centers)
    const flowerCenters: Record<string, { x: number, y: number }> = {
      red: { x: 1180 * 0.14, y: 820 * 0.75 },
      orange: { x: 1180 * 0.33, y: 820 * 0.64 },
      yellow: { x: 1180 * 0.49, y: 820 * 0.78 },
      green: { x: 1180 * 0.58, y: 820 * 0.53 },
      blue: { x: 1180 * 0.72, y: 820 * 0.67 },
      purple: { x: 1180 * 0.88, y: 820 * 0.76 },
    };
    
    const butterflies = ['red', 'orange', 'yellow'];
    
    // Match first three butterflies
    for (const color of butterflies) {
      const butterfly = await page.locator(`.sprite.butterfly:has(img[src*="butterfly-${color}"])`).first();
      const box = await butterfly.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(200);
        
        const target = flowerCenters[color];
        await page.mouse.move(target.x, target.y, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(2500);
      }
    }
    
    // Screenshot: Mid-game
    await page.screenshot({ path: '../docs/ch2-test-stills/03-mid-game-three-flowers.png' });
    
    // Try wrong drop (blue to red)
    const blueButterfly = await page.locator('.sprite.butterfly:has(img[src*="butterfly-blue"])').first();
    const blueBox = await blueButterfly.boundingBox();
    
    if (blueBox) {
      await page.mouse.move(blueBox.x + blueBox.width / 2, blueBox.y + blueBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      
      const wrongTarget = flowerCenters.red;
      await page.mouse.move(wrongTarget.x, wrongTarget.y, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      // Screenshot: Wrong drop
      await page.screenshot({ path: '../docs/ch2-test-stills/04-wrong-drop-moment.png' });
      await page.waitForTimeout(1500);
    }
    
    // Match remaining butterflies
    const remainingButterflies = ['green', 'blue', 'purple'];
    for (const color of remainingButterflies) {
      const butterfly = await page.locator(`.sprite.butterfly:has(img[src*="butterfly-${color}"])`).first();
      const box = await butterfly.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(200);
        
        const target = flowerCenters[color];
        await page.mouse.move(target.x, target.y, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(2500);
      }
    }
    
    // Wait for completion sequence
    await page.waitForTimeout(5000);
    
    // Screenshot: Full color garden
    await page.screenshot({ path: '../docs/ch2-test-stills/05-full-color-garden.png' });
    
    await page.waitForTimeout(10000); // Wait for narration
    
    // Wait for complete screen
    await expect(page.locator('.complete-title')).toContainText('Chapter 2 Complete', { timeout: 15000 });
    
    // Screenshot: Chapter 2 complete
    await page.screenshot({ path: '../docs/ch2-test-stills/06-ch2-complete-screen.png' });
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
