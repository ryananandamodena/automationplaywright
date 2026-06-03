# 🚀 CI/CD + Allure Publishing Setup

## Overview

This GitHub Actions workflow automatically runs Playwright tests and publishes **Allure reports to GitHub Pages** on every push, PR, or schedule.

## 🌟 Features

✅ **Automatic Test Execution** - Runs on push, PR, schedule, or manual trigger  
✅ **Multi-Browser Support** - Chromium (extendable to Firefox, WebKit)  
✅ **Allure Report Publishing** - Beautiful reports on GitHub Pages  
✅ **Test Filtering** - Run specific test suites (smoke, contracts, SO, PO)  
✅ **Parallel Execution** - Fast test runs with matrix strategy  
✅ **Artifact Storage** - 30-day retention for reports, 7 days for screenshots  
✅ **Daily Scheduled Runs** - Automated regression testing at 2 AM WIB  
✅ **Status Notifications** - Summary with links to reports  

---

## 📁 Workflow File

Location: `.github/workflows/playwright-tests.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Daily schedule at 2 AM WIB (7 PM UTC)
- Manual dispatch with test suite selection

---

## 🔧 Setup Instructions

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select:
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`
4. Click **Save**

**GitHub Pages will be available at:**
```
https://YOUR_USERNAME.github.io/automationplaywright/reports/
```

### Step 2: Configure Secrets (Optional)

For private repositories or notifications:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `GITHUB_TOKEN` - Auto-provided by GitHub
   - `LOGIN_EMAIL` - (Optional) Test credentials
   - `LOGIN_PASSWORD` - (Optional) Test credentials

### Step 3: Push Workflow File

```powershell
git add .github/workflows/playwright-tests.yml
git commit -m "Add CI/CD workflow with Allure publishing"
git push origin main
```

### Step 4: Verify Workflow

1. Go to **Actions** tab on GitHub
2. See workflow running automatically
3. Wait for completion (~5-10 minutes)
4. Access Allure report at Pages URL

---

## 🎯 Manual Trigger

### Via GitHub UI

1. Go to **Actions** tab
2. Select "🎭 Playwright Tests with Allure Reports"
3. Click **Run workflow**
4. Select test suite:
   - `all` - All tests
   - `smoke` - Smoke tests only (@smoke tag)
   - `contracts` - Contract tests
   - `sales-orders` - SO tests
   - `purchase-orders` - PO tests
5. Click **Run workflow**

### Via GitHub CLI

```powershell
# Install GitHub CLI
winget install GitHub.cli

# Trigger workflow
gh workflow run playwright-tests.yml

# With specific test suite
gh workflow run playwright-tests.yml -f test_suite=smoke

# View workflow runs
gh run list --workflow=playwright-tests.yml

# View logs
gh run view
```

---

## 📊 Viewing Reports

### Allure Report (GitHub Pages)

```
https://YOUR_USERNAME.github.io/automationplaywright/reports/
```

**Features:**
- Interactive dashboard
- Test history (last 20 runs)
- Epic/Feature/Story organization
- Screenshots and attachments
- Trends and graphs

### Playwright HTML Report (Artifacts)

1. Go to **Actions** → Select workflow run
2. Scroll to **Artifacts** section
3. Download `playwright-report-chromium`
4. Extract and open `index.html`

### Test Screenshots (On Failure)

1. Go to **Actions** → Select workflow run
2. Download `test-screenshots-chromium`
3. View failure screenshots

---

## 🔄 Workflow Jobs

### 1️⃣ Test Job

**What it does:**
- Checks out code
- Sets up Node.js with npm cache
- Installs dependencies
- Installs Playwright browsers
- Runs tests based on trigger/input
- Generates Allure results
- Uploads artifacts

**Matrix strategy:**
```yaml
matrix:
  project: [chromium]
  # Extend to: [chromium, firefox, webkit]
```

**Artifacts uploaded:**
- `allure-results-{browser}` (30 days)
- `allure-report-{browser}` (30 days)
- `playwright-report-{browser}` (30 days)
- `test-screenshots-{browser}` (7 days, on failure)

### 2️⃣ Publish Report Job

**What it does:**
- Downloads all Allure results
- Combines results from all browsers
- Generates unified Allure report
- Maintains history (last 20 runs)
- Deploys to GitHub Pages (`gh-pages` branch)

**Dependencies:**
- Runs after `test` job completes
- Runs even if tests fail (`if: always()`)

### 3️⃣ Notify Job

**What it does:**
- Determines overall status
- Creates GitHub Step Summary
- Provides links to reports and artifacts

---

## ⚙️ Configuration

### Test Suite Selection

Edit workflow file to add more suites:

```yaml
workflow_dispatch:
  inputs:
    test_suite:
      options:
        - all
        - smoke
        - regression
        - api
        - e2e
```

### Schedule Customization

```yaml
schedule:
  # Daily at 2 AM WIB (7 PM UTC previous day)
  - cron: '0 19 * * *'
  
  # Mon-Fri at 8 AM WIB (1 AM UTC)
  - cron: '0 1 * * 1-5'
```

### Multi-Browser Testing

Uncomment in workflow file:

```yaml
matrix:
  project: [chromium, firefox, webkit]
```

**Impact:**
- 3x execution time
- More comprehensive coverage
- Higher resource usage

---

## 🐛 Troubleshooting

### Issue: Workflow not triggering

**Solution:**
1. Check workflow file is in `.github/workflows/`
2. Verify YAML syntax: https://yamlchecker.com/
3. Check repository Actions settings (enabled?)

### Issue: Tests fail in CI but pass locally

**Solution:**
1. Check environment variables in workflow
2. Verify BASE_URL settings
3. Check network/firewall restrictions
4. Review CI logs for specific errors

### Issue: GitHub Pages not showing report

**Solution:**
1. Verify Pages is enabled (Settings → Pages)
2. Check `gh-pages` branch exists
3. Wait 1-2 minutes for deployment
4. Clear browser cache

### Issue: Artifacts not uploading

**Solution:**
1. Check path exists: `Ryan/test-playwright/allure-results/`
2. Verify tests generated results
3. Check workflow permissions

---

## 📈 Best Practices

### 1️⃣ Test Organization

```javascript
// Use tags for filtering
test.describe('Sales Order @smoke @critical', () => {
  // ...
});
```

### 2️⃣ Parallel Execution

```javascript
// playwright.config.js
workers: process.env.CI ? 4 : 2
```

### 3️⃣ Retry Strategy

```javascript
retries: process.env.CI ? 2 : 1
```

### 4️⃣ Resource Management

```yaml
# Limit concurrent jobs
concurrency:
  group: tests-${{ github.ref }}
  cancel-in-progress: true
```

---

## 🎉 Success Metrics

**After setup, you get:**

✅ **Automated Testing** - Every code change tested automatically  
✅ **Historical Reports** - Track test trends over time  
✅ **Fast Feedback** - Results in ~5-10 minutes  
✅ **Team Visibility** - Reports accessible to everyone  
✅ **Quality Gates** - PR checks enforce quality  

**Testing Maturity:**
- **Stage 3: 100% ✅** - CI/CD + Allure + Docker + POM all complete!
- **Ready for Stage 4:** AI Testing with Applitools

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Allure Report Documentation](https://allurereport.org/)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
