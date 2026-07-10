import { execSync } from 'child_process';

const ADB = `"${process.env.ANDROID_HOME || process.env.LOCALAPPDATA + '\\Android\\Sdk'}\\platform-tools\\adb.exe"`;
const DEVICE = '127.0.0.1:5555';
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
    adb(`pull /sdcard/${name}.png ./${name}.png`);
    console.log(`📸 ${name}.png`);
  } catch (e) {
    console.log(`⚠️ Screenshot failed: ${e.message}`);
  }
}

function dumpUI(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = adb('shell uiautomator dump /sdcard/ui.xml');
      if (res.includes('ERROR')) {
        console.log(`  ⚠️ UI dump error, retrying... (${i+1}/${retries})`);
        sleep(2000);
        continue;
      }
      return adb('shell cat /sdcard/ui.xml');
    } catch (e) {
      console.log(`⚠️ UI dump failed: ${e.message}`);
      sleep(2000);
    }
  }
  return '';
}

function parseContentDescs(xmlStr) {
  const matches = [...xmlStr.matchAll(/content-desc="([^"]+)"/g)];
  return [...new Set(matches.map(m => m[1]).filter(Boolean))];
}

function parseElements(xmlStr) {
  const matches = [...xmlStr.matchAll(/content-desc="([^"]+)".*?clickable="([^"]+)".*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)];
  return matches.map(m => ({
    desc: m[1],
    clickable: m[2] === 'true',
    x: Math.floor((+m[3] + +m[5]) / 2),
    y: Math.floor((+m[4] + +m[6]) / 2)
  })).filter(e => e.desc);
}

// ============ MAIN ============
console.log('🚀 Sales Consultant Mobile Test (Pure ADB)');
console.log('====================================\n');

console.log('🧹 Clearing app data to ensure fresh login state...');
adb(`shell pm clear ${PKG}`);
sleep(3000);

console.log('📱 Launching Sales Mobile...');
adb(`shell am start -n ${PKG}/${ACT}`);

console.log('⏳ Waiting for app to load (15s)...');
sleep(15000);
screenshot('01-login-page');

console.log('\n🔍 Parsing coordinates from login page...');
let xml = dumpUI();

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

  console.log('  ✅ Email: iqbalilahi7@gmail.com');
  tap(COORDS.email.x, COORDS.email.y);
  sleep(1000);
  typeText('iqbalilahi7@gmail.com');

  tap(COORDS.password.x, COORDS.password.y);
  sleep(1000);
  typeText('P@ssw0rd_iqbalilahi7');
  console.log('  ✅ Password entered');
sleep(500);

console.log(`\n🔘 Tapping Login button (${COORDS.loginBtn.x}, ${COORDS.loginBtn.y})`);
tap(COORDS.loginBtn.x, COORDS.loginBtn.y);
console.log('  ✅ Login button clicked!');

console.log('⏳ Waiting for login response (20s)...');
sleep(20000);

const currentApp = adb('shell dumpsys window | findstr mCurrentFocus').trim();
console.log(`  📱 Current focus: ${currentApp}`);

xml = dumpUI();
if (xml.includes('content-desc="Login"')) {
  console.log('  ❌ Login failed - still on login page');
  process.exit(1);
} else {
  console.log('  ✅ Login succeeded!');
}

console.log('\n📋 Current Page Elements:');
const descs = parseContentDescs(xml);
const clickable = parseElements(xml).filter(e => e.clickable && e.desc);

console.log('\n🚀 Opening Sales App...');
const salesApp = clickable.find(e => e.desc.includes('Sales'));
if (salesApp) {
  console.log('  📍 Tapping at (180, 560)');
  console.log('\n🚀 Opening Sales App from Portal...');
  tap(180, 560); // Portal Apps - Sales Consultant Mobile icon
  sleep(3000);
  
  let xml2 = dumpUI();
  if (xml2.includes('Confirmation') || xml2.includes('Are you sure')) {
    console.log('  ⚠️ Confirmation popup detected! Clicking "Yes"...');
    tap(540, 710); // Click Yes
    sleep(5000);
    xml2 = dumpUI();
  }

  if (xml2.includes('Terms of Use') || xml2.includes('I have read and agree')) {
    console.log('  📄 Terms of Use screen detected! Scrolling to bottom...');
    for (let i = 0; i < 5; i++) {
      adb('shell input swipe 360 900 360 200 100');
      sleep(1000);
    }
    console.log('  ✅ Accepting Terms of Use...');
    tap(360, 1114); // Checkbox
    sleep(1000);
    tap(360, 1212); // Accept & Continue button
    sleep(10000);
    xml2 = dumpUI();
  }

  if (xml2.includes('Allow Sales Mobile') || xml2.includes('location')) {
    console.log('  📍 Location permission popup detected! Clicking "ALLOW"...');
    tap(590, 680); // ALLOW button (590, 550 visually, +130)
    sleep(3000);
    xml2 = dumpUI();
  }

  console.log('\n🏪 Opening Store Inventory...');
  tap(280, 640); // Store Inventory icon in Quick Menu (280, 510 visually, +130)
  sleep(5000);
  screenshot('08-store-inventory-menu');

  console.log('\n➕ Tapping Add Store Inventory button...');
  tap(360, 1214); // Coordinates of the blue plus button
  sleep(5000);
  screenshot('09-create-inventory');
  
  console.log('  📅 Selecting Periode Stok...');
  tap(360, 500); // Tap Pilih Periode
  sleep(3000);
  tap(546, 1003); // Tap OK on date picker
  sleep(3000);

  console.log('  📦 Selecting Product...');
  tap(360, 776); // Tap Pilih Product dropdown
  sleep(3000);
  
  console.log('  🔍 Searching for 2725 GABK...');
  tap(360, 320); // Tap search bar in bottom sheet
  sleep(2000);
  typeText('2725 GABK');
  sleep(2000);
  adb('shell input keyevent 66'); // Press Enter
  sleep(4000);
  
  console.log('  📍 Selecting first search result...');
  tap(360, 436); // Tap the first product result
  sleep(4000);
  screenshot('10-product-selected');

  console.log('  💾 Saving and Submitting...');
  tap(360, 1220); // Save & Submit button
  sleep(5000);
  screenshot('11-final-result');

  console.log('\n✅ Script completed successfully!');
}
