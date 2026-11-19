import { chromium } from 'playwright';

async function testGame() {
  console.log('Checking console logs...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
  });
  
  const page = await context.newPage();
  
  // Collect console logs
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });
  
  // Collect errors
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error}`);
  });
  
  try {
    await page.goto('http://localhost:5173/kathleen-magic-keys/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.click('.play-button', { force: true, timeout: 5000 });
    await page.waitForTimeout(8000);
    
    // Check DOM structure
    const gameSceneHTML = await page.locator('.game-scene').innerHTML();
    console.log('\nGame Scene HTML length:', gameSceneHTML.length);
    
    const containerExists = await page.locator('.game-container').count();
    console.log('Game containers:', containerExists);
    
    const bgExists = await page.locator('.game-bg').count();
    console.log('Background images:', bgExists);
    
    const allImages = await page.locator('img').count();
    console.log('Total images:', allImages);
    
    // Check if layout loaded
    const layoutData = await page.evaluate(() => {
      return window.__LAYOUT_DEBUG__;
    });
    console.log('Layout data:', layoutData);
    
    await page.screenshot({ path: '/tmp/console-test.png', fullPage: true });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testGame().catch(console.error);
