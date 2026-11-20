import playwright from '@playwright/test';

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.setViewportSize({ width: 1180, height: 820 });
  
  // Chapter 3
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker', { timeout: 10000 });
  await page.click('.chapter-card:nth-child(3)', { force: true });
  await page.waitForSelector('.chapter3-scene', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-start.png' });
  console.log('✓ Ch3 start');
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-mid-game.png' });
  console.log('✓ Ch3 mid-game');
  
  // Chapter 4
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(4)', { force: true });
  await page.waitForSelector('.chapter4-scene', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-start.png' });
  console.log('✓ Ch4 start');
  
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-mid-game.png' });
  console.log('✓ Ch4 mid-game');
  
  // Chapter 5
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(5)', { force: true });
  await page.waitForSelector('.chapter5-scene', { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-start.png' });
  console.log('✓ Ch5 start');
  
  await page.waitForTimeout(14000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-mid-game.png' });
  console.log('✓ Ch5 mid-game');
  
  // iPhone screenshots
  await page.setViewportSize({ width: 844, height: 390 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(3)', { force: true });
  await page.waitForSelector('.chapter3-scene');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch3-iphone.png' });
  console.log('✓ Ch3 iPhone');
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(4)', { force: true });
  await page.waitForSelector('.chapter4-scene');
  await page.waitForTimeout(13000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch4-iphone.png' });
  console.log('✓ Ch4 iPhone');
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(5)', { force: true });
  await page.waitForSelector('.chapter5-scene');
  await page.waitForTimeout(14000);
  await page.screenshot({ path: 'docs/ch3-5-test-stills/ch5-iphone.png' });
  console.log('✓ Ch5 iPhone');
  
  // Check Ch1 and Ch2
  await page.setViewportSize({ width: 1180, height: 820 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(1)', { force: true });
  await page.waitForSelector('.game-scene', { timeout: 10000 });
  console.log('✓ Chapter 1 loads');
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.click('.play-button', { force: true });
  await page.waitForSelector('.chapter-picker');
  await page.click('.chapter-card:nth-child(2)', { force: true });
  await page.waitForSelector('.chapter2-scene', { timeout: 10000 });
  console.log('✓ Chapter 2 loads');
  
  await browser.close();
  
  console.log(`\n✓ All screenshots captured!`);
  console.log(`✓ Console errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
})().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
