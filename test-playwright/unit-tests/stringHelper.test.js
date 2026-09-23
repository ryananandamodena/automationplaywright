import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper slug algorithm extracted for unit testing
function makeSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatRupiah(amount) {
  if (typeof amount !== 'number') return 'Rp 0';
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function calculatePPN(subtotal, rate = 0.11) {
  return Math.round(subtotal * rate);
}

describe('Unit Test: String & Financial Calculation Helpers', () => {
  describe('makeSlug()', () => {
    it('harus mengubah teks judul menjadi slug URL/folder yang bersih', () => {
      const input = 'TC-SO-001 — Create Sales Order - INDEN';
      const output = makeSlug(input);
      assert.equal(output, 'tc-so-001-create-sales-order-inden');
    });

    it('harus menangani karakter khusus dan spasi berlebih', () => {
      const input = '  Special @#$$% Characters & Spaces   ';
      const output = makeSlug(input);
      assert.equal(output, 'special-characters-spaces');
    });

    it('harus mengembalikan string kosong jika input null atau undefined', () => {
      assert.equal(makeSlug(null), '');
      assert.equal(makeSlug(undefined), '');
      assert.equal(makeSlug(''), '');
    });
  });

  describe('formatRupiah() & calculatePPN()', () => {
    it('harus memformat angka ke format Rupiah standar', () => {
      assert.equal(formatRupiah(1500000), 'Rp 1.500.000');
      assert.equal(formatRupiah(0), 'Rp 0');
      assert.equal(formatRupiah(null), 'Rp 0');
    });

    it('harus menghitung PPN 11% dengan tepat', () => {
      const subtotal = 10000000;
      const ppn = calculatePPN(subtotal, 0.11);
      assert.equal(ppn, 1100000);
      assert.equal(subtotal + ppn, 11100000);
    });
  });
});
