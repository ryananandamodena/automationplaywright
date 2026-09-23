// Shared constants/helpers for MODENA CMS automation specs.
// Verified against live DOM at https://merchandise-dev.modena.com/cms (2026-08-03).

export const BASE_URL = 'https://merchandise-dev.modena.com';

export const ADMIN = {
  email: 'admin@modena.com',
  password: 'admin123',
};

// Sidebar menus observed for this account during exploration. If the
// broken-access-control observation (OBS-01 in 11_cms_admin_test_cases.md)
// gets fixed, this list — and CMS-E2E-004 — should be revisited per role.
export const CMS_MENUS = [
  { label: 'Dashboard', path: '/cms' },
  { label: 'Products', path: '/cms/products' },
  { label: 'Orders', path: '/cms/orders' },
  { label: 'Stock', path: '/cms/stock' },
  { label: 'Settings', path: '/cms/settings' },
  { label: 'Users', path: '/cms/users' },
  { label: 'Roles', path: '/cms/roles' },
  { label: 'Categories', path: '/cms/categories' },
];

export async function loginCms(page, { email, password } = ADMIN) {
  await page.goto(`${BASE_URL}/cms/login`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL(`${BASE_URL}/cms`);
}
