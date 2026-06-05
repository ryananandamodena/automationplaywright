# 📊 Allure Reporting - Complete Setup Guide

## 🎯 What is Allure?

**Allure** is a powerful, flexible test report framework that provides:
- Beautiful, interactive test reports
- Test history & trends
- Detailed test execution steps
- Screenshots & attachments
- Test categorization & filtering
- Integration with CI/CD

### ❌ Before Allure (Basic HTML Report):
- Simple pass/fail list
- Limited information
- No history
- No trends
- Basic screenshots

### ✅ With Allure (Advanced Reporting):
- Interactive dashboard
- Test categorization (Epics, Features, Stories)
- Step-by-step execution details
- Screenshots & attachments embedded
- Test history & trends over time
- Failure analysis
- Flaky test detection

---

## ✅ Setup Complete!

Allure has been installed and configured in your project:

### Packages Installed:
```json
{
  "allure-playwright": "^2.x.x",
  "allure-commandline": "^2.x.x"
}
```

### Configuration Updated:
- ✅ `playwright.config.js` - Allure reporter configured
- ✅ `package.json` - NPM scripts added
- ✅ `.gitignore` - Allure directories excluded

---

## 🚀 How to Use

### Quick Start (All-in-One):
```bash
npm run test:allure:report
```

This command will:
1. Run all tests
2. Generate Allure report
3. Open report in browser automatically

### Step-by-Step Commands:

#### 1. Run Tests:
```bash
npm run test:allure
```
Generates `allure-results/` folder with test data

#### 2. Generate Report:
```bash
npm run allure:generate
```
Creates `allure-report/` folder with HTML report

#### 3. Open Report:
```bash
npm run allure:open
```
Opens report in browser

#### Quick Serve (Skip Generate):
```bash
npm run allure:serve
```
Generates and serves report in one command

---

## 📝 Writing Tests with Allure

### Basic Test Structure:

```javascript
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test('My test', async ({ page }) => {
  // Add metadata
  await allure.epic('User Management');
  await allure.feature('Login');
  await allure.story('User can login with valid credentials');
  await allure.severity('critical');
  await allure.tag('smoke', 'login');
  
  // Add steps
  await allure.step('Navigate to login page', async () => {
    await page.goto('/login');
  });
  
  await allure.step('Enter credentials', async () => {
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password');
  });
  
  await allure.step('Click login button', async () => {
    await page.click('button[type="submit"]');
  });
  
  // Add attachments
  const screenshot = await page.screenshot();
  await allure.attachment('Login Page', screenshot, 'image/png');
  
  // Add parameters
  await allure.parameter('Email', 'user@example.com');
  await allure.parameter('Browser', 'Chrome');
});
```

---

## 🏷️ Allure Annotations

### 1. Test Organization:

#### `allure.epic(name)`
Highest level grouping (e.g., "FMS System", "E-commerce")
```javascript
await allure.epic('FMS - Facility Management System');
```

#### `allure.feature(name)`
Feature under epic (e.g., "Contract Management", "User Auth")
```javascript
await allure.feature('Contract Management');
```

#### `allure.story(name)`
Specific user story/scenario
```javascript
await allure.story('Create new vehicle contract');
```

### 2. Test Metadata:

#### `allure.severity(level)`
Criticality: `blocker`, `critical`, `normal`, `minor`, `trivial`
```javascript
await allure.severity('critical');
```

#### `allure.tag(...tags)`
Tags for filtering (smoke, regression, etc.)
```javascript
await allure.tag('smoke', 'contract', 'create');
```

#### `allure.owner(name)`
Who maintains/owns this test
```javascript
await allure.owner('Ryan Ananda');
```

#### `allure.description(text)`
Detailed test description (supports Markdown)
```javascript
await allure.description(`
  This test validates contract creation flow.
  
  **Preconditions:**
  - User must be logged in
  - FMS application accessible
`);
```

### 3. Links & References:

#### `allure.link(url, name)`
Link to documentation, app, etc.
```javascript
await allure.link('https://portal-dev.modena.com', 'FMS Portal');
```

