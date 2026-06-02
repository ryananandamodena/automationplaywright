# MHC Sales Order Creation - Testing Results

**Date:** April 13, 2026  
**System:** MHC (MODENA Retail)  
**Test Type:** E2E Automated Testing with Playwright

---

## 📋 Test Summary

### ✅ Successfully Automated Steps:
1. Login to MHC system
2. Navigate to Sales Order page
3. Open Create Sales Order wizard
4. Select customer from list
5. Navigate to Products selection page

### ⚠️ Partially Automated:
- Adding products (manual intervention needed due to modal complexity)

### ❌ Challenges Found:
- Modal dialog backdrop interferes with automated clicks
- Many products have no stock (disabled buttons)
- Dynamic product list requires stock checking

---

## 🔐 System Access

### URL & Credentials
```
Base URL: https://mhc-dev.modena.com
Email: muhzaenal5@gmail.com
Password: P@ssw0rd
```

### User Role
- **Sales Dealer MHC Kelapa Gading**
- Branch: MHCO1 - BPL 3

---

## 🎯 Correct Selectors Discovery

### Login Page
| Element | Correct Selector | Notes |
|---------|-----------------|-------|
| Email Input | `input[type="email"]` | Placeholder: "name@example.com" |
| Password Input | `input[type="password"]` | Placeholder: "Enter your password" |
| Login Button | `button:has-text('Login')` | **NOT** "Log In" (one word only!) |

### Sales Order Page
| Element | Correct Selector | Notes |
|---------|-----------------|-------|
| Sales Order Menu | `text="Sales Order"` | In sidebar menu |
| Create Button | `button:has-text('Create New')` | **NOT** "New Sales Order" |

### Create SO Wizard - Step 1: Customer
| Element | Correct Selector | Notes |
|---------|-----------------|-------|
| Search Input | `input[placeholder='Search data...']` | Search customer name |
| Customer Row | `table tbody tr` | Click row to select |
| Next Button | `button:has-text('Next Step')` | Proceed to products |

### Create SO Wizard - Step 2: Products
| Element | Correct Selector | Notes |
|---------|-----------------|-------|
| Add to Order Button | `button:has-text('Add to Order')` | One per product card |
| Search Products | `input[placeholder*='Search product']` | Filter products |

### Product Modal (appears after clicking Add)
| Element | Correct Selector | Issues |
|---------|-----------------|--------|
| Stock Source Radio | `Warehouse Ready/Display/Indent` | Select stock type |
| Quantity Input | Spinner with +/- buttons | Default: 1 |
| Add to Order (Confirm) | `button:has-text('Add to Order')` | **BLOCKED by backdrop** |
| Cancel | `button:has-text('Cancel')` | Close modal |

---

## 🔍 Key Findings

### 1. Login Flow
- ✅ Login successful
- ✅ Dashboard loads showing "Welcome back, Sales Dealer"
- ⚠️ URL stays at `/login` even after successful login
- ✅ Verify by checking dashboard elements, not URL

### 2. Sales Order Wizard (3 Steps)
The Create SO process uses a wizard with progress indicator:

**Step 1: CUSTOMER** → **Step 2: PRODUCTS** → **Step 3: REVIEW**

### 3. Product Selection Challenge
**Issue:** Modal backdrop prevents automated clicking

```
Error: <div class="fixed inset-0 z-50..." intercepts pointer events
```

**Visible in screenshot:** Modal dialog shows:
- Product name: "MODENA BUILT IN ELECTRIC OVEN - BO 1662 BABK"
- Stock info: 0 Units (READY), 0 Units (DISPLAY)
- Quantity selector
- Buttons: Cancel | Add to Order

**Solutions Attempted:**
- ❌ Direct click - blocked by backdrop
- ❌ `force: true` click - timeout
- ❌ Multiple selector strategies - still blocked
- ⚠️ **Recommended:** Manual intervention or browser automation with different approach

### 4. Stock Availability
**Problem:** Many products have disabled "Add to Order" buttons

```html
<button disabled title="Quantity exceeds available stock">
```

**Available Products Found:**
- THERMOSTAT (XR02CX) - Rp 3.323.100
- TANK HOT WATER ASSEMBLY - Rp 330.000
- Others with READY status visible

---

## 📸 Screenshots Generated

| File | Description |
|------|-------------|
| `mhc-login-page.png` | Login form with all buttons/inputs |
| `sales-order-page.png` | Sales Order list page |
| `create-so-form.png` | Create wizard - Customer selection |
| `products-page.png` | Products selection page |
| `after-add-product1.png` | **Modal dialog visible** |
| `salesorder-products-page.png` | Full products page view |

