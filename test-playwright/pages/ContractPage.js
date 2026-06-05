/**
 * CONTRACT PAGE OBJECT
 * 
 * Handles contract management operations in FMS
 */

import { BasePage } from './BasePage.js';

export class ContractPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      // List page
      addContractButton: 'button:has-text("Add Contract"), button:has-text("Add"), button[class*="add"]',
      contractTable: 'tbody tr',
      searchInput: 'input[type="search"], input[placeholder*="Search"]',
      
      // Form fields
      vendorDropdown: '.css-b62m3t-container >> nth=0',
      startDateInput: 'input[type="date"] >> nth=0',
      endDateInput: 'input[type="date"] >> nth=1',
      vehicleSelect: 'select >> nth=0',
      channelDropdown: '.css-b62m3t-container >> nth=1',
      branchDropdown: '.css-b62m3t-container >> nth=2',
      mainUserDropdown: '.css-b62m3t-container >> nth=3',
      rentCostInput: 'input[placeholder="0"]',
      
      // Actions
      saveButton: 'button:has-text("Save Contract"), button:has-text("Save"), button[type="submit"]',
      cancelButton: 'button:has-text("Cancel")',
      deleteButton: 'button:has-text("Delete")',
      
      // React Select options
      reactSelectOption: 'div[id*="react-select"][id*="option"]'
    };
  }

  /**
   * Navigate to contracts list
   */
  async navigate(baseUrl) {
    await this.goto(`${baseUrl}/fms/vehicle/contract`);
    await this.waitForPageLoad();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get total contract count
   */
  async getContractCount() {
    return await this.page.locator(this.selectors.contractTable).count();
  }

  /**
   * Click Add Contract button
   */
  async clickAddContract() {
    console.log('🆕 Opening contract form...');
    
    const addButton = this.page.locator(this.selectors.addContractButton).first();
    await this.waitForElement(addButton);
    await addButton.click();
    
    await this.page.waitForTimeout(2000);
    console.log('✓ Contract form opened');
  }

  /**
   * Fill contract form with data
   */
  async fillContractForm(contractData) {
    console.log('📝 Filling contract form...');
    
    // Vendor
    if (contractData.vendor) {
      console.log('  - Vendor...');
      await this.selectReactSelect(0, contractData.vendor);
    }
    
    // Dates
    if (contractData.startDate) {
      console.log('  - Start Date...');
      await this.fill(this.selectors.startDateInput, contractData.startDate);
    }
    
    if (contractData.endDate) {
      console.log('  - End Date...');
      await this.fill(this.selectors.endDateInput, contractData.endDate);
    }
    
    // Vehicle
    if (contractData.vehicle) {
      console.log('  - Vehicle...');
      await this.page.locator(this.selectors.vehicleSelect).selectOption({ index: contractData.vehicle });
    }
    
    // Channel
    if (contractData.channel) {
      console.log('  - Channel...');
      await this.selectReactSelect(1, contractData.channel);
    }
    
    // Branch
    if (contractData.branch) {
      console.log('  - Branch...');
      await this.selectReactSelect(2, contractData.branch);
    }
    
    // Main User
    if (contractData.mainUser) {
      console.log('  - Main User...');
      await this.selectReactSelect(3, contractData.mainUser);
    }
    
    // Rent Cost
    if (contractData.rentCost) {
      console.log('  - Rent Cost...');
      await this.click(this.selectors.rentCostInput);
      await this.fill(this.selectors.rentCostInput, contractData.rentCost.toString());
    }
    
    console.log('✓ Form filled');
  }

  /**
   * Save contract
   */
  async saveContract() {
    console.log('💾 Saving contract...');
    
    const saveButton = this.page.locator(this.selectors.saveButton).first();
    await this.waitForElement(saveButton);
    await saveButton.click();
    
    await this.page.waitForTimeout(2000);
    
    // Handle SweetAlert
    const alert = await this.handleSweetAlert('confirm');
    
    if (alert) {
      console.log('✓ Contract saved successfully');
      return alert;
    }
    
    console.log('⚠ No confirmation alert detected');
    return null;
  }

  /**
   * Create a new contract (full flow)
   */
  async createContract(contractData) {
    const initialCount = await this.getContractCount();
    console.log(`📊 Initial contracts: ${initialCount}`);
    
    await this.clickAddContract();
    await this.fillContractForm(contractData);
    await this.screenshot('contract-form-filled.png');
    const result = await this.saveContract();
    
    // Wait for list to update
    await this.page.waitForTimeout(2000);
    
    const finalCount = await this.getContractCount();
    console.log(`📊 Final contracts: ${finalCount}`);
    
    return {
      success: finalCount > initialCount,
      initialCount,
      finalCount,
      alert: result
    };
  }

  /**
   * Search for contract
   */
  async searchContract(searchTerm) {
    console.log(`🔍 Searching for: ${searchTerm}`);
    
    const searchInput = this.page.locator(this.selectors.searchInput);
    await this.fill(searchInput, searchTerm);
    await this.page.waitForTimeout(1500);
    
    const resultCount = await this.getContractCount();
    console.log(`✓ Found ${resultCount} result(s)`);
    
    return resultCount;
  }

  /**
   * Delete first contract in list
   */
  async deleteFirstContract() {
    console.log('🗑️ Deleting first contract...');
    
    const firstRow = this.page.locator(this.selectors.contractTable).first();
    await firstRow.click();
    await this.page.waitForTimeout(500);
    
    const deleteButton = this.page.locator(this.selectors.deleteButton);
    const isVisible = await this.isVisible(deleteButton, 3000);
    
    if (isVisible) {
      await this.click(deleteButton);
      await this.handleSweetAlert('confirm');
      await this.page.waitForTimeout(2000);
      console.log('✓ Contract deleted');
      return true;
    }
    
    console.log('⚠ Delete button not found');
    return false;
  }
}
