# Contract Approval E2E Testing Guide

## Overview
Script untuk testing complete approval flow dengan multiple users:
1. **Ryan Ananda** - Membuat contract
2. **Novyan** - Approve level 1
3. **Daniel Aritonga** - Approve level 2

## Prerequisites

### User Accounts Required
```javascript
const USERS = {
  admin: {
    email: 'ryan.ananda@modena.com',
    password: 'P@ssw0rd_ryan.ananda',
    role: 'Admin/Creator'
  },
  approver1: {
    email: 'novyan.ramdhan@modena.com',
    password: 'P@ssw0rd_novyan.ramdhan',
    role: 'Approver 1'
  },
  approver2: {
    email: 'daniel.aritonga@modena.com',
    password: 'P@ssw0rd_daniel.aritonga',
    role: 'Approver 2'
  }
};
```

### System Requirements
- Approval workflow harus aktif di sistem
- User Novyan dan Daniel harus memiliki role approver
- Contract harus memerlukan approval (tidak auto-approved)

## How to Run

### Basic Execution
```bash
cd playwright-server/test-playwright
node contract-approval-e2e.mjs
```

### Expected Flow
```
1. Ryan Login → Create Contract → Logout
   ↓
2. Novyan Login → Find Contract → Approve → Logout
   ↓
3. Daniel Login → Find Contract → Approve → Logout
   ↓
4. Verify Final Status (Fully Approved)
```

## Script Features

### 1. Multi-Context Isolation
```javascript
// Each user gets separate browser context
const contextRyan = await browser.newContext({ viewport: null });
const contextNovyan = await browser.newContext({ viewport: null });
const contextDaniel = await browser.newContext({ viewport: null });
```

### 2. Flexible Data Creation
- Auto-generates dates (today + 1 month, + 1 year)
- Random rent cost (3-8 million)
- Auto-selects first available options from dropdowns

### 3. Robust Approval Detection
```javascript
// Multiple fallback methods:
1. Check approval menu/page
2. Try direct approval URLs
3. Search for contract
4. Look for approve button in list
5. Open contract details
6. Look for approve button in details
```

### 4. Comprehensive Logging
- Step-by-step progress
- Contract ID tracking
- Success/failure indicators
- Screenshot at each step

## Screenshots Generated

| File | Description |
|------|-------------|
| `approval-01-contract-form.png` | Contract form filled by Ryan |
| `approval-02-contract-submitted.png` | After contract submission |
| `approval-03-contract-list.png` | Contract list with new entry |
| `approval-04-novyan-page.png` | Novyan's approval page |
| `approval-05-novyan-search.png` | Search for contract |
| `approval-06-novyan-approved.png` | After Novyan approval |
| `approval-07-novyan-details.png` | Contract details view |
| `approval-08-daniel-search.png` | Daniel's search |
| `approval-09-daniel-approved.png` | After Daniel approval |
| `approval-10-final-status.png` | Final contract status |

## Troubleshooting

### Issue 1: Contract Not Created
**Symptoms**: "Add Contract" button not found

**Solutions**:
1. Check if contract page is accessible
2. Verify Ryan has permission to create contracts
3. Check if page URL is correct
4. Inspect actual button text/selector

### Issue 2: Approve Button Not Found
**Symptoms**: "Approve button not found"

**Possible Causes**:
1. Contract does not require approval (auto-approved)
2. User does not have approval permission
3. Contract already approved
4. Approval button is in different location

**Solutions**:
1. Check user roles and permissions
2. Verify approval workflow is enabled
3. Check contract status manually
4. Inspect approval page HTML

### Issue 3: Login Failed
**Symptoms**: Cannot login with provided credentials

**Solutions**:
1. Verify passwords are correct
2. Check if accounts are active
3. Verify FMS access for each user
4. Check for 2FA or additional security

### Issue 4: Search Not Working
**Symptoms**: Contract not found in search

**Solutions**:
1. Wait longer after contract creation
2. Check if contract ID format is correct
3. Try searching without full ID
4. Check if search is case-sensitive

## Customization

### Change Users
Edit the `USERS` object at the top of the script:
```javascript
const USERS = {
  admin: {
    email: 'your.admin@modena.com',
    password: 'YourPassword',
    name: 'Your Name',
    role: 'Admin'
  },
  // ... add more users
};
```

### Change Contract Data
Modify the contract creation section:
```javascript
// Custom dates
const startDateStr = '2026-05-01';
const endDateStr = '2027-04-30';

// Custom cost
const rentCost = 6000000; // Fixed cost instead of random
```

