import { test, expect } from "@playwright/test";
const debug = (page) =>
  page.evaluate(() => ({
    stage: window.__GAME_DEBUG__.stage,
    busy: window.__GAME_DEBUG__.busy,
    paused: window.__GAME_DEBUG__.paused,
    position: window.__GAME_DEBUG__.position,
    time: window.__GAME_DEBUG__.time,
    space: window.__GAME_DEBUG__.space,
  }));
async function chapter(page, n) {
  await expect
    .poll(async () => {
      const state = await debug(page);
      return state.stage === n && !state.busy;
    })
    .toBe(true);
}
async function ready(page, url = "/?qa=1&qaSpeed=20&qaQuality=low") {
  await page.goto(url);
  await expect(page.locator("#startBtn")).toBeEnabled();
  await expect(page.locator("#loading")).toBeHidden();
}
function monitor(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  return errors;
}

test("complete journey, door sequencing, pause, wishes, save/resume and restart", async ({
  page,
}) => {
  const errors = monitor(page);
  await ready(page);
  await page.screenshot({ path: "test-results/welcome.png" });
  await page.locator("#startBtn").click();
  await chapter(page, 0);
  await page.locator("#actionBtn").click();
  await chapter(page, 1);
  await page.locator("#actionBtn").click();
  await chapter(page, 2);
  await page.screenshot({ path: "test-results/garden.png" });
  await page.locator("#actionBtn").click();
  await chapter(page, 3);
  await page.locator("#actionBtn").click();
  await chapter(page, 4);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.gateOpen)).toBe(true);
  await page.screenshot({ path: "test-results/classroom.png" });
  await page.locator("#actionBtn").click();
  await expect(page.locator(".wish-card")).toHaveCount(25);
  await page.locator("#dismissClass").click();
  await page.locator("#pauseBtn").click();
  const paused = await debug(page);
  await page.waitForTimeout(400);
  expect(await debug(page)).toEqual(paused);
  await page.locator("#continueBtn").click();
  await chapter(page, 6);
  expect((await debug(page)).space).toBe("house");
  expect((await debug(page)).position).toEqual([-1, 0.18, 1]);
  await page.screenshot({ path: "test-results/house.png" });
  await page.locator("#actionBtn").click();
  await chapter(page, 7);
  await page.locator("#actionBtn").click();
  await chapter(page, 8);
  await page.locator("#actionBtn").click();
  await chapter(page, 9);
  await expect(page.locator("#finalPanel")).toBeVisible();
  expect((await debug(page)).space).toBe("finale");
  await page.screenshot({ path: "test-results/finale.png" });
  await page.locator("#wishesBtn").click();
  await expect(page.locator("#treeWishes p")).toHaveCount(24);
  await page.keyboard.press("Escape");
  await expect(page.locator("#wishPanel")).toBeHidden();
  expect(await page.evaluate(() => window.__GAME_DEBUG__.assets)).toEqual([]);
  const stages = await page.evaluate(() =>
    window.__GAME_DEBUG__.trace.map((e) => e.stage),
  );
  expect(stages).toEqual([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  await page.reload();
  await expect(page.locator("#resumeBtn")).toBeVisible();
  await page.locator("#resumeBtn").click();
  await chapter(page, 9);
  await expect(page.locator("#finalPanel")).toBeVisible();
  await page.locator("#replayBtn").click();
  await page.locator("#confirmRestart").click();
  await chapter(page, 0);
  await expect(page.locator("#finalPanel")).toBeHidden();
  expect(errors).toEqual([]);
});

test("all quality presets render and keyboard settings work", async ({
  page,
}) => {
  const errors = monitor(page);
  await ready(page, "/?qa=1&qaStage=4");
  await page.keyboard.press("Escape");
  await expect(page.locator("#pausePanel")).toBeVisible();
  for (const quality of ["low", "medium", "high"]) {
    await page.locator("#quality").selectOption(quality);
    await expect
      .poll(() => page.evaluate(() => window.__GAME_DEBUG__.quality))
      .toBe(quality);
    await page.locator("#continueBtn").click();
    await page.waitForTimeout(250);
    await page.keyboard.press("Escape");
  }
  await page.locator("#reduceMotion").check();
  await page.locator("#continueBtn").click();
  await page.locator("#soundBtn").click();
  await expect(page.locator("#soundBtn")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#soundBtn").click();
  await expect(page.locator("#soundBtn")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(errors).toEqual([]);
});

test("mobile chapter and finale panels fit, scroll and stay operable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = monitor(page);
  await ready(page, "/?qa=1&qaStage=4");
  expect(await page.evaluate(() => window.__GAME_DEBUG__.quality)).toBe("low");
  await page.locator("#actionBtn").click();
  await page.locator("#dismissClass").scrollIntoViewIfNeeded();
  await expect(page.locator("#dismissClass")).toBeInViewport();
  await page.screenshot({ path: "test-results/mobile-classroom.png" });
  await page.goto("/?qa=1&qaStage=9");
  await expect(page.locator("#finalPanel")).toBeVisible();
  await page.locator("#wishesBtn").scrollIntoViewIfNeeded();
  await page.locator("#wishesBtn").click();
  await page.locator("#treeWishes p").last().scrollIntoViewIfNeeded();
  await expect(page.locator("#treeWishes p").last()).toBeInViewport();
  await page.locator("#closeWishes").scrollIntoViewIfNeeded();
  await page.locator("#closeWishes").click();
  await page.screenshot({ path: "test-results/mobile-finale.png" });
  expect(errors).toEqual([]);
});

test("model failures retain a playable journey and damaged saves are ignored", async ({
  page,
}) => {
  const exceptions = [];
  page.on("pageerror", (e) => exceptions.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem("teacher-day-journey-v18", "bad-json"),
  );
  await page.route("**/assets/models/teacher_mom_chibi.glb", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.route("**/assets/models/sedan.glb", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await ready(page);
  await expect(page.locator("#resumeBtn")).toBeHidden();
  await page.locator("#startBtn").click();
  await chapter(page, 0);
  await page.locator("#actionBtn").click();
  await chapter(page, 1);
  expect(await page.evaluate(() => window.__GAME_DEBUG__.assets.length)).toBe(
    2,
  );
  expect(exceptions).toEqual([]);
});
