import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CREDENTIALS } from '../utils/testData';

export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.valid.username, CREDENTIALS.valid.password);
    await login.expectLoggedIn();
    await use(page);
  },
});

export { expect } from '@playwright/test';
