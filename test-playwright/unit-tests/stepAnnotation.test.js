import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StepAnnotation } from '../more1/so-po-tutorial/utils/stepAnnotation.js';

describe('Unit Test: StepAnnotation Class', () => {
  it('harus menginisialisasi properti awal dengan benar', () => {
    const ann = new StepAnnotation('TC-TEST-001', 'Test Case Name Sample');
    assert.equal(ann.testCaseId, 'TC-TEST-001');
    assert.equal(ann.testCaseName, 'Test Case Name Sample');
    assert.equal(ann.stepCounter, 0);
  });

  it('harus menambah stepCounter setiap method step() dipanggil', () => {
    const ann = new StepAnnotation('TC-TEST-002', 'Step Counter Test');
    assert.equal(ann.stepCounter, 0);

    ann.step('Login to portal');
    assert.equal(ann.stepCounter, 1);

    ann.step('Create Order', 'Detail payload');
    assert.equal(ann.stepCounter, 2);

    ann.step('Submit');
    assert.equal(ann.stepCounter, 3);
  });

  it('harus dapat menjalankan method banner tanpa melempar error', () => {
    const ann = new StepAnnotation('TC-TEST-003', 'Banner Test');
    assert.doesNotThrow(() => {
      ann.header();
      ann.success('Operasi berhasil');
      ann.warn('Perhatian');
      ann.footer({ Status: 'PASSED', TotalTime: '12s' });
    });
  });
});
