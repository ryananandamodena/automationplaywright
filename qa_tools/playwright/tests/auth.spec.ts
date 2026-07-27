import { test, expect, Page } from "@playwright/test";

// Unique email per test run to avoid conflicts
const timestamp = Date.now();
const TEST_EMAIL = `e2e-${timestamp}@test.com`;
const TEST_PASSWORD = "password123";

async function registerAndLogin(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  // Register
  await page.goto("/register");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  await page.locator("#register-btn").click();

  // Should redirect to /login
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

  // Login
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#login-btn").click();

  // Should redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
}

test.describe("Authentication Flow", () => {
  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/AI QA Platform/);
    await expect(page.locator("h1")).toContainText("Create Account");
    await expect(page.locator("#register-email")).toBeVisible();
    await expect(page.locator("#register-password")).toBeVisible();
    await expect(page.locator("#register-btn")).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/AI QA Platform/);
    await expect(page.locator("h1")).toContainText("AI QA Platform");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#login-btn")).toBeVisible();
  });

  test("register → login → dashboard full flow", async ({ page }) => {
    await registerAndLogin(page);
    // Should be on dashboard
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("login with wrong password shows error", async ({ page }) => {
    // Register first
    await page.goto("/register");
    const email = `wrong-pass-${timestamp}@test.com`;
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(TEST_PASSWORD);
    await page.locator("#register-btn").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Try wrong password
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("wrongpassword");
    await page.locator("#login-btn").click();

    // Should show error, stay on login page
    await expect(page).toHaveURL(/\/login/);
    // Error message should be visible
    await expect(page.locator("text=/failed|incorrect|invalid/i")).toBeVisible({ timeout: 3000 });
  });

  test("logout clears session", async ({ page }) => {
    await registerAndLogin(page);
    await page.locator("#logout-btn").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    // Try to go back to dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    // Clear cookies/storage
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
