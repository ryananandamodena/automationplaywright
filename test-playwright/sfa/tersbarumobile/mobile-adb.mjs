import { execSync } from 'child_process';

const ADB = `"${process.env.ANDROID_HOME || process.env.LOCALAPPDATA + '\\Android\\Sdk'}\\platform-tools\\adb.exe"`;
const DEVICE = '127.0.0.1:5555';
const PKG = 'com.modena.salesmobile';
const ACT = '.MainActivity';

// Credentials
const EMAIL = process.env.TERSBARU_EMAIL;
const PASSWORD = process.env.TERSBARU_PASSWORD;

const COORDS = {};

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

if (!COORDS.email || !COORDS.password || !COORDS.loginBtn) {
  console.log('  ❌ Could not parse login coordinates dynamically. Exiting...');
  process.exit(1);
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

const clickable = parseElements(xml).filter(e => e.clickable && e.desc);

console.log('\n🚀 Opening Sales App...');
const salesApp = clickable.find(e => e.desc.includes('Sales'));
if (salesApp) {
  console.log(`  📍 Tapping at (${salesApp.x}, ${salesApp.y})`);
  tap(salesApp.x, salesApp.y);
  sleep(5000);
  
  console.log('\n🔍 Checking Sales Consultant Home...');
  let xml2 = dumpUI();
  
  if (xml2.includes('content-desc="Confirmation"')) {
    console.log('  ⚠️ Confirmation popup detected! Clicking "Yes"...');
    const clickable2 = parseElements(xml2).filter(e => e.clickable && e.desc);
    const btnYes = clickable2.find(e => e.desc === 'Yes');
    if (btnYes) {
      tap(btnYes.x, btnYes.y);
      sleep(4000);
      xml2 = dumpUI();
    }
  }


} else {
  console.log('  ❌ Could not find Sales App button.');
}
