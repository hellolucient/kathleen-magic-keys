import { test } from '@playwright/test';

test.describe('Chapter 2 Screenshots', () => {
  test('Capture butterfly preview and speech box positioning', async ({ page }) => {
    test.setTimeout(120000);
    
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Skip to Chapter 2
    await page.click('.play-button', { force: true });
    await page.waitForTimeout(1500);
    await page.click('.chapter-card:has-text("Chapter 2")');
    await page.waitForTimeout(5000); // Wait for intro narration
    
    // Wait for butterfly preview to appear
    await page.waitForSelector('.look-for-preview', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Screenshot: Butterfly preview with speech box
    await page.screenshot({ 
      path: 'docs/ch2-test-stills/butterfly-preview-with-speech.png', 
      fullPage: false 
    });
    
    // Wait for preview to disappear
    await page.waitForTimeout(8000);
    
    // Screenshot: Speech box clear of Pip (during early gameplay)
    await page.screenshot({ 
      path: 'docs/ch2-test-stills/speech-box-clear-of-pip.png', 
      fullPage: false 
    });
    
    console.log('Screenshots captured successfully');
  });
});
