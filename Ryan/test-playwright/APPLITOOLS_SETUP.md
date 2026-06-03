# 🎨 Applitools Visual AI Testing Setup

## Overview

**Applitools Eyes** is an AI-powered visual testing platform that automatically detects visual bugs across browsers, devices, and resolutions.

### 🌟 Key Benefits

✅ **AI-Powered** - Smart visual comparison using machine learning  
✅ **Cross-Browser** - Test on Chrome, Firefox, Edge, Safari, Mobile devices  
✅ **Ultra Fast Grid** - Run visual tests in parallel (10x faster)  
✅ **No False Positives** - AI ignores insignificant differences  
✅ **Layout Testing** - Validate responsive design automatically  
✅ **Easy Maintenance** - Update baselines with one click  
✅ **CI/CD Integration** - Works with GitHub Actions, Jenkins, etc.  

---

## 🚀 Quick Start

### Step 1: Sign Up for Applitools (FREE)

1. Go to: https://applitools.com/users/register
2. Sign up dengan email (atau GitHub/Google)
3. Pilih plan: **Free Forever** (gratis selamanya!)
   - 100 checkpoints/month
   - Unlimited users
   - All core features

### Step 2: Get Your API Key

1. Login ke Applitools dashboard
2. Click profile icon (top right) → **My API Key**
3. Copy API key (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 3: Set API Key as Environment Variable

**Windows PowerShell:**
```powershell
# Temporary (current session only)
$env:APPLITOOLS_API_KEY = "your-api-key-here"

# Permanent (system-wide)
[System.Environment]::SetEnvironmentVariable('APPLITOOLS_API_KEY', 'your-api-key-here', 'User')

# Verify
$env:APPLITOOLS_API_KEY
```

**Linux/Mac:**
```bash
# Temporary
export APPLITOOLS_API_KEY="your-api-key-here"

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export APPLITOOLS_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# Verify
echo $APPLITOOLS_API_KEY
```

**Alternative: Create `.env` file (NOT recommended for Git repos)**
```bash
# .env (add to .gitignore!)
APPLITOOLS_API_KEY=your-api-key-here
```

### Step 4: Verify Installation

```powershell
# Check if package installed
npm list @applitools/eyes-playwright

# Should show:
# @applitools/eyes-playwright@1.47.4
```

### Step 5: Run Your First Visual Test

```powershell
cd Ryan/test-playwright

# Run visual tests
npx playwright test visual-tests/mhc-sales-order-visual.spec.js --headed

# Or use npm script
npm run test:visual
```

---

## 📖 How It Works

### 1️⃣ First Run - Create Baseline

```javascript
await eyes.check('Sales Order List', Target.window().fully());
```

**What happens:**
- Takes screenshot
- Uploads to Applitools cloud
- Marks as **baseline** (reference image)
- Status: **NEW** (no comparison yet)

### 2️⃣ Second Run - Compare with Baseline

```javascript
await eyes.check('Sales Order List', Target.window().fully());
```

**What happens:**
- Takes new screenshot
- AI compares with baseline
- If identical → ✅ **PASSED**
- If different → ❌ **UNRESOLVED** (needs review)

### 3️⃣ Review Differences

1. Open Applitools dashboard
2. See side-by-side comparison
3. AI highlights differences
4. Choose action:
   - ✅ **Accept** → Update baseline
   - ❌ **Reject** → Mark as bug
   - 👁️ **Ignore** → Skip this region

---

## 🎯 Test Examples

### Basic Full Page Screenshot

```javascript
test('Homepage visual check', async ({ page }) => {
  await eyes.open(page, 'My App', 'Homepage Test');
  
  await page.goto('https://myapp.com');
  
  // Take full page screenshot
  await eyes.check('Homepage', Target.window().fully());
  
  await eyes.closeAsync();
});
```

### Check Specific Element

```javascript
// Check only the header
await eyes.check('Header', Target.region('header'));

// Check by selector
await eyes.check('Login Form', Target.region('#login-form'));

// Check by Playwright locator
await eyes.check('Submit Button', 
  Target.region(page.locator('button[type="submit"]'))
);
```

### Responsive Design Testing

```javascript
// Desktop
await page.setViewportSize({ width: 1920, height: 1080 });
await eyes.check('Desktop View', Target.window().fully());

// Tablet
await page.setViewportSize({ width: 768, height: 1024 });
await eyes.check('Tablet View', Target.window().fully());

// Mobile
await page.setViewportSize({ width: 375, height: 667 });
await eyes.check('Mobile View', Target.window().fully());
```

### Cross-Browser Testing (Ultra Fast Grid)

```javascript
eyes.setConfiguration({
  browsersInfo: [
    { width: 1920, height: 1080, name: 'chrome' },
    { width: 1920, height: 1080, name: 'firefox' },
    { width: 1920, height: 1080, name: 'edge' },
    { deviceName: 'iPhone 14 Pro' },
    { deviceName: 'iPad Pro' },
  ]
});

// One test = 5 browser screenshots automatically!
await eyes.check('Cross-Browser', Target.window().fully());
```

### Ignore Dynamic Content

```javascript
// Ignore timestamps, ads, random content
await eyes.check('Page without Dynamic Content', 
  Target.window()
    .ignoreRegions('.timestamp', '.advertisement', '#random-content')
);
```

### Layout-Only Comparison

```javascript
// Check structure, ignore colors/fonts
await eyes.check('Layout Check', 
  Target.window()
    .layout()  // Layout match level
);
```

### Match Levels

```javascript
// Strict - pixel-perfect (default)
await eyes.check('Strict', Target.window().matchLevel('Strict'));

// Content - ignore colors
await eyes.check('Content', Target.window().matchLevel('Content'));

// Layout - ignore colors, fonts, content
await eyes.check('Layout', Target.window().matchLevel('Layout'));

// Exact - exact pixel match (very strict)
await eyes.check('Exact', Target.window().matchLevel('Exact'));
```

---

## 🛠️ Configuration

### applitools.config.js

Already created with optimal settings:

```javascript
module.exports = {
  testConcurrency: 5,           // 5 parallel tests
  browser: [/* 7 configurations */],
  matchLevel: 'strict',          // Pixel-perfect by default
  ignoreDisplacements: true,     // Ignore small shifts
  waitBeforeScreenshots: 500,    // Wait for animations
  // ... more settings
};
```

### Batch Management

Group related tests together:

```javascript
eyes.setConfiguration({
  batchName: 'Sprint 42 - Visual Regression',
  batchId: process.env.CI_BUILD_ID,  // Group CI runs
});
```

---

## 📊 Viewing Results

### Applitools Dashboard

1. Login to: https://eyes.applitools.com
2. Navigate to **Test Manager**
3. See all test runs with status:
   - ✅ **Passed** - No visual changes
   - ❌ **Unresolved** - Changes detected, needs review
   - ⬜ **New** - First run, baseline created
   - 🔄 **Running** - Test in progress

### Compare Screenshots

1. Click on any test
2. See **side-by-side comparison**
3. AI highlights differences in pink
4. Use tools:
   - **Overlay** - Blend images
   - **Swipe** - Drag to compare
   - **Diff** - Show only changes
   - **Thumbnails** - See all checkpoints

### Batch Results

- See all tests in a batch
- Overall pass/fail status
- Drill down into failures
- Export results

---

## 🚀 NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:visual": "playwright test visual-tests/ --project=chromium",
    "test:visual:headed": "playwright test visual-tests/ --headed",
    "test:visual:debug": "PWDEBUG=1 playwright test visual-tests/"
  }
}
```

Usage:

```powershell
# Run all visual tests
npm run test:visual