#### `allure.issue(id, url)`
Link to bug/issue tracker
```javascript
await allure.issue('JIRA-123', 'https://jira.company.com/JIRA-123');
```

#### `allure.tms(id, url)`
Link to test management system
```javascript
await allure.tms('TC-456', 'https://testmanager.com/TC-456');
```

### 4. Test Steps:

#### `allure.step(name, callback)`
Nested test steps for detailed reporting
```javascript
await allure.step('Login to application', async () => {
  await allure.step('Enter email', async () => {
    await page.fill('#email', 'test@test.com');
  });
  
  await allure.step('Enter password', async () => {
    await page.fill('#password', 'password');
  });
  
  await allure.step('Click submit', async () => {
    await page.click('button[type="submit"]');
  });
});
```

### 5. Attachments:

#### Screenshots:
```javascript
const screenshot = await page.screenshot();
await allure.attachment('Page Screenshot', screenshot, 'image/png');

// Or full page
const fullScreenshot = await page.screenshot({ fullPage: true });
await allure.attachment('Full Page', fullScreenshot, 'image/png');
```

#### JSON Data:
```javascript
const testData = { name: 'Test', value: 123 };
await allure.attachment('Test Data', JSON.stringify(testData, null, 2), 'application/json');
```

#### Text Logs:
```javascript
await allure.attachment('Test Log', 'This is a log message', 'text/plain');
```

#### HTML Content:
```javascript
const htmlContent = '<h1>Test Result</h1><p>Success!</p>';
await allure.attachment('HTML Report', htmlContent, 'text/html');
```

### 6. Parameters:

#### Test Parameters:
```javascript
await allure.parameter('Environment', 'DEV');
await allure.parameter('User', 'ryan.ananda@modena.com');
await allure.parameter('Browser', 'Chromium');
await allure.parameter('Test Data ID', 'DATA-001');
```

---

## 📊 Report Features

### 1. Overview Dashboard
- Total tests (passed/failed/broken/skipped)
- Success rate percentage
- Test duration
- Trends graph

### 2. Test Categories
- **Epics** - High-level features
- **Features** - Specific functionality
- **Stories** - User scenarios

### 3. Test Details
- Test name & description
- Execution steps (nested)
- Screenshots & attachments
- Parameters used
- Error stack traces (for failures)
- Test duration
- Retry information

### 4. Graphs & Charts
- **Duration Trend** - Test execution time over time
- **Success Rate Trend** - Pass/fail percentage history
- **Categories** - Failed test categorization
- **Severity** - Tests by criticality

### 5. Test History
- Historical test results
- Flaky test detection
- Duration trends per test
- Failure patterns

---

## 🎨 Best Practices

### 1. **Use Meaningful Names**
```javascript
// ❌ Bad
await allure.step('Step 1', async () => { ... });

// ✅ Good
await allure.step('Login with admin credentials', async () => { ... });
```

### 2. **Add Context with Attachments**
```javascript
// Always attach screenshots on important steps
await allure.step('Submit form', async () => {
  await page.click('button[type="submit"]');
  
  // Attach screenshot of result
  const screenshot = await page.screenshot();
  await allure.attachment('Submit Result', screenshot, 'image/png');
});
```

### 3. **Organize Tests Logically**
```javascript
// Use Epic → Feature → Story hierarchy
await allure.epic('E-commerce Platform');
await allure.feature('Shopping Cart');
await allure.story('Add product to cart');
```

### 4. **Set Appropriate Severity**
```javascript
// Critical business flows
await allure.severity('blocker'); // System down if fails

// Important features
await allure.severity('critical'); // Major functionality broken

// Regular tests
await allure.severity('normal'); // Standard test case

// Nice-to-have
await allure.severity('minor'); // UI issues, etc.
```

### 5. **Tag for Easy Filtering**
```javascript
await allure.tag('smoke'); // Quick smoke tests
await allure.tag('regression'); // Full regression suite
await allure.tag('api'); // API tests
await allure.tag('ui'); // UI tests
```

