# Quick Start Guide - GCCS Mobile Testing

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd playwright-server/test-playwright/gccs/mobile
npm install
npx playwright install chromium
```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `MOBILE_BASE_URL` in `.env` file with your actual GCCS Mobile URL

### Step 3: Run Tests

**Option A: Using PowerShell Script (Recommended)**
```powershell
.\run-tests.ps1
```

**Option B: Using NPM Scripts**
```bash
# Run all tests
npm test

# Run specific scenario
npm run test:login
npm run test:dashboard
npm run test:confirmation
npm run test:visit
npm run test:negative

# Run with UI mode (interactive)
npm run test:ui

# Run with debug mode
npm run test:debug
```

**Option C: Direct Playwright Command**
```bash
npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js
```

### Step 4: View Results

```bash
# Open HTML report
npm run report

# Or manually
npx playwright show-report mobile-test-report
```

---

## 📋 Test Scenarios Included

✅ **TC-MOB-001**: Login with valid credentials  
✅ **TC-MOB-002**: Dashboard verification  
✅ **TC-MOB-003**: Select RON Waiting Confirmation  
✅ **TC-MOB-004**: Confirmation process  
✅ **TC-MOB-005**: Start Visit process  
❌ **TC-MOB-NEG-001**: Invalid login (negative test)  
❌ **TC-MOB-NEG-002**: Double-click confirmation prevention  
❌ **TC-MOB-NEG-003**: Double-click start visit prevention  

---

## 📸 Evidence Collection

All tests automatically capture:

- **Screenshots**: Saved in `screenshots/` folder
- **Videos**: Saved in `test-results/` folder
- **Traces**: For debugging, view with `npx playwright show-trace`
- **Console Logs**: Captured in test output

---

## 🔧 Configuration Options

### Mobile Device Emulation

Tests run with **Pixel 5** emulation by default. To use other devices:

Edit `playwright.config.mobile.js`:
```javascript
projects: [
  {
    name: 'mobile-android-pixel5',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'mobile-android-galaxy',
    use: { ...devices['Galaxy S9+'] },
  },
  {
    name: 'mobile-iphone',
    use: { ...devices['iPhone 12'] },
  },
]
```

Then run specific project:
```bash
npx playwright test --project=mobile-android-galaxy
```

### GPS Location

Default: Jakarta, Indonesia (106.8456, -6.2088)

To change location, edit in config:
```javascript
geolocation: { 
  longitude: YOUR_LONGITUDE, 
  latitude: YOUR_LATITUDE 
}
```

---

## 🐛 Troubleshooting

### Test fails to find elements

**Solution**: Use Playwright Inspector to find correct selectors
```bash
npx playwright test mobile_gccs.spec.js --debug
```

### Timeout errors

**Solution**: Increase timeout in test or config
```javascript
test.setTimeout(120000); // 2 minutes
```

### GPS not working

**Solution**: Ensure geolocation permission is granted
```javascript
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ longitude: X, latitude: Y });
```

### Tests run too fast

**Solution**: Add slow motion
```javascript
use: {
  launchOptions: {
    slowMo: 1000 // 1 second delay between actions
  }
}
```

---

## 📚 Documentation

- [Full README](README.md) - Comprehensive guide
- [Test Cases](TEST_CASES.md) - Detailed test case documentation
- [Helper Functions](mobile-helpers.js) - Reusable utility functions

---

## 🎯 Next Steps

1. **Customize selectors** in test file to match your actual app
2. **Update base URL** to your environment
3. **Run tests** and verify they pass
4. **Integrate with CI/CD** (see README for examples)
5. **Expand test coverage** with additional scenarios

---

## 💡 Pro Tips

- Use `--ui` mode for interactive debugging
- Use `--headed` to see browser during test execution
- Use `--reporter=html` for beautiful test reports
- Check `screenshots/` folder after each run
- Review `test-results/` for videos of failed tests

---

## 📞 Support

For issues or questions:
- Check [README.md](README.md) troubleshooting section
- Review Playwright documentation: https://playwright.dev
- Contact QA team

---

**Happy Testing! 🚀**
