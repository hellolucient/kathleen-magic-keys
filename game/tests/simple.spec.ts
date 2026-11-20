import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Chapters 3-5 Quick Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.evaluate(() => localStorage.clear());
    await page.waitForSelector('.title-screen', { timeout: 10000 });
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker', { timeout: 5000 });
  });

  test('All chapters load and screenshots', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Test Chapter 3
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene', { timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-start.png' });
    console.log('✓ Ch3 loaded and screenshot taken');
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');

    // Test Chapter 4
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene', { timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-start.png' });
    console.log('✓ Ch4 loaded and screenshot taken');
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');

    // Test Chapter 5
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene', { timeout: 5000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-start.png' });
    console.log('✓ Ch5 loaded and screenshot taken');

    // iPhone screenshots
    await page.setViewportSize({ width: 844, height: 390 });
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(3)');
    await page.waitForSelector('.chapter3-scene');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-iphone.png' });
    console.log('✓ Ch3 iPhone screenshot taken');
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(4)');
    await page.waitForSelector('.chapter4-scene');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-iphone.png' });
    console.log('✓ Ch4 iPhone screenshot taken');
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');
    await page.click('.chapter-card:nth-child(5)');
    await page.waitForSelector('.chapter5-scene');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-iphone.png' });
    console.log('✓ Ch5 iPhone screenshot taken');

    expect(errors).toHaveLength(0);
    console.log('✓ No console errors across all chapters');
  });

  test('Chapters 1 and 2 still work', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Chapter 1
    await page.click('.chapter-card:nth-child(1)');
    await page.waitForSelector('.game-scene', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('✓ Chapter 1 loads');
    
    await page.goto(BASE_URL);
    await page.click('.title-button');
    await page.waitForSelector('.chapter-picker');

    // Chapter 2
    await page.click('.chapter-card:nth-child(2)');
    await page.waitForSelector('.chapter2-scene', { timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('✓ Chapter 2 loads');

    expect(errors).toHaveLength(0);
    console.log('✓ Chapters 1 & 2: No console errors');
  });
});