### 6. **Add Parameters for Data-Driven Tests**
```javascript
const testData = [
  { vendor: 'PT ABC', expected: 'success' },
  { vendor: 'PT XYZ', expected: 'success' }
];

for (const data of testData) {
  test(`Create contract for ${data.vendor}`, async ({ page }) => {
    await allure.parameter('Vendor', data.vendor);
    await allure.parameter('Expected Result', data.expected);
    // ... test implementation
  });
}
```

---

## 📁 File Structure

After running tests with Allure:

```
test-playwright/
├── allure-results/          ← Test execution data (JSON)
│   ├── xxxx-result.json
│   ├── xxxx-attachment.png
│   └── ...
├── allure-report/           ← Generated HTML report
│   ├── index.html
│   ├── data/
│   ├── history/
│   └── ...
├── playwright-report/       ← Standard Playwright HTML report
└── test-results/            ← Test artifacts & screenshots
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example:

```yaml
- name: Run tests with Allure
  run: npm run test:allure
  
- name: Generate Allure Report
  if: always()
  run: npm run allure:generate
  
- name: Upload Allure Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: allure-report
    path: allure-report/
    retention-days: 30

- name: Publish Allure Report
  if: always()
  uses: simple-elf/allure-report-action@master
  with:
    allure_results: allure-results
    allure_history: allure-history
    keep_reports: 20
```

---

## 🎯 Example Workflows

### Workflow 1: Daily Test Run
```bash
# Morning: Run full test suite
npm run test:allure

# Generate & view report
npm run allure:serve
```

### Workflow 2: Quick Smoke Test
```bash
# Run only smoke tests
npx playwright test --grep @smoke

# View results
npm run allure:serve
```

### Workflow 3: CI/CD Pipeline
```bash
# In CI pipeline
npm run test:allure
npm run allure:generate

# Archive allure-report/ folder
# Deploy to static hosting (S3, GitHub Pages, etc.)
```

---

## 📚 Demo Test

Run the demo test to see Allure in action:

```bash
npx playwright test contract-allure-demo.spec.js
npm run allure:serve
```

This will show you:
- ✅ Epic/Feature/Story organization
- ✅ Nested test steps
- ✅ Screenshots attachments
- ✅ JSON data attachments
- ✅ Test parameters
- ✅ Positive & negative tests

---

## 🔍 Troubleshooting

### Issue: "allure command not found"
```bash
# Reinstall allure-commandline
npm install -D allure-commandline
```

### Issue: "No allure-results found"
```bash
# Make sure you ran tests first
npm run test:allure

# Then generate report
npm run allure:generate
```

### Issue: "Report is empty"
```bash
# Clean old results
rm -rf allure-results allure-report

# Run tests again
npm run test:allure:report
```

### Issue: "Port already in use"
```bash
# Kill existing Allure server
# Then run again
npm run allure:serve
```

---

## 📊 Report Interpretation

### Test Status:
- **✅ Passed** - Test executed successfully
- **❌ Failed** - Test failed with assertion error
- **💔 Broken** - Test failed with exception/error
- **⏭️ Skipped** - Test was skipped
- **❓ Unknown** - Test status unclear

### Categories:
- **Product Defects** - Failed assertions (bugs in app)
- **Test Defects** - Test code errors (bugs in test)
- **Flaky Tests** - Intermittent failures (timing issues)

---

## 🎓 Learning Resources

- **Allure Docs:** https://docs.qameta.io/allure/
- **Playwright Integration:** https://www.npmjs.com/package/allure-playwright
- **Examples:** `contract-allure-demo.spec.js`

---

## ✅ Summary

You now have **enterprise-grade test reporting**!

**What You Get:**
- ✅ Beautiful interactive reports
- ✅ Test categorization (Epic/Feature/Story)
- ✅ Step-by-step execution tracking
- ✅ Screenshots & attachments
- ✅ Test history & trends
- ✅ Flaky test detection
- ✅ CI/CD ready

**Next Steps:**
1. Run demo test: `npx playwright test contract-allure-demo.spec.js`
2. Generate report: `npm run allure:serve`
3. Explore the report features
4. Add Allure annotations to existing tests

---

**Ready to see your first Allure report?** Run the demo! 🚀