### Add More Approvers
Add additional approval steps:
```javascript
// Step 4: Approve by Third Approver
const contextApprover3 = await browser.newContext({ viewport: null });
const pageApprover3 = await contextApprover3.newPage();

await login(pageApprover3, USERS.approver3);
results.approveLevel3 = await approveByApprover3(pageApprover3, results.contractId);

await logout(pageApprover3);
await contextApprover3.close();
```

## Best Practices

### 1. Wait Between Users
```javascript
// Give system time to process
await new Promise(resolve => setTimeout(resolve, 3000));
```

### 2. Always Logout
```javascript
// Clean session before next user
await logout(page);
await context.close();
```

### 3. Handle Alerts
```javascript
// Always check for success/error alerts
const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
if (swalTitle) {
  console.log(`📢 ${swalTitle}`);
  await page.click('.swal2-confirm');
}
```

### 4. Take Screenshots
```javascript
// Screenshot at each critical step
await page.screenshot({ path: 'step-name.png', fullPage: true });
```

## Expected Results

### Success Case (100%)
```
✅ Create Contract (Ryan) - KTR/MDC/2026/XXX
✅ Approve Level 1 (Novyan)
✅ Approve Level 2 (Daniel)
✅ Final Status Verified

Total: 4/4 passed (100.0%)
🎉 FULL APPROVAL FLOW COMPLETED!
```

### Partial Success (75%)
```
✅ Create Contract (Ryan) - KTR/MDC/2026/XXX
✅ Approve Level 1 (Novyan)
✅ Approve Level 2 (Daniel)
❌ Final Status Verified

Total: 3/4 passed (75.0%)
⚠️ 1 step(s) failed
```

### Common Failure (25%)
```
✅ Create Contract (Ryan) - KTR/MDC/2026/XXX
❌ Approve Level 1 (Novyan)
❌ Approve Level 2 (Daniel)
❌ Final Status Verified

Total: 1/4 passed (25.0%)
⚠️ 3 step(s) failed

Reason: Approval buttons not found
```

## Alternative Approaches

### Manual Approval Testing
If automated approval fails, test manually:

1. **Create Contract** (Ryan):
   ```bash
   node create-contract-simple.mjs
   ```
   Note the Contract ID

2. **Approve Level 1** (Novyan):
   - Login as novyan@modena.com
   - Navigate to approval page
   - Find and approve the contract
   - Logout

3. **Approve Level 2** (Daniel):
   - Login as daniel.aritonga@modena.com
   - Navigate to approval page
   - Find and approve the contract
   - Logout

4. **Verify**:
   - Login as any user
   - Check contract status = "Approved"

### Simplified Approval Script
Create a simpler version that just checks if approval is possible:

```javascript
// check-approval-access.mjs
async function checkApprovalAccess(email, password) {
  const page = await browser.newPage();
  await login(page, email, password);
  
  // Check for approval menu
  const hasApprovalMenu = await page.locator('text=/approval/i').isVisible();
  console.log(`${email}: Approval menu = ${hasApprovalMenu}`);
  
  // Check for pending contracts
  await page.goto(`${BASE_URL}/fms/vehicle/contract`);
  const pendingCount = await page.locator('text=/pending/i').count();
  console.log(`${email}: Pending contracts = ${pendingCount}`);
  
  await page.close();
}
```

## Related Scripts

- `contract-service-e2e-flexible.mjs` - Full E2E without approval
- `create-contract-simple.mjs` - Simple contract creation
- `create-contracts-batch.mjs` - Batch contract creation
- `run-vehicle-e2e-incognito.mjs` - Vehicle E2E with approval

## Next Steps

1. **Verify User Permissions**:
   - Check Novyan has approver role
   - Check Daniel has approver role
   - Verify approval workflow is configured

2. **Inspect Approval UI**:
   - Login manually as Novyan
   - Check where approval buttons are located
   - Update script selectors if needed

3. **Test Incrementally**:
   - First test contract creation only
   - Then test approval with one user
   - Finally test full flow

4. **Add More Features**:
   - Rejection flow
   - Comments on approval
   - Approval history
   - Email notifications

## Conclusion

Script approval E2E sudah dibuat dengan fitur:
- ✅ Multi-user support (Ryan, Novyan, Daniel)
- ✅ Isolated browser contexts
- ✅ Flexible data generation
- ✅ Robust button detection
- ✅ Comprehensive logging
- ✅ Screenshot at each step

Untuk menjalankan dengan sukses, pastikan:
1. Semua user account aktif dan memiliki permission yang benar
2. Approval workflow sudah dikonfigurasi di sistem
3. Contract memerlukan approval (tidak auto-approved)

Jika approval button tidak ditemukan, kemungkinan contract tidak memerlukan approval atau user tidak memiliki akses approval.