# Run with browser visible
npm run test:visual:headed

# Debug mode
npm run test:visual:debug
```

---

## 🐳 Docker Integration

Update `Dockerfile`:

```dockerfile
# Set Applitools API key as build arg
ARG APPLITOOLS_API_KEY
ENV APPLITOOLS_API_KEY=$APPLITOOLS_API_KEY

# Run visual tests
CMD ["npx", "playwright", "test", "visual-tests/"]
```

Run with Docker:

```powershell
# Build with API key
docker build --build-arg APPLITOOLS_API_KEY=$env:APPLITOOLS_API_KEY -t playwright-visual .

# Run tests
docker run --rm playwright-visual
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Update `.github/workflows/playwright-tests.yml`:

```yaml
env:
  APPLITOOLS_API_KEY: ${{ secrets.APPLITOOLS_API_KEY }}

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Visual Tests
        run: npx playwright test visual-tests/
        env:
          APPLITOOLS_API_KEY: ${{ secrets.APPLITOOLS_API_KEY }}
          APPLITOOLS_BATCH_ID: ${{ github.run_id }}
          APPLITOOLS_BRANCH: ${{ github.ref_name }}
```

**Set GitHub Secret:**
1. Repo Settings → Secrets → Actions
2. New secret: `APPLITOOLS_API_KEY`
3. Paste your API key

