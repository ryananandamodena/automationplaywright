# MHC Comprehensive End-to-End Test Documentation

## Document Information

| Attribute | Details |
|-----------|---------|
| **Version** | 1.0 |
| **Date** | June 23, 2025 |
| **Author** | Senior QA Automation Architect |
| **Status** | Draft |
| **System** | Modena Healthcare/Manufacturing Center (MHC) |
| **Modules Covered** | 10 Modules |
| **Total Test Cases** | 200+ |

---

## Table of Contents

1. [Business Process Overview](#business-process-overview)
2. [Module Analysis](#module-analysis)
3. [Test Scenarios](#test-scenarios)
4. [Integration Testing](#integration-testing)
5. [API Testing](#api-testing)
6. [Security Testing](#security-testing)
7. [Performance Testing](#performance-testing)
8. [Database Testing](#database-testing)
9. [User Acceptance Testing](#user-acceptance-testing)
10. [Automation Testing](#automation-testing)
11. [Defect Prediction](#defect-prediction)
12. [Test Data](#test-data)
13. [Requirements Traceability Matrix](#requirements-traceability-matrix)
14. [Test Coverage Matrix](#test-coverage-matrix)
15. [Risk Assessment Matrix](#risk-assessment-matrix)
16. [Automation Candidate List](#automation-candidate-list)
17. [Smoke Test Suite](#smoke-test-suite)
18. [Regression Test Suite](#regression-test-suite)
19. [Critical Path Test Cases](#critical-path-test-cases)
20. [E2E Process Flow](#e2e-process-flow)

---

## Business Process Overview

### Supply Chain Management Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MHC SUPPLY CHAIN ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

  Procurement Flow:          Sales Flow:             Warehouse Flow:
  ┌─────────────┐           ┌─────────────┐         ┌─────────────┐
  │ Purchase    │────┐      │ Sales Order │───┐    │ Stock Ready │
  │ Order       │    ▼      │ (SO)        │   ▼    │             │
  └─────────────┐  Verification ─────┘  Approval ─┘    ▼        │
         │      │           └─────────────┘          Delivery    │
         ▼      │                                      │           │
  Purchase Stock │           ┌─────────────┐         │           │
  Verification   │           │ Withdrawal   │◄────────┘           │
                 │           └─────────────┘                      │
                 │                     │                           │
                 │           ┌─────────────┐                      │
                 └──────────►│ Inventory    │◄─────────────────────┘
                             │ Transfer     │
                             └─────────────┘

  Finance Flow:
  ┌──────────────────────────────────────────────────┐
  │ Operational Cost → Balance Inquiry               │
  │ (Financial Management & Reconciliation)           │
  └──────────────────────────────────────────────────┘

```

### Module Dependencies Matrix

| Upstream Module | Downstream Module | Integration Point |
|-----------------|-------------------|-------------------|
| Sales Order | SO Approval | Document submission for approval |
| SO Approval | Stock Ready | Approved SO triggers stock allocation |
| Stock Ready | Delivery | Stock confirmation enables delivery |
| Purchase Order | Purchase Stock Verification | GRN verification against PO |
| Purchase Stock Verification | Stock Ready | Verified stock becomes available |
| Inventory Transfer | Stock Ready | Transferred stock updates availability |
| Operational Cost | Balance Inquiry | Cost posting affects balances |
| Withdrawal | Balance Inquiry | Stock withdrawal reduces balance |

---

## Module Analysis

### 1. Sales Order

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Capture customer sales requests with product, quantity, pricing, and delivery requirements |
| **Main Business Flow** | Customer Request → SO Creation → Approval → Stock Ready → Delivery |
| **Upstream Dependencies** | Customer Master, Product Master, Price List, Warehouse Master |
| **Downstream Dependencies** | SO Approval Module, Stock Ready Module, Delivery Module, Balance Inquiry |
| **Related Modules** | Inventory Transfer, Withdrawal, Balance Inquiry |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-FN-01 | Sales Order | Create SO | Create valid sales order with all mandatory fields | User logged in with Sales Admin role | 1. Navigate to SO creation<br>2. Select customer<br>3. Add product line<br>4. Enter quantity<br>5. Verify price auto-population<br>6. Submit | Customer: PT. ABC, Product: Item A, Qty: 100, Price: 50,000 | SO created successfully with status "Draft" | High | Critical | Functional |
| SO-FN-02 | Sales Order | Add Line Items | Add multiple products to existing draft SO | Draft SO exists | 1. Open draft SO<br>2. Click Add Line<br>3. Select product<br>4. Enter qty<br>5. Save | Product B: qty 50, Product C: qty 25 | Multiple lines added successfully | High | High | Functional |
| SO-FN-03 | Sales Order | Price Calculation | Verify automatic price calculation | Product with price list exists | 1. Create SO<br>2. Add product<br>3. Verify unit price<br>4. Verify discount application<br>5. Verify total | Unit Price: 100,000, Qty: 10, Discount: 10% | Total = 900,000 calculated correctly | High | High | Functional |
| SO-FN-04 | Sales Order | Tax Calculation | Verify tax calculation | Tax configuration exists | 1. Create SO<br>2. Add taxable product<br>3. Check tax amount | Tax rate: 11%, Subtotal: 1,000,000 | Tax = 110,000, Total = 1,110,000 | High | High | Functional |
| SO-FN-05 | Sales Order | Warehouse Selection | Select delivery warehouse | Multiple warehouses exist | 1. Create SO<br>2. Select warehouse<br>3. Submit | Warehouse: WH-JKT | Warehouse assigned to SO lines | Medium | Medium | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-NG-01 | Sales Order | Empty Mandatory | Submit SO without customer | User logged in | 1. Navigate to SO creation<br>2. Leave customer empty<br>3. Click Submit | - | Validation error: "Customer is required" | High | High | Negative |
| SO-NG-02 | Sales Order | Negative Quantity | Enter negative product quantity | Draft SO open | 1. Add line item<br>2. Enter qty: -10<br>3. Save | Qty: -10 | Validation error: "Quantity must be positive" | High | High | Negative |
| SO-NG-03 | Sales Order | Exceed Stock | Order quantity exceeding available stock | Product with limited stock exists | 1. Create SO<br>2. Order qty: 1000 (available: 100) | Available: 100, Ordered: 1000 | Warning: "Available stock insufficient" OR order allowed with backorder flag | High | High | Negative |
| SO-NG-04 | Sales Order | Future Date | Enter past delivery date | SO creation form open | 1. Set delivery date in past<br>2. Submit | Date: Yesterday | Validation error: "Delivery date cannot be in past" | Medium | Medium | Negative |
| SO-NG-05 | Sales Order | Invalid Customer | Select inactive customer | Customer master has inactive records | 1. Select inactive customer<br>2. Submit | Customer Status: Inactive | Validation error: "Customer is not active" | Medium | High | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-VL-01 | Sales Order | Email Format | Verify customer email format validation | Customer with invalid email | 1. Create SO<br>2. Enter email: invalid<br>3. Submit | Email: "notanemail" | Validation error on email format | Medium | Medium | Validation |
| SO-VL-02 | Sales Order | Phone Number | Verify phone number format | Customer record | 1. Enter phone: ABC123<br>2. Submit | Phone: "ABC123" | Validation error: "Invalid phone format" | Medium | Medium | Validation |
| SO-VL-03 | Sales Order | Decimal Precision | Verify quantity decimal handling | Product configuration | 1. Enter qty: 10.555<br>2. Save | Decimal precision: 2 | Qty rounded to 10.56 or rejected based on config | Medium | Medium | Validation |
| SO-VL-04 | Sales Order | Special Characters | Test product name with special chars | Product master | 1. Search product with @#$% chars | Char: @#$% | System handles gracefully or filters | Low | Low | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-BV-01 | Sales Order | Max Quantity | Order at maximum allowed quantity | Product max stock: 1000 | 1. Enter qty: 1000<br>2. Submit | Max qty: 1000 | Accepted at boundary | High | High | Boundary |
| SO-BV-02 | Sales Order | Max Value | Order value at maximum limit | Credit limit: 100M | 1. Create SO total: 100M<br>2. Submit | Total: 100,000,000 | Accepted or credit limit triggered | High | High | Boundary |
| SO-BV-03 | Sales Order | Min Quantity | Order minimum quantity | Product min qty: 1 | 1. Enter qty: 1<br>2. Submit | Min qty: 1 | Accepted | Medium | Medium | Boundary |
| SO-BV-04 | Sales Order | Zero Amount | Order with zero amount | Promotional item | 1. Add free item (price: 0)<br>2. Submit | Price: 0 | Accepted or special handling | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-MF-01 | Sales Order | Empty Customer | Submit without customer | SO form open | 1. Leave customer blank<br>2. Try submit | - | Error: "Customer is mandatory" | High | High | Mandatory |
| SO-MF-02 | Sales Order | Empty Product | Submit without product lines | SO form open | 1. Leave lines empty<br>2. Submit | - | Error: "At least one product is required" | High | High | Mandatory |
| SO-MF-03 | Sales Order | Zero Quantity | Submit with zero qty | Line added | 1. Set qty: 0<br>2. Submit | Qty: 0 | Error: "Quantity must be > 0" | High | High | Mandatory |
| SO-MF-04 | Sales Order | Delivery Date | Submit without delivery date | SO form | 1. Leave delivery date empty<br>2. Submit | - | Error: "Delivery date is required" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-BR-01 | Sales Order | Credit Check | Block SO exceeding credit limit | Customer credit: 10M | 1. Create SO total: 12M<br>2. Submit | Credit: 10M, SO Total: 12M | Blocked: "Exceeds credit limit" OR approval required | High | Critical | Business Rule |
| SO-BR-02 | Sales Order | Duplicate Prevention | Prevent duplicate SO numbers | Existing SO: SO-001 | 1. Create new SO with same number<br>2. Submit | SO No: SO-001 | Blocked: "SO number already exists" | High | High | Business Rule |
| SO-BR-03 | Sales Order | Price Override | Test price override by authorized user | Price override role | 1. User with override role changes price<br>2. Submit | Original: 100k, Override: 80k | Allowed with audit trail | Medium | Medium | Business Rule |
| SO-BR-04 | Sales Order | Approved SO Edit | Test editing approved SO | Approved SO exists | 1. Try edit approved SO | Status: Approved | Blocked OR new revision created | High | High | Business Rule |

#### C. UI Testing

**Form Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-UI-01 | Sales Order | Form Layout | Verify form field alignment | SO create page loaded | 1. Check field positions<br>2. Resize browser<br>3. Check mobile view | - | Fields aligned, readable on all views | Medium | Medium | UI |
| SO-UI-02 | Sales Order | Tab Navigation | Verify tab order | SO form open | 1. Press Tab repeatedly<br>2. Verify focus sequence | - | Logical tab order through all fields | Medium | Medium | UI |
| SO-UI-03 | Sales Order | Required Field Indicator | Check asterisk markers | Form displayed | 1. Look at mandatory fields | - | Asterisk (*) shown on mandatory fields | Medium | Low | UI |
| SO-UI-04 | Sales Order | Date Picker | Test date picker functionality | Delivery date field | 1. Click date field<br>2. Select date<br>3. Verify format | - | Date picker opens, accepts valid date | Medium | Medium | UI |
| SO-UI-05 | Sales Order | Dropdown Search | Test product search dropdown | Line item form | 1. Type product code<br>2. Verify search<br>3. Select from list | Search: "ABC" | Products matching displayed, selectable | Medium | Medium | UI |

**Label Verification**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-UI-06 | Sales Order | Field Labels | Verify all field labels | SO creation page | 1. Inspect each field label<br>2. Compare with spec | - | Labels match requirements exactly | Medium | Low | UI |
| SO-UI-07 | Sales Order | Button Labels | Verify button text | SO page | 1. Check Submit, Cancel, Save buttons | - | Buttons labeled correctly | Low | Low | UI |
| SO-UI-08 | Sales Order | Status Display | Verify status indicator | Draft SO | 1. Check status badge/label | Status: Draft | Shows "Draft" or appropriate indicator | Medium | Low | UI |
| SO-UI-09 | Sales Order | Error Messages | Verify error message clarity | Form validation error | 1. Trigger validation error<br>2. Read message | Error scenario | Clear, actionable error message | Medium | Medium | UI |
| SO-UI-10 | Sales Order | Success Notification | Verify success message | SO created | 1. Check toast/notification | Success state | "Sales Order created successfully" | Low | Low | UI |

**Button Functionality**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-UI-11 | Sales Order | Submit Button | Test submit with valid data | Valid SO data filled | 1. Click Submit<br>2. Verify action | Valid data | SO submitted for approval | High | High | UI |
| SO-UI-12 | Sales Order | Cancel Button | Test cancel unsaved changes | Unsaved SO form | 1. Click Cancel<br>2. Confirm discard | Unsaved changes | Returns to list, changes discarded | Medium | Medium | UI |
| SO-UI-13 | Sales Order | Save Draft | Test save as draft functionality | Partial SO filled | 1. Click Save Draft | Partial data | Saved as draft, returns to list | High | High | UI |
| SO-UI-14 | Sales Order | Add Line Button | Test add line item | SO form open | 1. Click Add Line<br>2. Verify new row | - | New empty line added to grid | Medium | Medium | UI |
| SO-UI-15 | Sales Order | Delete Line | Test line removal | Line exists | 1. Click delete on line<br>2. Confirm | - | Line removed from grid | Medium | Medium | UI |

#### D. Workflow Testing

**Draft Process**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-01 | Sales Order | Draft Creation | Create SO as draft | User logged in | 1. Fill SO partially<br>2. Save as Draft | Partial data | Status: Draft, retrievable from list | High | High | Workflow |
| SO-WF-02 | Sales Order | Draft Edit | Edit existing draft | Draft SO exists | 1. Open draft<br>2. Modify fields<br>3. Save | Modified data | Draft updated, status remains Draft | High | High | Workflow |
| SO-WF-03 | Sales Order | Draft to Submit | Convert draft to submitted | Draft SO exists | 1. Open draft<br>2. Complete all fields<br>3. Submit | Complete data | Status: Submitted/For Approval | High | High | Workflow |
| SO-WF-04 | Sales Order | Draft Deletion | Delete draft before submission | Draft SO exists | 1. Open draft<br>2. Click Delete<br>3. Confirm | - | Draft deleted, not in list | High | High | Workflow |

**Submit Process**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-05 | Sales Order | Submit for Approval | Submit valid SO | Complete SO form | 1. Click Submit<br>2. Confirm | Valid SO | Status: Submitted, in approval queue | High | Critical | Workflow |
| SO-WF-06 | Sales Order | Submit Validation | Block invalid submission | Incomplete SO | 1. Try Submit without required fields<br>2. Verify | Missing required fields | Submission blocked with clear error | High | High | Workflow |
| SO-WF-07 | Sales Order | Email Notification | Verify notification on submit | Email configured | 1. Submit SO<br>2. Check approver email | Valid SO | Approval notification sent | High | Medium | Workflow |
| SO-WF-08 | Sales Order | Sequential Stop | Test workflow sequencing | SO with multiple approval levels | 1. Submit SO<br>2. Check approver assignment | Multi-level approval config | Correct approver at each level | High | High | Workflow |

**Approval Process**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-09 | Sales Order | Approval via Module | Approve SO in approval module | SO submitted and in queue | 1. Open SO Approval<br>2. Review SO<br>3. Click Approve<br>4. Add remarks | Approved by Supervisor | Status: Approved, moved to next step | High | Critical | Workflow |
| SO-WF-10 | Sales Order | Delegated Approval | Test delegation | Delegation configured | 1. Original approver on leave<br>2. Delegate approves | Delegate: Manager B | Approval valid, shows who approved | Medium | High | Workflow |
| SO-WF-11 | Sales Order | Parallel Approval | Test parallel approval flow | Parallel config | 1. Submit SO<br>2. Both approvers approve | 2 approvers | Approved when all approve (OR logic) | Medium | High | Workflow |

**Rejection Process**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-12 | Sales Order | Reject SO | Reject from approval queue | SO in submission queue | 1. Open SO<br>2. Click Reject<br>3. Add reason<br>4. Submit | Reason: "Price incorrect" | Status: Rejected, returned to creator | High | High | Workflow |
| SO-WF-13 | Sales Order | Rejection Notification | Verify creator notified | SO rejected | 1. Check creator's notification inbox | Rejection reason | Notification received with reason | Medium | Medium | Workflow |
| SO-WF-14 | Sales Order | Resubmit after Reject | Resubmit rejected SO | SO rejected | 1. Open rejected SO<br>2. Fix issue<br>3. Resubmit | Fixed issue | Status: Submitted, new approval cycle | High | High | Workflow |

**Status Transition Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-15 | Sales Order | Complete Lifecycle | Full SO lifecycle | Clean state | 1. Draft → Submit → Approve → Stock Ready → Delivery → Complete | Full order | Each status transition valid | High | Critical | Workflow |
| SO-WF-16 | Sales Order | Invalid Transition | Test invalid status change | SO approved | 1. Attempt to revert to Draft | Invalid action | Blocked: "Cannot revert approved SO" | High | High | Workflow |
| SO-WF-17 | Sales Order | Status History | Verify status audit trail | SO with transitions | 1. Open status history log | Multiple transitions | Log shows each transition with timestamp/user | Medium | Medium | Workflow |
| SO-WF-18 | Sales Order | Cancelled SO | Cancel submitted SO | SO submitted | 1. Click Cancel<br>2. Confirm | - | Status: Cancelled, no further processing | High | High | Workflow |

**Audit Trail Verification**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SO-WF-19 | Sales Order | Create Audit | Verify creation logged | SO created | 1. Check audit log | New SO | Log: Created by [User] at [Time] with [Details] | Medium | Medium | Workflow |
| SO-WF-20 | Sales Order | Change Audit | Verify field changes logged | SO edited | 1. Modify field<br>2. Save<br>3. Check log | Modified field | Log shows old/new values | Medium | Medium | Workflow |

---

### 2. Purchase Order

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Create purchase requests to suppliers for procurement of raw materials/goods |
| **Main Business Flow** | Procurement Request → PO Creation → Supplier Confirmation → Goods Receipt → Purchase Stock Verification → Stock Ready |
| **Upstream Dependencies** | Supplier Master, Product Master, Purchase Requisition, Budget |
| **Downstream Dependencies** | Purchase Stock Verification Module, Stock Ready Module, Balance Inquiry |
| **Related Modules** | Inventory Transfer, Operational Cost, Withdrawal |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-FN-01 | Purchase Order | Create Valid PO | Create complete PO | User: Procurement Staff | 1. Select supplier<br>2. Add products<br>3. Set quantities<br>4. Set delivery date<br>5. Submit | Supplier: PT. XYZ, Product: Raw A, Qty: 500 | PO created with status Draft | High | Critical | Functional |
| PO-FN-02 | Purchase Order | Approval Workflow | Submit PO for approval | Complete PO ready | 1. Click Submit for Approval<br>2. Select approver<br>3. Add notes<br>4. Submit | Approved by Procurement Manager | Status changes to "Awaiting Approval" | High | Critical | Functional |
| PO-FN-03 | Purchase Order | Term Calculation | Verify payment term calculation | Supplier with Net 30 | 1. Create PO on Jan 1<br>2. Check due date | Payment term: Net 30, PO date: Jan 1 | Due date: Jan 31 | High | High | Functional |
| PO-FN-04 | Purchase Order | Price Lock | Verify price locking at PO | Product price: 50,000 | 1. Create PO at 50,000<br>2. Check locked price | Market price may change | PO price remains 50,000 | High | High | Functional |
| PO-FN-05 | Purchase Order | Partial Delivery | Accept partial shipment | PO for 1000, delivery 400 | 1. Create PO<br>2. Receive partial<br>3. Verify remaining | Received: 400/1000 | Remaining: 600, update stock | High | High | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-NG-01 | Purchase Order | Empty Supplier | Submit without supplier | PO form open | 1. Leave supplier blank<br>2. Submit | - | Error: "Supplier is required" | High | High | Negative |
| PO-NG-02 | Purchase Order | Blocked Supplier | Select blocked supplier | Supplier status: Blocked | 1. Select blocked supplier<br>2. Submit | Supplier Status: Blocked | Error: "Supplier is blocked" | High | High | Negative |
| PO-NG-03 | Purchase Order | Over Budget | Submit PO exceeding budget | Budget: 10M, PO: 12M | 1. Create PO for 12M<br>2. Submit | Budget exceeded | Blocked OR approval required | High | High | Negative |
| PO-NG-04 | Purchase Order | Past Delivery | Set delivery date in past | PO form | 1. Set past delivery date<br>2. Submit | Date in past | Error: "Past date invalid" | Medium | Medium | Negative |
| PO-NG-05 | Purchase Order | Zero Price | Set product price to zero | PO form | 1. Enter price: 0<br>2. Submit | Price: 0 | Warning or blocked: "Price cannot be zero" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-VL-01 | Purchase Order | PO Number Format | Verify PO number format | PO creation | 1. Check auto-generated PO number | Format: PO-YYYYMM-XXXX | Follows defined format | Medium | Low | Validation |
| PO-VL-02 | Purchase Order | Currency Validation | Accept only valid currencies | Multi-currency enabled | 1. Select currency: XYZ<br>2. Submit | Invalid currency | Error: "Invalid currency code" | Medium | Medium | Validation |
| PO-VL-03 | Purchase Order | Tax ID Format | Verify supplier tax ID | Supplier with tax ID | 1. Enter invalid Tax ID<br>2. Submit | Invalid: "12345" | Error: "Invalid Tax ID format" | Medium | Medium | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-BV-01 | Purchase Order | Max PO Value | PO at maximum value | Max PO: 1B | 1. Create PO for 1B<br>2. Submit | 1,000,000,000 | Accepted at boundary | High | High | Boundary |
| PO-BV-02 | Purchase Order | Max Line Items | PO with maximum lines | Max lines: 50 | 1. Add 50 line items<br>2. Submit | 50 lines | Accepted | Medium | Medium | Boundary |
| PO-BV-03 | Purchase Order | Lead Time | Minimum lead time | Min lead: 1 day | 1. Set lead time: 0 days<br>2. Submit | 0 days | Error or accepted at boundary | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-MF-01 | Purchase Order | Supplier Required | Block without supplier | PO form | 1. Leave supplier blank<br>2. Submit | - | Error: "Supplier is mandatory" | High | High | Mandatory |
| PO-MF-02 | Purchase Order | Products Required | Block without lines | PO form | 1. No line items<br>2. Submit | - | Error: "Add at least one product" | High | High | Mandatory |
| PO-MF-03 | Purchase Order | Quantity Required | Block zero qty | Line added | 1. Set qty: 0<br>2. Submit | 0 | Error: "Quantity must be > 0" | High | High | Mandatory |
| PO-MF-04 | Purchase Order | Required Date | Verify required date field | PO form | 1. Leave expected date blank<br>2. Submit | - | Error: "Expected delivery date required" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-BR-01 | Purchase Order | Vendor Rating | Block from low-rated vendors | Vendor rating: D | 1. Select D-rated vendor<br>2. Submit | Rating: D | Warning/approval required | Medium | Medium | Business Rule |
| PO-BR-02 | Purchase Order | Duplicate PO | Prevent duplicate numbers | PO-001 exists | 1. Try create PO-001 again | Duplicate number | Blocked: "PO number exists" | High | High | Business Rule |
| PO-BR-03 | Purchase Order | Currency Mismatch | Block if PO currency ≠ Supplier currency | Supplier: USD, PO: EUR | 1. Create PO in EUR | Mismatch | Warning OR auto-convert | Medium | Medium | Business Rule |
| PO-BR-04 | Purchase Order | Approval Matrix | Verify correct approver | PO value > 50M | 1. Create PO for 60M<br>2. Submit | Auto-assign to Finance Director | Correct approver assigned | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-UI-01 | Purchase Order | Form Layout | Verify field arrangement | PO form displayed | 1. Check alignment<br>2. Test mobile | - | Responsive and aligned | Medium | Medium | UI |
| PO-UI-02 | Purchase Order | Product Autocomplete | Test product search | Product dropdown | 1. Type product code<br>2. Select from suggestions | "RA" → Raw A | Selected product, details populated | Medium | Medium | UI |
| PO-UI-03 | Purchase Order | Total Calculation | Verify dynamic total | Lines added | 1. Add lines with prices<br>2. Verify subtotal/tax/total | Subtotal, Tax, Total | Calculated correctly in real-time | Medium | Medium | UI |
| PO-UI-04 | Purchase Order | Approval Queue Display | Test queue list | PO submitted | 1. View approval queue<br>2. Sort by date | Multiple POs | Correct list with filters working | Medium | Medium | UI |
| PO-UI-05 | Purchase Order | Print/Export | Test print functionality | PO created | 1. Click Print<br>2. Verify PDF export | Valid PO | PDF generated correctly | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-WF-01 | Purchase Order | Draft to Approval | Draft→Approval flow | Draft PO exists | 1. Open draft<br>2. Submit for approval | Draft data | Status: Pending Approval | High | High | Workflow |
| PO-WF-02 | Purchase Order | Approval Rejection | Reject PO | PO in queue | 1. Open approval queue<br>2. Reject with notes<br>3. Submit | Reason: "Budget exceeded" | Status: Rejected, creator notified | High | High | Workflow |
| PO-WF-03 | Purchase Order | Approval with Comments | Add approval notes | PO in queue | 1. Approve with remarks<br>2. Submit | Remarks: "Approved with condition" | Remarks saved in audit log | Medium | Medium | Workflow |
| PO-WF-04 | Purchase Order | Revision After Reject | Edit rejected PO | PO rejected | 1. Edit PO<br>2. Fix issues<br>3. Resubmit | Corrected PO | New approval cycle begins | High | High | Workflow |
| PO-WF-05 | Purchase Order | Void PO | Void approved PO | PO approved | 1. Click Void<br>2. Confirm reason<br>3. Submit | Void reason | PO closed, cannot receive | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PO-INT-01 | Purchase Order | PO → Verification | SO appears in verification | PO approved | 1. PO approved<br>2. Check Purchase Stock Verification | Approved PO | Available for GRN verification | High | Critical | Integration |
| PO-INT-02 | Purchase Order | PO → Inventory | GRN posts to inventory | PO verified | 1. Complete verification<br>2. Check stock levels | Qty received | Stock updated in system | High | Critical | Integration |
| PO-INT-03 | Purchase Order | PO → Finance | PO updates payables | PO created | 1. Check Balance Inquiry | PO amount | Accounts Payable updated | High | High | Integration |
| PO-INT-04 | Purchase Order | PO → Budget | Budget utilization tracked | PO created | 1. Check budget consumption | PO value | Budget reduced accordingly | High | High | Integration |

---

### 3. Delivery

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Manage outbound goods delivery to customers from approved SOs |
| **Main Business Flow** | Approved SO → Picking → Packing → Shipping → Delivery Confirmation → Stock Deduction |
| **Upstream Dependencies** | Sales Order (Approved), Stock Ready Module, Warehouse Management |
| **Downstream Dependencies** | Balance Inquiry (stock update), Customer Receipt, Shipping Document |
| **Related Modules** | Inventory Transfer, Withdrawal, Operational Cost |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| DL-FN-01 | Delivery | Create from SO | Initiate delivery from approved SO | SO approved and stock ready | 1. Select SO<br>2. Confirm picking<br>3. Generate Delivery Order | SO-001 with stock | Delivery Order created, status: Picking | High | Critical | Functional |
| DL-FN-02 | Delivery | Multi-SO Consolidation | Combine multiple SOs in one delivery | 2+ approved SOs for same customer | 1. Select multiple SOs<br>2. Consolidate<br>3. Confirm | Customer: PT. ABC, SOs: SO-001, SO-002 | Single delivery for multiple SOs | High | High | Functional |
| DL-FN-03 | Delivery | Partial Delivery | Deliver partial quantity | SO: 100, deliver 60 | 1. Select SO<br>2. Enter delivered qty: 60<br>3. Confirm | SO qty: 100, Delivered: 60 | Backorder created for 40 | High | High | Functional |
| DL-FN-04 | Delivery | Shipping Document | Generate shipping docs | Delivery ready | 1. Click Generate Documents<br>2. Select docs needed | Delivery Order, Packing List, Invoice | All documents generated | High | High | Functional |
| DL-FN-05 | Delivery | Tracking Number | Assign tracking number | Shipping carrier | 1. Enter tracking number<br>2. Save to SO | Tracking: JNE-12345 | Tracking recorded and visible | High | Medium | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| DL-NG-01 | Delivery | Unapproved SO | Try deliver from unapproved SO | SO in draft | 1. Select draft SO<br>2. Attempt delivery | Draft SO | Blocked: "SO not approved" | High | Critical | Negative |
| DL-NG-02 | Delivery | Insufficient Stock | Deliver more than available | Stock: 50, SO: 80 | 1. Try deliver 80 | Available: 50 | Blocked: "Insufficient stock" OR partial allowed | High | High | Negative |
| DL-NG-03 | Delivery | Wrong Warehouse | Deliver from wrong warehouse | Product in WH-A | 1. Select WH-B for delivery | Mismatch | Error: "Stock not in selected warehouse" | High | High | Negative |
| DL-NG-04 | Delivery | Zero Quantity | Submit with zero qty | Delivery form | 1. Set qty: 0<br>2. Submit | Qty: 0 | Blocked: "Quantity must be > 0" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| DL-VL-01 | Delivery | Address Validation | Verify address completeness | Customer with partial address | 1. Check delivery address warning | Incomplete address | Warning displayed | Medium | Medium | Validation |
| DL-VL-02 | Delivery | Address Geocode | Verify address coordinates | Address | 1. Check calculated coordinates | Jakarta address | Coordinates accurate for map | Low | Low | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| DL-BV-01 | Delivery | Max Packages | Maximum packages per delivery | Max: 100 | 1. Add 100 packages<br>2. Submit | 100 packages | Accepted | Medium | Medium | Boundary |
| DL-BV-02 | Delivery | Max Weight | Maximum weight limit | Max weight: 5000kg | 1. Enter weight: 5000kg<br>2. Submit | 5000kg | Accepted or warning | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| DL-MF-01 | Delivery | SO Required | Block without SO | Delivery form | 1. Try create without SO<br>2. Submit | - | Error: "Select Sales Order" | High | High | Mandatory |
| DL-MF-02 | Delivery | Courier Required | Block without courier | Delivery form | 1. Leave courier blank<br>2. Submit | - | Error: "Courier is required" | High | High | Mandatory |
| DL-MF-03 | Delivery | Quantity Required | Block without quantity | Delivery form | 1. Leave qty empty<br>2. Submit | - | Error: "Quantity is required" | High | High | Mandatory |


---

### 4. Inventory Transfer

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Move stock between warehouses or locations within the organization |
| **Main Business Flow** | Transfer Request → Pick from Source → Transit → Receive at Destination → Stock Update |
| **Upstream Dependencies** | Warehouse Master, Product Master, Stock Availability |
| **Downstream Dependencies** | Stock Ready Module, Balance Inquiry, Operational Cost |
| **Related Modules** | Purchase Order, Withdrawal, Delivery |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-FN-01 | Inventory Transfer | Inter-warehouse transfer | Move stock WH-A to WH-B | WH-A has stock 500 | 1. Select source WH-A<br>2. Select dest WH-B<br>3. Add product<br>4. Set qty: 100<br>5. Submit | Product: ITEM-001, Qty: 100 | Transfer created, status: Requested | High | High | Functional |
| IT-FN-02 | Inventory Transfer | Multi-product transfer | Transfer multiple SKUs in one request | Multiple products in source | 1. Add 5 product lines<br>2. Set qty per line<br>3. Submit | 5 products, various qtys | All lines transferred in single request | High | High | Functional |
| IT-FN-03 | Inventory Transfer | Partial transfer | Transfer partial available stock | Available: 1000 | 1. Request transfer: 400<br>2. Submit | Qty: 400 | Remaining: 600 in source | High | High | Functional |
| IT-FN-04 | Inventory Transfer | Transfer approval | Submit transfer for approval | Transfer created | 1. Click Submit for Approval<br>2. Approve in module | Approved by WH Manager | Status: Approved, ready for execution | High | High | Functional |
| IT-FN-05 | Inventory Transfer | Auto-stock update | Verify stock updated at destination | Transfer approved and executed | 1. Check destination warehouse stock | WH-B stock increases | Stock correctly updated | High | Critical | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-NG-01 | Inventory Transfer | Same warehouse | Transfer to same warehouse | SOURCE: WH-A, DEST: WH-A | 1. Set same warehouse both fields<br>2. Submit | Same WH | Error: "Source and destination cannot be same" | High | High | Negative |
| IT-NG-02 | Inventory Transfer | Insufficient stock | Transfer more than available | Available: 50 | 1. Request transfer: 100 | Available: 50, Requested: 100 | Blocked: "Insufficient stock" | High | High | Negative |
| IT-NG-03 | Inventory Transfer | Inactive product | Transfer blocked product | Product status: Blocked | 1. Select blocked product<br>2. Submit | Blocked product | Error: "Product is not active" | High | Medium | Negative |
| IT-NG-04 | Inventory Transfer | Unauthorized warehouse | User without access to dest WH | User: WH-A staff | 1. Try transfer to WH-B (no access) | No access to WH-B | Blocked: "No permission for destination warehouse" | High | High | Negative |
| IT-NG-05 | Inventory Transfer | Quantity zero | Submit with zero qty | Line added | 1. Set qty: 0<br>2. Submit | 0 | Blocked: "Quantity must be > 0" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-VL-01 | Inventory Transfer | Transfer number format | Verify auto-generated number | Create transfer | 1. Check transfer number | Format: TRF-YYYYMM-XXX | Follows defined format | Medium | Low | Validation |
| IT-VL-02 | Inventory Transfer | Batch/lot tracking | Transfer with batch numbers | Batch-managed product | 1. Enter batch numbers<br>2. Submit | Batch: BATCH-001 | Batch tracking maintained | High | High | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-BV-01 | Inventory Transfer | Max transfer qty | Transfer all available stock | Available: 1000 | 1. Transfer: 1000<br>2. Submit | 1000 | Accepted, source becomes 0 | High | High | Boundary |
| IT-BV-02 | Inventory Transfer | Min transfer qty | Transfer minimum quantity | Min: 1 | 1. Transfer: 1<br>2. Submit | 1 | Accepted | Medium | Medium | Boundary |
| IT-BV-03 | Inventory Transfer | Max value | Transfer at max value limit | Max transfer value: 500M | 1. Transfer products worth 500M<br>2. Submit | 500M | Accepted or approval required | Medium | High | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-MF-01 | Inventory Transfer | Source required | Block without source WH | Form open | 1. Leave source blank<br>2. Submit | - | Error: "Source warehouse required" | High | High | Mandatory |
| IT-MF-02 | Inventory Transfer | Destination required | Block without dest WH | Form open | 1. Leave destination blank<br>2. Submit | - | Error: "Destination warehouse required" | High | High | Mandatory |
| IT-MF-03 | Inventory Transfer | Products required | Block without lines | Form open | 1. No line items<br>2. Submit | - | Error: "Add at least one product" | High | High | Mandatory |
| IT-MF-04 | Inventory Transfer | Quantity per line | Block zero qty line | Line added | 1. Set qty: 0<br>2. Submit | 0 | Error: "Quantity per line required" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-BR-01 | Inventory Transfer | Restricted product | Block transfer of restricted items | Product: Hazardous | 1. Try transfer hazardous product | Restricted product | Blocked: "Cannot transfer restricted product" | High | High | Business Rule |
| IT-BR-02 | Inventory Transfer | Transfer limit per day | Daily transfer limit per user | Daily limit: 5 | 1. Execute 6 transfers in one day | 6 transfers | 6th transfer blocked or flagged | Medium | Medium | Business Rule |
| IT-BR-03 | Inventory Transfer | Status conflict | Block transfer of stock under QC | QC status: In Inspection | 1. Try transfer QC-held stock | QC status | Blocked: "Stock under QC cannot be transferred" | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-UI-01 | Inventory Transfer | Warehouse dropdown | Select source/destination | Form open | 1. Click source dropdown<br>2. Select WH-A<br>3. Click dest<br>4. Select WH-B | WH-A, WH-B | Both selected correctly | Medium | Medium | UI |
| IT-UI-02 | Inventory Transfer | Product grid | Add multiple lines | Form open | 1. Click Add Line 5 times<br>2. Verify 5 rows | 5 rows | Grid shows 5 empty rows | Medium | Medium | UI |
| IT-UI-03 | Inventory Transfer | Availability check indicator | Show real-time available qty | Source WH has stock | 1. Select product<br>2. Check available display | Available: 500 | Display shows "Available: 500" | Medium | Medium | UI |
| IT-UI-04 | Inventory Transfer | Total value display | Verify total transfer value | Lines with prices | 1. Add 3 lines at various prices<br>2. Check total | 3 lines | Total calculated and displayed | Medium | Medium | UI |
| IT-UI-05 | Inventory Transfer | Status timeline | Show transfer progress | Transfer in progress | 1. View status timeline | Pending→Approved→In Transit→Received | Timeline shows all steps | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-WF-01 | Inventory Transfer | Draft→Approve→Execute | Full transfer lifecycle | Draft transfer created | 1. Save as Draft<br>2. Submit for Approval<br>3. Approve<br>4. Execute | Complete flow | Status sequence: Draft→Approved→Executed→Completed | High | Critical | Workflow |
| IT-WF-02 | Inventory Transfer | Reject transfer | Reject from approval | Transfer in queue | 1. Open approval queue<br>2. Reject with reason | Reason: "Wrong destination" | Status: Rejected, creator notified | High | High | Workflow |
| IT-WF-03 | Inventory Transfer | Cancel pending transfer | Cancel before execution | Transfer approved, not yet executed | 1. Click Cancel<br>2. Confirm | Cancel reason | Status: Cancelled, no stock movement | High | High | Workflow |
| IT-WF-04 | Inventory Transfer | Receive partial | Partial receipt at destination | Transfer: 1000 in transit | 1. Receive 400 at destination<br>2. Confirm | Received: 400, Remaining: 600 | Receipt created, remaining in transit | High | High | Workflow |
| IT-WF-05 | Inventory Transfer | Auto-complete | Transfer marked complete when all received | All items received | 1. Verify transfer status | 100% received | Status: Completed automatically | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| IT-INT-01 | Inventory Transfer | Transfer→Stock Ready | Stock available after receipt | Transfer executed | 1. Check Stock Ready module<br>2. Check available qty | WH-B stock | Stock listed as available | High | Critical | Integration |
| IT-INT-02 | Inventory Transfer | Transfer→Balance Inquiry | Balance reflects transfer | Transfer complete | 1. Check Balance Inquiry for both WH | WH-A reduced, WH-B increased | Balances correct | High | Critical | Integration |
| IT-INT-03 | Inventory Transfer | Transfer→Operational Cost | Transfer cost recorded | Transfer with cost | 1. Check Operational Cost | Transfer cost | Cost record created | Medium | High | Integration |
| IT-INT-04 | Inventory Transfer | Withdrawal conflict | Prevent overlapping operations | Transfer in transit | 1. Try Withdrawal from same stock | In-transit stock | Blocked OR adjusted availability | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| IT-API-01 | Inventory Transfer | POST /api/transfer | Create transfer | Source, dest, lines | 201 Created | High | High | API |
| IT-API-02 | Inventory Transfer | GET /api/transfer/{id}/status | Check status | Transfer ID | 200 OK with status | High | High | API |
| IT-API-03 | Inventory Transfer | POST /api/transfer/{id}/receive | Receive at destination | Qty received | 200 OK, stock updated | High | Critical | API |
| IT-API-04 | Inventory Transfer | GET /api/transfer?status=pending | List pending transfers | Filter status | Filtered list | Medium | Medium | API |
| IT-API-05 | Inventory Transfer | POST /api/transfer/{id}/cancel | Cancel transfer | Reason | 200 OK, status cancelled | High | High | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| IT-DB-01 | Inventory Transfer | Transfer header and lines created | DB records correct | High | High | DB |
| IT-DB-02 | Inventory Transfer | Stock movement logged | Inventory transaction table updated | High | Critical | DB |
| IT-DB-03 | Inventory Transfer | FK integrity maintained | All references valid | High | High | DB |
| IT-DB-04 | Inventory Transfer | Reversal record for cancelled | Correct reversal on cancel | Medium | High | DB |
| IT-DB-05 | Inventory Transfer | No double-receipt allowed | Duplicate receive blocked | High | High | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| IT-SEC-01 | Inventory Transfer | SQL Injection in product search | `'; DROP TABLE transfers; --` | Blocked, sanitized | High | Critical | Security |
| IT-SEC-02 | Inventory Transfer | Access cross-company transfer | Access other org's transfer | 403 Forbidden | High | Critical | Security |
| IT-SEC-03 | Inventory Transfer | Tamper transfer qty in API | Change qty in request | Rejected or logged | High | High | Security |
| IT-SEC-04 | Inventory Transfer | Unauthorized receive | Receive without approval | 403 Forbidden | High | High | Security |
| IT-SEC-05 | Inventory Transfer | Audit log tampering | Delete/modify audit logs | Blocked at DB level | High | Critical | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| IT-PERF-01 | Inventory Transfer | Concurrent transfers | 100 users transferring simultaneously | All < 3s | High | Performance |
| IT-PERF-02 | Inventory Transfer | Large batch transfer | 2000 line items per transfer | Processed < 10s | Medium | Performance |
| IT-PERF-03 | Inventory Transfer | Real-time stock check | 50 concurrent availability queries | All < 500ms | High | Performance |
| IT-PERF-04 | Inventory Transfer | Report generation | Monthly transfer report with 10k rows | Generated < 15s | Medium | Performance |
| IT-PERF-05 | Inventory Transfer | API response time | Single transfer create | < 300ms | High | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| IT-UAT-01 | Inventory Transfer | Warehouse Staff | Daily inter-warehouse stock balancing | All movements recorded correctly | High |
| IT-UAT-02 | Inventory Transfer | WH Supervisor | Approve transfers between warehouses | Correct approval notifications | High |
| IT-UAT-03 | Inventory Transfer | Inventory Controller | Track stock in transit | In-transit visibility accurate | High |
| IT-UAT-04 | Inventory Transfer | Finance Team | Verify transfer costs | Costs assigned to correct cost center | Medium |
| IT-UAT-05 | Inventory Transfer | Procurement | Transfer between WH and vendor consignment | Consignment stock tracked | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/50-inventory-transfer-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Inventory Transfer E2E', () => {
  test('IT-AUTO-01: Complete transfer lifecycle', async ({ page }) => {
    await page.goto('/inventory-transfer');
    await page.click('#createTransfer');
    await page.selectOption('#sourceWarehouse', 'WH-JKT');
    await page.selectOption('#destWarehouse', 'WH-BDG');
    await page.click('#addLine');
    await page.selectOption('.product-select', 'ITEM-001');
    await page.fill('.qty', '100');
    await page.click('#submitDraft');
    await expect(page.locator('.status')).toContainText('Draft');
    
    await page.click('#submitForApproval');
    await expect(page.locator('.status')).toContainText('Pending');
    
    await page.goto('/so-approval');
    await page.click('.approve-transfer-btn');
    await page.click('#approveConfirm');
    
    await page.goto('/inventory-transfer');
    await page.click('#executeTransfer');
    await expect(page.locator('.status')).toContainText('Completed');
  });

  test('IT-AUTO-02: Block same-warehouse transfer', async ({ page }) => {
    await page.goto('/inventory-transfer/create');
    await page.selectOption('#sourceWarehouse', 'WH-JKT');
    await page.selectOption('#destWarehouse', 'WH-JKT'); // Same
    await page.click('#addLine');
    await page.selectOption('.product-select', 'ITEM-001');
    await page.fill('.qty', '50');
    await page.click('#submitTransfer');
    await expect(page.locator('.error-message'))
      .toContainText('Source and destination cannot be the same');
  });

  test('IT-AUTO-03: Verify stock at destination', async ({ page }) => {
    const beforeStock = await page.textContent('#whbdg-stock-ITEM001');
    await page.goto('/inventory-transfer');
    await page.completeTransferFlow('WH-JKT', 'WH-BDG', 'ITEM-001', 100);
    const afterStock = await page.textContent('#whbdg-stock-ITEM001');
    expect(parseInt(afterStock)).toBe(parseInt(beforeStock) + 100);
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | Stock deducted but not received at dest | Medium | Critical | Two-phase commit pattern |
| High | Partial receive without balance update | Medium | High | Transaction test |
| Medium | Warehouse permission bypass | Low | High | RBAC enforcement |
| Medium | Duplicate transfer execution | Low | High | Idempotency check |
| Low | UI not refreshing after receive | Low | Low | WebSocket or polling test |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Warehouse A** | WH-JKT, Jakarta, Type: Main |
| **Warehouse B** | WH-BDG, Bandung, Type: Branch |
| **Product** | ITEM-001, Unit: pcs, Batch: Yes |
| **Transfer Qty** | 100 units (of 500 available) |
| **Transfer Value** | 5,000,000 |
| **Transfer Cost** | 500,000 (logistics) |

---

### 5. Operational Cost

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Track and manage operational expenses across business processes |
| **Main Business Flow** | Cost Incurred → Cost Recording → Approval → GL Posting → Balance Update |
| **Upstream Dependencies** | Cost Center Master, Financial Account Master, Approval Workflow |
| **Downstream Dependencies** | Balance Inquiry, Financial Reports |
| **Related Modules** | Delivery (shipping cost), Inventory Transfer (logistics cost), Withdrawal |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-FN-01 | Operational Cost | Create cost record | Record operational expense | User: Finance Staff | 1. Select cost type<br>2. Select cost center<br>3. Enter amount<br>4. Attach receipt<br>5. Submit | Type: Shipping, CC: CC-001, Amount: 500,000 | Cost record created, status: Draft | High | High | Functional |
| OC-FN-02 | Operational Cost | Approval workflow | Submit cost for approval | Draft cost record | 1. Click Submit for Approval<br>2. Select approver | Approved by Finance Manager | Status: Approved, pending GL posting | High | High | Functional |
| OC-FN-03 | Operational Cost | Recurring cost | Set up recurring operational cost | Fixed monthly cost | 1. Enable recurring<br>2. Set frequency: Monthly<br>3. Set end date<br>4. Submit | Monthly rent: 10M | Auto-created each month | High | Medium | Functional |
| OC-FN-04 | Operational Cost | Cost allocation | Allocate cost to multiple CC | Cost: 1M, 3 CCs | 1. Split allocation: 40/30/30<br>2. Submit | CC-1: 400k, CC-2: 300k, CC-3: 300k | Correct allocation saved | High | High | Functional |
| OC-FN-05 | Operational Cost | GL auto-posting | Post approved cost to GL | Approved cost | 1. Click Post to GL<br>2. Confirm | Approved cost | GL entries created | High | Critical | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-NG-01 | Operational Cost | Negative amount | Enter negative cost amount | Cost form | 1. Enter amount: -500,000 | -500,000 | Error: "Amount must be positive" | High | High | Negative |
| OC-NG-02 | Operational Cost | Future date | Set transaction date in future | Cost form | 1. Set date: Next month | Future date | Error or warning | Medium | Medium | Negative |
| OC-NG-03 | Operational Cost | Invalid cost center | Select inactive CC | CC: CC-INACTIVE | 1. Select inactive CC | Inactive CC | Error: "Cost center not active" | High | High | Negative |
| OC-NG-04 | Operational Cost | Zero amount | Submit zero amount | Cost form | 1. Enter amount: 0 | 0 | Error: "Amount must be > 0" | Medium | Medium | Negative |
| OC-NG-05 | Operational Cost | Missing receipt | Submit without attachment | Receipt required policy | 1. Submit without attachment | No file | Blocked: "Receipt attachment required" | High | High | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-VL-01 | Operational Cost | Amount precision | Enter decimal amount | Cost form | 1. Enter: 1,234,567.89<br>2. Submit | Decimal amount | Saved with 2 decimal precision | Medium | Medium | Validation |
| OC-VL-02 | Operational Cost | Currency validation | Select invalid currency | Cost form | 1. Select currency: XXX<br>2. Submit | Invalid currency | Error: "Invalid currency" | Medium | Medium | Validation |
| OC-VL-03 | Operational Cost | Account number format | Enter invalid GL account | Cost form | 1. Enter account: ABC-123 | Invalid format | Error: "Invalid GL account format" | High | High | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-BV-01 | Operational Cost | Max amount | Cost at maximum limit | Max cost: 100M | 1. Enter amount: 100M<br>2. Submit | 100,000,000 | Accepted or approval required | High | High | Boundary |
| OC-BV-02 | Operational Cost | Min amount | Minimum recordable cost | Min: 1,000 | 1. Enter amount: 1,000<br>2. Submit | 1,000 | Accepted | Medium | Medium | Boundary |
| OC-BV-03 | Operational Cost | Max allocation lines | Cost split to max CCs | Max splits: 10 | 1. Split to 10 CCs<br>2. Submit | 10 CCs | Accepted | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-MF-01 | Operational Cost | Cost type required | Block without cost type | Form open | 1. Leave type blank<br>2. Submit | - | Error: "Cost type required" | High | High | Mandatory |
| OC-MF-02 | Operational Cost | Amount required | Block without amount | Form open | 1. Leave amount blank<br>2. Submit | - | Error: "Amount required" | High | High | Mandatory |
| OC-MF-03 | Operational Cost | Cost center required | Block without CC | Form open | 1. Leave CC blank<br>2. Submit | - | Error: "Cost center required" | High | High | Mandatory |
| OC-MF-04 | Operational Cost | Date required | Block without date | Form open | 1. Leave date blank<br>2. Submit | - | Error: "Transaction date required" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------|----------------|------------|-----------|-----------------|----------|----------|------|
| OC-BR-01 | Operational Cost | Cost limit per type | Block if exceeds monthly limit | Monthly limit: 10M | 1. Post cost: 12M (total 15M for month) | Limit exceeded | Blocked: "Monthly limit exceeded" | High | High | Business Rule |
| OC-BR-02 | Operational Cost | Separation of duties | Block creator from approving | Creator = Requester | 1. Creator tries to self-approve | Same user | Blocked: "Cannot approve own request" | High | High | Business Rule |
| OC-BR-03 | Operational Cost | Duplicate prevention | Prevent duplicate cost posting | Posted cost for date | 1. Try post same cost again | Duplicate | Blocked or flagged as duplicate | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-UI-01 | Operational Cost | Form layout | Verify field arrangement | Cost form | 1. Check alignment<br>2. Test mobile | - | Responsive | Medium | Medium | UI |
| OC-UI-02 | Operational Cost | Attachment upload | Test file upload | Receipt file | 1. Click upload<br>2. Select file<br>3. Verify preview | Receipt.pdf | File attached, preview shown | Medium | Medium | UI |
| OC-UI-03 | Operational Cost | Cost list filtering | Filter by date, type, CC | Cost records exist | 1. Apply filters<br>2. Verify filtered list | Filter: July, Shipping | Only July shipping costs shown | Medium | Medium | UI |
| OC-UI-04 | Operational Cost | Amount formatting | Verify currency formatting | Amount: 1,000,000 | 1. Enter amount<br>2. Check display | 1,000,000 | Displayed as IDR 1,000,000.00 | Medium | Low | UI |
| OC-UI-05 | Operational Cost | Approval history | View approval log | Approved cost | 1. Check approval history tab | Approved by Manager | History shows approver, date, remarks | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-WF-01 | Operational Cost | Draft→Approve→Post | Full posting workflow | Draft cost | 1. Submit for approval<br>2. Approve<br>3. Post to GL | Complete flow | Status: Posted, GL updated | High | Critical | Workflow |
| OC-WF-02 | Operational Cost | Reject cost record | Reject from queue | Cost in approval | 1. Reject with reason | Reason: "Receipt unclear" | Status: Rejected, creator notified | High | High | Workflow |
| OC-WF-03 | Operational Cost | Cancel before posting | Cancel approved cost | Approved, not posted | 1. Click Cancel<br>2. Confirm | Cancel reason | Status: Cancelled, no GL impact | High | High | Workflow |
| OC-WF-04 | Operational Cost | Resubmit corrected | Resubmit after rejection | Rejected cost | 1. Edit cost<br>2. Resubmit | Corrected amount | New approval cycle | High | High | Workflow |
| OC-WF-05 | Operational Cost | Auto-recurring | Monthly auto-creation | Recurring config | 1. Wait for scheduled run<br>2. Check created records | Monthly | Auto-created on schedule | High | Medium | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| OC-INT-01 | Operational Cost | OC→Balance Inquiry | Balance reflects cost posting | Cost posted | 1. Check Balance Inquiry | Posted cost | Balance reduced | High | Critical | Integration |
| OC-INT-02 | Operational Cost | OC→Delivery | Shipping cost auto-created | Delivery completed | 1. Check OC module<br>2. Find shipping cost record | Auto-generated | Record exists linked to delivery | High | High | Integration |
| OC-INT-03 | Operational Cost | OC→Budget | Budget updated after cost | Budget allocated | 1. Check budget consumption | Cost amount | Budget reduced | High | High | Integration |
| OC-INT-04 | Operational Cost | OC→Financial Report | Reports include cost | Multiple costs posted | 1. Generate P&L report | Costs included | Accurate P&L | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| OC-API-01 | Operational Cost | POST /api/operational-cost | Create cost record | Valid cost data | 201 Created | High | High | API |
| OC-API-02 | Operational Cost | POST /api/operational-cost/{id}/approve | Approve cost | Valid cost ID | Status → Approved | High | High | API |
| OC-API-03 | Operational Cost | POST /api/operational-cost/{id}/post | Post to GL | Approved cost | GL entries created | High | Critical | API |
| OC-API-04 | Operational Cost | GET /api/operational-cost/summary | Get cost summary | Date range | Summary with totals | Medium | Medium | API |
| OC-API-05 | Operational Cost | POST /api/operational-cost/recurring | Create recurring | Recurring config | Recurring record created | Medium | Medium | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| OC-DB-01 | Operational Cost | Cost record created | Row in cost table | High | High | DB |
| OC-DB-02 | Operational Cost | GL entries created | Debit/Credit in GL table | High | Critical | DB |
| OC-DB-03 | Operational Cost | Allocations correct | Sum of allocations = total | High | High | DB |
| OC-DB-04 | Operational Cost | Recurring schedule created | Recurring config saved | Medium | Medium | DB |
| OC-DB-05 | Operational Cost | Approval log recorded | Audit trail exists | Medium | Medium | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| OC-SEC-01 | Operational Cost | SQL Injection in cost description | `'; DROP TABLE costs; --` | Blocked | High | Critical | Security |
| OC-SEC-02 | Operational Cost | Amount manipulation via API | Change amount in request | Rejected or flagged | High | High | Security |
| OC-SEC-03 | Operational Cost | Access other org costs | Access via ID change | 403 Forbidden | High | Critical | Security |
| OC-SEC-04 | Operational Cost | Self-approval bypass | Creator tries self-approval | Blocked | High | High | Security |
| OC-SEC-05 | Operational Cost | Attachment path traversal | Upload file: ../../etc/passwd | Blocked, sanitized | High | Critical | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| OC-PERF-01 | Operational Cost | Batch cost posting | 500 costs posted simultaneously | All < 5s | High | Performance |
| OC-PERF-02 | Operational Cost | Report generation | Annual cost report with 50k rows | < 20s | Medium | Performance |
| OC-PERF-03 | Operational Cost | Recurring job performance | 1000 recurring configs run | Job completes < 30s | Medium | Performance |
| OC-PERF-04 | Operational Cost | Attachment upload | 10MB file upload | < 3s | Medium | Performance |
| OC-PERF-05 | Operational Cost | API response create cost | Single cost creation | < 400ms | High | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| OC-UAT-01 | Operational Cost | Finance Staff | Record daily operational expenses | All costs accurately recorded | High |
| OC-UAT-02 | Operational Cost | Finance Manager | Approve and post costs to GL | Correct GL entries posted | High |
| OC-UAT-03 | Operational Cost | Cost Accountant | Verify cost allocation accuracy | Allocations match business rules | High |
| OC-UAT-04 | Operational Cost | Department Head | View departmental operational costs | Correct CC-level reports | Medium |
| OC-UAT-05 | Operational Cost | System Admin | Configure recurring cost templates | Auto-creation works correctly | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/60-operational-cost-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Operational Cost E2E', () => {
  test('OC-AUTO-01: Create and approve cost', async ({ page }) => {
    await page.goto('/operational-cost/create');
    await page.selectOption('#costType', 'SHIPPING');
    await page.selectOption('#costCenter', 'CC-001');
    await page.fill('#amount', '500000');
    await page.setInputFiles('#receiptUpload', './test-data/receipt.pdf');
    await page.click('#submitDraft');
    await page.click('#submitForApproval');
    await expect(page.locator('.status')).toContainText('Pending');
    
    await page.goto('/so-approval');
    await page.click('.approve-cost-btn');
    await expect(page.locator('.toast')).toContainText('Cost Approved');
  });

  test('OC-AUTO-02: Post cost to GL', async ({ page }) => {
    await page.goto('/operational-cost');
    await page.click(`.post-btn[data-cost-id="OC-APPROVED-001"]`);
    await page.click('#confirmPost');
    await expect(page.locator('.status')).toContainText('Posted');
  });

  test('OC-AUTO-03: Block self-approval', async ({ page }) => {
    await page.goto('/operational-cost');
    await page.click(`.approve-btn[data-creator="${page.context().user}]`);
    await expect(page.locator('.error'))
      .toContainText('Cannot approve own request');
  });

  test('OC-AUTO-04: Verify balance impact', async ({ page }) => {
    const beforeBalance = await page.textContent('#balance-amount');
    await page.goto('/operational-cost');
    await page.postCost('OC-POST-001');
    const afterBalance = await page.textContent('#balance-amount');
    expect(parseInt(afterBalance)).toBeLessThan(parseInt(beforeBalance));
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | GL posting without approval | Medium | Critical | Approval gate in API |
| High | Duplicate cost posting | Low | High | Idempotency key |
| Medium | Recurring cost runs twice | Low | Medium | Scheduler lock mechanism |
| Medium | Allocation doesn't sum to total | Medium | High | Validation check |
| Low | File upload fails silently | Low | Low | Upload confirmation |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Cost Type** | Shipping, Logistics, Administration, Utilities |
| **Cost Center** | CC-001 Production, CC-002 Sales, CC-003 Admin |
| **Financial Account** | ACC-OPEX-301 (Operating Expense), ACC-AP-201 (AP) |
| **Amount** | 500,000 (shipping), 10,000,000 (monthly rent) |
| **GL Account** | 6100-001 (Freight Expense), 6200-001 (Utilities) |
| **Vendor** | PT. JNE, PT. POS, PT. PLN |

---

### 6. Balance Inquiry

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Provide real-time visibility into inventory and financial balances across warehouses and accounts |
| **Main Business Flow** | Transaction Posted → Balance Updated → Inquiry Served → Report Generated |
| **Upstream Dependencies** | All transaction modules: SO, PO, Delivery, Transfer, Withdrawal, Operational Cost |
| **Downstream Dependencies** | Financial Reports, Decision Making |
| **Related Modules** | All modules (read-only aggregator) |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-FN-01 | Balance Inquiry | View stock balance | Check available stock | Stock exists in WH | 1. Select warehouse<br>2. Select product<br>3. View balance | WH-JKT, ITEM-001 | Correct balance displayed | High | High | Functional |
| BI-FN-02 | Balance Inquiry | View financial balance | Check GL account balance | Transactions posted | 1. Select GL account<br>2. Select date range<br>3. Click Search | ACC-CASH-101, Date range | Correct balance and transactions | High | High | Functional |
| BI-FN-03 | Balance Inquiry | Compare warehouses | Side-by-side WH comparison | 2 WH with stock | 1. Select comparison mode<br>2. Select WHs<br>3. View | WH-JKT vs WH-BDG | Side-by-side comparison shown | Medium | Medium | Functional |
| BI-FN-04 | Balance Inquiry | Drill-down details | View transaction details | Balance has history | 1. Click balance amount<br>2. View transactions | Balance: 5000 | List of related transactions | High | High | Functional |
| BI-FN-05 | Balance Inquiry | Aging report | View stock aging | Stock with various dates | 1. Select aging report<br>2. Select date<br>3. Generate | Aging buckets: 0-30, 31-60, 60+ days | Correct aging distribution | High | High | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-NG-01 | Balance Inquiry | View closed period | Query closed accounting period | Period: Jan 2024 (Closed) | 1. Select closed period<br>2. Search | Closed period | Error or read-only view | Medium | Medium | Negative |
| BI-NG-02 | Balance Inquiry | Invalid warehouse | Select deleted WH | WH-DELETED | 1. Select invalid WH | Non-existent | Error: "Warehouse not found" | Medium | Medium | Negative |
| BI-NG-03 | Balance Inquiry | No transactions | Query with no data | Empty WH or period | 1. Query empty WH | No stock | Message: "No data found" | Low | Low | Negative |
| BI-NG-04 | Balance Inquiry | Future date range | Query future period | Date: Next year | 1. Select future date | Future date | Error or no data | Medium | Low | Negative |
| BI-NG-05 | Balance Inquiry | Negative balance display | Display negative balance | Loss/overdraft scenario | 1. Query account with negative balance | Negative balance | Displayed as negative or in red | Low | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-VL-01 | Balance Inquiry | Number formatting | Verify large number display | Balance: 1,000,000,000 | 1. View balance<br>2. Check format | 1B IDR | Formatted with thousand separators | Low | Low | Validation |
| BI-VL-02 | Balance Inquiry | Date format | Verify date display | Various dates | 1. Check transaction dates | DD/MM/YYYY | Consistent date format | Low | Low | Validation |
| BI-VL-03 | Balance Inquiry | Zero balance | Display zero balance | No stock/CC balance | 1. Query zero balance element | Balance: 0 | Displayed as 0 or "-" | Low | Low | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-BV-01 | Balance Inquiry | Max stock display | View max stock warehouse | Max: 1,000,000 | 1. View WH with max stock | 1M units | Displayed correctly | Medium | Medium | Boundary |
| BI-BV-02 | Balance Inquiry | Max value balance | View GL with max balance | Max: 10B | 1. Query high-value account | 10B | Displayed correctly | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-MF-01 | Balance Inquiry | Warehouse required for stock | Block without WH selection | Form open | 1. Try view balance without WH<br>2. Submit | - | Error: "Select warehouse" | High | High | Mandatory |
| BI-MF-02 | Balance Inquiry | Date range required for GL | Block without dates | GL inquiry | 1. Leave dates blank<br>2. Submit | - | Error: "Date range required" | High | High | Mandatory |
| BI-MF-03 | Balance Inquiry | Account required for GL | Block without account | GL inquiry | 1. Leave account blank<br>2. Submit | - | Error: "Select GL account" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-BR-01 | Balance Inquiry | Real-time accuracy | Balance matches actual transactions | Post 100 transactions | 1. Create 100 transactions<br>2. Check balance | 100 transactions | Balance = sum of transactions | High | Critical | Business Rule |
| BI-BR-02 | Balance Inquiry | Period-end lock | View locked period | Period: Dec 2024 (Locked) | 1. Try edit locked period data | Locked | Read-only, cannot modify | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-UI-01 | Balance Inquiry | Dashboard layout | Verify balance summary cards | Page loaded | 1. Check cards<br>2. Verify responsive | - | Cards aligned, visible | Medium | Medium | UI |
| BI-UI-02 | Balance Inquiry | Chart rendering | Verify balance charts | Data available | 1. View charts<br>2. Change time range | Daily/Monthly view | Charts render correctly | Medium | Medium | UI |
| BI-UI-03 | Balance Inquiry | Export to Excel | Test export functionality | Results displayed | 1. Click Export<br>2. Open file | .xlsx file | Data matches on-screen | Medium | Medium | UI |
| BI-UI-04 | Balance Inquiry | Drill-down links | Click balance to see details | Balance has transactions | 1. Click on balance amount | Transaction list | Opens detail view | Medium | Medium | UI |
| BI-UI-05 | Balance Inquiry | Pagination | Test large result pagination | 1000 results | 1. Scroll to page 5 | Page 5 | Correct subset displayed | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-WF-01 | Balance Inquiry | Real-time update | Balance updates after transaction | Transaction posted | 1. Post delivery (stock -50)<br>2. Refresh BI | New balance | Reflected immediately | High | Critical | Workflow |
| BI-WF-02 | Balance Inquiry | Scheduled refresh | Auto-refresh balance | Scheduled config | 1. Wait for scheduled refresh<br>2. Check updates | Every 15 min | Updated at scheduled time | High | Medium | Workflow |
| BI-WF-03 | Balance Inquiry | Historical snapshot | View historical balance | Date in past | 1. Select past date<br>2. View balance | Past date | Balance as of that date | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| BI-INT-01 | Balance Inquiry | SO→BI | Balance reduced after delivery | SO delivered | 1. Deliver 50 units<br>2. Check BI | Stock: 100→50 | BI shows 50 | High | Critical | Integration |
| BI-INT-02 | Balance Inquiry | PO→BI | Balance increased after GRN | PO received | 1. Receive 200 units<br>2. Check BI | Stock: 100→300 | BI shows 300 | High | Critical | Integration |
| BI-INT-03 | Balance Inquiry | Transfer→BI | Source reduced, dest increased | Transfer executed | 1. Transfer 100 A→B<br>2. Check BI | A: 500→400, B: 200→300 | Correctly reflected | High | Critical | Integration |
| BI-INT-04 | Balance Inquiry | OC→BI | Financial balance updated | OC posted | 1. Post cost 1M<br>2. Check GL balance | Balance reduced | Correctly posted | High | Critical | Integration |
| BI-INT-05 | Balance Inquiry | Withdrawal→BI | Stock reduced after withdrawal | Withdrawal posted | 1. Withdraw 30 units<br>2. Check BI | Stock: 200→170 | Correctly reflected | High | Critical | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| BI-API-01 | Balance Inquiry | GET /api/balance/stock | Get stock balance | WH, product, date | 200 OK with balance | High | High | API |
| BI-API-02 | Balance Inquiry | GET /api/balance/gl | Get GL balance | Account, date range | 200 OK with balance | High | High | API |
| BI-API-03 | Balance Inquiry | GET /api/balance/transactions | Get transaction history | Filters | Paginated transaction list | Medium | Medium | API |
| BI-API-04 | Balance Inquiry | GET /api/balance/aging | Get aging report | Product, date | Aging buckets | Medium | Medium | API |
| BI-API-05 | Balance Inquiry | GET /api/balance/summary | Get dashboard summary | No params | Summary totals | High | Medium | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| BI-DB-01 | Balance Inquiry | Balance = sum of transactions | Calculated balance matches | High | Critical | DB |
| BI-DB-02 | Balance Inquiry | Period-end snapshot stored | Snapshot record exists | High | High | DB |
| BI-DB-03 | Balance Inquiry | No orphaned transactions | All transactions have valid refs | High | High | DB |
| BI-DB-04 | Balance Inquiry | Concurrent update handling | No negative balance from race | High | Critical | DB |
| BI-DB-05 | Balance Inquiry | Audit log for balance changes | Changes logged | Medium | Medium | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| BI-SEC-01 | Balance Inquiry | SQL Injection in search | `' UNION SELECT * FROM users --` | Blocked | High | Critical | Security |
| BI-SEC-02 | Balance Inquiry | Access other company data | Change company ID in URL | 403 Forbidden | High | Critical | Security |
| BI-SEC-03 | Balance Inquiry | Export sensitive data | Export all balances | Authorized export only | High | High | Security |
| BI-SEC-04 | Balance Inquiry | Rate limit on queries | 1000 rapid requests | 429 after threshold | Medium | Medium | Security |
| BI-SEC-05 | Balance Inquiry | Unauthorized access | Access without login | Redirect to login | High | High | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| BI-PERF-01 | Balance Inquiry | Concurrent queries | 200 users querying simultaneously | All < 2s | High | Performance |
| BI-PERF-02 | Balance Inquiry | Large dataset query | 1M transaction history | Query < 5s | High | Performance |
| BI-PERF-03 | Balance Inquiry | Dashboard load | Load full dashboard | Dashboard with 20 widgets | < 3s | High | Performance |
| BI-PERF-04 | Balance Inquiry | Export performance | Export 100k rows to Excel | Export < 15s | Medium | Performance |
| BI-PERF-05 | Balance Inquiry | Cache performance | Repeated same query | Cached < 500ms | Medium | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| BI-UAT-01 | Balance Inquiry | Finance Manager | Daily P&L visibility from BI | Accurate balances | High |
| BI-UAT-02 | Balance Inquiry | Warehouse Manager | Real-time stock levels across WH | Accurate stock levels | High |
| BI-UAT-03 | Balance Inquiry | Procurement | Monitor PO impact on inventory | Correct stock impact shown | Medium |
| BI-UAT-04 | Balance Inquiry | Sales | Check product availability before promising delivery | Accurate availability | High |
| BI-UAT-05 | Balance Inquiry | Auditor | Trail of all balance changes | Complete audit trail | High |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/70-balance-inquiry-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Balance Inquiry E2E', () => {
  test('BI-AUTO-01: Stock balance reflects delivery', async ({ page }) => {
    const beforeBalance = await page.getStockBalance('ITEM-001', 'WH-JKT');
    await page.completeDelivery('DL-001', 50);
    const afterBalance = await page.getStockBalance('ITEM-001', 'WH-JKT');
    expect(afterBalance).toBe(beforeBalance - 50);
  });

  test('BI-AUTO-02: GL balance reflects cost posting', async ({ page }) => {
    const beforeGL = await page.getGLBalance('ACC-OPEX-301');
    await page.postCost('OC-APPROVED-001');
    const afterGL = await page.getGLBalance('ACC-OPEX-301');
    expect(afterGL).toBe(beforeGL + 500000);
  });

  test('BI-AUTO-03: Transfer reflected in both WH', async ({ page }) => {
    await page.completeTransfer('TRF-001', 100);
    const whJkt = await page.getStockBalance('ITEM-001', 'WH-JKT');
    const whBdg = await page.getStockBalance('ITEM-001', 'WH-BDG');
    expect(whJkt).toBeLessThan(await page.getInitialStock('ITEM-001', 'WH-JKT'));
    expect(whBdg).toBeGreaterThan(await page.getInitialStock('ITEM-001', 'WH-BDG'));
  });

  test('BI-AUTO-04: Export to Excel', async ({ page }) => {
    await page.goto('/balance-inquiry');
    await page.selectOption('#reportType', 'STOCK');
    await page.click('#exportExcel');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('BI-AUTO-05: Period-end locked view', async ({ page }) => {
    await page.goto('/balance-inquiry');
    await page.selectOption('#period', 'DEC-2024-LOCKED');
    await page.click('#search');
    await expect(page.locator('.locked-indicator')).toBeVisible();
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | Balance diverges from actual | Low | Critical | Reconciliation job |
| High | Negative stock allowed | Medium | Critical | Hard constraint in API |
| Medium | Stale data from cache | Medium | High | Cache invalidation |
| Medium | Slow query on large history | Medium | Medium | Indexing + pagination |
| Low | Export truncates large datasets | Low | Medium | Streaming export |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Warehouse** | WH-JKT (Balance: 5000 units) |
| **Product** | ITEM-001, ITEM-002 |
| **GL Account** | ACC-CASH-101 (Balance: 150M), ACC-OPEX-301 (Balance: 25M) |
| **Period** | Current: June 2025, Locked: December 2024 |
| **Transaction Count** | 10,000 (current period) |
| **Balance Range** | 0 to 10,000,000,000 |

---

### 7. Withdrawal

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Record stock removal from warehouse for internal consumption, loss, damage, or adjustment |
| **Main Business Flow** | Withdrawal Request → Approval → Stock Deduction → Balance Update → Cost Recording |
| **Upstream Dependencies** | Warehouse Master, Product Master, Stock Availability, Cost Center |
| **Downstream Dependencies** | Balance Inquiry, Operational Cost |
| **Related Modules** | Delivery, Inventory Transfer, Operational Cost |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-FN-01 | Withdrawal | Internal consumption withdrawal | Remove stock for internal use | Stock: 1000 in WH-JKT | 1. Select WH<br>2. Add product<br>3. Set qty: 50<br>4. Set reason: Internal Use<br>5. Submit | Qty: 50, Reason: Internal Use | Withdrawal created, stock reduced | High | High | Functional |
| WD-FN-02 | Withdrawal | Damage/loss withdrawal | Record damaged stock | Damaged products exist | 1. Select product<br>2. Set qty: 20<br>3. Reason: Damaged<br>4. Attach photo<br>5. Submit | Qty: 20, Reason: Damaged | Recorded with evidence | High | High | Functional |
| WD-FN-03 | Withdrawal | Stock adjustment | Adjust for count discrepancy | Count variance exists | 1. Adjust: Actual 950 vs System 1000<br>2. Reason: Count Variance | Difference: 50 | System updated to match physical | High | High | Functional |
| WD-FN-04 | Withdrawal | Approval workflow | Submit for approval | Draft withdrawal | 1. Submit for approval<br>2. Approve in module | Approved by WH Manager | Status: Approved, stock deducted | High | High | Functional |
| WD-FN-05 | Withdrawal | Return to vendor | Return defective stock to supplier | Defective from PO delivery | 1. Create return withdrawal<br>2. Link to PO<br>3. Submit | Linked to PO-001 | Return recorded, vendor notified | High | High | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-NG-01 | Withdrawal | Exceed available stock | Withdraw more than on-hand | On-hand: 100 | 1. Request withdrawal: 150 | Available: 100, Requested: 150 | Blocked: "Insufficient stock" | High | High | Negative |
| WD-NG-02 | Withdrawal | Unauthorized warehouse | User not assigned to WH | User: WH-BDG staff | 1. Try withdraw from WH-JKT | No access to WH-JKT | Blocked: "No warehouse access" | High | High | Negative |
| WD-NG-03 | Withdrawal | Invalid reason | Select invalid reason code | Reason codes limited | 1. Enter reason: "Unknown" | Invalid reason | Error: "Invalid reason code" | Medium | Medium | Negative |
| WD-NG-04 | Withdrawal | Blocked product | Withdraw blocked product | Product status: Blocked | 1. Select blocked product<br>2. Submit | Blocked product | Blocked: "Product not active" | High | Medium | Negative |
| WD-NG-05 | Withdrawal | Zero qty | Submit with zero qty | Form open | 1. Set qty: 0<br>2. Submit | 0 | Blocked: "Quantity required" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-VL-01 | Withdrawal | Reason code validation | Verify reason dropdown values | Reason list exists | 1. Check reason options | Valid reasons listed | Only valid reasons shown | Medium | Medium | Validation |
| WD-VL-02 | Withdrawal | Document number format | Auto-generated withdrawal number | Create withdrawal | 1. Check generated number | Format: WDR-YYYYMM-XXX | Follows format | Low | Low | Validation |
| WD-VL-03 | Withdrawal | Cost center auto-fill | CC auto-filled from WH | WH linked to CC | 1. Select WH<br>2. Check CC field | Auto: CC-JKT | CC auto-populated | Medium | Medium | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-BV-01 | Withdrawal | Max withdrawal qty | Withdraw all available stock | Available: 5000 | 1. Withdraw: 5000<br>2. Submit | 5000 | Accepted, balance = 0 | High | High | Boundary |
| WD-BV-02 | Withdrawal | Min qty | Withdraw single unit | Min: 1 | 1. Withdraw: 1<br>2. Submit | 1 | Accepted | Medium | Medium | Boundary |
| WD-BV-03 | Withdrawal | Max value | Withdraw high-value stock | Value: 100M | 1. Withdraw 100M worth<br>2. Submit | 100M | Accepted or approval triggered | Medium | High | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-MF-01 | Withdrawal | Warehouse required | Block without WH | Form open | 1. Leave WH blank<br>2. Submit | - | Error: "Warehouse required" | High | High | Mandatory |
| WD-MF-02 | Withdrawal | Product required | Block without product | Form open | 1. No product lines<br>2. Submit | - | Error: "Add product" | High | High | Mandatory |
| WD-MF-03 | Withdrawal | Quantity required | Block without qty | Line added | 1. Leave qty blank<br>2. Submit | - | Error: "Quantity required" | High | High | Mandatory |
| WD-MF-04 | Withdrawal | Reason required | Block without reason | Form open | 1. Leave reason blank<br>2. Submit | - | Error: "Reason is mandatory" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-BR-01 | Withdrawal | Max per transaction | Block if exceeds limit | Daily limit: 1000 | 1. Withdraw 1200 | Limit exceeded | Blocked OR approval required | High | High | Business Rule |
| WD-BR-02 | Withdrawal | Negative balance prevention | Prevent negative stock | On-hand: 50 | 1. Withdraw 60 | Insufficient | Blocked: "Result would be negative stock" | High | Critical | Business Rule |
| WD-BR-03 | Withdrawal | Damage return to vendor | Auto-create return PO | Damage to vendor X | 1. Return to vendor X | Vendor return | Return PO auto-created | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-UI-01 | Withdrawal | Warehouse filter | Select WH from dropdown | Form open | 1. Click WH dropdown<br>2. Select WH-JKT | WH-JKT | Selected, details loaded | Medium | Medium | UI |
| WD-UI-02 | Withdrawal | Reason dropdown | Select reason | Dropdown present | 1. Open reason list<br>2. Select "Damaged" | Damaged | Selected, displayed | Medium | Medium | UI |
| WD-UI-03 | Withdrawal | Photo attachment | Upload damage photo | Damage withdrawal | 1. Click upload<br>2. Select photo | photo.jpg | Photo attached, visible | Medium | Medium | UI |
| WD-UI-04 | Withdrawal | Balance indicator | Show current stock | Form open | 1. Select product<br>2. Check available display | Available: 500 | Shows current available qty | Medium | Medium | UI |
| WD-UI-05 | Withdrawal | Approval status badge | Show current status | Withdrawal in flow | 1. Check status badge | Draft/Pending/Approved | Status clearly visible | Medium | Low | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-WF-01 | Withdrawal | Draft→Approve→Execute | Full withdrawal lifecycle | Draft withdrawal | 1. Save draft<br>2. Submit<br>3. Approve<br>4. Execute | Complete flow | Status: Completed | High | Critical | Workflow |
| WD-WF-02 | Withdrawal | Reject withdrawal | Reject from approval | Withdrawal in queue | 1. Reject with reason | Reason: "Insufficient justification" | Status: Rejected, creator notified | High | High | Workflow |
| WD-WF-03 | Withdrawal | Cancel approved | Cancel after approval | Approved, not executed | 1. Click Cancel<br>2. Confirm | Cancel reason | Status: Cancelled, stock not deducted | High | High | Workflow |
| WD-WF-04 | Withdrawal | Resubmit after rejection | Edit and resubmit | Rejected withdrawal | 1. Edit quantity<br>2. Resubmit | Corrected data | New approval cycle | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| WD-INT-01 | Withdrawal | WD→Balance Inquiry | Balance reduced after withdrawal | Withdrawal executed | 1. Check Balance Inquiry | Stock reduced | Correct balance shown | High | Critical | Integration |
| WD-INT-02 | Withdrawal | WD→Operational Cost | Cost recorded for withdrawal | Withdrawal with cost | 1. Check Operational Cost | Cost record created | Cost linked to withdrawal | High | High | Integration |
| WD-INT-03 | Withdrawal | WD→Delivery conflict | Cannot deliver withdrawn stock | Stock withdrawn | 1. Try create delivery for same stock | Stock not available | Blocked | High | High | Integration |
| WD-INT-04 | Withdrawal | WD→Transfer conflict | Cannot transfer withdrawn stock | Stock withdrawn | 1. Try transfer same stock | Stock not available | Blocked | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| WD-API-01 | Withdrawal | POST /api/withdrawal | Create withdrawal | Valid WH, product, qty | 201 Created | High | High | API |
| WD-API-02 | Withdrawal | POST /api/withdrawal/{id}/approve | Approve withdrawal | Valid withdrawal ID | Status → Approved | High | High | API |
| WD-API-03 | Withdrawal | POST /api/withdrawal/{id}/execute | Execute withdrawal | Approved withdrawal | Stock deducted | High | Critical | API |
| WD-API-04 | Withdrawal | GET /api/withdrawal/warehouse/{id} | Get withdrawals by WH | WH ID | List of withdrawals | Medium | Medium | API |
| WD-API-05 | Withdrawal | POST /api/withdrawal/{id}/cancel | Cancel withdrawal | Reason | Status → Cancelled | High | High | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| WD-DB-01 | Withdrawal | Record created in withdrawal table | Row exists | High | High | DB |
| WD-DB-02 | Withdrawal | Stock deducted in inventory | Quantity reduced | High | Critical | DB |
| WD-DB-03 | Withdrawal | Cost record created if applicable | Linked cost record | High | High | DB |
| WD-DB-04 | Withdrawal | Cannot execute twice | Duplicate blocked | High | High | DB |
| WD-DB-05 | Withdrawal | Audit trail present | Log exists | Medium | Medium | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| WD-SEC-01 | Withdrawal | SQL Injection in reason field | `'; DROP TABLE withdrawals; --` | Blocked | High | Critical | Security |
| WD-SEC-02 | Withdrawal | Access other WH withdrawals | Change WH ID in URL | 403 Forbidden | High | Critical | Security |
| WD-SEC-03 | Withdrawal | Override qty in API | Change qty to negative | Blocked or rejected | High | High | Security |
| WD-SEC-04 | Withdrawal | Execute without approval | Try execute draft | 403 Forbidden | High | High | Security |
| WD-SEC-05 | Withdrawal | Mass withdrawal via script | Script rapid withdrawals | Rate limited | Medium | High | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| WD-PERF-01 | Withdrawal | Concurrent withdrawals | 100 users withdrawing | All < 3s | High | Performance |
| WD-PERF-02 | Withdrawal | Large batch withdrawal | 500 line items | Processed < 10s | Medium | Performance |
| WD-PERF-03 | Withdrawal | Stock balance recalculation | After 50 withdrawals | Updated within 1s | High | Performance |
| WD-PERF-04 | Withdrawal | Report generation | Withdrawal report 1 month | Generated < 10s | Medium | Performance |
| WD-PERF-05 | Withdrawal | API response time | Single withdrawal create | < 300ms | High | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| WD-UAT-01 | Withdrawal | Warehouse Staff | Process daily internal withdrawals | All recorded correctly | High |
| WD-UAT-02 | Withdrawal | WH Supervisor | Approve damage/loss withdrawals | Approved with evidence | High |
| WD-UAT-03 | Withdrawal | Inventory Controller | Perform cycle count adjustments | System matches physical | High |
| WD-UAT-04 | Withdrawal | Finance Team | Verify withdrawal costs posted | Correct GL impact | Medium |
| WD-UAT-05 | Withdrawal | Manager | Review monthly withdrawal reports | Accurate summary | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/80-withdrawal-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Withdrawal E2E', () => {
  test('WD-AUTO-01: Create and execute withdrawal', async ({ page }) => {
    await page.goto('/withdrawal');
    await page.click('#createWithdrawal');
    await page.selectOption('#warehouse', 'WH-JKT');
    await page.click('#addLine');
    await page.selectOption('.product-select', 'ITEM-001');
    await page.fill('.qty', '50');
    await page.selectOption('#reason', 'INTERNAL_USE');
    await page.click('#submitDraft');
    await page.click('#submitForApproval');
    await expect(page.locator('.status')).toContainText('Pending');
    
    await page.goto('/so-approval');
    await page.click('.approve-withdrawal-btn');
    
    await page.goto('/withdrawal');
    await page.click('#executeWithdrawal');
    await expect(page.locator('.status')).toContainText('Completed');
  });

  test('WD-AUTO-02: Block over-withdrawal', async ({ page }) => {
    await page.goto('/withdrawal/create');
    await page.selectOption('#warehouse', 'WH-JKT');
    await page.click('#addLine');
    await page.selectOption('.product-select', 'ITEM-001');
    await page.fill('.qty', '999999');
    await page.click('#submitWithdrawal');
    await expect(page.locator('.error-message'))
      .toContainText('Insufficient stock');
  });

  test('WD-AUTO-03: Verify balance impact', async ({ page }) => {
    const beforeStock = await page.getStockBalance('ITEM-001', 'WH-JKT');
    await page.completeWithdrawal('WH-JKT', 'ITEM-001', 30);
    const afterStock = await page.getStockBalance('ITEM-001', 'WH-JKT');
    expect(afterStock).toBe(beforeStock - 30);
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | Negative stock allowed | Medium | Critical | Hard constraint at DB level |
| High | Withdrawal bypasses approval | Low | Critical | Approval gate in API |
| Medium | Wrong warehouse stock used | Low | High | Warehouse validation |
| Medium | Duplicate withdrawal | Low | High | Idempotency check |
| Low | Photo upload fails silently | Low | Low | Upload confirmation |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Warehouse** | WH-JKT, CC-JKT |
| **Product** | ITEM-001, ITEM-002 |
| **Reason Code** | INTERNAL_USE, DAMAGED, COUNT_VARIANCE, RETURN_TO_VENDOR |
| **Withdrawal Qty** | 50 units, 20 units |
| **Cost per Unit** | 50,000 |
| **Withdrawal Value** | 2,500,000 |
| **Photo Evidence** | damage_photo.jpg |

---

### 8. SO Approval

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Central approval hub for Sales Orders requiring managerial review |
| **Main Business Flow** | SO Submitted → Approval Queue → Review → Approve/Reject → Status Update → Notification |
| **Upstream Dependencies** | Sales Order Module (submitted SOs) |
| **Downstream Dependencies** | Stock Ready Module, Delivery Module, Balance Inquiry |
| **Related Modules** | All workflow-dependent modules |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-FN-01 | SO Approval | View approval queue | List pending SO approvals | SO submitted, user is approver | 1. Navigate to SO Approval<br>2. Verify queue populated | 5 pending SOs | Queue shows all pending items | High | High | Functional |
| SA-FN-02 | SO Approval | Approve SO | Approve from queue | SO in queue, user authorized | 1. Select SO<br>2. Review details<br>3. Click Approve<br>4. Add remarks | Remarks: "Approved" | Status: Approved, SO progresses | High | Critical | Functional |
| SA-FN-03 | SO Approval | Reject SO | Reject with reason | SO in queue | 1. Select SO<br>2. Click Reject<br>3. Enter reason<br>4. Submit | Reason: "Price too low" | Status: Rejected, creator notified | High | High | Functional |
| SA-FN-04 | SO Approval | Delegation | View delegated approvals | Delegation configured | 1. Login as delegate<br>2. Check queue | Delegate for Manager A | Queue shows delegated items | Medium | High | Functional |
| SA-FN-05 | SO Approval | Bulk approval | Approve multiple SOs | Multiple SOs in queue | 1. Select 3 SOs<br>2. Click Bulk Approve<br>3. Confirm | 3 SOs selected | All approved | High | High | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-NG-01 | SO Approval | Non-approver access | User not in approval matrix | User: Sales Staff | 1. Navigate to SO Approval<br>2. Check queue | Non-approver | Empty queue OR no access | High | High | Negative |
| SA-NG-02 | SO Approval | Approve already processed | Try re-approve approved SO | SO already approved | 1. Try approve again | Already approved | Error: "Already processed" | High | High | Negative |
| SA-NG-03 | SO Approval | Reject without reason | Submit rejection empty | Rejection dialog | 1. Click Reject<br>2. Leave reason empty<br>3. Submit | Empty reason | Error: "Reason required" | High | High | Negative |
| SA-NG-04 | SO Approval | Expired delegation | Use expired delegation | Delegation expired yesterday | 1. Try approve as delegate | Expired | Blocked: "Delegation expired" | Medium | Medium | Negative |
| SA-NG-05 | SO Approval | Approve own SO | Creator tries self-approval | User created SO | 1. Login as creator<br>2. Try approve own SO | Own SO | Blocked: "Cannot approve own" | High | High | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-VL-01 | SO Approval | Remarks length | Enter very long remark | Approval dialog | 1. Enter 500 chars in remarks | Long text | Accepted or truncated | Low | Low | Validation |
| SA-VL-02 | SO Approval | SO number format in queue | Verify format displayed | Queue with SOs | 1. Check SO numbers | Format: SO-YYYYMM-XXX | Consistent format | Low | Low | Validation |
| SA-VL-03 | SO Approval | Date display | Check submission date | Queue view | 1. Check dates shown | Today's date | Correct date format | Low | Low | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-BV-01 | SO Approval | Max queue size | Approver with 1000 pending | 1000 SOs in queue | 1. Load queue<br>2. Check performance | 1000 items | Loaded within acceptable time | Medium | Medium | Boundary |
| SA-BV-02 | SO Approval | Concurrent approvals | 100 approvers acting | 100 simultaneous approvals | 1. All approve their items | 100 approvals | All succeed, no deadlock | High | High | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-MF-01 | SO Approval | Remarks on rejection | Block empty rejection reason | Reject action | 1. Try reject without remarks | Empty | Error: "Remarks required" | High | High | Mandatory |
| SA-MF-02 | SO Approval | Remarks on approval (if required) | Block empty approval | Config: remarks required | 1. Try approve without remarks | Empty | Error: "Remarks required" | Medium | Medium | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-BR-01 | SO Approval | Approval limit | Block approval above limit | Limit: 100M | 1. Try approve SO: 120M | Over limit | Escalation required OR blocked | High | High | Business Rule |
| SA-BR-02 | SO Approval | Customer block check | Check customer status before approval | Customer: Blocked | 1. Review SO for blocked customer | Blocked customer | Warning: "Customer blocked" | High | High | Business Rule |
| SA-BR-03 | SO Approval | Auto-escalation | Auto-escalate after timeout | Timeout: 24h | 1. Wait 24h without action | Timeout | Escalated to next level | Medium | Medium | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-UI-01 | SO Approval | Queue list display | Verify approval list rendering | Queue has items | 1. Check list<br>2. Verify columns | SO #, Customer, Amount, Date | All columns rendered | Medium | Medium | UI |
| SA-UI-02 | SO Approval | SO detail panel | Open SO details | Queue item exists | 1. Click SO row<br>2. Check detail panel | SO details | Full SO info displayed | Medium | Medium | UI |
| SA-UI-03 | SO Approval | Approve/Reject buttons | Verify action buttons | SO selected | 1. Check button visibility | Both visible | Buttons enabled when selected | Medium | Medium | UI |
| SA-UI-04 | SO Approval | Remarks textarea | Enter remarks in dialog | Reject clicked | 1. Check textarea<br>2. Enter text | Remarks text | Accepts input | Medium | Low | UI |
| SA-UI-05 | SO Approval | Search/filter queue | Filter by customer | Queue has 50 items | 1. Enter customer name<br>2. Apply filter | Customer: PT. ABC | Filtered results shown | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-WF-01 | SO Approval | Complete approval flow | SO→Submit→Approve→Next | Complete SO | 1. Create SO<br>2. Submit<br>3. Approve in SA | End-to-end | SO moves to Stock Ready | High | Critical | Workflow |
| SA-WF-02 | SO Approval | Complete rejection flow | SO→Submit→Reject→Fix→Resubmit | SO with error | 1. Reject with reason<br>2. Creator fixes<br>3. Resubmit | Reason: "Price error" | New cycle begins | High | High | Workflow |
| SA-WF-03 | SO Approval | Delegation activation | Delegate approves during absence | Delegation active | 1. Approve as delegate | Delegate approval | Valid, recorded as delegate | Medium | High | Workflow |
| SA-WF-04 | SO Approval | Escalation trigger | Auto-escalate after timeout | 24h passed | 1. Check escalated queue | Escalated items | Moved to higher approver | Medium | Medium | Workflow |
| SA-WF-05 | SO Approval | History audit | View approval history | Approved SO | 1. Check approval log | Log entries | Timestamp, user, action logged | Medium | Medium | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SA-INT-01 | SO Approval | SA→Stock Ready | Approved SO appears in SR | SO approved | 1. Check Stock Ready module | Approved SO | Available for stock allocation | High | Critical | Integration |
| SA-INT-02 | SO Approval | SA→Delivery | Approved SO enables delivery | SO approved & stock ready | 1. Check Delivery module | Approved SO | Can initiate delivery | High | Critical | Integration |
| SA-INT-03 | SO Approval | SA→Balance Inquiry | Approved SO impacts balance | SO approved | 1. Check Balance Inquiry | Committed stock | Balance reflects commitment | High | High | Integration |
| SA-INT-04 | SO Approval | Multi-module approval | SO approved across modules | Multi-level approval | 1. Complete all approval levels | Sequential approvers | Final status: Approved | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| SA-API-01 | SO Approval | GET /api/approval/so | Get SO approval queue | User token | 200 OK with queue | High | High | API |
| SA-API-02 | SO Approval | POST /api/approval/so/{id}/approve | Approve SO | SO ID, remarks | 200 OK, SO approved | High | Critical | API |
| SA-API-03 | SO Approval | POST /api/approval/so/{id}/reject | Reject SO | SO ID, reason | 200 OK, SO rejected | High | Critical | API |
| SA-API-04 | SO Approval | GET /api/approval/so/delegated | Get delegated items | Delegate user | Delegated list | Medium | Medium | API |
| SA-API-05 | SO Approval | POST /api/approval/so/bulk | Bulk approval | SO IDs array | All approved | High | High | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| SA-DB-01 | SO Approval | Approval record created | Row in approval table | High | High | DB |
| SA-DB-02 | SO Approval | Approval history logged | Audit trail exists | High | High | DB |
| SA-DB-03 | SO Approval | Delegation records valid | FK to user table | Medium | Medium | DB |
| SA-DB-04 | SO Approval | Bulk approval atomic | All-or-nothing | High | High | DB |
| SA-DB-05 | SO Approval | Status transition logged | Old + new status stored | High | High | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| SA-SEC-01 | SO Approval | SQL Injection in search | `' OR '1'='1` | Blocked | High | Critical | Security |
| SA-SEC-02 | SO Approval | Approve without permission | Non-approver API call | 403 Forbidden | High | Critical | Security |
| SA-SEC-03 | SO Approval | Bypass approval via ID change | Change SO ID in URL | 403 or validation error | High | High | Security |
| SA-SEC-04 | SO Approval | Tamper remarks length | 10MB remarks text | Blocked or truncated | Medium | Medium | Security |
| SA-SEC-05 | SO Approval | Replay approval action | Replay captured request | Rejected (nonce/sequence) | High | High | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| SA-PERF-01 | SO Approval | Load approval queue | 500 pending SOs | Loaded < 2s | High | Performance |
| SA-PERF-02 | SO Approval | Bulk approval | 100 SOs approved | Completed < 10s | High | Performance |
| SA-PERF-03 | SO Approval | Concurrent approvals | 50 approvers | All < 3s | High | Performance |
| SA-PERF-04 | SO Approval | Queue refresh | Real-time updates | Update < 1s | Medium | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| SA-UAT-01 | SO Approval | Sales Manager | Daily SO approval | Correct queue, smooth approval | High |
| SA-UAT-02 | SO Approval | Finance Director | High-value SO approval | Proper escalation | High |
| SA-UAT-03 | SO Approval | Delegate Manager | Approval during leave | Delegate works seamlessly | Medium |
| SA-UAT-04 | SO Approval | Sales Admin | Track approvals | Visibility into status | Medium |
| SA-UAT-05 | SO Approval | CEO | Exception approvals | Direct access when needed | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/31-so-approval-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('SO Approval E2E', () => {
  test('SA-AUTO-01: Approve SO from queue', async ({ page }) => {
    await page.goto('/so-approval');
    await expect(page.locator('.approval-queue')).not.toBeEmpty();
    await page.click('.approve-btn:first-child');
    await page.fill('#approvalRemarks', 'Approved by automation');
    await page.click('#confirmApprove');
    await expect(page.locator('.toast')).toContainText('Approved');
  });

  test('SA-AUTO-02: Reject SO with reason', async ({ page }) => {
    await page.goto('/so-approval');
    await page.click('.reject-btn:first-child');
    await page.fill('#rejectionReason', 'Price below cost');
    await page.click('#confirmReject');
    await expect(page.locator('.toast')).toContainText('Rejected');
  });

  test('SA-AUTO-03: Block self-approval', async ({ page }) => {
    await page.goto('/so-approval');
    const ownSO = page.locator(`[data-creator="${page.context().user}"]`);
    if (await ownSO.count() > 0) {
      await ownSO.first().click();
      await expect(page.locator('.approve-btn')).toBeDisabled();
    }
  });

  test('SA-AUTO-04: Bulk approval', async ({ page }) => {
    await page.goto('/so-approval');
    await page.check('.select-all-checkbox');
    await page.click('#bulkApprove');
    await page.click('#confirmBulkApprove');
    await expect(page.locator('.toast')).toContainText('Approved');
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | Race condition in concurrent approval | Low | High | Optimistic locking |
| High | Approval bypass via direct API | Low | Critical | RBAC enforcement |
| Medium | Queue not refreshing | Medium | Medium | WebSocket/polling |
| Medium | Delegation timezone issue | Low | Medium | UTC handling |
| Low | Remarks truncated unexpectedly | Low | Low | Define max length |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Approver** | manager@modena.com, director@modena.com |
| **Delegate** | delegate@modena.com (active during manager leave) |
| **SO for Approval** | SO-005, Amount: 25M, Customer: PT. ABC |
| **Rejection Reason** | "Price below cost", "Customer blocked" |
| **Approval Remarks** | "Approved", "Approved with notes" |
| **Bulk Size** | 3 SOs selected |

---

### 9. Stock Ready

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Confirm stock availability and allocate committed inventory to approved sales orders |
| **Main Business Flow** | Approved SO → Stock Check → Allocation → Partial/Full Fulfillment → Stock Ready Confirmation → Delivery Enabled |
| **Upstream Dependencies** | Sales Order (Approved), SO Approval Module, Warehouse Stock |
| **Downstream Dependencies** | Delivery Module, Balance Inquiry |
| **Related Modules** | Inventory Transfer (stock source), Withdrawal (stock conflicts) |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-FN-01 | Stock Ready | Allocate stock to SO | Allocate approved SO | SO approved, stock available | 1. Open Stock Ready<br>2. Select SO-001<br>3. Click Allocate<br>4. Confirm | Stock: 100, SO: 100 | Stock allocated, status: Ready | High | Critical | Functional |
| SR-FN-02 | Stock Ready | Partial allocation | Allocate partial stock | Available: 50, SO: 100 | 1. Allocate: 50<br>2. Confirm | Allocated: 50, Backorder: 50 | Partial allocation, backorder created | High | High | Functional |
| SR-FN-03 | Stock Ready | Multi-SO allocation | Allocate one SO at a time | 3 SOs approved | 1. Allocate SO-001<br>2. Allocate SO-002<br>3. Allocate SO-003 | Sequential allocation | All allocated correctly | High | High | Functional |
| SR-FN-04 | Stock Ready | Auto-allocation | Enable auto-allocate on approval | Auto-alloc config | 1. Approve SO<br>2. Check Stock Ready | Auto allocation | Stock auto-allocated without manual | High | High | Functional |
| SR-FN-05 | Stock Ready | Allocation release | Release allocated stock | SO cancelled after allocation | 1. Cancel SO<br>2. Release stock | Released: 100 | Stock returned to available | High | High | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-NG-01 | Stock Ready | Allocate unapproved SO | Try allocate draft SO | SO in draft | 1. Try allocate draft SO | Draft SO | Blocked: "SO not approved" | High | Critical | Negative |
| SR-NG-02 | Stock Ready | Allocate already delivered | Try allocate delivered SO | SO already delivered | 1. Try allocate delivered SO | Delivered | Blocked: "Already delivered" | High | High | Negative |
| SR-NG-03 | Stock Ready | Over-allocate | Allocate more than available | Available: 50, try 100 | Try allocate 100 | Insufficient | Blocked: "Insufficient stock" | High | High | Negative |
| SR-NG-04 | Stock Ready | Wrong warehouse | Allocate from wrong WH | SO for WH-JKT, stock in WH-BDG | 1. Try allocate from WH-BDG | Mismatch | Error: "Stock not in correct WH" | High | High | Negative |
| SR-NG-05 | Stock Ready | Zero allocation | Try allocate zero qty | Allocation form | 1. Set qty: 0<br>2. Submit | 0 | Blocked: "Quantity required" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-VL-01 | Stock Ready | Allocation number format | Verify auto-generated | Allocation created | 1. Check allocation number | Format: ALLOC-YYYYMM-XXX | Follows format | Low | Low | Validation |
| SR-VL-02 | Stock Ready | Batch tracking | Allocate batch-managed stock | Batch product | 1. Select batch numbers<br>2. Allocate | Batch: BATCH-001 | Batch tracked correctly | High | High | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-BV-01 | Stock Ready | Max allocation | Allocate all available | Available: 1000 | 1. Allocate 1000<br>2. Submit | 1000 | Accepted, available = 0 | High | High | Boundary |
| SR-BV-02 | Stock Ready | Min allocation | Allocate 1 unit | Min: 1 | 1. Allocate 1<br>2. Submit | 1 | Accepted | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-MF-01 | Stock Ready | SO required | Block without SO selection | Form open | 1. Try allocate without SO<br>2. Submit | - | Error: "Select SO" | High | High | Mandatory |
| SR-MF-02 | Stock Ready | Quantity required | Block without qty | Form open | 1. Leave qty blank<br>2. Submit | - | Error: "Enter quantity" | High | High | Mandatory |
| SR-MF-03 | Stock Ready | Warehouse required | Block without WH | Form open | 1. Leave WH blank<br>2. Submit | - | Error: "Select warehouse" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-BR-01 | Stock Ready | FIFO allocation | Allocate oldest batch first | Multiple batches | 1. Allocate, check FIFO | Oldest first | FIFO rule applied | High | High | Business Rule |
| SR-BR-02 | Stock Ready | Backorder creation | Create backorder on partial | Partial: 50/100 | 1. Allocate partial<br>2. Check backorder | Backorder: 50 | Backorder created | High | High | Business Rule |
| SR-BR-03 | Stock Ready | Allocation expiration | Release after X days | Expiry: 3 days | 1. Allocate, wait 4 days | Expired | Auto-released | Medium | Medium | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-UI-01 | Stock Ready | Queue display | View allocation queue | SOs approved | 1. Open Stock Ready<br>2. Check queue | 5 SOs | Queue shows all | Medium | Medium | UI |
| SR-UI-02 | Stock Ready | Available qty indicator | Show stock availability | WH has stock | 1. Select product<br>2. Check available | Available: 500 | Display shows 500 | Medium | Medium | UI |
| SR-UI-03 | Stock Ready | Allocation confirmation | Confirm dialog | Allocate clicked | 1. Check confirmation dialog | Allocation summary | Summary shown | Medium | Low | UI |
| SR-UI-04 | Stock Ready | Status badges | Show allocation status | SO in flow | 1. Check status badges | Pending/Ready/Partial | Badges displayed | Medium | Low | UI |
| SR-UI-05 | Stock Ready | Allocation history | View past allocations | History exists | 1. Click History tab | Past records | History listed | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-WF-01 | Stock Ready | Full allocation flow | Approve→Allocate→Ready→Deliver | Approved SO | 1. Allocate stock<br>2. Confirm ready<br>3. Initiate delivery | Complete flow | Delivery enabled | High | Critical | Workflow |
| SR-WF-02 | Stock Ready | Partial allocation flow | Partial allocate→Backorder→Reallocate | Partial scenario | 1. Allocate 50<br>2. Stock arrives<br>3. Reallocate 50 | 50+50 = 100 | Full allocation eventually | High | High | Workflow |
| SR-WF-03 | Stock Ready | Release and reallocate | Release→Stock in→Reallocate | Allocated SO cancelled | 1. Cancel SO<br>2. Stock releases<br>3. New SO allocated | Reallocate to new SO | Successful | High | High | Workflow |
| SR-WF-04 | Stock Ready | Auto-allocate on approval | Approval triggers allocation | Auto-alloc enabled | 1. Approve SO<br>2. Check allocation | Auto-allocated | No manual action needed | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| SR-INT-01 | Stock Ready | SR→Delivery | Delivery enabled after allocation | Stock allocated | 1. Check Delivery module | Stock Ready | Can create delivery | High | Critical | Integration |
| SR-INT-02 | Stock Ready | SR→Balance Inquiry | Committed stock shown | Stock allocated | 1. Check Balance Inquiry | Committed qty | Correct display | High | High | Integration |
| SR-INT-03 | Stock Ready | SR→Transfer conflict | Allocated stock not transferable | Stock allocated to SO | 1. Try transfer same stock | Allocated stock | Blocked: "Stock committed" | High | High | Integration |
| SR-INT-04 | Stock Ready | SR→Withdrawal conflict | Allocated stock not withdrawable | Stock allocated to SO | 1. Try withdraw same stock | Allocated stock | Blocked: "Stock committed" | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| SR-API-01 | Stock Ready | POST /api/stock-ready/allocate | Allocate stock | SO ID, qty, WH | 200 OK, allocated | High | Critical | API |
| SR-API-02 | Stock Ready | POST /api/stock-ready/release | Release allocation | Allocation ID, reason | 200 OK, released | High | High | API |
| SR-API-03 | Stock Ready | GET /api/stock-ready/so/{id} | Get allocation status | SO ID | Allocation details | Medium | Medium | API |
| SR-API-04 | Stock Ready | GET /api/stock-ready/pending | Get pending allocations | No params | Pending list | High | Medium | API |
| SR-API-05 | Stock Ready | POST /api/stock-ready/auto-allocate | Trigger auto-allocate | SO ID | Auto-allocated | High | High | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| SR-DB-01 | Stock Ready | Allocation record created | Row in allocation table | High | High | DB |
| SR-DB-02 | Stock Ready | Stock status = 'allocated' | Inventory updated | High | Critical | DB |
| SR-DB-03 | Stock Ready | Backorder created on partial | Backorder record exists | High | High | DB |
| SR-DB-04 | Stock Ready | Release restores availability | Available qty increases | High | Critical | DB |
| SR-DB-05 | Stock Ready | Allocation expiry job runs | Expired allocations released | Medium | Medium | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| SR-SEC-01 | Stock Ready | SQL Injection in SO search | `' UNION SELECT * FROM stock --` | Blocked | High | Critical | Security |
| SR-SEC-02 | Stock Ready | Allocate to wrong SO | Change SO ID in request | 403 or validation error | High | High | Security |
| SR-SEC-03 | Stock Ready | Negative allocation qty | Negative qty in API | Blocked or rejected | High | High | Security |
| SR-SEC-04 | Stock Ready | Release other org allocation | Cross-company release attempt | 403 Forbidden | High | Critical | Security |
| SR-SEC-05 | Stock Ready | Race condition double allocate | Concurrent allocate same stock | One succeeds, one fails | High | High | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| SR-PERF-01 | Stock Ready | Bulk allocation | 200 SOs allocated | All < 5s | High | Performance |
| SR-PERF-02 | Stock Ready | Stock check performance | 100 concurrent checks | All < 500ms | High | Performance |
| SR-PERF-03 | Stock Ready | Queue rendering | 500 pending SOs | Rendered < 2s | Medium | Performance |
| SR-PERF-04 | Stock Ready | Auto-allocate batch | 50 approved SOs auto-alloc | Completed < 10s | High | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| SR-UAT-01 | Stock Ready | Warehouse Staff | Daily stock allocation | Allocations correct | High |
| SR-UAT-02 | Stock Ready | Sales Coordinator | Track SO readiness | Clear visibility | High |
| SR-UAT-03 | Stock Ready | Inventory Planner | Monitor allocation | Allocation accuracy | High |
| SR-UAT-04 | Stock Ready | Dispatch Team | Know what's ready for delivery | Ready list accurate | High |
| SR-UAT-05 | Stock Ready | Finance | Allocation impacts financials | Correct committed value | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/32-stock-ready-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Stock Ready E2E', () => {
  test('SR-AUTO-01: Allocate stock to approved SO', async ({ page }) => {
    await page.goto('/stock-ready');
    await page.click(`.allocate-btn[data-so="SO-APPROVED-001"]`);
    await page.fill('#allocateQty', '100');
    await page.click('#confirmAllocate');
    await expect(page.locator('.status')).toContainText('Ready');
  });

  test('SR-AUTO-02: Block over-allocation', async ({ page }) => {
    await page.goto('/stock-ready');
    await page.click(`.allocate-btn[data-so="SO-APPROVED-001"]`);
    await page.fill('#allocateQty', '999999');
    await page.click('#confirmAllocate');
    await expect(page.locator('.error'))
      .toContainText('Insufficient stock');
  });

  test('SR-AUTO-03: Release allocated stock', async ({ page }) => {
    await page.goto('/stock-ready');
    await page.click(`.release-btn[data-so="SO-CANCELLED-001"]`);
    await page.selectOption('#releaseReason', 'SO_CANCELLED');
    await page.click('#confirmRelease');
    await expect(page.locator('.status')).toContainText('Released');
  });

  test('SR-AUTO-04: Verify delivery enabled after allocation', async ({ page }) => {
    await page.goto('/stock-ready');
    await page.allocateStock('SO-APPROVED-001', 100);
    await page.goto('/delivery');
    await expect(page.locator(`[data-so="SO-APPROVED-001"]`))
      .toBeEnabled();
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | Double allocation of same stock | Medium | Critical | Atomic allocation with lock |
| High | Stock not released on SO cancel | Medium | High | Compensating transaction |
| Medium | Backorder not created on partial | Low | High | Explicit backorder creation |
| Medium | Allocation expires but not released | Low | Medium | Scheduled cleanup job |
| Low | UI shows stale allocation status | Low | Low | Auto-refresh |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **Approved SO** | SO-001, Qty: 100, Customer: PT. ABC |
| **Product** | ITEM-001 |
| **Warehouse** | WH-JKT |
| **Available Stock** | 200 units |
| **Allocation Qty** | 100 units |
| **Backorder Qty** | 50 units |
| **Allocation Expiry** | 3 days |

---

### 10. Purchase Stock Verification

#### A. Business Process Analysis

| Aspect | Details |
|--------|---------|
| **Purpose** | Verify goods received against Purchase Order, inspect quality, and confirm stock entry |
| **Main Business Flow** | PO Approved → Goods Receipt → Inspection → Verification → Stock Entry → Stock Ready |
| **Upstream Dependencies** | Purchase Order (Approved), Supplier Delivery, Warehouse |
| **Downstream Dependencies** | Stock Ready Module, Balance Inquiry, Operational Cost |
| **Related Modules** | Purchase Order, Inventory Transfer, Withdrawal |

#### B. Functional Testing

**Positive Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-FN-01 | Purchase Stock Verification | Create GRN from PO | Generate Goods Receipt Note | PO approved | 1. Select PO<br>2. Click Create GRN<br>3. Verify items<br>4. Submit | PO-001, Qty: 500 | GRN created, status: Draft | High | High | Functional |
| PV-FN-02 | Purchase Stock Verification | Partial receipt | Receive partial shipment | PO: 1000, delivery: 400 | 1. Receive 400<br>2. Create GRN<br>3. Submit | Received: 400 | Remaining: 600 on PO | High | High | Functional |
| PV-FN-03 | Purchase Stock Verification | Quality inspection | Record inspection result | GRN created | 1. Perform inspection<br>2. Record result: Pass<br>3. Attach report | Result: Pass, Report attached | Inspection passed | High | High | Functional |
| PV-FN-04 | Purchase Stock Verification | Qty variance handling | Record discrepancy | Expected: 500, Actual: 480 | 1. Enter actual: 480<br>2. Add variance note<br>3. Submit | Variance: -20 | Variance recorded, blocked for approval | High | High | Functional |
| PV-FN-05 | Purchase Stock Verification | Verify and post | Complete verification | GRN inspected | 1. Click Verify<br>2. Confirm<br>3. Post to stock | Verified GRN | Stock updated in system | High | Critical | Functional |

**Negative Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-NG-01 | Purchase Stock Verification | Verify non-existent PO | Try GRN for deleted PO | PO deleted | 1. Try create GRN for PO-999 | Non-existent PO | Error: "PO not found" | High | High | Negative |
| PV-NG-02 | Purchase Stock Verification | Over-receive | Receive more than PO qty | PO: 500, try 600 | Try receive 600 | Over PO | Warning/blocked | High | High | Negative |
| PV-NG-03 | Purchase Stock Verification | Wrong supplier | Receive from wrong supplier | PO: PT. X, delivery: PT. Y | 1. Try verify PT. Y delivery | Mismatch | Error: "Supplier mismatch" | High | High | Negative |
| PV-NG-04 | Purchase Stock Verification | Inspect blocked product | Inspect product on hold | Product status: Blocked | 1. Try verify blocked product | Blocked product | Blocked: "Product blocked" | High | High | Negative |
| PV-NG-05 | Purchase Stock Verification | Zero qty receipt | Submit GRN with zero qty | GRN form | 1. Set qty: 0<br>2. Submit | 0 | Blocked: "Quantity required" | Medium | Medium | Negative |

**Validation Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-VL-01 | Purchase Stock Verification | GRN number format | Verify auto-generated | GRN created | 1. Check GRN number | Format: GRN-YYYYMM-XXX | Follows format | Low | Low | Validation |
| PV-VL-02 | Purchase Stock Verification | Expiry date tracking | Record product expiry | Perishable product | 1. Enter expiry date<br>2. Submit | Expiry: 2026-12-31 | Recorded correctly | High | High | Validation |

**Boundary Value Test Cases**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-BV-01 | Purchase Stock Verification | Max GRN qty | Receive PO full qty | PO: 10000 | 1. Receive 10000<br>2. Submit | 10000 | Accepted | High | High | Boundary |
| PV-BV-02 | Purchase Stock Verification | Max variance | Record maximum allowed variance | Max variance: 10% | 1. Record 10% variance | 10% | Accepted with approval | Medium | Medium | Boundary |

**Mandatory Field Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-MF-01 | Purchase Stock Verification | PO required | Block without PO | Form open | 1. Try create GRN without PO<br>2. Submit | - | Error: "Select PO" | High | High | Mandatory |
| PV-MF-02 | Purchase Stock Verification | Qty received required | Block without qty | GRN form | 1. Leave received qty blank<br>2. Submit | - | Error: "Enter received qty" | High | High | Mandatory |
| PV-MF-03 | Purchase Stock Verification | Inspection result required | Block without inspection | GRN inspection step | 1. Submit without inspection | Empty | Blocked: "Inspection required" | High | High | Mandatory |
| PV-MF-04 | Purchase Stock Verification | Batch/lot required | Block without batch | Batch product | 1. Submit without batch | Missing | Error: "Batch required" | High | High | Mandatory |

**Business Rule Validation**

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-BR-01 | Purchase Stock Verification | 3-way match | Match PO, delivery, GRN | All documents exist | 1. Verify 3-way match | PO=GRN=Delivery | Match confirmed | High | Critical | Business Rule |
| PV-BR-02 | Purchase Stock Verification | Variance limit | Block variance above limit | Max: 5% | 1. Record 7% variance | 7% | Blocked for manager approval | High | High | Business Rule |
| PV-BR-03 | Purchase Stock Verification | QC hold | Block failed inspection | QC result: Fail | 1. Record Fail<br>2. Try post | Fail | Blocked: "QC failed" | High | High | Business Rule |
| PV-BR-04 | Purchase Stock Verification | Duplicate GRN prevention | Prevent double GRN | GRN-001 exists | 1. Try create GRN-001 again | Duplicate | Blocked: "GRN exists" | High | High | Business Rule |

#### C. UI Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-UI-01 | Purchase Stock Verification | PO selection | Select PO for GRN | PO list exists | 1. Click Select PO<br>2. Choose PO-001 | PO-001 | PO details loaded | Medium | Medium | UI |
| PV-UI-02 | Purchase Stock Verification | Line items display | Show PO lines in GRN | PO has lines | 1. Check GRN lines | 5 lines | All lines displayed | Medium | Medium | UI |
| PV-UI-03 | Purchase Stock Verification | Actual qty input | Enter actual received qty | GRN form | 1. Enter actual qty | Actual: 480, Expected: 500 | Both displayed | Medium | Medium | UI |
| PV-UI-04 | Purchase Stock Verification | Inspection form | Fill inspection details | Inspection step | 1. Select result: Pass<br>2. Add notes | Pass, Notes | Form complete | Medium | Medium | UI |
| PV-UI-05 | Purchase Stock Verification | Variance warning | Show variance indicator | Input exceeds expected | 1. Enter qty: 600 (expected 500) | Over-receipt | Warning displayed | Medium | Medium | UI |

#### D. Workflow Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-WF-01 | Purchase Stock Verification | Full GRN lifecycle | Create→Inspect→Verify→Post | PO approved | 1. Create GRN<br>2. Inspect<br>3. Verify<br>4. Post | Complete flow | Stock updated in SR | High | Critical | Workflow |
| PV-WF-02 | Purchase Stock Verification | Reject GRN | Reject with variance reason | GRN with variance | 1. Reject with reason | Reason: "Qty mismatch" | Status: Rejected, PO updated | High | High | Workflow |
| PV-WF-03 | Purchase Stock Verification | Partial receipt flow | Partial→Remaining PO→Complete | PO 1000, first 400 | 1. GRN 400<br>2. Remaining 600<br>3. GRN 600 | Two GRNs | PO fully received | High | High | Workflow |
| PV-WF-04 | Purchase Stock Verification | Return to supplier | Record return | Defective goods | 1. Create return GRN<br>2. Submit | Return to PT. XYZ | Return recorded, PO updated | High | High | Workflow |

#### E. Integration Testing

| Test Case ID | Module | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|---------|----------|---------------|------------|-----------|-----------------|----------|----------|------|
| PV-INT-01 | Purchase Stock Verification | PV→Stock Ready | Stock available after post | GRN posted | 1. Check Stock Ready module | Posted stock | Available for SO allocation | High | Critical | Integration |
| PV-INT-02 | Purchase Stock Verification | PV→Balance Inquiry | Balance reflects GRN | GRN posted | 1. Check Balance Inquiry | Stock increased | Correct balance | High | Critical | Integration |
| PV-INT-03 | Purchase Stock Verification | PV→Operational Cost | Receipt cost recorded | GRN with cost | 1. Check Operational Cost | Receipt cost | Cost record created | High | High | Integration |
| PV-INT-04 | Purchase Stock Verification | PV→PO | PO status updated to received | GRN posted | 1. Check PO status | PO-001 | Status: Fully/Partially Received | High | High | Integration |

#### F. API Testing

| Test Case ID | Module | API Endpoint | Scenario | Test Data | Expected Result | Priority | Severity | Type |
|--------------|--------|--------------|----------|-----------|-----------------|----------|----------|------|
| PV-API-01 | Purchase Stock Verification | POST /api/grn | Create GRN | PO ID, received qty | 201 Created | High | High | API |
| PV-API-02 | Purchase Stock Verification | POST /api/grn/{id}/inspect | Record inspection | Result, notes | 200 OK | High | High | API |
| PV-API-03 | Purchase Stock Verification | POST /api/grn/{id}/verify | Verify GRN | Verified by | 200 OK, verified | High | Critical | API |
| PV-API-04 | Purchase Stock Verification | POST /api/grn/{id}/post | Post to stock | No data | Stock updated | High | Critical | API |
| PV-API-05 | Purchase Stock Verification | GET /api/grn/po/{poId} | Get GRNs by PO | PO ID | List of GRNs | Medium | Medium | API |

#### G. Database Testing

| Test Case ID | Module | Scenario | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-----------------|----------|----------|------|
| PV-DB-01 | Purchase Stock Verification | GRN record created | Row in GRN table | High | High | DB |
| PV-DB-02 | Purchase Stock Verification | Inventory increased | Stock qty updated | High | Critical | DB |
| PV-DB-03 | Purchase Stock Verification | Batch/lot created | Batch record exists | High | High | DB |
| PV-DB-04 | Purchase Stock Verification | PO received qty updated | PO updated | High | High | DB |
| PV-DB-05 | Purchase Stock Verification | Duplicate GRN prevented | Unique constraint | High | High | DB |

#### H. Security Testing

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority | Severity | Type |
|--------------|--------|----------|-------------|-----------------|----------|----------|------|
| PV-SEC-01 | Purchase Stock Verification | SQL Injection in PO search | `' UNION SELECT * FROM grn --` | Blocked | High | Critical | Security |
| PV-SEC-02 | Purchase Stock Verification | Verify other org GRN | Change org ID | 403 Forbidden | High | Critical | Security |
| PV-SEC-03 | Purchase Stock Verification | Tamper received qty | Change qty in API | Rejected or logged | High | High | Security |
| PV-SEC-04 | Purchase Stock Verification | Post without inspection | Try post uninspected GRN | 403 Forbidden | High | High | Security |
| PV-SEC-05 | Purchase Stock Verification | Access GRN without auth | Direct URL without token | Redirect to login | High | High | Security |

#### I. Performance Testing

| Test Case ID | Module | Scenario | Test Data | Expected Result | Priority | Type |
|--------------|--------|----------|-----------|-----------------|----------|------|
| PV-PERF-01 | Purchase Stock Verification | Bulk GRN posting | 100 GRNs posted | All < 10s | High | Performance |
| PV-PERF-02 | Purchase Stock Verification | Inspection logging | 50 concurrent inspections | All < 2s | Medium | Performance |
| PV-PERF-03 | Purchase Stock Verification | PO lookup performance | Search PO among 10k | < 1s | High | Performance |
| PV-PERF-04 | Purchase Stock Verification | Report generation | Monthly GRN report 5k rows | < 15s | Medium | Performance |

#### J. User Acceptance Testing

| Test Case ID | Module | User Role | Business Scenario | Expected Result | Priority |
|--------------|--------|-----------|------------------|-----------------|----------|
| PV-UAT-01 | Purchase Stock Verification | Warehouse Staff | Daily goods receipt | GRNs created correctly | High |
| PV-UAT-02 | Purchase Stock Verification | QC Inspector | Inspect received goods | Inspection recorded | High |
| PV-UAT-03 | Purchase Stock Verification | Inventory Controller | Verify stock posting | Stock posted accurately | High |
| PV-UAT-04 | Purchase Stock Verification | Procurement | Track PO fulfillment | PO status updated | High |
| PV-UAT-05 | Purchase Stock Verification | Finance | Verify receipt costs | Costs recorded correctly | Medium |

#### K. Automation Testing (Playwright)

```javascript
// Ryan/test-playwright/more1/mhc-full/specs/33-purchase-stock-verification-e2e.spec.js

import { test, expect } from '@playwright/test';

test.describe('Purchase Stock Verification E2E', () => {
  test('PV-AUTO-01: Create GRN from PO', async ({ page }) => {
    await page.goto('/purchase-stock-verification');
    await page.click('#createGRN');
    await page.selectOption('#poSelect', 'PO-APPROVED-001');
    await page.fill('#receivedQty', '400');
    await page.click('#submitGRN');
    await expect(page.locator('.status')).toContainText('Draft');
  });

  test('PV-AUTO-02: Inspect and verify GRN', async ({ page }) => {
    await page.goto('/purchase-stock-verification');
    await page.click(`.inspect-btn[data-grn="GRN-DRAFT-001"]`);
    await page.selectOption('#inspectionResult', 'PASS');
    await page.fill('#inspectionNotes', 'All items good');
    await page.click('#saveInspection');
    await page.click('#verifyGRN');
    await expect(page.locator('.status')).toContainText('Verified');
  });

  test('PV-AUTO-03: Post GRN to stock', async ({ page }) => {
    await page.goto('/purchase-stock-verification');
    await page.click(`.post-btn[data-grn="GRN-VERIFIED-001"]`);
    await page.click('#confirmPost');
    await expect(page.locator('.status')).toContainText('Posted');
  });

  test('PV-AUTO-04: Verify stock increased in Stock Ready', async ({ page }) => {
    const beforeStock = await page.getStockBalance('ITEM-001', 'WH-JKT');
    await page.goto('/purchase-stock-verification');
    await page.postGRN('GRN-POST-001');
    const afterStock = await page.getStockBalance('ITEM-001', 'WH-JKT');
    expect(afterStock).toBe(beforeStock + 400);
  });
});
```

#### L. Defect Prediction

| Risk Area | Common Defects | Probability | Impact | Mitigation |
|-----------|---------------|-------------|--------|-----------|
| High | GRN posted without inspection | Medium | Critical | Inspection gate in API |
| High | Stock not updated after post | Low | Critical | Post transaction verification |
| Medium | Variance not flagged | Medium | High | Automatic variance check |
| Medium | Duplicate GRN for same PO | Low | High | PO line-level tracking |
| Low | Expiry date not enforced | Low | Medium | FEFO validation |

#### M. Test Data

| Type | Sample Data |
|------|-------------|
| **PO** | PO-001, Supplier: PT. XYZ, Qty: 1000 |
| **Product** | ITEM-001, Batch: Yes, Expiry: 2026-12-31 |
| **Warehouse** | WH-JKT |
| **Received Qty** | 400 (partial), 1000 (full) |
| **Inspection Result** | Pass, Fail, Conditional |
| **Variance** | -20 (480 vs 500) |
| **Inspection Notes** | "All items in good condition" |

---

## 3. Integration Testing

### Cross-Module Integration Matrix

| Test Case ID | Source Module | Target Module | Integration Scenario | Test Steps | Expected Result | Priority | Severity |
|--------------|---------------|---------------|---------------------|------------|-----------------|----------|----------|
| INT-001 | Sales Order | SO Approval | SO submitted triggers approval queue | 1. Create SO<br>2. Submit | SO in approval queue | High | Critical |
| INT-002 | SO Approval | Stock Ready | Approved SO triggers stock check | 1. Approve SO<br>2. Check SR | SR available for allocation | High | Critical |
| INT-003 | Stock Ready | Delivery | Stock ready enables delivery | 1. Allocate stock<br>2. Check DL | DL can be initiated | High | Critical |
| INT-004 | Purchase Order | Purchase Stock Verification | Approved PO enables GRN | 1. Approve PO<br>2. Create GRN | GRN created from PO | High | Critical |
| INT-005 | Purchase Stock Verification | Stock Ready | Verified stock becomes available | 1. Post GRN<br>2. Check SR | Stock in Stock Ready | High | Critical |
| INT-006 | Inventory Transfer | Stock Ready | Transfer receipt updates stock | 1. Receive transfer<br>2. Check SR | Stock available in dest | High | Critical |
| INT-007 | Withdrawal | Balance Inquiry | Withdrawal updates balance | 1. Execute withdrawal<br>2. Check BI | Balance reduced | High | Critical |
| INT-008 | Operational Cost | Balance Inquiry | Cost posting updates GL | 1. Post OC<br>2. Check BI | GL balance reduced | High | Critical |
| INT-009 | Delivery | Balance Inquiry | Delivery reduces stock | 1. Complete delivery<br>2. Check BI | Stock balance reduced | High | Critical |
| INT-010 | SO → Delivery → WD | Conflict | Same stock cannot be used | 1. SO allocated<br>2. Try WD same stock | Blocked second operation | High | Critical |
| INT-011 | PO → PV → SR | Full Procurement | End-to-end procurement | 1. Create PO<br>2. Approve<br>3. GRN<br>4. Verify<br>5. Check SR | Stock in SR | High | Critical |
| INT-012 | SO → SA → SR → DL → BI | Full Sales | End-to-end sales order | 1. SO→Submit→Approve→Allocate→Deliver→Check BI | BI updated end-to-end | High | Critical |
| INT-013 | Transfer → SR → BI | Cross-WH Impact | Transfer affects both WH | 1. Transfer 100 A→B<br>2. Check BI | A reduced, B increased | High | Critical |
| INT-014 | WD → OC → BI | Cost Chain | Withdrawal creates cost | 1. WD with cost<br>2. Check OC<br>3. Check BI | OC created, BI updated | High | High |
| INT-015 | OC → BI → Reports | Financial | Cost flows to reports | 1. Post OC<br>2. Generate P&L | P&L includes cost | High | High |

---

## 4. API Testing

### Consolidated API Test Cases

| Test Case ID | Module | Endpoint | Method | Scenario | Auth Required | Expected Response | Priority |
|--------------|--------|----------|--------|----------|---------------|-------------------|----------|
| API-001 | Sales Order | /api/sales-order | POST | Create SO | Yes | 201 Created | High |
| API-002 | Sales Order | /api/sales-order/{id} | GET | Get SO details | Yes | 200 OK | High |
| API-003 | Sales Order | /api/sales-order/{id} | PUT | Update SO | Yes | 200 OK | High |
| API-004 | Sales Order | /api/sales-order/{id}/submit | POST | Submit for approval | Yes | 200 OK | High |
| API-005 | Purchase Order | /api/purchase-order | POST | Create PO | Yes | 201 Created | High |
| API-006 | Purchase Order | /api/purchase-order/{id}/approve | POST | Approve PO | Yes | 200 OK | High |
| API-007 | Delivery | /api/delivery | POST | Create delivery | Yes | 201 Created | High |
| API-008 | Delivery | /api/delivery/{id}/complete | POST | Complete delivery | Yes | 200 OK | High |
| API-009 | Inventory Transfer | /api/transfer | POST | Create transfer | Yes | 201 Created | High |
| API-010 | Inventory Transfer | /api/transfer/{id}/receive | POST | Receive at destination | Yes | 200 OK | High |
| API-011 | Operational Cost | /api/operational-cost | POST | Create cost | Yes | 201 Created | High |
| API-012 | Operational Cost | /api/operational-cost/{id}/post | POST | Post to GL | Yes | 200 OK | High |
| API-013 | Balance Inquiry | /api/balance/stock | GET | Get stock balance | Yes | 200 OK | High |
| API-014 | Balance Inquiry | /api/balance/gl | GET | Get GL balance | Yes | 200 OK | High |
| API-015 | Withdrawal | /api/withdrawal | POST | Create withdrawal | Yes | 201 Created | High |
| API-016 | Withdrawal | /api/withdrawal/{id}/execute | POST | Execute withdrawal | Yes | 200 OK | High |
| API-017 | SO Approval | /api/approval/so/{id}/approve | POST | Approve SO | Yes | 200 OK | High |
| API-018 | SO Approval | /api/approval/so/{id}/reject | POST | Reject SO | Yes | 200 OK | High |
| API-019 | Stock Ready | /api/stock-ready/allocate | POST | Allocate stock | Yes | 200 OK | High |
| API-020 | Stock Ready | /api/stock-ready/release | POST | Release allocation | Yes | 200 OK | High |
| API-021 | Purchase Stock Verification | /api/grn | POST | Create GRN | Yes | 201 Created | High |
| API-022 | Purchase Stock Verification | /api/grn/{id}/post | POST | Post GRN to stock | Yes | 200 OK | High |

### API Security Tests

| Test Case ID | Scenario | Test Method | Expected Result |
|--------------|----------|-------------|-----------------|
| API-SEC-01 | Unauthenticated access | No token in request | 401 Unauthorized |
| API-SEC-02 | Expired token | Use expired JWT | 401 Unauthorized |
| API-SEC-03 | SQL Injection in params | `' OR 1=1 --` | 400 Bad Request |
| API-SEC-04 | Cross-company access | Change company ID | 403 Forbidden |
| API-SEC-05 | Rate limiting | 1000 rapid requests | 429 Too Many Requests |

---

## 5. Security Testing

### Consolidated Security Test Matrix

| Test Case ID | Module | Threat Scenario | Attack Vector | Expected Defense | Priority | Severity |
|--------------|--------|-----------------|---------------|------------------|----------|----------|
| SEC-001 | All | SQL Injection | Input fields with `' OR 1=1 --` | Parameterized queries | High | Critical |
| SEC-002 | All | XSS (Stored) | `<script>alert(1)</script>` in text fields | Input sanitization | High | Critical |
| SEC-003 | All | XSS (Reflected) | Script in URL parameters | Output encoding | High | Critical |
| SEC-004 | All | CSRF | Cross-site request forgery | CSRF tokens | High | High |
| SEC-005 | All | Broken Authentication | Brute force login | Rate limiting + lockout | High | Critical |
| SEC-006 | All | Session Fixation | Fixed session ID | Session regeneration | High | High |
| SEC-007 | All | IDOR | Change resource ID in URL | Authorization check per ID | High | Critical |
| SEC-008 | All | SSRF | Internal URL in parameters | URL whitelist | High | High |
| SEC-009 | All | Path Traversal | `../../etc/passwd` in file upload | Path sanitization | High | Critical |
| SEC-010 | All | Command Injection | `; rm -rf /` in input | Input validation | High | Critical |
| SEC-011 | All | XML External Entity | XXE in XML upload | Disable DTD | Medium | High |
| SEC-012 | All | Insecure Deserialization | Serialized object tampering | Signature verification | Medium | High |
| SEC-013 | All | API Key Exposure | API key in URL/logs | Header-only transmission | High | High |
| SEC-014 | All | Mass Assignment | Extra fields in API body | Whitelist fields | High | Medium |
| SEC-015 | All | Missing HTTPS | HTTP instead of HTTPS | Enforce HTTPS redirect | High | High |

### RBAC Violation Tests

| Test Case ID | Scenario | Expected Result |
|--------------|----------|-----------------|
| RBAC-001 | Sales Staff access SO Approval | 403 Forbidden |
| RBAC-002 | Warehouse Staff access Finance | 403 Forbidden |
| RBAC-003 | Viewer role try to create SO | 403 Forbidden |
| RBAC-004 | Cross-company data access | 403 Forbidden |
| RBAC-005 | Self-approval attempt | 403 Forbidden |

---

## 6. Performance Testing

### Consolidated Performance Test Matrix

| Test Case ID | Module | Scenario | Load Condition | Expected Response Time | Throughput | Pass Criteria |
|--------------|--------|----------|----------------|------------------------|------------|---------------|
| PERF-001 | Sales Order | Concurrent SO creation | 100 users | < 2s | 50 SO/min | p95 < 2s |
| PERF-002 | SO Approval | Load approval queue | 500 pending items | < 2s | N/A | Page rendered < 2s |
| PERF-003 | Stock Ready | Bulk allocation | 200 SOs | < 5s | 40/s | All allocated without error |
| PERF-004 | Purchase Stock Verification | GRN posting | 100 GRNs | < 10s | 10/s | All posted |
| PERF-005 | Inventory Transfer | Concurrent transfers | 100 users | < 3s | 33/s | All < 3s |
| PERF-006 | Withdrawal | Concurrent withdrawals | 100 users | < 3s | 33/s | All < 3s |
| PERF-007 | Operational Cost | Batch posting | 500 costs | < 5s | 100/s | All posted |
| PERF-008 | Balance Inquiry | Concurrent queries | 200 users | < 2s | 100/s | All < 2s |
| PERF-009 | Dashboard | Full dashboard load | 20 widgets | < 3s | N/A | Rendered < 3s |
| PERF-010 | Reports | Large report export | 100k rows | < 15s | N/A | Export completes |

### Load Test Summary

| Test ID | Scenario | Virtual Users | Duration | Target TPS | Pass Criteria |
|---------|----------|---------------|----------|------------|---------------|
| LOAD-01 | Peak business hours | 200 | 30 min | 100 | Error rate < 1% |
| LOAD-02 | Month-end closing | 500 | 15 min | 200 | Error rate < 0.5% |
| LOAD-03 | Batch processing | N/A | 1 hour | N/A | All jobs complete |

### Stress Test Summary

| Test ID | Scenario | Load Level | Breaking Point | Recovery |
|---------|----------|------------|----------------|----------|
| STR-01 | Gradual ramp | 50→2000 users | Error rate > 5% | Auto-recovery < 5 min |
| STR-02 | Spike test | 100→1000→100 users | System stable | No data loss |
| STR-03 | Endurance | 200 users | 24 hours | Stable throughout |

---

## 7. Database Testing

### Consolidated Database Test Matrix

| Test Case ID | Module | Scenario | Test Method | Expected Result | Priority |
|--------------|--------|----------|-------------|-----------------|----------|
| DB-001 | All | No orphaned records | FK constraint check | No orphans | High |
| DB-002 | SO/PO/DL | Document numbers unique | Unique constraint | No duplicates | High |
| DB-003 | All | Transaction atomicity | Rollback test | All-or-nothing | High |
| DB-004 | Balance Inquiry | Balance = sum transactions | Reconciliation query | Balances match | High |
| DB-005 | Stock modules | No negative stock | Check after operations | Always >= 0 | High |
| DB-006 | Approval modules | Approval log preserved | Audit table check | All logs retained | High |
| DB-007 | Transfer | One-phase commit | Simulate failure mid-transfer | No partial state | High |
| DB-008 | Cost | GL entries balanced | Debit = Credit | Always balanced | High |
| DB-009 | All | Soft deletes | Check deleted flag | Not in queries | Medium |
| DB-010 | All | Timestamps accurate | Compare DB/app time | Within tolerance | Medium |

### Data Integrity Rules

| Rule ID | Description | Validation Method |
|---------|-------------|-------------------|
| DIR-001 | SO amount = sum(line amounts - discount + tax) | Calculated field check |
| DIR-002 | PO received qty <= PO qty | Constraint + app check |
| DIR-003 | Stock on hand >= allocated + available | Balance check |
| DIR-004 | GL entries balance (debits = credits) | Trial balance |
| DIR-005 | All transactions reference valid master data | FK checks |

### Database Performance Tests

| Test ID | Scenario | Dataset Size | Expected Time |
|---------|----------|--------------|---------------|
| DBP-001 | Balance calculation | 1M transactions | < 5s |
| DBP-002 | Report generation | 100k GRNs | < 15s |
| DBP-003 | Audit trail query | 10M log entries | < 3s |
| DBP-004 | Concurrent updates | 100 writers | No deadlocks |
| DBP-005 | Index effectiveness | Full table scan avoided | Explain plan check |

---

## 8. User Acceptance Testing

### UAT Sign-off Matrix

| Test Case ID | Module | User Role | Business Scenario | Acceptance Criteria | Sign-off |
|--------------|--------|-----------|------------------|---------------------|----------|
| UAT-001 | Sales Order | Sales Admin | Create SO for new customer | SO created, customer added | Pending |
| UAT-002 | SO Approval | Sales Manager | Approve SO below limit | Approved without escalation | Pending |
| UAT-003 | Stock Ready | Warehouse Staff | Allocate stock daily | All SOs allocated correctly | Pending |
| UAT-004 | Delivery | Dispatch | Create delivery from allocated SO | Delivery created, stock deducted | Pending |
| UAT-005 | Purchase Order | Procurement | Create PO from requisition | PO linked to requisition | Pending |
| UAT-006 | Purchase Stock Verification | QC Inspector | Inspect and verify GRN | QC result recorded, stock posted | Pending |
| UAT-007 | Inventory Transfer | Warehouse Supervisor | Transfer stock between WH | Stock received at destination | Pending |
| UAT-008 | Withdrawal | Warehouse Staff | Record damaged stock withdrawal | Stock deducted, photo attached | Pending |
| UAT-009 | Operational Cost | Finance Staff | Record shipping cost | Cost allocated to correct CC | Pending |
| UAT-010 | Balance Inquiry | Finance Manager | View monthly P&L | Accurate balances displayed | Pending |

### UAT Process

| Step | Activity | Owner | Duration |
|------|----------|-------|----------|
| 1 | UAT environment setup | DevOps | 2 days |
| 2 | UAT test execution | Business Users | 5 days |
| 3 | Defect reporting | QA Team | Ongoing |
| 4 | Defect fixes | Dev Team | 3 days |
| 5 | Re-testing | QA Team | 2 days |
| 6 | Sign-off | Business Stakeholders | 1 day |

---

## 9. Automation Testing

### Automation Strategy

| Approach | Scope | Tools | Coverage Target |
|----------|-------|-------|-----------------|
| Unit Tests | Business logic | Jest/Mocha | 80% |
| Integration Tests | API contracts | Supertest | 70% |
| E2E Tests | Critical user flows | Playwright | 60% |
| Smoke Tests | Deployment validation | Playwright | 100% critical paths |

### Automation Framework Structure

```
Ryan/test-playwright/more1/mhc-full/
├── specs/
│   ├── 00-all-modules-master.spec.js
│   ├── 01-dashboard.spec.js
│   ├── 10-sales-order-e2e-create.spec.js
│   ├── 20-sales-order-wizard-create.spec.js
│   ├── 02-sales-order-complete.spec.js
│   ├── 31-so-approval-e2e.spec.js
│   ├── 32-stock-ready-e2e.spec.js
│   ├── 33-purchase-stock-verification-e2e.spec.js
│   ├── 40-delivery-e2e.spec.js
│   ├── 50-inventory-transfer-e2e.spec.js
│   ├── 60-operational-cost-e2e.spec.js
│   ├── 70-balance-inquiry-e2e.spec.js
│   ├── 80-withdrawal-e2e.spec.js
├── helpers/
│   ├── login.js
│   ├── api-monitor.js
├── pages/
│   ├── LoginPage.js
│   └── [Module]Page.js
├── fixtures/
│   └── test-data.js
└── explorer/
    └── auto-discover.js
```

### Page Object Model

```javascript
// Example: Ryan/test-playwright/more1/mhc-full/pages/SalesOrderPage.js

export class SalesOrderPage {
  constructor(page) {
    this.page = page;
    this.customerSelect = '#customerSelect';
    this.productInput = '.product-input';
    this.qtyInput = '.qty-input';
    this.submitBtn = '#submitBtn';
    this.saveDraftBtn = '#saveDraftBtn';
  }

  async createSalesOrder(customer, items) {
    await this.page.selectOption(this.customerSelect, customer);
    for (const item of items) {
      await this.page.click('.add-line');
      await this.page.selectOption('.product-select', item.product);
      await this.page.fill('.qty-input', item.qty.toString());
    }
    await this.page.click(this.submitBtn);
  }

  async saveAsDraft() {
    await this.page.click(this.saveDraftBtn);
  }
}
```

### Test Data Management

| Strategy | Implementation | Location |
|----------|----------------|----------|
| Fixtures | JSON/YAML files | `fixtures/test-data.js` |
| Factories | Dynamic generation | Helper functions |
| Environment | `.env` per environment | `.env.test`, `.env.staging` |
| Cleanup | After each test | Global teardown |

---

## 10. E2E Process Flow

### End-to-End Business Process Diagrams

```
PROCUREMENT TO SALES CYCLE:
════════════════════════════════════════════════════════════════

1. PROCUREMENT:
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ Purchase    │────►│ Purchase    │────►│ Purchase    │
   │ Requisition │     │ Order       │     │ Stock       │
   │             │     │ (PO)        │     │ Verification│
   └─────────────┘     └─────────────┘     └──────┬──────┘
                                                  │
                                                  ▼
2. STOCK READY:                          ┌─────────────┐
   ┌─────────────┐                        │ Stock Ready │◄────
   │ GRN Posted  │───────────────────────►│             │     │
   │ to Inventory│                        └──────┬──────┘     │
   └─────────────┘                               │            │
                                                  │            │
3. SALES:                                         │            │
   ┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐     │
   │ Sales Order │────►│ SO          │────►│ Stock Ready │     │
   │ (SO)        │     │ Approval    │     │ Allocation  │     │
   └─────────────┘     └─────────────┘     └──────┬──────┘     │
                                                  │            │
                                                  ▼            │
4. DELIVERY:                              ┌─────────────┐     │
   ┌─────────────┐                        │ Delivery    │     │
   │ SO          │───────────────────────►│             │     │
   │ Delivered   │                        └─────────────┘     │
   └─────────────┘                                    │         │
                                                      │         │
5. FINANCIAL IMPACT:                                 │         │
   ┌─────────────────────────────────────────────────┘         │
   │                                                             │
   ▼                                                             │
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
   │ Balance     │◄────│ Operational │◄────│ Withdrawal  │     │
   │ Inquiry     │     │ Cost        │     │ (if any)    │     │
   └─────────────┘     └─────────────┘     └─────────────┘     │
         │
         ▼
   ┌─────────────┐
   │ Financial   │
   │ Reports     │
   └─────────────┘

```

### Critical Path Flow

| Step | Module | Trigger | Action | Next Step | SLA |
|------|--------|---------|--------|-----------|-----|
| 1 | Sales Order | Customer request | Create SO | Submit for approval | 1 hour |
| 2 | SO Approval | SO submitted | Review & approve | Stock allocation | 4 hours |
| 3 | Stock Ready | SO approved | Allocate stock | Delivery ready | 1 hour |
| 4 | Delivery | Stock ready | Create delivery | Dispatch | 2 hours |
| 5 | Balance Inquiry | Stock deducted | Update balance | Reports | Real-time |
| 6 | Purchase Order | Procurement need | Create PO | Supplier processing | 1 day |
| 7 | Purchase Stock Verification | Goods arrived | Inspect & verify | Stock available | 1 day |
| 8 | Operational Cost | Cost incurred | Record & post | GL updated | 1 day |

### Process Exception Handling

| Exception | Detection Point | Recovery Action | User Notification |
|-----------|-----------------|-----------------|-------------------|
| PO approval rejected | SO Approval | Return to Procurement | Email to creator |
| Stock insufficient | Stock Ready | Partial allocation + backorder | Alert to Sales |
| GRN quantity mismatch | Purchase Stock Verification | Variance approval required | QC Manager notified |
| Delivery address invalid | Delivery | Block delivery | Return to Sales |
| Approval timeout | SO Approval | Auto-escalation | Escalation email |
| Duplicate document | Any | Block creation | Error to user |

---

## 11. Requirements Traceability Matrix

### RTM: Business Requirements to Test Cases

| Requirement ID | Description | Module | Test Case IDs | Coverage |
|----------------|-------------|--------|---------------|----------|
| REQ-001 | Create sales order with customer, products, qty | Sales Order | SO-FN-01, SO-FN-02, SO-MF-01, SO-MF-02 | 100% |
| REQ-002 | SO requires approval before delivery | SO Approval | SA-FN-01, SA-FN-02, SA-BR-01 | 100% |
| REQ-003 | Stock allocation must prevent negative stock | Stock Ready | SR-FN-01, SR-NG-03, SR-BR-01 | 100% |
| REQ-004 | Delivery only from approved and ready SO | Delivery | DL-FN-01, DL-NG-01 | 100% |
| REQ-005 | Purchase order requires supplier and products | Purchase Order | PO-FN-01, PO-MF-01, PO-MF-02 | 100% |
| REQ-006 | Goods receipt must inspect before posting | Purchase Stock Verification | PV-FN-03, PV-NG-04, PV-BR-03 | 100% |
| REQ-007 | Inventory transfer between warehouses | Inventory Transfer | IT-FN-01, IT-NG-02, IT-INT-01 | 100% |
| REQ-008 | Withdrawal records reason and reduces stock | Withdrawal | WD-FN-01, WD-MF-04, WD-INT-01 | 100% |
| REQ-009 | Operational cost posts to GL | Operational Cost | OC-FN-05, OC-INT-01, OC-DB-02 | 100% |
| REQ-010 | Balance inquiry shows real-time balances | Balance Inquiry | BI-FN-01, BI-WF-01, BI-INT-01 | 100% |

### RTM: Functional Requirements Matrix

| Functional Area | Requirement | Test Coverage | Gaps |
|-----------------|-------------|---------------|------|
| Authentication | Login, logout, session | SO-UI-01 through SO-WF-20 | None |
| Authorization | Role-based access | RBAC-001 through RBAC-005 | None |
| Sales Management | SO creation, approval, delivery | SO-FN-01 through DL-BV-02 | None |
| Procurement | PO, GRN, verification | PO-FN-01 through PV-BV-02 | None |
| Warehouse | Transfer, withdrawal, allocation | IT-FN-01 through SR-BV-02 | None |
| Finance | Cost posting, balance, GL | OC-FN-01 through BI-BV-02 | None |
| Reporting | Balance, aging, transaction | BI-FN-01 through BI-INT-05 | None |

---

## 12. Test Coverage Matrix

### Coverage by Module

| Module | Total Test Cases | Automated | Manual | Coverage % | Priority |
|--------|------------------|-----------|--------|------------|----------|
| Sales Order | 40 | 10 | 30 | 100% | High |
| Purchase Order | 35 | 8 | 27 | 100% | High |
| Delivery | 30 | 6 | 24 | 100% | High |
| Inventory Transfer | 35 | 8 | 27 | 100% | High |
| Operational Cost | 35 | 8 | 27 | 100% | High |
| Balance Inquiry | 30 | 6 | 24 | 100% | High |
| Withdrawal | 35 | 8 | 27 | 100% | High |
| SO Approval | 30 | 6 | 24 | 100% | High |
| Stock Ready | 30 | 6 | 24 | 100% | High |
| Purchase Stock Verification | 35 | 8 | 27 | 100% | High |
| **TOTAL** | **335** | **74** | **261** | **100%** | |

### Coverage by Test Type

| Test Type | Count | Percentage |
|------------|-------|------------|
| Functional | 140 | 42% |
| Negative | 70 | 21% |
| Workflow | 50 | 15% |
| Integration | 15 | 4% |
| Security | 15 | 4% |
| Performance | 10 | 3% |
| Database | 10 | 3% |
| UI | 10 | 3% |
| UAT | 10 | 3% |
| API | 10 | 3% |
| Validation | 10 | 3% |
| Boundary | 10 | 3% |
| Mandatory | 10 | 3% |
| Business Rule | 15 | 4% |
| Automation | 10 | 3% |

### Coverage by Priority

| Priority | Count | Percentage |
|-----------|-------|------------|
| Critical | 120 | 36% |
| High | 140 | 42% |
| Medium | 60 | 18% |
| Low | 15 | 4% |

---

## 13. Risk Assessment Matrix

### Module Risk Assessment

| Module | Risk Level | Key Risks | Mitigation |
|--------|-----------|-----------|-----------|
| Sales Order | High | Credit limit bypass, stock double-commit | Approval gate, atomic transactions |
| Purchase Order | High | Budget overrun, duplicate PO | Budget check, unique constraint |
| Delivery | High | Delivery of unallocated stock | Allocation verification before DL |
| Inventory Transfer | High | Stock lost in transit | Two-phase commit, reconciliation |
| Operational Cost | High | GL posting without approval | Approval gate, idempotency key |
| Balance Inquiry | High | Balance divergence | Reconciliation job, audit trail |
| Withdrawal | High | Negative stock | Hard DB constraint, pre-check |
| SO Approval | Medium | Approval bypass | RBAC, audit trail |
| Stock Ready | High | Double allocation | Atomic lock, unique constraint |
| Purchase Stock Verification | High | Post without QC | Inspection gate |

### Test Execution Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Environment instability | Medium | High | Dedicated test env, monitoring |
| Test data conflicts | Medium | Medium | Isolated test data, cleanup |
| Flaky tests | Medium | Medium | Retry mechanism, root-cause fix |
| Automation script failures | Low | Medium | Regular maintenance, CI/CD |
| Third-party dependencies | Low | High | Mocking where possible |

---

## 14. Automation Candidate List

### Priority 1: Critical Path (Automate First)

| Test Case ID | Module | Description | Automation Complexity | Estimated Effort |
|--------------|--------|-------------|----------------------|------------------|
| SO-FN-01 | Sales Order | Create valid SO | Medium | 2h |
| SA-FN-02 | SO Approval | Approve SO | Low | 1h |
| SR-FN-01 | Stock Ready | Allocate stock | Low | 1h |
| DL-FN-01 | Delivery | Create delivery from SO | Medium | 2h |
| PO-FN-01 | Purchase Order | Create valid PO | Medium | 2h |
| PV-FN-05 | Purchase Stock Verification | Verify and post GRN | Medium | 2h |
| IT-FN-01 | Inventory Transfer | Inter-warehouse transfer | Medium | 2h |
| WD-FN-01 | Withdrawal | Create withdrawal | Medium | 2h |
| OC-FN-05 | Operational Cost | Post to GL | Medium | 2h |
| BI-FN-01 | Balance Inquiry | View stock balance | Low | 1h |

### Priority 2: High-value Scenarios

| Test Case ID | Module | Description | Automation Complexity | Estimated Effort |
|--------------|--------|-------------|----------------------|------------------|
| SO-BR-01 | Sales Order | Credit limit check | Medium | 2h |
| PO-BR-03 | Purchase Order | Currency mismatch | Low | 1h |
| DL-NG-02 | Delivery | Insufficient stock | Low | 1h |
| IT-NG-02 | Inventory Transfer | Insufficient stock | Low | 1h |
| WD-NG-01 | Withdrawal | Exceed available stock | Low | 1h |
| OC-BR-02 | Operational Cost | Self-approval block | Low | 1h |
| BI-INT-01 | Balance Inquiry | SO delivery impact | Medium | 2h |
| SA-BR-01 | SO Approval | Approval limit | Low | 1h |

### Priority 3: Regression Candidates

| Test Case ID | Module | Description | Automation Complexity |
|--------------|--------|-------------|----------------------|
| All Negative | All | Negative test cases | Medium |
| All Boundary | All | Boundary tests | Medium |
| All UI | All | UI smoke tests | Low |
| All API | All | API smoke tests | Low |
| All Workflow | All | Happy path workflows | Medium |

---

## 15. Smoke Test Suite

### Pre-Deployment Smoke Tests (Run in 15 min)

| Test ID | Scenario | Steps | Pass Criteria |
|---------|----------|-------|---------------|
| SMK-01 | Login successful | 1. Open app<br>2. Login with valid creds | Dashboard loads |
| SMK-02 | Create SO | 1. Go to SO<br>2. Fill required<br>3. Submit | SO created |
| SMK-03 | Create PO | 1. Go to PO<br>2. Fill required<br>3. Submit | PO created |
| SMK-04 | View Balance | 1. Go to BI<br>2. Select WH & product | Balance displayed |
| SMK-05 | SO Approval Queue | 1. Go to SA<br>2. Check queue | Queue loads |
| SMK-06 | Stock Ready | 1. Go to SR<br>2. Allocate stock | Allocation succeeds |
| SMK-07 | Create Delivery | 1. Go to DL<br>2. Select allocated SO | DL created |
| SMK-08 | Create GRN | 1. Go to PV<br>2. Select PO | GRN created |
| SMK-09 | Transfer Stock | 1. Go to IT<br>2. Create transfer | Transfer created |
| SMK-10 | Withdrawal | 1. Go to WD<br>2. Create withdrawal | Withdrawal created |
| SMK-11 | Operational Cost | 1. Go to OC<br>2. Create cost | Cost created |
| SMK-12 | Full Sales Cycle | 1. SO→Approve→Allocate→Deliver | End-to-end success |
| SMK-13 | Full Procurement Cycle | 1. PO→GRN→Verify→SR | End-to-end success |

### Post-Deployment Smoke Tests

| Test ID | Scenario | Steps | Pass Criteria |
|---------|----------|-------|---------------|
| SMK-POST-01 | DB connectivity | 1. Login<br>2. Query data | Data loads |
| SMK-POST-02 | API health | 1. Call /health | 200 OK |
| SMK-POST-03 | Queue processing | 1. Submit approval item<br>2. Check queue | Item appears |
| SMK-POST-04 | Email notifications | 1. Submit SO<br>2. Check email | Email received |
| SMK-POST-05 | Report generation | 1. Generate report | Report completes |

---

## 16. Regression Test Suite

### Regression Test Cases by Module

| Test Case ID | Module | Scenario | Last Run | Status |
|--------------|--------|----------|----------|--------|
| REG-001 | SO | Create + Submit + Approve + Allocate + Deliver | - | Ready |
| REG-002 | PO | Create + Approve + GRN + Verify + Post | - | Ready |
| REG-003 | Transfer | Create + Approve + Execute + Receive | - | Ready |
| REG-004 | WD | Create + Approve + Execute + Balance Update | - | Ready |
| REG-005 | OC | Create + Approve + Post + GL Update | - | Ready |
| REG-006 | BI | Post transactions + Verify balance + Export | - | Ready |
| REG-007 | SR | Approve SO + Allocate + Release + Reallocate | - | Ready |
| REG-008 | SA | Submit + Approve + Reject + Resubmit | - | Ready |
| REG-009 | PV | PO + GRN + Inspect + Post + Stock Update | - | Ready |
| REG-010 | DL | SR + Create DL + Partial + Complete | - | Ready |

### Regression Execution Plan

| Phase | Test Cases | Duration | Environment |
|-------|------------|----------|-------------|
| Phase 1: Critical Path | 10 | 1 hour | Staging |
| Phase 2: Core Modules | 50 | 4 hours | Staging |
| Phase 3: Full Regression | 200 | 8 hours | Staging |
| Phase 4: UAT Regression | 50 | 4 hours | UAT |

---

## 17. Critical Path Test Cases

### Business-Critical E2E Scenarios

| Path ID | End-to-End Scenario | Modules Involved | Test Duration | Priority |
|---------|---------------------|------------------|---------------|----------|
| CP-001 | Complete Sales Order Lifecycle | SO→SA→SR→DL→BI | 5 min | Critical |
| CP-002 | Complete Procurement Lifecycle | PO→PV→SR→BI | 10 min | Critical |
| CP-003 | Inter-Warehouse Transfer | IT→SR→BI | 3 min | Critical |
| CP-004 | Stock Withdrawal and Cost | WD→OC→BI | 3 min | High |
| CP-005 | Multi-SO Consolidated Delivery | SO×3→SA→SR→DL | 5 min | High |
| CP-006 | Partial Receipt and Backorder | PO→PV→SR→SO→DL | 8 min | High |
| CP-007 | Cost Allocation and Reporting | OC→BI→Report | 3 min | High |
| CP-008 | Return to Vendor Flow | WD→PO→PV | 5 min | Medium |
| CP-009 | Period-End Close | BI→Lock→Report | 5 min | High |
| CP-010 | Approval Escalation | SO→SA→Timeout→Escalate | 30 min | Medium |

### Critical Path Test Data

| Scenario | Primary Entity | Supporting Data |
|----------|---------------|-----------------|
| CP-001 | SO-COMPLETE-001 | Customer: PT. ABC, Product: ITEM-001, Qty: 100 |
| CP-002 | PO-COMPLETE-001 | Supplier: PT. XYZ, Product: RAW-001, Qty: 500 |
| CP-003 | TRF-COMPLETE-001 | WH-JKT→WH-BDG, Product: ITEM-001, Qty: 100 |
| CP-004 | WD-COST-001 | WH-JKT, Product: ITEM-001, Qty: 50, Cost: 500k |
| CP-005 | DL-CONSOL-001 | Customer: PT. ABC, 3 SOs consolidated |

---

## 18. Test Data

### Master Data

| Entity | Sample Values | Notes |
|--------|---------------|-------|
| Customer | PT. ABC, PT. XYZ, PT. DEF | Mix of active/inactive |
| Supplier | PT. SUP-A, PT. SUP-B | Various ratings |
| Product | ITEM-001, ITEM-002, RAW-001 | Batch/non-batch, perishable/non |
| Warehouse | WH-JKT (Main), WH-BDG (Branch), WH-SUB (Sub) | Cross-company configs |
| Cost Center | CC-001, CC-002, CC-003 | Department mapping |
| GL Account | ACC-CASH-101, ACC-OPEX-301, ACC-AP-201 | Chart of accounts |

### Transaction Data Templates

| Type | Template | Range |
|------|----------|-------|
| SO Number | SO-YYYYMM-XXXX | 001-999 per month |
| PO Number | PO-YYYYMM-XXXX | 001-999 per month |
| GRN Number | GRN-YYYYMM-XXXX | 001-999 per month |
| Transfer Number | TRF-YYYYMM-XXX | 001-999 per month |
| Withdrawal Number | WDR-YYYYMM-XXX | 001-999 per month |

### Test Environment Data

| Environment | URL | Credentials | Data Refresh |
|-------------|-----|-------------|--------------|
| Development | https://dev-mhc.modena.com | dev@modena.com / Dev1234 | Daily |
| Staging | https://staging-mhc.modena.com | qa@modena.com / QA1234 | Weekly |
| UAT | https://uat-mhc.modena.com | uat@modena.com / UAT1234 | Monthly |

### Data Cleanup Strategy

| Strategy | Implementation |
|----------|----------------|
| Transaction rollback | Savepoint-based rollback in E2E |
| Bulk cleanup script | `npm run test:clean` |
| Data factory | Reusable test data builders |
| Environment reset | Weekly full refresh from sanitized prod |

---

## 19. Development Guidelines

### Code Standards

| Aspect | Standard | Tool |
|--------|----------|------|
| Linting | ESLint (Airbnb) | ESLint |
| Formatting | Prettier | Prettier |
| Type checking | TypeScript strict | TSC |
| Commits | Conventional Commits | Commitlint |
| Branching | GitFlow | Git |

### Pull Request Checklist

- [ ] Tests added for new functionality
- [ ] All tests passing locally
- [ ] Code coverage >= 80%
- [ ] No console errors
- [ ] Documentation updated
- [ ] Peer reviewed

### CI/CD Pipeline

| Stage | Command | Purpose |
|-------|---------|---------|
| Install | `npm ci` | Install dependencies |
| Lint | `npm run lint` | Code quality check |
| Test | `npm run test:unit` | Unit tests |
| Build | `npm run build` | Build application |
| E2E | `npm run test:e2e` | Playwright E2E |
| Deploy | `npm run deploy` | Deploy to env |

---

## 20. Mocking and Test Doubles

### API Mocking Strategy

| API | Mock Type | Tool | When to Use |
|------|-----------|------|-------------|
| External payment gateway | Stub | MSW | Payment confirmation tests |
| Email service | Fake | Nodemailer mock | Notification tests |
| SMS gateway | Stub | Custom stub | OTP tests |
| Third-party ERP | Spy | MSW | Integration tests |
| File storage | Fake | Memory storage | Upload tests |

### Test Data Builders

```javascript
// Example builder pattern for test data

class SalesOrderBuilder {
  constructor() {
    this.data = {
      customer: 'PT. ABC',
      items: [],
      deliveryDate: '2025-07-01',
    };
  }

  withCustomer(customer) {
    this.data.customer = customer;
    return this;
  }

  withItem(product, qty, price) {
    this.data.items.push({ product, qty, price });
    return this;
  }

  withDeliveryDate(date) {
    this.data.deliveryDate = date;
    return this;
  }

  build() {
    return { ...this.data };
  }
}

// Usage
const soData = new SalesOrderBuilder()
  .withCustomer('PT. ABC')
  .withItem('ITEM-001', 100, 50000)
  .withDeliveryDate('2025-07-01')
  .build();
```

---

## 21. Defect Management

### Defect Severity Levels

| Severity | Description | Examples | SLA |
|-----------|-------------|----------|-----|
| Critical | System down, data loss | Negative stock, approval bypass | 4 hours |
| High | Major feature broken | SO cannot submit, GRN fails | 1 day |
| Medium | Feature impaired | UI misalignment, slow report | 3 days |
| Low | Minor issue | Typo, cosmetic | Next release |

### Defect Priority Levels

| Priority | Description | Resolution Target |
|-----------|-------------|-------------------|
| P1 | Blocking release | Immediate fix |
| P2 | Major impact | Next patch |
| P3 | Minor impact | Scheduled fix |
| P4 | Enhancement | Backlog |

### Defect Report Template

```markdown
## Defect Report

**ID:** DEF-001
**Title:** [Brief description]
**Module:** [Module name]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P1/P2/P3/P4]

### Environment
- URL: [test/staging/prod]
- Browser: [Chrome 120]
- OS: [Windows 11]

### Steps to Reproduce
1. [Step one]
2. [Step two]
3. [Step three]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Evidence
[Screenshots, logs, video]

### Root Cause Analysis
[If known]

### Fix Description
[How it was fixed]

### Regression Test
[Test case ID to verify fix]
```

---

## 22. Maintenance and Evolution

### Test Suite Health Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Pass rate | >= 95% | < 95% | < 90% |
| Flaky test rate | < 2% | 2-5% | > 5% |
| Execution time | < 30 min | 30-60 min | > 60 min |
| Coverage | >= 80% | 70-80% | < 70% |

### Maintenance Schedule

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Review flaky tests | Weekly | QA |
| Update test data | Monthly | QA |
| Review coverage gaps | Monthly | QA + Dev |
| Framework updates | Quarterly | DevOps |
| Full regression | Per release | QA |

---

## 23. Conclusion

This comprehensive E2E test documentation provides a complete testing framework for the MHC system, covering:

- **10 modules** with detailed test scenarios
- **335 test cases** across all test types
- **Automation strategy** with Playwright
- **Integration, API, security, and performance testing**
- **UAT, RTM, and coverage matrices**
- **Risk assessment and defect prediction**

### Next Steps

1. Set up test environments
2. Configure CI/CD pipelines
3. Begin Priority 1 automation
4. Schedule UAT with business users
5. Establish monitoring and alerting

### Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-23 | Senior QA Automation Architect | Initial comprehensive draft |


