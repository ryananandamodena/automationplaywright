import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, MHC_PREFIX, URLS, testData } from '../more1/so-po-tutorial/utils/testData.js';

describe('Unit Test: testData & URL Matrix Helper', () => {
  it('harus memiliki BASE_URL dan MHC_PREFIX yang valid', () => {
    assert.ok(BASE_URL.startsWith('http://') || BASE_URL.startsWith('https://'), 'BASE_URL harus berformat URL');
    assert.equal(MHC_PREFIX, '/mhc');
  });

  it('harus menghasilkan URL endpoint yang memiliki format yang benar', () => {
    assert.equal(URLS.login, BASE_URL);
    assert.equal(URLS.salesOrder, `${BASE_URL}/mhc/sales-order`);
    assert.equal(URLS.salesOrderCreate, `${BASE_URL}/mhc/sales-order/create`);
    assert.equal(URLS.purchaseOrder, `${BASE_URL}/mhc/purchase-order`);
    assert.equal(URLS.purchaseOrderCreate, `${BASE_URL}/mhc/purchase-order/create`);
  });

  it('harus memiliki skenario data INDEN lengkap dan valid', () => {
    const data = testData.inden;
    assert.equal(data.testCaseId, 'TC-SO-001');
    assert.equal(data.type, 'INDEN');
    assert.ok(Array.isArray(data.itemSKUs) && data.itemSKUs.length > 0);
    assert.ok(data.stockSourceLabel instanceof RegExp);
    assert.ok(data.stockSourceLabel.test('Warehouse Indent'));
  });

  it('harus memiliki skenario data READY lengkap dan valid', () => {
    const data = testData.ready;
    assert.equal(data.testCaseId, 'TC-SO-002');
    assert.equal(data.type, 'READY');
    assert.ok(Array.isArray(data.itemSKUs) && data.itemSKUs.length > 0);
    assert.ok(data.stockSourceLabel instanceof RegExp);
    assert.ok(data.stockSourceLabel.test('Warehouse Ready'));
  });

  it('harus memiliki relasi SO-ke-PO yang konsisten', () => {
    assert.equal(testData.poFromInden.soTestCaseId, testData.inden.testCaseId);
    assert.equal(testData.poFromReady.soTestCaseId, testData.ready.testCaseId);
  });
});
