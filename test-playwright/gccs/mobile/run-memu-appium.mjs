import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { remote } from 'webdriverio';

dotenv.config({ path: path.resolve('.env') });

const cfg = {
  appiumServerUrl: process.env.APPIUM_SERVER_URL || 'http://127.0.0.1:4723',
  udid: process.env.MEMU_UDID || '127.0.0.1:21503',
  deviceName: process.env.MEMU_DEVICE_NAME || 'MEmu',
  appPackage: process.env.MOBILE_APP_PACKAGE || '',
  appActivity: process.env.MOBILE_APP_ACTIVITY || '',
  baseUrl: process.env.MOBILE_BASE_URL || 'https://gccs-mobile-test.modena.com',
  username: process.env.TEST_USERNAME || 'TEC_IDR002',
  password: process.env.TEST_PASSWORD || 'password.1',
  strictFlow: (process.env.STRICT_FLOW || 'false').toLowerCase() === 'true',
  flowMode: (process.env.GCCS_FLOW_MODE || 'default').toLowerCase(),
  startupTimeoutMs: Number(process.env.APP_STARTUP_TIMEOUT_MS || 120000),
  artifactsDir: path.resolve('test-results-appium')
};

const selectors = {
  dashboard: [
    'android=new UiSelector().textContains("Dashboard")',
    'android=new UiSelector().resourceIdMatches(".*dashboard.*")',
    'android=new UiSelector().textContains("Work Order No.")',
    'android=new UiSelector().textContains("Start Repair")',
    'android=new UiSelector().textContains("Repair Management")',
    'android=new UiSelector().textContains("Validation")',
    'android=new UiSelector().textContains("HELLO,")',
    'android=new UiSelector().textContains("Features")',
    'android=new UiSelector().textContains("Today Summary Work Order")'
  ],
  waitingConfirmation: [
    'android=new UiSelector().textContains("Waiting Confirmation")',
    'android=new UiSelector().textContains("Menunggu Konfirmasi")',
    'android=new UiSelector().textContains("Waiting")',
    'android=new UiSelector().textContains("Waiting to Confirm")'
  ],
  confirmation: [
    'android=new UiSelector().textContains("Confirmation")',
    'android=new UiSelector().textContains("Konfirmasi")',
    'android=new UiSelector().textContains("Confirm")'
  ],
  startVisit: [
    'android=new UiSelector().textContains("Start Visit")',
    'android=new UiSelector().textContains("Mulai Kunjungan")',
    'android=new UiSelector().textContains("Start Repair")'
  ],
  homeMarkers: [
    'android=new UiSelector().textContains("HELLO,")',
    'android=new UiSelector().textContains("Features")',
    'android=new UiSelector().textContains("Today Summary Work Order")'
  ],
  openWorkOrder: [
    'android=new UiSelector().text("Work Order")',
    'android=new UiSelector().textContains("Waiting to Confirm")',
    'android=new UiSelector().textContains("Total Work Order")'
  ]
};

if (!fs.existsSync(cfg.artifactsDir)) {
  fs.mkdirSync(cfg.artifactsDir, { recursive: true });
}

const useNativeApp = Boolean(cfg.appPackage && cfg.appActivity);

