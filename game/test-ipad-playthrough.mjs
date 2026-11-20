/**
 * iPad landscape (1180x820, hasTouch) end-to-end playthrough of all 5 chapters.
 * Real mouse/pointer drags. Stills → docs/ipad-fix-stills/
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STILLS = join(__dirname, '..', 'docs', 'ipad-fix-stills');
const BASE = 'http://127.0.0.1:4173/kathleen-magic-keys/';

const errors = [];
const stills = [];

async function shot(page, name) {
  const path = join(STILLS, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  stills.push(path);
  console.log(`  📷 ${name}`);
}

const wait = (page, ms) => page.waitForTimeout(ms);

async function pointerDragBoxes(page, fromBox, toBox) {
  const ax = fromBox.x + fromBox.width / 2;
  const ay = fromBox.y + fromBox.height / 2;
  const bx = toBox.x + toBox.width / 2;
  const by = toBox.y + toBox.height / 2;
  await page.mouse.move(ax, ay);
  await page.mouse.down();
  for (let i = 1; i <= 16; i++) {
    await page.mouse.move(ax + ((bx - ax) * i) / 16, ay + ((by - ay) * i) / 16);
    await wait(page, 12);
  }
  await page.mouse.up();
  await wait(page, 200);
}

async function clickSel(page, sel, timeout = 8000) {
  const el = page.locator(sel).first();
  await el.waitFor({ state: 'visible', timeout });
  await el.click({ force: true });
}

async function main() {
  mkdirSync(STILLS, { recursive: true });
  console.log('iPad playthrough →', STILLS);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/favicon|AbortError|Download the React DevTools/i.test(t)) return;
    errors.push(t);
    console.log('❌', t);
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.log('❌ page', err.message);
  });

  await page.addInitScript(() => {
    window.__KMK_FAST_AUDIO = true;
  });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.title-screen', { timeout: 30000 });
  await shot(page, '01-title');

  await clickSel(page, '.play-button');
  await page.waitForSelector('.chapter-picker', { timeout: 10000 });
  await shot(page, '02-chapter-picker');

  // ========== CH1 ==========
  await clickSel(page, '.chapter-card >> nth=0');
  await page.waitForSelector('.game-scene', { timeout: 15000 });
  await wait(page, 600); // intro lines are fast with __KMK_FAST_AUDIO
  await shot(page, '03-ch1-start');

  // Wait for intro to finish (fast audio ~few hundred ms per line)
  await wait(page, 2000);

  // Teddy twice
  await clickSel(page, 'img[src="art/sprites/teddy.png"]');
  await wait(page, 500);
  await clickSel(page, 'img[src="art/sprites/teddy.png"]');
  await wait(page, 700);

  await clickSel(page, 'img[src*="jewellery-box"]');
  await wait(page, 700);
  try { await page.locator('.key-jewellery').click({ force: true, timeout: 3000 }); } catch {}

  await clickSel(page, 'img[src*="curtain-closed"]');
  await wait(page, 700);
  try { await page.locator('.key-curtain').click({ force: true, timeout: 3000 }); } catch {}

  // Wardrobe
  const wh = page.locator('.wardrobe-hitbox');
  if (await wh.count()) {
    const b = await wh.boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await wait(page, 500);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.62);
    await wait(page, 700);
    try { await page.locator('.key-wardrobe').click({ force: true, timeout: 3000 }); } catch {}
  }

  // Click any floating keys that appear after puzzles
  async function clickFloatingKeys() {
    const keys = page.locator('.sprite.key.clickable');
    const n = await keys.count();
    for (let i = 0; i < n; i++) {
      try { await keys.nth(i).click({ force: true, timeout: 1000 }); await wait(page, 400); } catch {}
    }
  }
  await clickFloatingKeys();

  // Mirror + stars 1,2,3 then tap the mirror key
  await clickSel(page, '.mirror-hitbox');
  await wait(page, 1600); // wait for demo tones
  const stars = page.locator('.star.clickable');
  for (let i = 0; i < 3; i++) {
    await stars.nth(i).click({ force: true });
    await wait(page, 450);
  }
  await wait(page, 600);
  try {
    await page.locator('.key-mirror').click({ force: true, timeout: 5000 });
  } catch {
    await clickFloatingKeys();
  }
  await wait(page, 1000);

  // Wait until 5/5
  for (let i = 0; i < 20; i++) {
    const txt = await page.locator('.key-count').textContent().catch(() => '');
    if (txt && txt.includes('5')) break;
    await clickFloatingKeys();
    await wait(page, 300);
  }
  await shot(page, '04-ch1-keys-done');

  // Door
  await clickSel(page, '.door-hitbox');
  await wait(page, 3000);
  await shot(page, '05-ch1-door-open');

  // Follow Pip at the door
  for (let i = 0; i < 40; i++) {
    const follow = page.locator('.follow-me');
    if (await follow.count()) {
      await follow.first().click({ force: true });
      break;
    }
    // Pip may be clickable near door
    const fairy = page.locator('.sprite.fairy.clickable, .fairy.follow-me');
    if (await fairy.count()) {
      await fairy.first().click({ force: true });
      break;
    }
    await wait(page, 250);
  }

  // Transition Ch1→Ch2: capture any half-drawn overlay frames
  for (let t = 0; t < 4; t++) {
    await wait(page, 120);
    await shot(page, `05b-trans-1to2-f${t}`);
    if (await page.locator('.chapter2-scene').count()) break;
  }

  // ========== CH2 ==========
  await page.waitForSelector('.chapter2-scene', { timeout: 30000 });
  await wait(page, 400);
  await shot(page, '06-ch2-opening-colour');
  await wait(page, 1500);
  await shot(page, '07-ch2-after-sneeze');

  // Wait for intro to settle
  await wait(page, 2000);

  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  for (const color of colors) {
    const bf = page.locator(`.butterfly img[src*="butterfly-${color}"]`).first();
    try {
      await bf.waitFor({ state: 'visible', timeout: 6000 });
      const from = await bf.boundingBox();
      const flower = page.locator(`.flower-hint-${color}`).first();
      let to = await flower.boundingBox().catch(() => null);
      if (!to) {
        const img = page.locator(`img[src*="flower-${color}-colour"]`).first();
        to = await img.boundingBox();
      }
      if (from && to) {
        await pointerDragBoxes(page, from, to);
        await wait(page, 600);
      }
    } catch (e) {
      console.log(`  ch2 ${color}: ${e.message}`);
    }
  }
  await shot(page, '08-ch2-all-matched');

  // Completion frames
  for (let f = 0; f < 8; f++) {
    await wait(page, 400);
    await shot(page, `09-ch2-complete-f${f}`);
  }

  // Petal + path
  try {
    await page.locator('.sprite.rainbow-petal, .rainbow-petal').first().click({ force: true, timeout: 10000 });
  } catch {}
  await wait(page, 1200);
  await shot(page, '10-ch2-footprints');
  try {
    await page.locator('.path-continue-hit').click({ force: true, timeout: 10000 });
  } catch {
    await page.mouse.click(820, 520);
  }

  // Transition Ch2→Ch3
  for (let t = 0; t < 4; t++) {
    await wait(page, 120);
    await shot(page, `10b-trans-2to3-f${t}`);
    if (await page.locator('.chapter3-scene').count()) break;
  }

  // ========== CH3 ==========
  await page.waitForSelector('.chapter3-scene', { timeout: 30000 });
  await wait(page, 800);
  await shot(page, '11-ch3-start');
  await wait(page, 2500); // intro + first sequence

  const SEQS = [[0, 2], [1, 3, 0], [2, 4, 1]];
  for (let r = 0; r < 3; r++) {
    // Wait until waiting phase (pads clickable)
    for (let w = 0; w < 60; w++) {
      if (await page.locator('.lily-pad.clickable').count()) break;
      await wait(page, 200);
    }
    await wait(page, 300);
    for (const idx of SEQS[r]) {
      // Ensure still waiting
      for (let w = 0; w < 20; w++) {
        if (await page.locator(`.lily-pad-${idx}.clickable`).count()) break;
        await wait(page, 150);
      }
      await page.locator(`.lily-pad-${idx}`).click({ force: true });
      await wait(page, 500);
    }
    // Wait for praise + next round sequence to play
    await wait(page, 2000);
    await shot(page, `12-ch3-after-round-${r + 1}`);
  }

  for (let i = 0; i < 40; i++) {
    if (await page.locator('.purple-gem').count()) break;
    await wait(page, 250);
  }
  await shot(page, '13-ch3-gem');
  try { await page.locator('.purple-gem').click({ force: true, timeout: 10000 }); } catch {}
  await wait(page, 1500);
  for (let i = 0; i < 30; i++) {
    if (await page.locator('.ch3-path-continue').count()) {
      await page.locator('.ch3-path-continue').click({ force: true });
      break;
    }
    await wait(page, 300);
  }

  // Transition Ch3→Ch4
  for (let t = 0; t < 4; t++) {
    await wait(page, 120);
    await shot(page, `13b-trans-3to4-f${t}`);
    if (await page.locator('.chapter4-scene').count()) break;
  }

  // ========== CH4 ==========
  await page.waitForSelector('.chapter4-scene', { timeout: 30000 });
  await wait(page, 800);
  await shot(page, '14-ch4-start');
  await wait(page, 2000);

  for (let n = 0; n < 14; n++) {
    const ff = page.locator('.firefly.clickable').first();
    if (!(await ff.count())) break;
    try {
      await ff.click({ force: true, timeout: 2000 });
      await wait(page, 250);
    } catch { break; }
  }
  await shot(page, '15-ch4-lantern-full');
  await wait(page, 1500);
  await shot(page, '16-ch4-animals');

  for (const baby of ['owlet', 'bunny', 'fawn']) {
    const parent = { owlet: 'owl', bunny: 'rabbit', fawn: 'deer' }[baby];
    try {
      const bEl = page.locator(`.baby-animal:not(.matched) img[src*="${baby}"]`).first();
      await bEl.waitFor({ state: 'visible', timeout: 8000 });
      const from = await bEl.boundingBox();
      const to = await page.locator(`.parent-${parent}`).first().boundingBox();
      if (from && to) await pointerDragBoxes(page, from, to);
      await wait(page, 700);
    } catch (e) {
      console.log(`  ch4 ${baby}: ${e.message}`);
    }
  }
  await shot(page, '17-ch4-matched');

  // Wait through narr-cry then lantern prompt
  for (let i = 0; i < 60; i++) {
    if (await page.locator('.lantern.clickable').count()) break;
    await wait(page, 250);
  }
  await shot(page, '18-ch4-mountain');
  const lantern = page.locator('.lantern');
  const lb = await lantern.boundingBox();
  if (lb) {
    await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2);
    await wait(page, 200);
    await lantern.dispatchEvent('pointerdown');
    await lantern.dispatchEvent('click');
  }
  await wait(page, 2000);
  for (let i = 0; i < 50; i++) {
    if (await page.locator('.ch4-path-continue').count()) {
      try {
        await page.locator('.ch4-path-continue').click({ force: true, timeout: 3000 });
      } catch {}
      break;
    }
    if (lb) {
      try { await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2); } catch {}
    }
    await wait(page, 400);
  }
  await shot(page, '18b-ch4-after-lantern').catch(() => {});

  // Transition Ch4→Ch5
  for (let t = 0; t < 4; t++) {
    await wait(page, 120);
    await shot(page, `18c-trans-4to5-f${t}`);
    if (await page.locator('.chapter5-scene').count()) break;
  }

  // ========== CH5 ==========
  await page.waitForSelector('.chapter5-scene', { timeout: 45000 });
  await wait(page, 1000);
  await shot(page, '19-ch5-start');
  // Wait until hide-and-seek clouds are on screen
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.cloud-hiding-spot').count()) break;
    await wait(page, 250);
  }
  await shot(page, '19b-ch5-clouds');

  for (let find = 0; find < 3; find++) {
    if (find === 0) {
      const wrong = page.locator('.cloud-hiding-spot:not(.has-smudge)').first();
      if (await wrong.count()) {
        await wrong.click({ force: true });
        await wait(page, 700);
        await shot(page, '20-ch5-wrong-cloud');
      }
    }
    const right = page.locator('.cloud-hiding-spot.has-smudge').first();
    if (await right.count()) {
      await shot(page, `21-ch5-before-find-${find + 1}`);
      await right.click({ force: true });
      await wait(page, 900);
      await shot(page, `21-ch5-find-${find + 1}`);
    } else {
      const clouds = page.locator('.cloud-hiding-spot');
      const c = await clouds.count();
      for (let i = 0; i < c; i++) {
        await clouds.nth(i).click({ force: true });
        await wait(page, 400);
      }
    }
  }

  await wait(page, 1500);
  await shot(page, '22-ch5-crown-phase');

  for (let p = 0; p < 3; p++) {
    const piece = page.locator('.treasure-piece.clickable').first();
    if (!(await piece.count())) break;
    const from = await piece.boundingBox();
    const crown = page.locator('.crown-assembly, .crown-ghost').first();
    const to = (await crown.boundingBox()) || { x: 540, y: 200, width: 120, height: 90 };
    if (from) {
      await pointerDragBoxes(page, from, to);
      await wait(page, 900);
    }
  }
  // Crowned-happy beat (Smudge wearing crown + sparkles)
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.smudge-sitting.with-crown, .crowned-happy').count()) break;
    await wait(page, 200);
  }
  await shot(page, '23-ch5-after-crown');

  // Capture mid fly-across, then wait for CompleteScreen (after animation finishes)
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.smudge-flying-across').count()) {
      await wait(page, 800);
      await shot(page, '23b-ch5-flying');
      break;
    }
    if (await page.locator('.complete-screen').count()) break;
    await wait(page, 300);
  }
  for (let i = 0; i < 50; i++) {
    if (await page.locator('.complete-screen').count()) break;
    await wait(page, 400);
  }
  await shot(page, '24-the-end');
  await wait(page, 800);
  if (await page.locator('.complete-screen').count()) {
    await shot(page, '25-complete-screen');
  }

  writeFileSync(join(STILLS, 'console-errors.json'), JSON.stringify(errors, null, 2));
  writeFileSync(join(STILLS, 'stills-index.json'), JSON.stringify(stills.map(s => s.split('/').pop()), null, 2));

  console.log('\n=== DONE ===');
  console.log('Stills:', stills.length);
  console.log('Console errors:', errors.length);
  errors.forEach(e => console.log(' -', e));

  await browser.close();
  // Soft-fail on errors after stills are saved — exit 1 so we notice
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
