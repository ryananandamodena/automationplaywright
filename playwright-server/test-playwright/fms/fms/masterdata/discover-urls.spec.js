import { test } from "@playwright/test";

async function loginAndGoToFMS(page) {
  await page.goto("https://portal-dev.modena.com/fms/vehicle", { waitUntil: "load", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  if (page.url().includes("/login")) {
    await page.locator("input[type=email], input[name=email]").first().fill("ryan.ananda@modena.com");
    await page.locator("input[type=password]").first().fill("P@ssw0rd_ryan.ananda");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
  }
  if (page.url().includes("my-application")) {
    await page.getByText("FMS (DEV)").click();
    await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    const c = page.getByRole("button", { name: "Confirm" });
    if (await c.isVisible({ timeout: 2000 }).catch(() => false)) { await c.click(); await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {}); }
    await page.goto("https://portal-dev.modena.com/fms/vehicle", { waitUntil: "load", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  if (!page.url().includes("/fms/vehicle")) {
    await page.goto("https://portal-dev.modena.com/my-application", { waitUntil: "load", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const fmsBtn = page.getByText("FMS (DEV)").first();
    if (await fmsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fmsBtn.click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      const c = page.getByRole("button", { name: "Confirm" });
      if (await c.isVisible({ timeout: 2000 }).catch(() => false)) { await c.click(); await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {}); }
    }
    await page.goto("https://portal-dev.modena.com/fms/vehicle", { waitUntil: "load", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
}

test("Discover Master Data URLs", async ({ page }) => {
  test.setTimeout(180000);
  await loginAndGoToFMS(page);
  console.log("Current URL: " + page.url());
  const allButtons = await page.getByRole("button").allInnerTexts();
  console.log("All buttons: " + allButtons.join(" | "));
  const masterDataBtn = page.getByRole("button", { name: /master data/i }).first();
  if (await masterDataBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await masterDataBtn.click();
    await page.waitForTimeout(1500);
    const linksAfterExpand = await page.locator("a").allInnerTexts();
    console.log("Links after expand: " + linksAfterExpand.join(" | "));
    const candidates = ["Branch","Brand","Category","Items","UOM","Document","Dokumen","Building Component","Building Material","Vehicle Model","Vehicle Brand","User Management","Approval"];
    for (const candidate of candidates) {
      const link = page.getByRole("link", { name: new RegExp(candidate, "i") }).first();
      if (await link.isVisible({ timeout: 500 }).catch(() => false)) {
        await link.click();
        await page.waitForTimeout(1500);
        console.log(candidate + " => " + page.url());
        await page.goto("https://portal-dev.modena.com/fms/vehicle", { waitUntil: "load", timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(800);
        await page.getByRole("button", { name: /master data/i }).first().click().catch(() => {});
        await page.waitForTimeout(800);
      } else {
        console.log(candidate + " => NOT FOUND");
      }
    }
  } else {
    console.log("Master Data button NOT found");
  }
  console.log("DONE");
});
