import { test, expect, Page } from "@playwright/test";

const timestamp = Date.now();
const TEST_EMAIL = `project-e2e-${timestamp}@test.com`;
const TEST_PASSWORD = "password123";

async function loginAs(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  // Register if not exists (first time)
  await page.goto("/register");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  await page.locator("#register-btn").click();
  await page.waitForURL(/\/(login|dashboard)/, { timeout: 5000 });

  if (page.url().includes("/login")) {
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#login-btn").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  }
}

test.describe("Project Management Flow", () => {
  test("create a new project", async ({ page }) => {
    await loginAs(page);

    // Navigate to new project
    await page.locator("#new-project-btn").click();
    await expect(page).toHaveURL(/\/projects\/new/);

    // Fill form
    await page.locator("#project-name").fill("E2E Test Project");
    await page.locator("#project-url").fill("https://e2e-test.example.com");
    await page.locator("#create-project-btn").click();

    // Should redirect to project detail
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+$/, { timeout: 5000 });
    await expect(page.locator("h1")).toContainText("E2E Test Project");
  });

  test("project appears in dashboard list", async ({ page }) => {
    await loginAs(page);

    // Create a project
    await page.goto("/dashboard/projects/new");
    await page.locator("#project-name").fill("Listed Project");
    await page.locator("#project-url").fill("https://listed.example.com");
    await page.locator("#create-project-btn").click();
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // Go to dashboard
    await page.goto("/dashboard");
    await expect(page.locator("text=Listed Project")).toBeVisible({ timeout: 3000 });
  });

  test("create project with missing required field shows validation", async ({ page }) => {
    await loginAs(page);
    await page.goto("/dashboard/projects/new");

    // Submit without filling required fields
    await page.locator("#create-project-btn").click();

    // HTML5 validation should prevent submission
    const nameInput = page.locator("#project-name");
    await expect(nameInput).toBeFocused();
  });

  test("projects page shows searchable list", async ({ page }) => {
    await loginAs(page);
    await page.goto("/dashboard/projects");

    await expect(page.locator("h1")).toContainText("Projects");
    await expect(page.locator("#search-projects")).toBeVisible();
    await expect(page.locator("#create-project-link")).toBeVisible();
  });

  test("add environment to project", async ({ page }) => {
    await loginAs(page);

    // Create project first
    await page.goto("/dashboard/projects/new");
    await page.locator("#project-name").fill("Env Test Project");
    await page.locator("#project-url").fill("https://env-test.example.com");
    await page.locator("#create-project-btn").click();
    await page.waitForURL(/\/projects\/[a-z0-9-]+$/);

    // Add environment
    await page.locator("#add-env-btn").click();
    await page.locator("input[placeholder*='Environment name']").fill("Staging");
    await page.locator("input[placeholder*='Base URL']").fill("https://staging.example.com");
    await page.getByRole("button", { name: "Save" }).click();

    // Environment should appear in list
    await expect(page.locator("text=Staging")).toBeVisible({ timeout: 3000 });
  });
});
