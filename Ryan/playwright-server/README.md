# FMS E2E Testing with Playwright

Automated end-to-end testing untuk FMS (Facility Management System) Contract & Service modules.

## 📁 Project Structure

```
playwright-server/
├── test-playwright/
│   ├── create-contract-simple.mjs          # ✅ Contract creation (Production)
│   ├── contract-service-e2e-flexible.mjs   # ✅ Full E2E test (Production)
│   ├── contract-approval-e2e.mjs           # ⚠️ Approval flow (Needs config)
│   ├── create-contracts-batch.mjs          # 📦 Batch creation
│   └── run-vehicle-e2e-incognito.mjs       # 🚗 Vehicle E2E
├── .env                                     # Environment variables (local)
├── .env.example                             # Template
├── package.json                             # Dependencies
└── README.md                                # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd playwright-server
npm install
npx playwright install chromium
```

### 2. Setup Environment
```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env
```

### 3. Run Tests

#### Contract Creation (Recommended)
```bash
cd test-playwright
node create-contract-simple.mjs
```

#### Full E2E Test
```bash
node contract-service-e2e-flexible.mjs
```

#### Headless Mode
```bash
HEADLESS=true node create-contract-simple.mjs
```

## 📊 Available Tests

| Script | Status | Success Rate | Description |
|--------|--------|--------------|-------------|
| `create-contract-simple.mjs` | ✅ Production | 100% | Simple contract creation |
| `contract-service-e2e-flexible.mjs` | ✅ Production | 83% | Full E2E (Contract + Service) |
| `contract-approval-e2e.mjs` | ⚠️ Partial | 25% | Multi-user approval flow |
| `create-contracts-batch.mjs` | 📦 Ready | N/A | Batch contract creation |
| `run-vehicle-e2e-incognito.mjs` | 🚗 Ready | N/A | Vehicle E2E with approval |

## 🔧 Configuration

### Environment Variables

```bash
# Application
BASE_URL=https://portal-dev.modena.com

# User Credentials
ADMIN_EMAIL=ryan.ananda@modena.com
ADMIN_PASSWORD=P@ssw0rd_ryan.ananda
APPROVER1_EMAIL=novyan.ramdhan@modena.com
APPROVER1_PASSWORD=P@ssw0rd_novyan.ramdhan
APPROVER2_EMAIL=daniel.aritonga@modena.com
APPROVER2_PASSWORD=P@ssw0rd_daniel.aritonga

# Test Settings
HEADLESS=false
TIMEOUT=30000
```

## 🎯 CI/CD Integration

### GitHub Actions
File: `.github/workflows/e2e-tests.yml` ✅

**Setup:**
1. Add secrets in GitHub: Settings → Secrets → Actions
2. Push to repository
3. Check Actions tab

**Triggers:**
- Push to main/develop
- Pull requests
- Manual trigger
- Scheduled (daily 2 AM)

### GitLab CI/CD
File: `.gitlab-ci.yml` ✅

**Setup:**
1. Add variables in GitLab: Settings → CI/CD → Variables
2. Push to repository
3. Check CI/CD → Pipelines

## 📚 Documentation

| File | Description |
|------|-------------|
| `CI_CD_QUICK_START.md` | Setup CI/CD dalam 5 menit |
| `CI_CD_SETUP_GUIDE.md` | Complete CI/CD guide (all platforms) |
| `FINAL_E2E_SUMMARY.md` | Test results & summary |
| `APPROVAL_E2E_GUIDE.md` | Approval flow testing guide |
| `CONTRACT_SERVICE_E2E_RESULTS.md` | Detailed test results |

## ✨ Features

### Flexible Data Approach
- ✅ Auto-selects first available options
- ✅ Dynamic date generation
- ✅ Random cost generation
- ✅ Adapts to system data

### Multi-User Support
- ✅ Isolated browser contexts
- ✅ Automatic login/logout
- ✅ Session management

### Robust Detection
- ✅ Multiple fallback selectors
- ✅ React-select handling
- ✅ Dynamic element waiting
- ✅ Error recovery

### Comprehensive Logging
- ✅ Step-by-step progress
- ✅ Success/failure indicators
- ✅ Screenshot on each step
- ✅ Detailed error messages

## 🐛 Troubleshooting

### Issue: Tests fail locally
```bash
# Check Node.js version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npx playwright install chromium
```

### Issue: Login fails
```bash
# Verify credentials in .env
cat .env

# Test with visible browser
HEADLESS=false node create-contract-simple.mjs
```

### Issue: Elements not found
```bash
# Increase timeout
export TIMEOUT=60000
node create-contract-simple.mjs
```

## 📈 Test Results

### Latest Run (30 March 2026)

**Contract Creation:**
- Status: ✅ Success
- Initial: 9 contracts
- Final: 10 contracts
- Time: ~45 seconds

**Full E2E:**
- Status: ✅ 83% Success (5/6 passed)
- Login: ✅
- Create Contract: ✅
- View Details: ✅
- Search/Filter: ✅
- Export: ✅
- Create Service: ⚠️ (form opens, submit button issue)

**Approval Flow:**
- Status: ⚠️ 25% Success (1/4 passed)
- Create Contract: ✅
- Approve Level 1: ❌ (no approval access)
- Approve Level 2: ❌ (button not found)
- Verify Status: ❌

## 🎓 Best Practices

1. **Always test locally first**
   ```bash
   HEADLESS=true node create-contract-simple.mjs
   ```

2. **Use environment variables**
   ```javascript
   const BASE_URL = process.env.BASE_URL || 'default';
   ```

3. **Handle errors gracefully**
   ```javascript
   if (await button.isVisible().catch(() => false)) {
     await button.click();
   }
   ```

4. **Take screenshots**
   ```javascript
   await page.screenshot({ path: 'step.png', fullPage: true });
   ```

5. **Clean up after tests**
   ```javascript
   await browser.close();
   ```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request
5. CI/CD will run automatically

## 📞 Support

- **Documentation**: Check `*.md` files in this directory
- **Issues**: Create GitHub/GitLab issue
- **Questions**: Contact team

## 📝 License

Internal use only - MODENA

---

**Last Updated**: 30 March 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
