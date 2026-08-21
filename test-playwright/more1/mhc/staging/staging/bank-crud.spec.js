/**
 * MHC - BANK Staging (Sync SAP) test
 *
 * Rewritten 2026-08-18: this menu was verified live to be a READ-ONLY sync
 * viewer (search + AND/OR filter builder + sort + "Sinkronkan Semua"), with
 * no Add/Edit/Delete UI anywhere — see fixtures.js for the full writeup and
 * registerStagingSuite() for the shared test bodies.
 */

import { test } from '@playwright/test';
import { registerStagingSuite } from './fixtures.js';

registerStagingSuite(test, { menuName: 'BANK', menuSlug: 'bank' });
