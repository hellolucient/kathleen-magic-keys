# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chapter2-screenshots.spec.ts >> Chapter 2 Screenshots >> Capture butterfly preview and speech box positioning
- Location: tests/chapter2-screenshots.spec.ts:4:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.look-for-preview') to be visible

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - img "Garden"
  - generic [ref=e6]:
    - img "red butterfly"
  - generic [ref=e7]:
    - img "orange butterfly"
  - generic [ref=e8]:
    - img "yellow butterfly"
  - generic [ref=e9]:
    - img "green butterfly"
  - generic [ref=e10]:
    - img "blue butterfly"
  - generic [ref=e11]:
    - img "purple butterfly"
  - generic:
    - img "Pip the Fairy"
  - generic [ref=e12]: 0 / 6
  - button "🔊" [ref=e21] [cursor=pointer]
```

# Test source

```ts
  1  | import { test } from '@playwright/test';
  2  | 
  3  | test.describe('Chapter 2 Screenshots', () => {
  4  |   test('Capture butterfly preview and speech box positioning', async ({ page }) => {
  5  |     test.setTimeout(120000);
  6  |     
  7  |     await page.setViewportSize({ width: 1180, height: 820 });
  8  |     await page.goto('http://localhost:5173');
  9  |     await page.waitForTimeout(3000);
  10 |     
  11 |     // Skip to Chapter 2
  12 |     await page.click('.play-button', { force: true });
  13 |     await page.waitForTimeout(1500);
  14 |     await page.click('.chapter-card:has-text("Chapter 2")');
  15 |     await page.waitForTimeout(5000); // Wait for intro narration
  16 |     
  17 |     // Wait for butterfly preview to appear
> 18 |     await page.waitForSelector('.look-for-preview', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  19 |     await page.waitForTimeout(1000);
  20 |     
  21 |     // Screenshot: Butterfly preview with speech box
  22 |     await page.screenshot({ 
  23 |       path: 'docs/ch2-test-stills/butterfly-preview-with-speech.png', 
  24 |       fullPage: false 
  25 |     });
  26 |     
  27 |     // Wait for preview to disappear
  28 |     await page.waitForTimeout(8000);
  29 |     
  30 |     // Screenshot: Speech box clear of Pip (during early gameplay)
  31 |     await page.screenshot({ 
  32 |       path: 'docs/ch2-test-stills/speech-box-clear-of-pip.png', 
  33 |       fullPage: false 
  34 |     });
  35 |     
  36 |     console.log('Screenshots captured successfully');
  37 |   });
  38 | });
  39 | 
```