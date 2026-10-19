import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const download =
  "https://github.com/sujalalmeida/TileMac/releases/download/v0.6.0/TileMe-0.6.0-apple-silicon.dmg";
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/");
  await expect(page.locator(".map-tile")).toHaveCount(4);
});
const selected = (page) => page.locator('.map-tile[aria-pressed="true"]');
const region = (page) =>
  page.getByRole("region", { name: "Interactive desktop map", exact: true });
const widths = (page) =>
  page.locator(".map-tile").evaluateAll((els) =>
    els.map((el) => ({
      id: el.dataset.id,
      width: el.getBoundingClientRect().width,
    })),
  );

test("new block joins after selection without squeezing other blocks", async ({
  page,
}) => {
  const before = await widths(page);
  await page.getByRole("button", { name: "Add window", exact: true }).click();
  await expect(page.locator(".map-tile")).toHaveCount(5);
  await expect(page.locator(".map-tile").nth(2)).toHaveAttribute(
    "data-id",
    "5",
  );
  await expect(selected(page)).toHaveAttribute("data-id", "5");
  const after = (await widths(page)).filter((w) => w.id !== "5");
  expect(after).toEqual(before);
  await expect(page.getByRole("status")).toContainText(
    "Existing windows kept their widths",
  );
  expect(
    await page
      .locator("#map-viewport")
      .evaluate((v) => v.scrollWidth > v.clientWidth),
  ).toBe(true);
});

test("keyboard scope, boundaries, and roving block focus", async ({ page }) => {
  await page.keyboard.press("ArrowRight");
  await expect(selected(page)).toHaveAttribute("data-id", "2");
  await region(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(selected(page)).toHaveAttribute("data-id", "3");
  await expect(region(page)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("button", { name: "Previous window", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("End");
  await expect(selected(page)).toHaveAttribute("data-id", "4");
  await expect(
    page.getByRole("button", { name: "Next window", exact: true }),
  ).toBeDisabled();
  await selected(page).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(selected(page)).toHaveAttribute("data-id", "3");
  await expect(selected(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("slider", { name: "Move to a window" }),
  ).toBeFocused();
});

test("overview slider changes selection without double-handling arrow keys", async ({
  page,
}) => {
  const slider = page.getByRole("slider", { name: "Move to a window" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("2");
  await expect(selected(page)).toHaveAttribute("data-id", "3");
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    "Browser, window 3 of 4",
  );
});

test("width changes only the selected block and stop restores original widths and positions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const before = await widths(page);
  await page.getByRole("button", { name: "Change width", exact: true }).click();
  const after = await widths(page);
  expect(after[1].width).toBe(440);
  expect(after.filter((w) => w.id !== "2")).toEqual(
    before.filter((w) => w.id !== "2"),
  );
  await expect(page.getByRole("status")).toContainText(
    "All other window widths are unchanged",
  );
  await page
    .getByRole("button", { name: "Stop & restore", exact: true })
    .click();
  await expect(page.locator("#demo")).toHaveAttribute("data-mode", "restored");
  await expect(
    page.getByText("Original layout restored", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add window", exact: true }),
  ).toBeDisabled();
  await expect(selected(page).locator(".tile-width")).toHaveText("330 px");
  const tops = await page
    .locator(".map-tile")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(new Set(tops).size).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Start row", exact: true }).click();
  await expect(page.locator("#demo")).toHaveAttribute("data-mode", "row");
  const rowTops = await page
    .locator(".map-tile")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(new Set(rowTops).size).toBe(1);
  expect((await widths(page))[1].width).toBe(330);
});

test("demo limit is clear, and reset returns to a useful starting point", async ({
  page,
}) => {
  const add = page.getByRole("button", { name: "Add window", exact: true });
  for (let i = 0; i < 8; i++) await add.click();
  await expect(page.locator(".map-tile")).toHaveCount(12);
  await expect(add).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Demo limit reached");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.locator(".map-tile")).toHaveCount(4);
  await expect(selected(page)).toHaveAttribute("data-id", "2");
  await expect(add).toBeEnabled();
});

test("real release, metadata, links and required preview details", async ({
  page,
}) => {
  const links = page.locator("a[download]");
  await expect(links).toHaveCount(3);
  for (const a of await links.all())
    await expect(a).toHaveAttribute("href", download);
  await expect(page).toHaveTitle("Along — Your windows, in one scrolling row.");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /free, open-source/,
  );
  await expect(page.locator("#preview-note")).toContainText(
    "This preview is not notarized by Apple.",
  );
  await expect(
    page.getByRole("link", { name: "Apple’s Open Anyway instructions" }),
  ).toHaveAttribute("href", "https://support.apple.com/102445");
  await expect(
    page.getByText("Fresh-install compatibility testing is still pending."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "MIT license" })).toHaveAttribute(
    "href",
    "https://github.com/sujalalmeida/TileMac/blob/master/LICENSE",
  );
  const ids = await page
    .locator('a[href^="#"]')
    .evaluateAll((els) =>
      els.map((a) => a.getAttribute("href").slice(1)).filter(Boolean),
    );
  for (const id of ids)
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive layout and WCAG accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const restore of [false, true]) {
      if (restore)
        await page
          .getByRole("button", { name: "Stop & restore", exact: true })
          .click();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    }
  });
}

test("reduced motion is immediate for navigation and changing layouts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#map-viewport")).toHaveCSS(
    "scroll-behavior",
    "auto",
  );
  await region(page).focus();
  await page.keyboard.press("End");
  expect(
    await page.locator("#map-viewport").evaluate((v) => v.scrollLeft),
  ).toBeGreaterThan(0);
  await expect(selected(page)).toHaveCSS("transition-duration", "0s");
  await page
    .getByRole("button", { name: "Stop & restore", exact: true })
    .click();
  await expect(selected(page)).toHaveCSS("transition-duration", "0s");
});

test("horizontal touch gestures select a block, vertical gestures keep their selection", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  const viewport = page.locator("#map-viewport");
  await viewport.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 280, clientY: 700 }],
  });
  await viewport.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: 100, clientY: 705 }],
  });
  await expect(selected(page)).toHaveAttribute("data-id", "3");
  await viewport.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 200, clientY: 700 }],
  });
  await viewport.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: 190, clientY: 550 }],
  });
  await expect(selected(page)).toHaveAttribute("data-id", "3");
  await context.close();
});

test("native horizontal wheel scrolling moves the workspace continuously", async ({
  page,
}) => {
  const viewport = page.locator("#map-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const rect = await viewport.boundingBox();
  const before = await viewport.evaluate((v) => v.scrollLeft);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.wheel(150, 0);
  await expect
    .poll(() => viewport.evaluate((v) => v.scrollLeft))
    .toBeGreaterThan(before + 30);
});

test("product information works with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("a[download]").first()).toHaveAttribute(
    "href",
    download,
  );
  await expect(page.locator("#install")).toBeVisible();
  await expect(page.locator("#preview-note")).toContainText(
    "This preview is not notarized by Apple.",
  );
  await context.close();
});
