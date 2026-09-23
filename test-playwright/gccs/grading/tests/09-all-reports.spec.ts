import { test, expect } from '../fixtures/authFixture';
import { GradeCategoriesPage } from '../pages/GradeCategoriesPage';
import { QuestionsSetupPage } from '../pages/QuestionsSetupPage';
import { ItemGradingPage } from '../pages/ItemGradingPage';
import { ServiceCenterPage } from '../pages/ServiceCenterPage';
import { MatrixApprovalPage } from '../pages/MatrixApprovalPage';
import fs from 'fs';
import path from 'path';
import os from 'os';

test.describe('All Export Excel Reports', () => {
  const downloadDir = path.join(os.homedir(), 'Downloads');

  test('Export grade categories to Excel', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const download = await gc.exportExcel();
    expect(download.suggestedFilename()).toMatch(/.*\.xlsx|.*\.xls/i);
    const downloadPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });

  test('Export questions setup to Excel', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    const download = await qs.exportExcel();
    expect(download.suggestedFilename()).toMatch(/.*\.xlsx|.*\.xls/i);
    const downloadPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });

  test('Export item grading to Excel', async ({ loggedInPage }) => {
    const ig = new ItemGradingPage(loggedInPage);
    await ig.goto();
    const download = await ig.exportExcel();
    expect(download.suggestedFilename()).toMatch(/.*\.xlsx|.*\.xls/i);
    const downloadPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });

  test('Export warehouse grading to Excel', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    const SERVICE_CENTER_ID = 85;
    await sc.goto(SERVICE_CENTER_ID);
    const download = await sc.exportExcel();
    expect(download.suggestedFilename()).toMatch(/.*\.xlsx|.*\.xls/i);
    const downloadPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });

  test('Export matrix approval to Excel', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    const download = await matrixPage.exportExcel();
    expect(download.suggestedFilename()).toMatch(/.*\.xlsx|.*\.xls/i);
    const downloadPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });
});
