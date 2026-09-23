/**
 * SO Data Store — File-based data sharing between SO and PO tests
 *
 * SO tests write their created SO numbers here so PO tests can find them.
 * Uses a simple JSON file under test-results/so-data.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'test-results', 'so-data.json');

export function saveSOData(testCaseId, data) {
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });

  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { /* first run */ }

  existing[testCaseId] = { ...data, savedAt: new Date().toISOString() };
  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`  💾 SO data saved for ${testCaseId}: ${JSON.stringify(data)}`);
}

export function loadSOData(testCaseId) {
  try {
    const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return all[testCaseId] || null;
  } catch {
    return null;
  }
}
