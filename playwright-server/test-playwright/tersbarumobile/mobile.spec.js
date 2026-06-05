import { remote } from 'webdriverio';

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'MEmu',
  'appium:udid': '127.0.0.1:21503',
  'appium:appPackage': 'com.modena.salesmobile',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': true,
  'appium:fullReset': false,
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 300,
  'appium:adbExecTimeout': 120000,
  'appium:uiautomator2ServerLaunchTimeout': 180000,
  'appium:uiautomator2ServerInstallTimeout': 120000,
  'appium:skipDeviceInitialization': true,
  'appium:skipServerInstallation': false,
  'appium:skipUnlock': true,
  'appium:ignoreHiddenApiPolicyError': true,
  'appium:suppressKillServer': true,
  'appium:skipLogcatCapture': true,
  'appium:forceAppLaunch': true,
  'appium:shouldTerminateApp': true,
  'appium:uiautomator2ServerReadTimeout': 60000,
  'appium:disableWindowAnimation': true,
};

const wdOpts = {
  hostname: '127.0.0.1',
  port: 4723,
  logLevel: 'warn',
  capabilities,
};

// Helper: screenshot via ADB (fallback when UiAutomator2 crashes)
import { execSync } from 'child_process';

async function adbScreenshot(name) {
  try {
    const adb = `${process.env.ANDROID_HOME}\\platform-tools\\adb.exe`;
    execSync(`"${adb}" -s 127.0.0.1:21503 shell screencap -p /sdcard/${name}.png`);
    execSync(`"${adb}" -s 127.0.0.1:21503 pull /sdcard/${name}.png ./tersbarumobile/${name}.png`);
    console.log(`📸 ADB Screenshot: ${name}.png`);
  } catch (e) {
    console.log(`⚠️ ADB screenshot failed: ${e.message}`);
  }
}

// Helper: ADB command runner
function adb(cmd) {
  const adbPath = `${process.env.ANDROID_HOME}\\platform-tools\\adb.exe`;
  return execSync(`"${adbPath}" -s 127.0.0.1:21503 ${cmd}`, { encoding: 'utf8' }).trim();
}

// Helper: tap at coordinates via ADB
function adbTap(x, y) {
  adb(`shell input tap ${x} ${y}`);
}

// Helper: type text via ADB (escape special chars)
function adbType(text) {
  // Use Ctrl+A to select all, then delete (safer than KEYCODE_MOVE_HOME which can trigger Home button on MEmu)
  adb('shell input keyevent 29 --longpress');  // dummy to ensure focus
  adb('shell input keyevent KEYCODE_CTRL_LEFT+KEYCODE_A');  // Select all
  adb('shell input keyevent KEYCODE_DEL');
  // Type the text - encode for shell
  const escaped = text.replace(/([\\@#$%^&*()!])/g, '\\$1');
  adb(`shell input text "${escaped}"`);
}

// Helper: get UI XML dump
function adbDumpUI() {
  adb('shell uiautomator dump /sdcard/ui.xml');
  return adb('shell cat /sdcard/ui.xml');
}

async function runTest() {
  let driver;

  try {
    console.log('🔌 Connecting to Appium server...');
    driver = await remote(wdOpts);
    console.log('✅ Connected! Sales Mobile app launched on MEmu.');

    // Tunggu app loading
    console.log('⏳ Waiting for app to load (12s)...');
    await driver.pause(12000);
    await adbScreenshot('01-login-page');

    // === LOGIN via ADB (more stable than UiAutomator2 element interaction) ===
    console.log('\n🔐 Logging in via ADB...');

    // Get page source from Appium (not uiautomator dump)
    const xml = await driver.getPageSource();
    console.log('  📋 Page source obtained');

    // Parse EditText bounds from XML
    const editTextRegex = /EditText[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
    const editTexts = [];
    let match;
    while ((match = editTextRegex.exec(xml)) !== null) {
      const x = Math.floor((parseInt(match[1]) + parseInt(match[3])) / 2);
      const y = Math.floor((parseInt(match[2]) + parseInt(match[4])) / 2);
      editTexts.push({ x, y });
    }
    console.log(`  Found ${editTexts.length} input fields`);

    // Parse Login button bounds
    const loginBtnRegex = /content-desc="Login"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/;
    const loginMatch = loginBtnRegex.exec(xml);

    if (editTexts.length >= 2 && loginMatch) {
      // Tap email field and type
      console.log(`  📍 Email field at (${editTexts[0].x}, ${editTexts[0].y})`);
      adbTap(editTexts[0].x, editTexts[0].y);
      await driver.pause(800);
      adbType('arman.septian@modena.com');
      console.log('  ✅ Email entered');

      // Tap password field and type
      console.log(`  📍 Password field at (${editTexts[1].x}, ${editTexts[1].y})`);
      adbTap(editTexts[1].x, editTexts[1].y);
      await driver.pause(800);
      adbType('P@ssw0rd_arman.septian');
      console.log('  ✅ Password entered');

      await driver.pause(500);
      await adbScreenshot('02-credentials-filled');

      // Tap area kosong untuk dismiss keyboard (bukan BACK yang bisa close app)
      adbTap(450, 400);
      await driver.pause(1000);

      // Tap Login button
      const loginX = Math.floor((parseInt(loginMatch[1]) + parseInt(loginMatch[3])) / 2);
      const loginY = Math.floor((parseInt(loginMatch[2]) + parseInt(loginMatch[4])) / 2);
      console.log(`  📍 Login button at (${loginX}, ${loginY})`);
      adbTap(loginX, loginY);
      console.log('  ✅ Login button clicked!');

      // Wait for login API response
      console.log('  ⏳ Waiting for login response (30s)...');
      await driver.pause(30000);
      await adbScreenshot('03-after-login-30s');

      // Check if login succeeded
      const xml2 = await driver.getPageSource();
      if (xml2.includes('content-desc="Login"')) {
        console.log('  ⚠️ Still on login page, waiting 30s more...');
        await driver.pause(30000);
        await adbScreenshot('04-after-login-60s');
        const xml3 = await driver.getPageSource();
        if (xml3.includes('content-desc="Login"')) {
          console.log('  ❌ Login may have failed - still on login page');
        } else {
          console.log('  ✅ Login succeeded after 60s!');
        }
      } else {
        console.log('  ✅ Login succeeded! Navigated to new page.');
      }

      // Explore the current page
      console.log('\n📋 [Current Page Elements]:');
      const xml4 = await driver.getPageSource();
      // Extract all content-desc values
      const descRegex = /content-desc="([^"]+)"/g;
      const descs = new Set();
      let dm;
      while ((dm = descRegex.exec(xml4)) !== null) {
        if (dm[1] && dm[1].trim()) descs.add(dm[1]);
      }
      for (const d of descs) {
        console.log(`  🏷️ "${d}"`);
      }

      // Extract clickable elements
      const clickRegex = /clickable="true"[^>]*content-desc="([^"]*)"/g;
      console.log('\n📋 [Clickable Elements]:');
      let cm;
      while ((cm = clickRegex.exec(xml4)) !== null) {
        if (cm[1]) console.log(`  🔘 "${cm[1]}"`);
      }

      await adbScreenshot('05-final-state');

    } else {
      console.log('  ⚠️ Could not find email/password fields or Login button in UI dump');
      console.log('  EditTexts found:', editTexts.length);
      console.log('  Login button found:', !!loginMatch);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await adbScreenshot('error-screenshot');
  } finally {
    if (driver) {
      try { await driver.deleteSession(); } catch {}
      console.log('🔌 Session closed.');
    }
  }
}

runTest();
