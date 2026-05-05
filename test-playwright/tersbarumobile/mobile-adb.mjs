import { execSync } from 'child_process';

const ADB = `"${process.env.ANDROID_HOME || process.env.LOCALAPPDATA + '\\Android\\Sdk'}\\platform-tools\\adb.exe"`;
const DEVICE = '127.0.0.1:21503';
const PKG = 'com.modena.salesmobile';
const ACT = '.MainActivity';

// Credentials
const EMAIL = 'arman.septian@modena.com';
const PASSWORD = 'P@ssw0rd_arman.septian';

// Coordinates from previous successful UI dump (MEmu 900x1600 resolution)
const COORDS = {
  email: { x: 450, y: 699 },
  password: { x: 450, y: 883 },
  loginBtn: { x: 450, y: 1049 },
};

function adb(cmd) {
  return execSync(`${ADB} -s ${DEVICE} ${cmd}`, { encoding: 'utf8', timeout: 30000 }).trim();
}

function sleep(ms) {
  execSync(`powershell -c "Start-Sleep -Milliseconds ${ms}"`);
}

function tap(x, y) {
  adb(`shell input tap ${x} ${y}`);
}

function typeText(text) {
  adb('shell input keyevent KEYCODE_CTRL_LEFT+KEYCODE_A');
  adb('shell input keyevent KEYCODE_DEL');
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/ /g, '%s')
    .replace(/&/g, '\\&')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\|/g, '\\|')
    .replace(/;/g, '\\;')
    .replace(/'/g, "\\'");
  adb(`shell input text "${escaped}"`);
}

function screenshot(name) {
  try {
    adb(`shell screencap -p /sdcard/${name}.png`);
    adb(`pull /sdcard/${name}.png ./tersbarumobile/${name}.png`);
    console.log(`📸 ${name}.png`);
  } catch (e) {
    console.log(`⚠️ Screenshot failed: ${e.message}`);
  }
}

function dumpUI() {
  try {
    adb('shell uiautomator dump /sdcard/ui.xml');
    return adb('shell cat /sdcard/ui.xml');
  } catch (e) {
    console.log(`⚠️ UI dump failed: ${e.message}`);
    return '';
  }
}

// ============ MAIN ============
console.log('🚀 Sales Mobile Login Test (Pure ADB)');
console.log('====================================\n');

// Step 1: Force stop & relaunch app
console.log('📱 Launching Sales Mobile...');
try { adb(`shell am force-stop ${PKG}`); } catch {}
sleep(1000);
adb(`shell am start -n ${PKG}/${ACT}`);
console.log('  ✅ App launched');

// Step 2: Wait for app to load
console.log('⏳ Waiting for app to load (15s)...');
sleep(15000);
screenshot('01-login-page');

// Step 3: Dump UI to verify login page
console.log('\n🔍 Checking login page...');
let xml = dumpUI();
const hasLogin = xml.includes('content-desc="Login"');
const hasEditText = xml.includes('EditText');
console.log(`  Login button found: ${hasLogin}`);
console.log(`  Input fields found: ${hasEditText}`);

if (!hasLogin || !hasEditText) {
  // Try to get coordinates dynamically
  console.log('  ⚠️ UI different from expected, parsing coordinates...');
  const editTextRegex = /EditText[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  let match;
  const fields = [];
  while ((match = editTextRegex.exec(xml)) !== null) {
    fields.push({
      x: Math.floor((+match[1] + +match[3]) / 2),
      y: Math.floor((+match[2] + +match[4]) / 2),
    });
  }
  if (fields.length >= 2) {
    COORDS.email = fields[0];
    COORDS.password = fields[1];
  }
  const loginRegex = /content-desc="Login"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/;
  const lm = loginRegex.exec(xml);
  if (lm) {
    COORDS.loginBtn = { x: Math.floor((+lm[1] + +lm[3]) / 2), y: Math.floor((+lm[2] + +lm[4]) / 2) };
  }
}

// Step 4: Enter email
console.log('\n🔐 Entering credentials...');
console.log(`  📍 Tapping email field (${COORDS.email.x}, ${COORDS.email.y})`);
tap(COORDS.email.x, COORDS.email.y);
sleep(800);
typeText(EMAIL);
console.log(`  ✅ Email: ${EMAIL}`);

// Step 5: Enter password
console.log(`  📍 Tapping password field (${COORDS.password.x}, ${COORDS.password.y})`);
tap(COORDS.password.x, COORDS.password.y);
sleep(800);
typeText(PASSWORD);
console.log(`  ✅ Password entered`);
sleep(500);
screenshot('02-credentials-filled');

// Step 7: Click Login directly (no need to dismiss keyboard - ADB input doesn't show keyboard)
console.log(`\n🔘 Tapping Login button (${COORDS.loginBtn.x}, ${COORDS.loginBtn.y})`);
tap(COORDS.loginBtn.x, COORDS.loginBtn.y);
console.log('  ✅ Login button clicked!');

// Step 8: Wait for login response  
console.log('⏳ Waiting for login response (10s)...');
sleep(10000);
screenshot('03-after-login-10s');

// Step 8b: Take progressive screenshots to see what happens
console.log('⏳ Waiting 10s more...');
sleep(10000);
screenshot('04-after-login-20s');

// Check if we're on home screen - if so, relaunch app (login might have succeeded in background)
const currentApp = adb('shell dumpsys window | findstr mCurrentFocus').trim();
console.log(`  📱 Current focus: ${currentApp}`);

if (!currentApp.includes(PKG)) {
  console.log('  ℹ️ App not in foreground, relaunching...');
  adb(`shell am start -n ${PKG}/${ACT}`);
  sleep(10000);
  screenshot('05-after-relaunch');
}

// Step 9: Check login status
console.log('\n🔍 Checking login result...');
xml = dumpUI();
if (xml.includes('content-desc="Login"')) {
  console.log('  ⚠️ Still on login page after 40s. Waiting 30s more...');
  sleep(30000);
  screenshot('04-after-login-70s');
  xml = dumpUI();
  if (xml.includes('content-desc="Login"')) {
    console.log('  ❌ Login failed - still on login page');
    // Show any error messages
    const descs = parseContentDescs(xml);
    console.log('  Page content:', descs.join(', '));
  }
} else {
  console.log('  ✅ Login succeeded!');
}

// Step 10: Explore current page
console.log('\n📋 Current Page Elements:');
const descs = parseContentDescs(xml);
for (const d of descs) {
  console.log(`  🏷️ "${d}"`);
}

const elements = parseElements(xml);
const clickable = elements.filter(e => e.clickable && e.desc);
if (clickable.length > 0) {
  console.log('\n🔘 Clickable Elements:');
  for (const el of clickable) {
    console.log(`  "${el.desc}" at (${el.x}, ${el.y})`);
  }
}

screenshot('05-final-state');
console.log('\n✅ Test completed!');