---

## 🚀 How to Run Tests

### Run Main Test (Up to Products Page)
```powershell
cd test-playwright
npx playwright test "fms/fms/vehicle/sales/craete_so_test.spec.js" --headed
```

### Run Inspection Tests (for debugging)
```powershell
# Inspect login page elements
npx playwright test "fms/fms/vehicle/sales/inspect-login.spec.js" --headed

# Inspect sales order page
npx playwright test "fms/fms/vehicle/sales/inspect-salesorder-page.spec.js" --headed

# Inspect create form
npx playwright test "fms/fms/vehicle/sales/inspect-create-form.spec.js" --headed
```

### Debug Mode
```powershell
npx playwright test "fms/fms/vehicle/sales/craete_so_test.spec.js" --headed --debug
```

---

## 📝 Test Files Created

| File | Purpose | Status |
|------|---------|--------|
| `craete_so_test.spec.js` | Main SO creation test | ✅ Working (up to products) |
| `create-so-simple.spec.js` | Simplified version with stock checking | ⚠️ Modal issue |
| `inspect-login.spec.js` | Inspect login page elements | ✅ Working |
| `test-login-only.spec.js` | Test login flow only | ✅ Working |
| `inspect-salesorder-page.spec.js` | Inspect SO page elements | ✅ Working |
| `inspect-create-form.spec.js` | Inspect create wizard | ✅ Working |

---

## 🎬 Working Test Flow

```javascript
// 1. Login
await page.goto('https://mhc-dev.modena.com');
await page.locator('input[type="email"]').fill('muhzaenal5@gmail.com');
await page.locator('input[type="password"]').fill('P@ssw0rd');
await page.locator("button:has-text('Login')").click();

// 2. Navigate to Sales Order
await page.locator('text="Sales Order"').first().click();

// 3. Create New
await page.locator("button:has-text('Create New')").click();

// 4. Select Customer
const searchInput = page.locator("input[placeholder='Search data...']");
await searchInput.fill('Dedi');
const firstCustomerRow = page.locator('table tbody tr').first();
await firstCustomerRow.click();

// 5. Go to Products
await page.locator("button:has-text('Next Step')").click();

// 6. Products page loaded - MANUAL INTERVENTION NEEDED
// User needs to manually click Add to Order and confirm modals
```

---

## 💡 Recommendations

### For Full Automation
1. **Modal Handling:** Consider using:
   - Keyboard navigation (Tab + Enter)
   - Native browser events (not Playwright locators)
   - API testing instead of UI for product addition

2. **Stock Management:** 
   - Filter only products with stock > 0
   - Use API to check stock before attempting to add

3. **Alternative Approach:**
   - Automate up to products page
   - Use API calls to add items to cart
   - Resume automation at review step

### For Manual Testing
- Use the automated test to reach products page quickly
- Manually add products (10 seconds)
- Can automate the submit step after

---

## 📊 Test Execution Stats

| Metric | Value |
|--------|-------|
| Total Test Duration | ~20 seconds (to products page) |
| Success Rate | 100% (for automated steps) |
| Screenshots Captured | 6 |
| Elements Inspected | 50+ |
| Iterations to Find Correct Selectors | 8 |

---

## 🐛 Known Issues

1. **Modal Backdrop Interception**
   - Severity: HIGH
   - Impact: Cannot automate product addition
   - Workaround: Manual intervention

2. **Out of Stock Products**
   - Severity: MEDIUM
   - Impact: Many products unavailable
   - Workaround: Filter by stock status

3. **URL-based Navigation Unreliable**
   - Severity: LOW
   - Impact: Cannot verify pages by URL
   - Workaround: Use element presence instead

---

## ✅ Success Criteria Met

- [x] Login automation working
- [x] Navigation to SO page working
- [x] Customer selection working
- [x] Reaching products page working
- [x] Screenshots for verification
- [x] Inspection tools for debugging
- [ ] Full end-to-end product addition (blocked)
- [ ] Order submission (pending product addition)

---

## 🔗 Related Files

- Main test: `craete_so_test.spec.js`
- Config: `playwright.config.js`
- Screenshots: `test-results/*.png`
- Storage state: `storageState.json`

---

**Last Updated:** April 13, 2026  
**Tested By:** Automated Testing (GitHub Copilot + Playwright)  
**Status:** ✅ Partial Success - Ready for Manual Product Addition
