# 📚 Page Object Model (POM) Guide

## 🎯 What is Page Object Model?

Page Object Model is a design pattern that creates an **object repository** for web UI elements. Instead of hardcoding selectors in tests, you create a class for each page with reusable methods.

### ❌ Without POM (Brittle)
```javascript
// Test 1
await page.click('button:has-text("Add Contract")');
await page.fill('input[type="email"]', 'test@email.com');

// Test 2  
await page.click('button:has-text("Add Contract")');
await page.fill('input[type="email"]', 'test@email.com');

// Problem: If UI changes, update in MANY places!
```

### ✅ With POM (Maintainable)
```javascript
// Test 1
const contractPage = new ContractPage(page);
await contractPage.clickAddContract();
await contractPage.fillEmail('test@email.com');

// Test 2
const contractPage = new ContractPage(page);
await contractPage.clickAddContract();
await contractPage.fillEmail('test@email.com');

// Solution: UI changes? Update in ONE place (ContractPage class)!
```

---

## 📁 Structure

```
pages/
├── BasePage.js         ← Base class with common methods
├── LoginPage.js        ← Login functionality
├── ContractPage.js     ← Contract management
└── README.md          ← This file

Your future pages:
├── SalesOrderPage.js
├── PurchaseOrderPage.js
├── VehiclePage.js
└── ...etc
```

---

## 🏗️ Architecture

### 1. **BasePage.js** - Foundation
Contains common methods ALL pages need:
- `click()` - Click with auto-wait
- `fill()` - Fill input with auto-wait  
- `waitForElement()` - Smart waiting
- `screenshot()` - Take screenshots
- `handleSweetAlert()` - Handle popup dialogs
- `selectReactSelect()` - Handle React Select dropdowns

**All page objects extend BasePage!**

### 2. **LoginPage.js** - Authentication
Handles login operations:
- `navigate(baseUrl)` - Go to login page
- `login(email, password)` - Perform login
- `selectApplication(appName)` - Select app (FMS/MHC)
- `loginAndSelectApp()` - Full login flow
- `isLoggedIn()` - Check login status
- `logout()` - Logout

### 3. **ContractPage.js** - Contract Operations
Handles contract management:
- `navigate(baseUrl)` - Go to contracts page
- `clickAddContract()` - Open form
- `fillContractForm(data)` - Fill all fields
- `saveContract()` - Submit form
- `createContract(data)` - Full creation flow
- `searchContract(term)` - Search functionality
- `deleteFirstContract()` - Delete operations

---

## 🚀 How to Use

### Example 1: Simple Login Test
```javascript
import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';

test('Login to FMS', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.loginAndSelectApp(
    'https://portal-dev.modena.com',
    'ryan.ananda@modena.com',
    'P@ssw0rd_ryan.ananda',
    'FMS (DEV)'
  );
  
  // That's it! Login handled
});
```

### Example 2: Create Contract Test
```javascript
import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { ContractPage } from './pages/ContractPage.js';

test('Create new contract', async ({ page }) => {
  // 1. Login
  const loginPage = new LoginPage(page);
  await loginPage.loginAndSelectApp(
    'https://portal-dev.modena.com',
    'ryan.ananda@modena.com',
    'P@ssw0rd_ryan.ananda',
    'FMS (DEV)'
  );
  
  // 2. Navigate to contracts
  const contractPage = new ContractPage(page);
  await contractPage.navigate('https://portal-dev.modena.com');
  
  // 3. Create contract
  const result = await contractPage.createContract({
    vendor: 'PT',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    vehicle: 1,
    channel: 'Retail',
    branch: 'Jakarta',
    mainUser: 'Ryan',
    rentCost: 5000000
  });
  
  // 4. Verify
  expect(result.success).toBeTruthy();
  console.log(`✅ Created contract! Count: ${result.initialCount} → ${result.finalCount}`);
});
```

### Example 3: Search & Delete Contract
```javascript
import { test } from '@playwright/test';
import { ContractPage } from './pages/ContractPage.js';

test('Search and delete contract', async ({ page }) => {
  // Assume already logged in via storageState
  
  const contractPage = new ContractPage(page);
  await contractPage.navigate('https://portal-dev.modena.com');
  
  // Search
  const count = await contractPage.searchContract('PT ABC');
  expect(count).toBeGreaterThan(0);
  
  // Delete first result
  await contractPage.deleteFirstContract();
});
```

---

## 🎨 Creating New Page Objects

### Template:
```javascript
import { BasePage } from './BasePage.js';

export class YourPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Define selectors
    this.selectors = {
      mainButton: 'button:has-text("Main")',
      inputField: 'input[name="field"]',
      // ... etc
    };
  }

  // Navigation
  async navigate(baseUrl) {
    await this.goto(`${baseUrl}/your/path`);
    await this.waitForPageLoad();
  }

  // Actions
  async clickMainButton() {
    await this.click(this.selectors.mainButton);
  }

  async fillInputField(value) {
    await this.fill(this.selectors.inputField, value);
  }

  // High-level workflows
  async completeWorkflow(data) {
    await this.clickMainButton();
    await this.fillInputField(data.field);
    // ... more steps
    return await this.submit();
  }
}
```

