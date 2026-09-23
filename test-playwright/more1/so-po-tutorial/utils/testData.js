/**
 * Test Data — SO & PO Tutorial Automation
 *
 * Centralised data for all 4 test cases.
 * Credentials are read from environment variables — never hard-coded.
 */

import 'dotenv/config';

export const BASE_URL = process.env.MORE_BASE_URL || 'https://more-dev.modena.com';
export const MHC_PREFIX = '/mhc';

export const CREDENTIALS = {
  email: process.env.MHC_EMAIL || process.env.MORE_USERNAME || 'ryan.ananda@modena.com',
  password: process.env.MHC_PASSWORD || process.env.MORE_PASSWORD || 'Modena@2025',
  company: 'MODENA HOME CENTER (MHC)',
};

export const URLS = {
  login: BASE_URL,
  salesOrder: `${BASE_URL}${MHC_PREFIX}/sales-order`,
  salesOrderCreate: `${BASE_URL}${MHC_PREFIX}/sales-order/create`,
  purchaseOrder: `${BASE_URL}${MHC_PREFIX}/purchase-order`,
  purchaseOrderCreate: `${BASE_URL}${MHC_PREFIX}/purchase-order/create`,
};

export const testData = {
  inden: {
    testCaseId: 'TC-SO-001',
    testCaseName: 'Create Sales Order - INDEN',
    videoName: 'TC-SO-001-Create-SO-Inden',
    item: 'BH 2725 GABK',
    itemSKUs: ['BH2725GABK', 'BH 2725 GABK'],
    type: 'INDEN',
    stockSourceLabel: /warehouse indent/i,
    customer: 'Agus',
  },

  ready: {
    testCaseId: 'TC-SO-002',
    testCaseName: 'Create Sales Order - READY',
    videoName: 'TC-SO-002-Create-SO-Ready',
    item: 'BH 2725 GBBK',
    itemSKUs: ['BH2725GBBK', 'BH 2725 GBBK'],
    type: 'READY',
    stockSourceLabel: /warehouse ready/i,
    customer: 'Agus',
  },

  poFromInden: {
    testCaseId: 'TC-PO-001',
    testCaseName: 'Create PO From SO - INDEN',
    videoName: 'TC-PO-001-Create-PO-From-SO-Inden',
    item: 'BH 2725 GABK',
    itemSKUs: ['BH2725GABK', 'BH 2725 GABK'],
    type: 'INDEN',
    soTestCaseId: 'TC-SO-001',
  },

  poFromReady: {
    testCaseId: 'TC-PO-002',
    testCaseName: 'Create PO From SO - READY',
    videoName: 'TC-PO-002-Create-PO-From-SO-Ready',
    item: 'BH 2725 GBBK',
    itemSKUs: ['BH2725GBBK', 'BH 2725 GBBK'],
    type: 'READY',
    soTestCaseId: 'TC-SO-002',
  },
};
