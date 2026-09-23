import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveSOData, loadSOData } from '../more1/so-po-tutorial/utils/soDataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'more1', 'test-results');
const DATA_FILE = path.join(TEST_RESULTS_DIR, 'so-data.json');

describe('Unit Test: soDataStore Helper', () => {
  let originalContent = null;

  before(() => {
    if (fs.existsSync(DATA_FILE)) {
      originalContent = fs.readFileSync(DATA_FILE, 'utf-8');
    }
  });

  after(() => {
    if (originalContent !== null) {
      fs.writeFileSync(DATA_FILE, originalContent, 'utf-8');
    } else if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  });

  it('harus mengembalikan null jika testCaseId tidak ditemukan', () => {
    const result = loadSOData('TC-NON-EXISTENT-999');
    assert.equal(result, null);
  });

  it('harus berhasil menyimpan data SO dan memuatnya kembali dengan benar', () => {
    const mockCaseId = 'TC-UNIT-TEST-SO-001';
    const mockData = {
      soNumber: 'SO/MHC/2026/0999',
      customer: 'Test Customer',
      totalAmount: 15000000,
    };

    saveSOData(mockCaseId, mockData);
    const loaded = loadSOData(mockCaseId);

    assert.ok(loaded !== null, 'Data harus ditemukan');
    assert.equal(loaded.soNumber, mockData.soNumber);
    assert.equal(loaded.customer, mockData.customer);
    assert.equal(loaded.totalAmount, mockData.totalAmount);
    assert.ok(typeof loaded.savedAt === 'string', 'savedAt harus berupa string timestamp');
  });

  it('harus mempertahankan data lama saat menambahkan data test case baru', () => {
    const caseA = 'TC-UNIT-A';
    const caseB = 'TC-UNIT-B';

    saveSOData(caseA, { item: 'Item A' });
    saveSOData(caseB, { item: 'Item B' });

    const loadedA = loadSOData(caseA);
    const loadedB = loadSOData(caseB);

    assert.equal(loadedA.item, 'Item A');
    assert.equal(loadedB.item, 'Item B');
  });
});
