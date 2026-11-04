import { test, expect } from '@playwright/test';
import { TREE_WISHES } from '../src/config.js';

async function chapter(page, n) {
  await expect(page.locator('#stageNumber')).toHaveText(String(n));
  await expect(page.locator('#mapFade')).not.toHaveClass(/on/);
  await expect(page.locator('#mapFade')).toHaveCSS('opacity', '0');
}
async function advance(page, n) {
  await page.locator('#actionBtn').click(); await chapter(page, n);
}
test('complete route, scene assets, locked destinations and all wishes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('[data-place=home]')).toBeDisabled();
  await expect(page.locator('[data-place=wish]')).toBeDisabled();
  await page.screenshot({ path: 'test-results/village.png' });
  await page.locator('[data-place=school]').click(); await chapter(page, 3);
  await page.screenshot({ path: 'test-results/school.png' });
  await advance(page, 4); await page.screenshot({ path: 'test-results/hall.png' });
  await advance(page, 5); await page.screenshot({ path: 'test-results/classroom.png' });
  await page.locator('#actionBtn').click();
  await expect(page.locator('.wish-card')).toHaveCount(25);
  await page.keyboard.press('Escape');
  await expect(page.locator('#actionBtn')).toBeVisible();
  await page.locator('#actionBtn').click();
  await page.locator('#dismissClass').click(); await chapter(page, 6);
  await advance(page, 6); // Exit school to the village, then walk to the car.
  await expect(page.locator('[data-place=car]')).toBeEnabled();
  await page.locator('[data-place=car]').click(); await chapter(page, 7);
  await page.screenshot({ path: 'test-results/boarding.png' });
  await advance(page, 8); await expect(page.locator('#actionBtn')).toBeDisabled();
  await page.keyboard.press('Enter'); await chapter(page, 8);
  await page.screenshot({ path: 'test-results/driving.png' });
  await chapter(page, 9); await advance(page, 10);
  await page.screenshot({ path: 'test-results/floor1.png' });
  await advance(page, 11); await page.screenshot({ path: 'test-results/stairs.png' });
  await advance(page, 12); await advance(page, 13); await advance(page, 14); await advance(page, 15);
  await expect(page.locator('#finalPanel')).toBeVisible();
  await page.screenshot({ path: 'test-results/rooftop.png' });
  // First gold card at world coordinate (W*.52+45, H*.40).
  await page.locator('#game').click({ position: { x: 914, y: 376 } });
  await expect(page.locator('#treeWish')).toContainText('Mẹ luôn mạnh khỏe');
  for(let i=1;i<24;i++){
    const a=i*2.39996,r=45+(i%6)*35;
    await page.locator('#game').click({position:{x:1672*.52+Math.cos(a)*r,y:941*.40+Math.sin(a)*r*.66}});
    await expect(page.locator('#treeWish')).toContainText(TREE_WISHES[i]);
  }
  await page.locator('#allWishesBtn').click();
  for (const wish of TREE_WISHES) await expect(page.locator('#infoBody')).toContainText(wish);
  await page.keyboard.press('Escape');
  await page.locator('#replayBtn').click(); await chapter(page, 1);
  await expect(page.locator('[data-place=wish]')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('portrait and landscape preserve hotspots, movement and usable panels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await page.screenshot({ path: 'test-results/mobile-village.png' });
  await page.locator('#journalBtn').click(); await expect(page.locator('#infoPanel')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#infoPanel')).toBeHidden();
  await page.locator('[data-place=school]').click(); await chapter(page, 3);
  await advance(page, 4); await advance(page, 5);
  await page.locator('#actionBtn').click(); await expect(page.locator('.wish-card')).toHaveCount(25);
  await page.screenshot({ path: 'test-results/mobile-classroom.png' });
  await page.locator('#dismissClass').click(); await chapter(page, 6);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: 'test-results/mobile-landscape.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
