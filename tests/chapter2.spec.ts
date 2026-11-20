import { test, expect } from '@playwright/test';

test.describe('Chapter 2: Rainbow Garden', () => {
  test('Complete gameplay from Chapter 1 through Chapter 2', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout
    
    // Set iPad landscape viewport
    await page.setViewportSize({ width: 1180, height: 820 });
    
    // Navigate to the game
    await page.goto('http://localhost:5173');
    
    // Wait for loading screen to complete
    await page.waitForTimeout(3000);
    
    // Click Play button on title screen (force through animations)
    await page.click('.play-button', { force: true });
    await page.waitForTimeout(1500);
    
    // Select Chapter 1 from chapter picker
    await page.click('.chapter-card:has-text("Chapter 1")');
    await page.waitForTimeout(2000);
    
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // === CHAPTER 1 GAMEPLAY ===
    // Click teddy twice to reveal key (auto-collects)
    await page.click('.sprite.teddy', { timeout: 5000, force: true });
    await page.waitForTimeout(800);
    await page.click('.sprite.teddy', { force: true });
    await page.waitForTimeout(2000);
    
    // Open jewellery box (key auto-collects)
    await page.click('.sprite.jewellery-box', { force: true });
    await page.waitForTimeout(2000);
    
    // Open curtain (key auto-collects)
    await page.click('.sprite.curtain-closed', { force: true });
    await page.waitForTimeout(2000);
    
    // Open wardrobe and get key from dress (auto-collects)
    await page.click('.sprite.wardrobe-hitbox', { force: true });
    await page.waitForTimeout(1500);
    await page.click('.dress-pocket-hitbox', { force: true });
    await page.waitForTimeout(2000);
    
    // Activate mirror and complete star sequence
    await page.click('.sprite.mirror-hitbox', { force: true });
    await page.waitForTimeout(3000);
    
    // Click stars in sequence (1, 2, 3)
    await page.locator('.sprite.star').nth(0).click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('.sprite.star').nth(1).click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('.sprite.star').nth(2).click({ force: true });
    await page.waitForTimeout(1500);
    
    // Click the mirror key that appears
    await page.click('.key-mirror', { force: true, timeout: 5000 }).catch(() => {
      console.log('Mirror key not found or already collected');
    });
    await page.waitForTimeout(3000);
    
    // Wait for all 5 keys to be collected (with longer timeout)
    await page.waitForSelector('.key-count:has-text("5 / 5")', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Click door to unlock and complete Chapter 1
    await page.click('.sprite.door-hitbox', { force: true });
    await page.waitForTimeout(20000); // Wait for unlock sequence and completion narration
    
    // Wait for complete screen
    await expect(page.locator('.complete-title')).toContainText('Chapter 1 Complete', { timeout: 10000 });
    
    // Click Next Chapter button
    await page.click('button:has-text("Next Chapter")');
    await page.waitForTimeout(3000);
    
    // === CHAPTER 2 GAMEPLAY ===
    await expect(page.locator('.chapter2-scene')).toBeVisible({ timeout: 5000 });
    
    // Take screenshot: Grey garden start
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch2-test-stills/01-grey-garden-start.png', fullPage: false });
    
    // Get all butterfly elements
    const butterflies = [
      { color: 'red', selector: '.sprite.butterfly:has(img[src*="butterfly-red"])' },
      { color: 'orange', selector: '.sprite.butterfly:has(img[src*="butterfly-orange"])' },
      { color: 'yellow', selector: '.sprite.butterfly:has(img[src*="butterfly-yellow"])' },
      { color: 'green', selector: '.sprite.butterfly:has(img[src*="butterfly-green"])' },
      { color: 'blue', selector: '.sprite.butterfly:has(img[src*="butterfly-blue"])' },
      { color: 'purple', selector: '.sprite.butterfly:has(img[src*="butterfly-purple"])' },
    ];
    
    // Match first three butterflies correctly
    for (let i = 0; i < 3; i++) {
      const butterfly = await page.locator(butterflies[i].selector).first();
      const box = await butterfly.boundingBox();
      
      if (box) {
        // Drag butterfly to its matching flower
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(200);
        
        // Calculate flower center position (approximate from layout)
        const flowerPositions: Record<string, { x: number, y: number }> = {
          red: { x: 1180 * 0.14, y: 820 * 0.75 },
          orange: { x: 1180 * 0.33, y: 820 * 0.64 },
          yellow: { x: 1180 * 0.49, y: 820 * 0.78 },
          green: { x: 1180 * 0.58, y: 820 * 0.53 },
          blue: { x: 1180 * 0.72, y: 820 * 0.67 },
          purple: { x: 1180 * 0.88, y: 820 * 0.76 },
        };
        
        const target = flowerPositions[butterflies[i].color];
        await page.mouse.move(target.x, target.y, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(2000);
      }
    }
    
    // Take screenshot: Mid-game with three flowers colored
    await page.screenshot({ path: 'docs/ch2-test-stills/02-mid-game-three-flowers.png', fullPage: false });
    
    // Try one wrong drop (blue butterfly to wrong flower)
    const blueButterfly = await page.locator(butterflies[4].selector).first();
    const blueBox = await blueButterfly.boundingBox();
    
    if (blueBox) {
      await page.mouse.move(blueBox.x + blueBox.width / 2, blueBox.y + blueBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      
      // Drop it on the red flower position (wrong)
      const wrongTarget = { x: 1180 * 0.14, y: 820 * 0.75 };
      await page.mouse.move(wrongTarget.x, wrongTarget.y, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(1500);
    }
    
    // Take screenshot: Wrong drop moment
    await page.screenshot({ path: 'docs/ch2-test-stills/03-wrong-drop-moment.png', fullPage: false });
    
    // Match remaining butterflies correctly
    for (let i = 3; i < 6; i++) {
      const butterfly = await page.locator(butterflies[i].selector).first();
      const box = await butterfly.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(200);
        
        const flowerPositions: Record<string, { x: number, y: number }> = {
          red: { x: 1180 * 0.14, y: 820 * 0.75 },
          orange: { x: 1180 * 0.33, y: 820 * 0.64 },
          yellow: { x: 1180 * 0.49, y: 820 * 0.78 },
          green: { x: 1180 * 0.58, y: 820 * 0.53 },
          blue: { x: 1180 * 0.72, y: 820 * 0.67 },
          purple: { x: 1180 * 0.88, y: 820 * 0.76 },
        };
        
        const target = flowerPositions[butterflies[i].color];
        await page.mouse.move(target.x, target.y, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for completion sequence
    await page.waitForTimeout(5000);
    
    // Take screenshot: Full color garden
    await page.screenshot({ path: 'docs/ch2-test-stills/04-full-color-garden.png', fullPage: false });
    
    await page.waitForTimeout(8000); // Wait for completion narration
    
    // Wait for complete screen
    await expect(page.locator('.complete-title')).toContainText('Chapter 2 Complete', { timeout: 15000 });
    
    // Take screenshot: Complete screen
    await page.screenshot({ path: 'docs/ch2-test-stills/05-chapter2-complete-screen.png', fullPage: false });
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