---

## 💡 Best Practices

### ✅ DO:
1. **One class per page/component**
   - `LoginPage` for login
   - `ContractPage` for contracts
   - `DashboardPage` for dashboard

2. **Descriptive method names**
   ```javascript
   // ✅ Good
   await contractPage.fillVendorDropdown('PT ABC');
   
   // ❌ Bad
   await contractPage.fill1('PT ABC');
   ```

3. **Return useful data**
   ```javascript
   async createContract(data) {
     // ...
     return {
       success: true,
       contractId: 123,
       message: 'Contract created'
     };
   }
   ```

4. **Handle common patterns in BasePage**
   - SweetAlerts
   - React Select dropdowns
   - Loading states
   - Error messages

5. **Use locators instead of strings**
   ```javascript
   // ✅ Better - stored in selectors object
   this.selectors.button = 'button:has-text("Save")';
   
   // ❌ Avoid - hardcoded in methods
   await page.click('button:has-text("Save")');
   ```

### ❌ DON'T:
1. **Don't put assertions in Page Objects**
   ```javascript
   // ❌ Bad - assertion in page object
   async createContract() {
     await this.click(saveButton);
     expect(result).toBeTruthy(); // NO!
   }
   
   // ✅ Good - return data, assert in test
   async createContract() {
     await this.click(saveButton);
     return { success: true };
   }
   ```

2. **Don't mix test logic with page logic**
   - Page Objects = HOW to interact
   - Tests = WHAT to verify

3. **Don't create god objects**
   - Keep page objects focused
   - One page = one responsibility

---

## 🔄 Refactoring Existing Tests

### Step 1: Identify Page Objects Needed
Look at your test:
```javascript
// This test needs:
// - LoginPage (login flow)
// - ContractPage (contract operations)
```

### Step 2: Extract Selectors
```javascript
// Old test
await page.click('button:has-text("Add")');

// Becomes
this.selectors.addButton = 'button:has-text("Add")';
```

### Step 3: Create Methods
```javascript
// Old test code
await page.click('button:has-text("Add")');
await page.fill('input[name="vendor"]', 'PT ABC');
await page.click('button:has-text("Save")');

// Becomes one method in ContractPage
async createQuickContract(vendorName) {
  await this.click(this.selectors.addButton);
  await this.fill(this.selectors.vendorInput, vendorName);
  await this.click(this.selectors.saveButton);
}
```

### Step 4: Update Test
```javascript
// Old test
test('Create contract', async ({ page }) => {
  await page.goto('...');
  await page.click('button:has-text("Add")');
  // 20 more lines...
});

// New test
test('Create contract', async ({ page }) => {
  const contractPage = new ContractPage(page);
  await contractPage.navigate(BASE_URL);
  await contractPage.createQuickContract('PT ABC');
});
```

---

## 📊 Benefits

### 1. **Maintainability** 🛠️
- UI changes? Update ONE place
- Add features? Extend page object
- Rename fields? Update selector object

### 2. **Reusability** ♻️
```javascript
// Use same page object in multiple tests
test('Test 1', async ({ page }) => {
  const contract = new ContractPage(page);
  await contract.createContract(data);
});

test('Test 2', async ({ page }) => {
  const contract = new ContractPage(page);
  await contract.searchContract('ABC');
});
```

### 3. **Readability** 📖
```javascript
// Clear what test does
await loginPage.login(email, password);
await contractPage.createContract(data);
await contractPage.verifyContractExists(contractId);
```

### 4. **Reduced Duplication** 🔄
- Login code once in LoginPage
- Used everywhere
- DRY principle

### 5. **Easier Testing** ✅
```javascript
// Test focuses on WHAT, not HOW
test('Create 10 contracts', async ({ page }) => {
  const contractPage = new ContractPage(page);
  
  for (let i = 0; i < 10; i++) {
    await contractPage.createContract({ vendor: `PT ${i}` });
  }
});
```

---

## 🎯 Next Steps

1. **✅ Review examples** - Understand BasePage, LoginPage, ContractPage
2. **🔨 Create PurchaseOrderPage** - Apply pattern to PO tests
3. **🔨 Create SalesOrderPage** - Apply pattern to SO tests
4. **♻️ Refactor existing tests** - Use page objects
5. **📚 Expand library** - Add more page objects as needed

---

## 📚 Resources

- [Playwright POM Docs](https://playwright.dev/docs/pom)
- [Martin Fowler - PageObject](https://martinfowler.com/bliki/PageObject.html)
- [POM Best Practices](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)

---

**Need help?** Check existing page objects (`LoginPage.js`, `ContractPage.js`) for examples!
