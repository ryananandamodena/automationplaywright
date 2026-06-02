import { test, expect } from '@playwright/test';

test.describe('GCCS Menu Navigation Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login ke GCCS
        await page.goto('https://gccs-test.modena.com/');
        await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
        await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
        await page.getByRole('button', { name: 'Login' }).click();

        // Tunggu sampai dashboard atau halaman utama muncul
        await page.waitForTimeout(3000);
    });

    test('Check all main menu items', async ({ page }) => {
        // Ambil semua menu utama yang terlihat dengan selector yang lebih aman
        const menuSelectors = [
            '[role="menuitem"]',
            '.menu-item',
            '.nav-item',
            '[data-testid*="menu"]',
            'nav a',
            '.navbar-nav a',
            '.main-menu a',
            '[role="navigation"] a',
            '.sidebar a',
            'ul li a'
        ];

        const allMenuItems = new Set();

        for (const selector of menuSelectors) {
            try {
                const items = await page.locator(selector).allTextContents();
                items.forEach(item => {
                    if (item.trim() && item.trim().length < 50) {
                        allMenuItems.add(item.trim());
                    }
                });
            } catch (error) {
                // Continue to next selector
            }
        }

        const menuItems = Array.from(allMenuItems);

        console.log('=== MENU ITEMS FOUND ===');
        menuItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
        });

        // Cari menu dengan berbagai selector yang mungkin
        const possibleMenus = [
            'Dashboard',
            'Call Center',
            'Customer Service',
            'Technical Support',
            'Sales',
            'Reports',
            'Administration',
            'Settings',
            'User Management',
            'System',
            'Master Data',
            'Analytics',
            'Monitoring'
        ];

        console.log('\n=== CHECKING SPECIFIC MENUS ===');
        for (const menuName of possibleMenus) {
            try {
                const menuExists = await page.locator(`text=${menuName}`).isVisible({ timeout: 2000 });
                console.log(`${menuName}: ${menuExists ? '✅ FOUND' : '❌ NOT FOUND'}`);
            } catch (error) {
                console.log(`${menuName}: ❌ ERROR - ${error.message}`);
            }
        }

        // Screenshot untuk dokumentasi
        await page.screenshot({ path: 'gccs-menu-screenshot.png', fullPage: true });

        // Assert bahwa setidaknya ada beberapa menu yang terlihat
        expect(menuItems.length).toBeGreaterThan(0);
    });

    test('Navigate through Call Center menu', async ({ page }) => {
        // Klik menu Call Center
        try {
            await page.getByText('Call Center').click();
            await page.waitForTimeout(2000);

            console.log('=== CALL CENTER SUBMENU ===');

            // Cari submenu Call Center
            const callCenterSubmenus = await page.locator('[role="menuitem"], .submenu-item, .nav-link, a, button').allTextContents();

            callCenterSubmenus.forEach((item, index) => {
                if (item.trim() && item.trim() !== 'Call Center') {
                    console.log(`${index + 1}. ${item.trim()}`);
                }
            });

            // Coba klik Call Entry jika ada
            try {
                await page.getByRole('link', { name: 'Call Entry' }).click();
                await page.waitForTimeout(2000);
                console.log('✅ Successfully navigated to Call Entry');

                // Screenshot halaman Call Entry
                await page.screenshot({ path: 'call-entry-page.png', fullPage: true });

            } catch (error) {
                console.log('❌ Call Entry not found or not clickable');
            }

        } catch (error) {
            console.log('❌ Call Center menu not found');
        }
    });

    test('Check sidebar navigation', async ({ page }) => {
        // Cari sidebar atau navigation panel
        const sidebarSelectors = [
            '.sidebar',
            '.navigation',
            '.nav-sidebar',
            '[class*="sidebar"]',
            '[class*="nav"]',
            '.menu',
            '.main-menu'
        ];

        console.log('=== SIDEBAR ANALYSIS ===');

        for (const selector of sidebarSelectors) {
            try {
                const sidebar = page.locator(selector);
                const isVisible = await sidebar.isVisible({ timeout: 1000 });

                if (isVisible) {
                    console.log(`✅ Sidebar found with selector: ${selector}`);

                    // Ambil semua link di sidebar
                    const sidebarLinks = await sidebar.locator('a, button, [role="button"]').allTextContents();
                    console.log('Sidebar links:');
                    sidebarLinks.forEach((link, index) => {
                        if (link.trim()) {
                            console.log(`  ${index + 1}. ${link.trim()}`);
                        }
                    });
                    break;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
    });

    test('Check user profile and logout options', async ({ page }) => {
        console.log('=== USER PROFILE & LOGOUT ===');

        // Cari avatar, profile, atau user menu
        const userMenuSelectors = [
            '.user-menu',
            '.profile-menu',
            '.avatar',
            '[class*="user"]',
            '[class*="profile"]',
            'button:has-text("sysadmin")',
            '.dropdown-toggle'
        ];

        for (const selector of userMenuSelectors) {
            try {
                const userMenu = page.locator(selector);
                const isVisible = await userMenu.isVisible({ timeout: 1000 });

                if (isVisible) {
                    console.log(`✅ User menu found with selector: ${selector}`);
                    await userMenu.click();
                    await page.waitForTimeout(1000);

                    // Cari opsi logout
                    const logoutOptions = await page.locator('text=/logout|sign out|keluar/i').allTextContents();
                    console.log('Logout options found:', logoutOptions);

                    break;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
    });

    test('Generate complete menu structure report', async ({ page }, testInfo) => {
        // Kumpulkan semua informasi menu dalam satu test
        const menuReport = {
            timestamp: new Date().toISOString(),
            url: page.url(),
            mainMenus: [],
            subMenus: {},
            navigationElements: [],
            userInfo: {}
        };

        // Ambil semua elemen yang terlihat dengan text
        const allTextElements = await page.locator('*:visible').filter({ hasText: /.+/ }).allTextContents();
        menuReport.navigationElements = allTextElements.filter(text =>
            text.trim().length > 0 &&
            text.trim().length < 50 && // Filter text yang terlalu panjang
            !text.includes('\n') // Filter multiline text
        ).slice(0, 50); // Ambil 50 elemen pertama

        // Cari menu utama
        const mainMenuSelectors = [
            'nav a',
            '.navbar-nav a',
            '.main-menu a',
            '[role="navigation"] a',
            '.sidebar a',
            'ul li a'
        ];

        for (const selector of mainMenuSelectors) {
            try {
                const menus = await page.locator(selector).allTextContents();
                if (menus.length > 0) {
                    menuReport.mainMenus = menus.filter(menu => menu.trim().length > 0);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        // Attach report ke test
        await testInfo.attach('GCCS Menu Structure Report', {
            body: JSON.stringify(menuReport, null, 2),
            contentType: 'application/json'
        });

        console.log('=== COMPLETE MENU REPORT ===');
        console.log(JSON.stringify(menuReport, null, 2));

        // Screenshot full page
        await page.screenshot({ path: 'gccs-full-menu-structure.png', fullPage: true });
        await testInfo.attach('Full Page Screenshot', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png'
        });
    });
});