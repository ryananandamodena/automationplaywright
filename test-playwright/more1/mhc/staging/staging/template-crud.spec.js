/**
 * MHC - Staging (Sync SAP) test TEMPLATE
 *
 * Copy this file for a new "Sinkronisasi SAP" staging menu. See fixtures.js
 * for why these are List/Search/Filter/Sync tests, not CRUD: every staging
 * menu verified so far (Bank, BP Group, PPh, Warehouse) is a read-only sync
 * viewer with no Add/Edit/Delete UI.
 *
 * Steps to use this template:
 *   1. Copy this file to `<menu-slug>-crud.spec.js`.
 *   2. Set menuName to the page heading text after "Staging: " (all caps,
 *      e.g. 'BANK', 'BP GROUP') and menuSlug to the URL segment used in
 *      `/mhc/sync-sap/<menuSlug>/list` (e.g. 'bank', 'bp-group').
 *   3. Run it once against https://more-dev.modena.com and confirm the page
 *      really has no Add/Edit/Delete button before trusting test #2 below —
 *      if this menu turns out to have real CRUD controls (unlike the ones
 *      already verified), write dedicated create/update/delete tests here
 *      instead of using registerStagingSuite().
 */

import { test } from '@playwright/test';
import { registerStagingSuite } from './fixtures.js';

// Left commented out on purpose: this file is a copy-paste template, not a
// runnable spec for a real menu. Uncomment and fill in menuName/menuSlug
// after copying it to `<menu-slug>-crud.spec.js`.
// registerStagingSuite(test, { menuName: 'MENU NAME', menuSlug: 'menu-slug' });
