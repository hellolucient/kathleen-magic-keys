import { test } from '@playwright/test';

test('Take screenshots of chapters 3-5', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.evaluate(() => localStorage.clear());
  
  // Wait for title screen
  await page.waitForSelector('.play-button', { timeout: 10000 });
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker', { timeout: 5000 });
  
  // Chapter 3
  await page.click('.chapter-card:nth-child(3)');
  await page.waitForSelector('.chapter3-scene', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-start.png' });
  console.log('✓ Ch3 start');
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-mid-game.png' });
  console.log('✓ Ch3 mid-game');
  
  // Back to picker
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  
  // Chapter 4
  await page.click('.chapter-card:nth-child(4)');
  await page.waitForSelector('.chapter4-scene', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-start.png' });
  console.log('✓ Ch4 start');
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-mid-game.png' });
  console.log('✓ Ch4 mid-game');
  
  // Back to picker
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  
  // Chapter 5
  await page.click('.chapter-card:nth-child(5)');
  await page.waitForSelector('.chapter5-scene', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-start.png' });
  console.log('✓ Ch5 start');
  
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-mid-game.png' });
  console.log('✓ Ch5 mid-game');
  
  // iPhone screenshots
  await page.setViewportSize({ width: 844, height: 390 });
  
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(3)');
  await page.waitForSelector('.chapter3-scene');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-iphone.png' });
  console.log('✓ Ch3 iPhone');
  
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(4)');
  await page.waitForSelector('.chapter4-scene');
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-iphone.png' });
  console.log('✓ Ch4 iPhone');
  
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(5)');
  await page.waitForSelector('.chapter5-scene');
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-iphone.png' });
  console.log('✓ Ch5 iPhone');
  
  // Check Ch1 and Ch2 load
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  
  await page.click('.chapter-card:nth-child(1)');
  await page.waitForSelector('.game-scene', { timeout: 5000 });
  console.log('✓ Chapter 1 loads');
  
  await page.goto('http://localhost:5173');
  await page.click('.play-button');
  await page.waitForSelector('.chapter-picker');
  
  await page.click('.chapter-card:nth-child(2)');
  await page.waitForSelector('.chapter2-scene', { timeout: 5000 });
  console.log('✓ Chapter 2 loads');
  
  console.log('\n✓ All screenshots captured and chapters verified!');
});
