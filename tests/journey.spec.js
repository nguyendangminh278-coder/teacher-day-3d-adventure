import { test,expect } from '@playwright/test';
import { TREE_WISHES } from '../src/config.js';
const state=p=>p.evaluate(()=>window.__STORY_STATE__);
async function chapter(p,n){await expect(p.locator('#stageNumber')).toHaveText(String(n),{timeout:12000});}
async function go(p,n){await expect(p.locator('#actionBtn')).toBeEnabled();await p.locator('#actionBtn').click();await chapter(p,n);}
test('chronological journey starts at school, performs actions and reads every wish',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('/?qa=1');await expect(page.locator('#loading')).toBeHidden();await chapter(page,1);
 expect((await state(page)).scene).toBe('school-front');
 await expect(page.locator('#timeline .current')).toHaveText('1Trường học');
 await page.screenshot({path:'test-results/school-start.png'});
 const before=await state(page);await page.locator('#actionBtn').click();
 await expect.poll(async()=>(await state(page)).actor.y).toBeLessThan(before.actor.y-20);
 const mid=await state(page);expect(mid.moving).toBe(true);expect(mid.actor.direction).toBe('north');
 await page.screenshot({path:'test-results/entering-school.png'});
 await chapter(page,2);await go(page,3);
 await page.screenshot({path:'test-results/new-classroom.png'});
 await page.locator('#actionBtn').click();await expect(page.locator('.wish-card')).toHaveCount(25);
 await page.locator('#dismissClass').click();await chapter(page,4);await go(page,5);
 await page.screenshot({path:'test-results/car-boarding.png'});
 await go(page,6);await expect(page.locator('#actionBtn')).toBeDisabled();
 await page.keyboard.press('Enter');expect((await state(page)).scene).toBe('car-driving');
 await page.screenshot({path:'test-results/car-driving.png'});
 await chapter(page,7);await page.screenshot({path:'test-results/new-home.png'});
 await go(page,8);await page.screenshot({path:'test-results/family-floor1.png'});await go(page,9);await page.locator('#actionBtn').click();
 await expect.poll(async()=>(await state(page)).actor.y).toBeLessThan(850);
 await page.screenshot({path:'test-results/climbing.png'});await chapter(page,10);
 await page.screenshot({path:'test-results/family-floor2.png'});await go(page,11);await go(page,12);await go(page,13);
 await expect(page.locator('#finalPanel')).toBeVisible();
 for(let i=0;i<24;i++){
  const a=i*2.39996,r=45+(i%6)*35;
  await page.locator('#game').click({position:{x:1672*.52+Math.cos(a)*r,y:941*.4+Math.sin(a)*r*.66}});
  await expect(page.locator('#treeWish')).toHaveText(TREE_WISHES[i]);
 }
 await page.locator('#allWishesBtn').click();await expect(page.locator('#infoBody')).toContainText(TREE_WISHES[23]);
 await page.keyboard.press('Escape');await page.locator('#replayBtn').click();await chapter(page,1);expect(errors).toEqual([]);
});
test('Vietnamese local font, no flashing effects, mobile layout and movement',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?qa=1');await expect(page.locator('#loading')).toBeHidden();
 expect(await page.evaluate(()=>document.fonts.check('16px "Be Vietnam Pro"','Trường THCS Cù Chính Lan · Điều ước'))).toBe(true);
 expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
 const before=await state(page);await page.keyboard.down('ArrowRight');
 await expect.poll(async()=>(await state(page)).actor.x).toBeGreaterThan(before.actor.x+20);await page.keyboard.up('ArrowRight');
 await page.locator('#journalBtn').click();await expect(page.locator('#infoBody')).toContainText('07:00');await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/mobile-start.png'});
 await go(page,2);await page.setViewportSize({width:844,height:390});await page.screenshot({path:'test-results/mobile-hall.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844);
});
