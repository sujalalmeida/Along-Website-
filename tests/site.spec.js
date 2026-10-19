import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const download =
  "https://github.com/sujalalmeida/TileMac/releases/download/v0.6.0/TileMe-0.6.0-apple-silicon.dmg";
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/");
  await expect(page.locator(".app-window")).toHaveCount(4);
});

test("insertion follows selection without changing existing widths", async ({
  page,
}) => {
  const initial = await page.locator(".app-window").evaluateAll((els) =>
    els.map((el) => ({
      id: el.dataset.id,
      width: el.getBoundingClientRect().width,
    })),
  );
  await page.getByRole("button", { name: "Add window", exact: true }).click();
  await expect(page.locator(".app-window")).toHaveCount(5);
  await expect(page.locator(".app-window").nth(2)).toHaveAttribute(
    "data-selected",
    "true",
  );
  await expect(page.locator(".app-window").nth(2)).toHaveAttribute(
    "data-id",
    "5",
  );
  const remaining = await page
    .locator('.app-window:not([data-id="5"])')
    .evaluateAll((els) =>
      els.map((el) => ({
        id: el.dataset.id,
        width: el.getBoundingClientRect().width,
      })),
    );
  expect(remaining).toEqual(initial);
  await expect(page.getByRole("status")).toContainText(
    "Existing windows kept their widths",
  );
  const overflow = await page
    .locator("#window-viewport")
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(true);
  await page
    .getByRole("button", { name: "Select Music, window 5", exact: true })
    .click();
  await expect(page.locator(".app-window").last()).toHaveAttribute(
    "data-selected",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Next window", exact: true }),
  ).toBeDisabled();
});

test("arrow controls, scoped keyboard handling, boundaries and focus", async ({
  page,
}) => {
  const region = page.getByRole("region", {
    name: "Scrolling window demonstration",
  });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "2",
  );
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "3",
  );
  await expect(region).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("button", { name: "Previous window", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "1",
  );
  await page.keyboard.press("End");
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "4",
  );
  await page
    .getByRole("button", { name: "Previous window", exact: true })
    .click();
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "3",
  );
  await region.focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#window-viewport")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Select Notes, window 1", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "1",
  );
});

test("demo cap is communicated and does not trap keyboard focus", async ({
  page,
}) => {
  const add = page.getByRole("button", { name: "Add window", exact: true });
  for (let i = 0; i < 8; i++) await add.click();
  await expect(page.locator(".app-window")).toHaveCount(12);
  await expect(add).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Demo limit reached");
  await page
    .getByRole("region", {
      name: "Scrolling window demonstration",
      exact: true,
    })
    .focus();
  await page.keyboard.press("End");
  await expect(page.locator(".app-window").last()).toHaveAttribute(
    "data-selected",
    "true",
  );
});

test("release links, metadata and visible installation details", async ({
  page,
}) => {
  const links = page.locator("a[download]");
  await expect(links).toHaveCount(3);
  for (const a of await links.all())
    await expect(a).toHaveAttribute("href", download);
  await expect(page).toHaveTitle(
    "TileMe — Your windows, in one scrolling row.",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /free, open-source/,
  );
  await expect(
    page.getByText("This preview is not notarized by Apple.", { exact: false }),
  ).toBeVisible();
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
      els.map((el) => el.getAttribute("href").slice(1)).filter(Boolean),
    );
  for (const id of ids)
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive layout and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}

test("reduced motion applies immediately to interactive scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#window-viewport")).toHaveCSS(
    "scroll-behavior",
    "auto",
  );
  await page
    .getByRole("region", {
      name: "Scrolling window demonstration",
      exact: true,
    })
    .focus();
  await page.keyboard.press("End");
  const offset = await page
    .locator("#window-viewport")
    .evaluate((el) => el.scrollLeft);
  expect(offset).toBeGreaterThan(0);
  await expect(page.locator(".button-primary").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
});

test("touch swipe moves to the next window without a vertical gesture selecting it", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  const viewport = page.locator("#window-viewport");
  await viewport.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 280, clientY: 700 }],
  });
  await viewport.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: 100, clientY: 705 }],
  });
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "3",
  );
  await viewport.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 200, clientY: 700 }],
  });
  await viewport.dispatchEvent("touchend", {
    changedTouches: [{ identifier: 1, clientX: 190, clientY: 550 }],
  });
  await expect(page.locator('[data-selected="true"]')).toHaveAttribute(
    "data-id",
    "3",
  );
  await context.close();
});

test("page content and real download remain accessible without JavaScript", async ({
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
