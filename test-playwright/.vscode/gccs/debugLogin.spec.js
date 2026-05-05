import { test, expect } from '@playwright/test';

test.describe('GCCS Login Debug Tests', () => {
    test('Debug login process step by step', async ({ page }) => {
        console.log('=== DEBUG LOGIN PROCESS ===');

        // Step 1: Go to login page
        console.log('1. Navigating to login page...');
        await page.goto('https://gccs-test.modena.com/');
        await page.waitForLoadState('networkidle');

        console.log('Current URL:', page.url());
        console.log('Page title:', await page.title());

        // Step 2: Check if login form exists
        console.log('2. Checking login form...');
        const usernameField = page.getByRole('textbox', { name: 'Username' });
        const passwordField = page.getByRole('textbox', { name: 'Input Your Password' });
        const loginButton = page.getByRole('button', { name: 'Login' });

        const usernameExists = await usernameField.isVisible({ timeout: 5000 });
        const passwordExists = await passwordField.isVisible({ timeout: 5000 });
        const loginBtnExists = await loginButton.isVisible({ timeout: 5000 });

        console.log('Username field visible:', usernameExists);
        console.log('Password field visible:', passwordExists);
        console.log('Login button visible:', loginBtnExists);

        if (!usernameExists || !passwordExists || !loginBtnExists) {
            console.log('❌ Login form not found!');
            await page.screenshot({ path: 'login-form-not-found.png', fullPage: true });
            return;
        }

        // Step 3: Fill login credentials
        console.log('3. Filling login credentials...');
        await usernameField.fill('sysadmin');
        await passwordField.fill('P@ssw0rd12');

        // Step 4: Click login
        console.log('4. Clicking login button...');
        await loginButton.click();

        // Step 5: Wait and check result
        console.log('5. Waiting for navigation...');
        await page.waitForTimeout(5000);

        console.log('Current URL after login:', page.url());
        console.log('Page title after login:', await page.title());

        // Check if we're still on login page or redirected
        const stillOnLogin = await usernameField.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Still on login page:', stillOnLogin);

        if (stillOnLogin) {
            console.log('❌ Login failed - still on login page');
            await page.screenshot({ path: 'login-failed-still-on-login.png', fullPage: true });

            // Check for error messages dengan selector yang benar
            const errorSelectors = [
                '.error',
                '.alert',
                '[class*="error"]',
                'text=/invalid|salah|error|gagal/i'
            ];

            for (const selector of errorSelectors) {
                try {
                    const errorElements = await page.locator(selector).allTextContents();
                    if (errorElements.length > 0) {
                        console.log(`Error messages found with selector ${selector}:`, errorElements);
                    }
                } catch (error) {
                    // Continue to next selector
                }
            }
        } else {
            console.log('✅ Login successful - redirected to dashboard');

            // Take screenshot of dashboard
            await page.screenshot({ path: 'dashboard-after-login.png', fullPage: true });

            // Try to find menu items
            console.log('6. Looking for menu items...');
            const menuSelectors = [
                'nav',
                '.sidebar',
                '.menu',
                '[class*="menu"]',
                '[class*="nav"]'
            ];

            for (const selector of menuSelectors) {
                try {
                    const menuElement = page.locator(selector);
                    const isVisible = await menuElement.isVisible({ timeout: 1000 });
                    if (isVisible) {
                        console.log(`✅ Found menu with selector: ${selector}`);

                        // Get all links/text in menu
                        const menuItems = await menuElement.locator('a, button, span, div').allTextContents();
                        console.log('Menu items:');
                        menuItems.forEach((item, index) => {
                            if (item.trim()) {
                                console.log(`  ${index + 1}. ${item.trim()}`);
                            }
                        });
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            // Try to find Call Center menu specifically
            console.log('7. Looking for Call Center menu...');
            try {
                const callCenterMenu = page.locator('text=Call Center');
                const isCallCenterVisible = await callCenterMenu.isVisible({ timeout: 2000 });
                console.log('Call Center menu visible:', isCallCenterVisible);

                if (isCallCenterVisible) {
                    await callCenterMenu.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Call Center menu');

                    // Get submenu items
                    const submenuItems = await page.locator('[role="menuitem"], .submenu-item, a, button').allTextContents();
                    console.log('Call Center submenu:');
                    submenuItems.forEach((item, index) => {
                        if (item.trim() && item.trim() !== 'Call Center') {
                            console.log(`  ${index + 1}. ${item.trim()}`);
                        }
                    });
                }
            } catch (error) {
                console.log('❌ Error finding Call Center menu:', error.message);
            }
        }

        // Final screenshot
        await page.screenshot({ path: 'final-state.png', fullPage: true });
    });

    test('Check page structure after login', async ({ page }) => {
        // Login process
        await page.goto('https://gccs-test.modena.com/');
        await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
        await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
        await page.getByRole('button', { name: 'Login' }).click();

        await page.waitForTimeout(3000);

        // Analyze page structure
        const pageStructure = {
            url: page.url(),
            title: await page.title(),
            bodyText: await page.locator('body').textContent(),
            allHeadings: await page.locator('h1, h2, h3, h4, h5, h6').allTextContents(),
            allButtons: await page.locator('button').allTextContents(),
            allLinks: await page.locator('a').allTextContents(),
            allDivsWithText: await page.locator('div').filter({ hasText: /.+/ }).allTextContents()
        };

        console.log('=== PAGE STRUCTURE ANALYSIS ===');
        console.log('URL:', pageStructure.url);
        console.log('Title:', pageStructure.title);
        console.log('Headings:', pageStructure.allHeadings);
        console.log('Buttons:', pageStructure.allButtons.slice(0, 10)); // First 10 buttons
        console.log('Links:', pageStructure.allLinks.slice(0, 10)); // First 10 links

        // Check if this looks like a dashboard
        const hasDashboardIndicators = pageStructure.allDivsWithText.some(text =>
            text.toLowerCase().includes('dashboard') ||
            text.toLowerCase().includes('welcome') ||
            text.toLowerCase().includes('menu') ||
            text.toLowerCase().includes('navigation')
        );

        console.log('Has dashboard indicators:', hasDashboardIndicators);

        // Save structure to test attachment
        await testInfo.attach('Page Structure Analysis', {
            body: JSON.stringify(pageStructure, null, 2),
            contentType: 'application/json'
        });
        console.log('Page structure saved to test attachment');
    });
});