---

## 🎯 Best Practices

### 1️⃣ Use Meaningful Names

```javascript
// ❌ Bad
await eyes.check('Test 1', Target.window());

// ✅ Good
await eyes.check('Sales Order List - Desktop Chrome 1920x1080', Target.window());
```

### 2️⃣ Organize by Feature

```
visual-tests/
  ├── auth/
  │   ├── login-visual.spec.js
  │   └── signup-visual.spec.js
  ├── sales-order/
  │   ├── so-list-visual.spec.js
  │   └── so-create-visual.spec.js
  └── purchase-order/
      ├── po-list-visual.spec.js
      └── po-create-visual.spec.js
```

### 3️⃣ Wait for Page Stability

```javascript
// Wait for animations, loaders
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);  // Wait for CSS animations

await eyes.check('Stable Page', Target.window());
```

### 4️⃣ Use Ignore Regions Wisely

```javascript
// Ignore dynamic content
await eyes.check('Page', 
  Target.window()
    .ignoreRegions(
      '.timestamp',         // Changes every time
      '.live-chat-widget',  // External widget
      '#ad-banner'          // Ads rotate
    )
);
```

### 5️⃣ Test Critical User Journeys

Focus on:
- Login/Signup flows
- Checkout process
- Dashboard layouts
- Forms and validation
- Responsive breakpoints

### 6️⃣ Baseline Management

- Keep baselines up to date
- Use branches for feature development
- Merge baselines when merging code
- Review all changes carefully

---

## 🐛 Troubleshooting

### Error: "Missing API Key"

**Solution:**
```powershell
# Verify API key is set
$env:APPLITOOLS_API_KEY

# If empty, set it
$env:APPLITOOLS_API_KEY = "your-key-here"
```

### Error: "Test didn't run"

**Solution:**
```javascript
// Make sure to open and close Eyes
await eyes.open(page, 'App Name', 'Test Name');
// ... checks ...
await eyes.closeAsync();  // Don't forget this!
```

### Error: "Too many unresolved tests"

**Solution:**
- Review tests on Applitools dashboard
- Accept legitimate changes
- Reject bugs
- Update baselines

### Visual differences appear random

**Solution:**
```javascript
// Wait for stability
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// Ignore dynamic regions
await eyes.check('Page', 
  Target.window().ignoreRegions('.dynamic-content')
);
```

---

## 📚 Resources

- **Applitools Documentation:** https://applitools.com/docs
- **Playwright Integration:** https://applitools.com/docs/api-ref/sdk-api/playwright/js
- **Tutorial Videos:** https://applitools.com/tutorials
- **Blog:** https://applitools.com/blog
- **Community:** https://applitools.com/community

---

## 🎉 What's Next?

After mastering Applitools:

1. ✅ **Integrate with existing tests** - Add visual checks to current tests
2. ✅ **Set up visual baselines** - Run tests to create initial baselines
3. ✅ **Automate in CI/CD** - Run visual tests on every PR
4. ✅ **Monitor visual regressions** - Catch UI bugs automatically
5. ✅ **Expand coverage** - Add more pages, components, states

**Your Testing Maturity:**
- Stage 2 (Automation): 100% ✅
- Stage 3 (Advanced): 100% ✅
- **Stage 4 (AI Testing): 100% ✅** 🎉

You're now at the **cutting edge** of test automation! 🚀
