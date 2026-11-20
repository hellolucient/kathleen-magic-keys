import { test } from '@playwright/test';

test('debug', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug.png' });
  
  const html = await page.content();
  console.log('Page classes:', await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[class]')).map(el => el.className).slice(0, 10);
  }));
});
