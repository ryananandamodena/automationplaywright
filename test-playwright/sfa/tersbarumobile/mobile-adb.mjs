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
console.log('🚀 Sales Mobile Login Test (Pure ADB)');
console.log('====================================\n');

console.log('📱 Launching Sales Mobile...');
try { adb(`shell am force-stop ${PKG}`); } catch {}
sleep(1000);
adb(`shell am start -n ${PKG}/${ACT}`);
console.log('  ✅ App launched');

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

console.log('\n🔐 Entering credentials...');
tap(COORDS.email.x, COORDS.email.y);
sleep(800);
typeText(EMAIL);
console.log(`  ✅ Email: ${EMAIL}`);

tap(COORDS.password.x, COORDS.password.y);
sleep(800);
typeText(PASSWORD);
console.log(`  ✅ Password entered`);
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
  console.log(`  📍 Tapping at (${salesApp.x}, ${salesApp.y})`);
  tap(salesApp.x, salesApp.y);
  sleep(5000);
  screenshot('06-sales-consultant-home');
  
  console.log('\n🔍 Checking Sales Consultant Home...');
  let xml2 = dumpUI();
  
  if (xml2.includes('content-desc="Confirmation"')) {
    console.log('  ⚠️ Confirmation popup detected! Clicking "Yes"...');
    const clickable2 = parseElements(xml2).filter(e => e.clickable && e.desc);
    const btnYes = clickable2.find(e => e.desc === 'Yes');
    if (btnYes) {
      tap(btnYes.x, btnYes.y);
      sleep(4000);
      screenshot('07-sales-consultant-main-menu');
      xml2 = dumpUI();
    }
  }

  const clickableMenu = parseElements(xml2).filter(e => e.clickable && e.desc);
  console.log('\n🔘 Clickable Menu Elements:');
  for (const el of clickableMenu) {
    console.log(`  "${el.desc}" at (${el.x}, ${el.y})`);
  }

  // Step 12: Go to Store tab and search
  console.log('\n🏪 Opening Store tab...');
  tap(550, 1240); // Bottom navigation - Store icon
  sleep(3000);
  screenshot('08-store-menu');

  console.log('  📍 Tapping search bar...');
  tap(360, 150); // Search bar center
  sleep(2000);
  console.log('  ⌨️ Typing "2725 GABK"...');
  typeText('2725 GABK');
  sleep(1000);
  console.log('  ⌨️ Pressing Enter...');
  adb('shell input keyevent 66');
  sleep(4000); // Wait for search results
  screenshot('09-search-results');

  let xml3 = dumpUI();
  
  // Find the first clickable element that might be the store result
  // If exact name doesn't match, just click the first search result which is usually below the search bar
  console.log('  📍 Tapping first search result...');
  tap(360, 300); // Coordinate for the first list item
  sleep(5000);
  screenshot('10-store-details');
  
  let xml4 = dumpUI();
  console.log('\n📋 Elements in Store Details:');
  const descs4 = parseContentDescs(xml4);
  for (const d of descs4) {
    console.log(`  🏷️ "${d}"`);
  }

  const clickableStore = parseElements(xml4).filter(e => e.clickable && e.desc);
  console.log('\n🔘 Clickable Store Elements:');
  for (const el of clickableStore) {
    console.log(`  "${el.desc}" at (${el.x}, ${el.y})`);
  }

} else {
  console.log('  ❌ Could not find Sales App button.');
}

console.log('\n✅ Script paused for exploration (Store Details)!');