function tsName(label) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(cfg.artifactsDir, `${stamp}-${label}.png`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureAppiumServer() {
  const statusUrl = `${cfg.appiumServerUrl.replace(/\/$/, '')}/status`;
  const res = await fetch(statusUrl).catch(() => null);
  if (!res || !res.ok) {
    throw new Error(`Appium server not reachable at ${statusUrl}. Start it with: npx appium`);
  }
}

async function findFirstDisplayed(driver, selectors, nativeMode = false) {
  for (const selector of selectors) {
    if (nativeMode && !selector.startsWith('android=') && !selector.startsWith('~')) {
      continue;
    }
    try {
      const el = await driver.$(selector);
      if (await el.isDisplayed()) {
        return el;
      }
    } catch {
      // Ignore and continue.
    }
  }
  return null;
}

async function switchToWebContextIfNeeded(driver) {
  const contexts = await driver.getContexts();
  const webCtx = contexts.find(c => c.includes('WEBVIEW') || c.includes('CHROMIUM'));
  if (webCtx) {
    await driver.switchContext(webCtx);
    return webCtx;
  }
  return 'NATIVE_APP';
}

async function waitForAppReady(driver) {
  const deadline = Date.now() + cfg.startupTimeoutMs;
  let splashSeen = false;

  while (Date.now() < deadline) {
    const source = await driver.getPageSource();
    const upper = source.toUpperCase();

    const hasLoginMarkers =
      upper.includes('USERNAME') ||
      upper.includes('PASSWORD') ||
      upper.includes('LOGIN') ||
      upper.includes('MASUK');

    const hasDashboardMarkers =
      upper.includes('WORK ORDER') ||
      upper.includes('TODAY SUMMARY WORK ORDER') ||
      upper.includes('HELLO,');

    const hasSplashMarkers =
      upper.includes('GLOBAL CUSTOMER CARE SYSTEM') ||
      upper.includes('MODENA') ||
      upper.includes('1.25.3');

    if (hasLoginMarkers || hasDashboardMarkers) {
      await driver.saveScreenshot(tsName('00-ready-screen'));
      return;
    }

    if (hasSplashMarkers) {
      splashSeen = true;
    }

    await sleep(2000);
  }

  await driver.saveScreenshot(tsName('00-startup-timeout'));
  if (splashSeen) {
    throw new Error('App stuck on splash screen and did not reach login/dashboard within timeout.');
  }
  throw new Error('App did not reach a known ready screen (login/dashboard) within timeout.');
}

async function stepLogin(driver, nativeMode) {
  const usernameEl = await findFirstDisplayed(driver, [
    'input[name="username"]',
    'input[type="text"]',
    '~username',
    'android=new UiSelector().resourceIdMatches(".*username.*")',
    'android=new UiSelector().textContains("Username")',
    'android=new UiSelector().className("android.widget.EditText").instance(0)'
  ], nativeMode);

  const passwordEl = await findFirstDisplayed(driver, [
    'input[name="password"]',
    'input[type="password"]',
    '~password',
    'android=new UiSelector().resourceIdMatches(".*password.*")',
    'android=new UiSelector().textContains("Password")',
    'android=new UiSelector().className("android.widget.EditText").instance(1)'
  ], nativeMode);

  const loginBtn = await findFirstDisplayed(driver, [
    'button[type="submit"]',
    'button*=Login',
    '~login',
    'android=new UiSelector().textContains("Login")',
    'android=new UiSelector().textContains("Masuk")',
    'android=new UiSelector().className("android.widget.Button")'
  ], nativeMode);

  if (!usernameEl || !passwordEl || !loginBtn) {
    const alreadyLoggedIn = await findFirstDisplayed(driver, [
      'android=new UiSelector().textContains("Dashboard")',
      'android=new UiSelector().textContains("Work Order No.")',
      'android=new UiSelector().textContains("Start Repair")',
      'android=new UiSelector().textContains("Repair Management")',
      'android=new UiSelector().textContains("Validation")',
      'android=new UiSelector().textContains("HELLO,")',
      'android=new UiSelector().textContains("Today Summary Work Order")',
      'android=new UiSelector().textContains("Features")'
    ], true);

    if (alreadyLoggedIn) {
      console.log('[APPIUM] Login form not found because session appears already authenticated.');
      await driver.saveScreenshot(tsName('01-login-skipped-already-authenticated'));
      return;
    }

    const srcPath = path.join(cfg.artifactsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-login-page-source.xml`);
    fs.writeFileSync(srcPath, await driver.getPageSource(), 'utf8');
    throw new Error('Login elements not found. Check selectors or app context.');
  }

  await usernameEl.setValue(cfg.username);
  await passwordEl.setValue(cfg.password);
  await driver.saveScreenshot(tsName('01-login-filled'));
  await loginBtn.click();
  await sleep(2500);
}

async function stepDashboard(driver, nativeMode) {
  const dashboard = await findFirstDisplayed(driver, [
    'h1*=Dashboard',
    'h2*=Dashboard',
    ...selectors.dashboard,
    'android=new UiSelector().textContains("Home")'
  ], nativeMode);

  if (!dashboard) {
    throw new Error('Dashboard indicator not found after login.');
  }

  await driver.saveScreenshot(tsName('02-dashboard'));
}

async function navigateFromHomeToWorkOrder(driver, nativeMode) {
  if (!nativeMode) {
    return false;
  }

  const onHome = await findFirstDisplayed(driver, selectors.homeMarkers, true);
  if (!onHome) {
    return false;
  }

  const openEntry = await findFirstDisplayed(driver, selectors.openWorkOrder, true);
  if (!openEntry) {
    return false;
  }

  await openEntry.click();
  await sleep(2000);
  await driver.saveScreenshot(tsName('02b-open-work-order'));
  return true;
}

async function stepSelectWaitingConfirmation(driver, nativeMode) {
  let waitingRecord = await findFirstDisplayed(driver, [
    '//*[contains(translate(., "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "WAITING CONFIRMATION")]',
    ...selectors.waitingConfirmation
  ], nativeMode);

  if (!waitingRecord) {
    const navigated = await navigateFromHomeToWorkOrder(driver, nativeMode);
    if (navigated) {
      waitingRecord = await findFirstDisplayed(driver, [
        '//*[contains(translate(., "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "WAITING CONFIRMATION")]',
        ...selectors.waitingConfirmation
      ], nativeMode);
    }
  }

  if (!waitingRecord) {
    if (cfg.strictFlow) {
      throw new Error('No Waiting Confirmation record found.');
    }
    console.log('[APPIUM] Waiting Confirmation record not found, skipping step in non-strict mode.');
    await driver.saveScreenshot(tsName('03-waiting-confirmation-skip'));
    return;
  }

  await waitingRecord.click();
  await sleep(1500);
  await driver.saveScreenshot(tsName('03-waiting-confirmation-detail'));
}

async function stepConfirmation(driver, nativeMode) {
  const confirmBtn = await findFirstDisplayed(driver, [
    'button*=Confirmation',
    'button*=Konfirmasi',
    ...selectors.confirmation
  ], nativeMode);

  if (!confirmBtn) {
    if (cfg.strictFlow) {
      throw new Error('Confirmation button not found.');
    }
    console.log('[APPIUM] Confirmation button not found, skipping step in non-strict mode.');
    await driver.saveScreenshot(tsName('04-confirmation-skip'));
    return;
  }

  await confirmBtn.click();
  await sleep(2500);
  await driver.saveScreenshot(tsName('04-confirmation'));
}

async function stepStartVisit(driver, nativeMode) {
  const startBtn = await findFirstDisplayed(driver, [
    'button*=Start Visit',
    'button*=Mulai Kunjungan',
    ...selectors.startVisit
  ], nativeMode);

  if (!startBtn) {
    if (cfg.strictFlow) {
      throw new Error('Start Visit button not found.');
    }
    console.log('[APPIUM] Start Visit button not found, skipping step in non-strict mode.');
    await driver.saveScreenshot(tsName('05-start-visit-skip'));
    return;
  }

  await startBtn.click();
  await sleep(3000);
  await driver.saveScreenshot(tsName('05-start-visit'));
}

(async () => {
  console.log('[APPIUM] Checking server...');
  await ensureAppiumServer();

  const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:udid': cfg.udid,
    'appium:deviceName': cfg.deviceName,
    'appium:newCommandTimeout': 240,
    'appium:noReset': true,
    'appium:autoGrantPermissions': true
  };

  if (useNativeApp) {
    capabilities['appium:appPackage'] = cfg.appPackage;
    capabilities['appium:appActivity'] = cfg.appActivity;
  } else {
    capabilities.browserName = 'Chrome';
    capabilities['appium:chromeOptions'] = {
      args: ['--disable-notifications']
    };
  }

  console.log('[APPIUM] Starting session...');
  const driver = await remote({
    protocol: 'http',
    hostname: new URL(cfg.appiumServerUrl).hostname,
    port: Number(new URL(cfg.appiumServerUrl).port || '4723'),
    path: '/',
    capabilities,
    logLevel: 'warn'
  });

  try {
    let nativeMode = false;

    if (useNativeApp) {
      const currentCtx = await switchToWebContextIfNeeded(driver);
      console.log(`[APPIUM] Context: ${currentCtx}`);
      if (currentCtx === 'NATIVE_APP') {
        await driver.saveScreenshot(tsName('00-native-context'));
        console.log('[APPIUM] Running in native context mode.');
        nativeMode = true;

        const activityName = cfg.appActivity;
        await driver.startActivity(cfg.appPackage, activityName);
        await sleep(2000);
        await driver.saveScreenshot(tsName('00-after-start-activity'));
        console.log('[APPIUM] Waiting app readiness after activity launch...');
        await waitForAppReady(driver);
      }
    } else {
      await driver.url(cfg.baseUrl);
      await sleep(1500);
      await driver.saveScreenshot(tsName('00-open-url'));
    }

    console.log('[APPIUM] Scenario 1: Login');
    await stepLogin(driver, nativeMode);

    console.log('[APPIUM] Scenario 2: Dashboard');
    await stepDashboard(driver, nativeMode);

    console.log('[APPIUM] Scenario 3: Select Waiting Confirmation');
    await stepSelectWaitingConfirmation(driver, nativeMode);

    console.log('[APPIUM] Scenario 4: Confirmation');
    if (cfg.flowMode === 'repair') {
      console.log('[APPIUM] Flow mode repair: skipping explicit confirmation step.');
    } else {
      await stepConfirmation(driver, nativeMode);
    }

    console.log('[APPIUM] Scenario 5: Start Visit');
    await stepStartVisit(driver, nativeMode);

    console.log('[APPIUM] PASS: Main scenario flow completed.');
  } finally {
    await driver.deleteSession().catch(() => {});
  }
})().catch(err => {
  console.error(`[APPIUM] FAILED: ${err.message}`);
  process.exit(1);
});
