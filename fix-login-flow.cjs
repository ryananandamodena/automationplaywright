const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'test-playwright', 'more1'),
    path.join(__dirname, 'test-playwright', 'fms'),
    path.join(__dirname, 'test-playwright', 'visual-tests'),
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let changed = false;

    // 1. Fix email selector: input[type="email"] -> input[name="email"]
    // Only in login context (fill with email value, not other uses)
    const emailFillRegex = /\.locator\(['"]input\[type="email"\]\['"]\)\.fill\(/g;
    if (emailFillRegex.test(content)) {
        content = content.replace(emailFillRegex, `.locator('input[name="email"]').fill(`);
        changed = true;
    }

    // 2. Add company selection after filling password, before clicking login button
    // Pattern: after password fill, before button click
    const loginClickRegex = /await page\.locator\(["']button:has-text\(['"](?:Login|Sign In)['"]\)["']\)\.click\(\);/g;
    
    // Find positions where we need to insert company selection
    // Look for: password fill followed by login click
    const pwFillMatch = content.match(/(await page\.locator\(['"]input\[type="password"\]\['"]\)\.fill\(LOGIN_PASSWORD\);)/);
    if (pwFillMatch) {
        const idx = content.indexOf(pwFillMatch[1]) + pwFillMatch[1].length;
        const afterPw = content.slice(idx);
        
        // Check if company selection already exists
        if (!afterPw.includes('Select a company') && !afterPw.includes('MODENA HOME CENTER')) {
            const companySelection = `
  
  // Pilih company MHC dari dropdown
  const companyBtn = page.locator('button:has-text("Select a company")');
  if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await companyBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
    await page.waitForTimeout(500);
  }`;
            
            content = content.slice(0, idx) + companySelection + content.slice(idx);
            changed = true;
        }
    }

    // 3. Replace login button text "Login" -> "Sign In"  
    if (content.includes('button:has-text(\'Login\')')) {
        content = content.replace(/button:has-text\('Login'\)/g, "button:has-text('Sign In')");
        changed = true;
    }
    if (content.includes('button:has-text("Login")')) {
        content = content.replace(/button:has-text\("Login"\)/g, 'button:has-text("Sign In")');
        changed = true;
    }

    // 4. Update POM LoginPage selectors
    if (filePath.includes('LoginPage.js')) {
        content = content.replace(/this\.emailInput = page\.locator\(['"]input\[type="email"\]\['"]\);/g, `this.emailInput = page.locator('input[name="email"]');`);
        content = content.replace(/this\.loginButton = page\.locator\(['"]button:has-text\(["']Login["']\)["']\);/g, `this.loginButton = page.locator('button:has-text("Sign In")');`);
        
        // Add company selection in login method
        if (!content.includes('Select a company')) {
            content = content.replace(
                /await this\.loginButton\.click\(\);\n\s*await this\.page\.waitForTimeout\(3000\);/,
                `await this.loginButton.click();
    await this.page.waitForTimeout(3000);
    
    // Pilih company MHC dari dropdown (halaman login more-dev)
    const companyBtn = this.page.locator('button:has-text("Select a company")');
    if (await companyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyBtn.click();
      await this.page.waitForTimeout(500);
      await this.page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
      await this.page.waitForTimeout(500);
    }`
            );
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${path.relative(__dirname, filePath)}`);
        return true;
    }
    return false;
}

function walkDir(dir) {
    let count = 0;
    if (!fs.existsSync(dir)) return count;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'gccs') {
                count += walkDir(fullPath);
            }
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
            if (processFile(fullPath)) count++;
        }
    }
    return count;
}

console.log('Fixing login flow for more-dev.modena.com...');
let total = 0;
for (const dir of dirs) {
    total += walkDir(dir);
}
console.log(`\n✅ Done! ${total} files updated.`);