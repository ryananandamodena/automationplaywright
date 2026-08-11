import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  private get username() {
    return this.page.locator('#userName');
  }
  private get password() {
    return this.page.locator('input[name="password"]');
  }
  private get submitBtn() {
    return this.page.getByRole('button', { name: 'Login' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submitBtn.click();
  }

  async expectLoggedIn() {
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(this.page).toHaveURL(/dashboard/);
  }

  async expectStillOnLogin() {
    await expect(this.page).toHaveURL(/\/$|login/i);
  }

  async logout() {
    await this.page.locator('#caret-down').click();
    await this.page.getByRole('button', { name: /sign out/i }).click();
  }
}
