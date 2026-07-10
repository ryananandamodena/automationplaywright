# Setup BlueStacks untuk Playwright Testing

## Panduan Koneksi BlueStacks dengan Playwright

### Skenario 1: Aplikasi Web/PWA di Chrome (Paling Umum)

Jika aplikasi GCCS Mobile adalah web app yang dibuka di Chrome browser di dalam BlueStacks:

#### Step 1: Enable Remote Debugging di BlueStacks

1. **Buka BlueStacks**
2. **Buka Chrome browser** di dalam BlueStacks
3. **Buka aplikasi GCCS Mobile** di Chrome
4. **Catat URL aplikasi** (misal: `https://gccs-mobile.modena.com`)

#### Step 2: Enable ADB di BlueStacks

1. Buka **BlueStacks Settings**
2. Pergi ke **Advanced Settings**
3. Enable **Android Debug Bridge (ADB)**
4. Catat **ADB Port** (default: `5555`)

#### Step 3: Connect ADB

Buka PowerShell/Command Prompt:

```powershell
# Set ADB path (sesuaikan dengan instalasi Anda)
$env:PATH += ";C:\Program Files\BlueStacks_nxt\HD-Adb.exe"

# Atau gunakan Android SDK ADB
cd "C:\Users\[YourUsername]\AppData\Local\Android\Sdk\platform-tools"

# Connect ke BlueStacks
.\adb connect localhost:5555

# Verify koneksi
.\adb devices
# Output harus menampilkan: localhost:5555  device
```

#### Step 4: Forward Chrome DevTools Port

```powershell
# Forward port untuk Chrome DevTools
.\adb forward tcp:9222 localabstract:chrome_devtools_remote

# Atau jika menggunakan webview
.\adb forward tcp:9222 localabstract:webview_devtools_remote_[PROCESS_ID]
```

#### Step 5: Update Test Configuration

Buat file konfigurasi baru untuk BlueStacks:

**File: `playwright.config.bluestacks.js`**

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '*.spec.js',
  timeout: 120000,
  
  use: {
    // Connect ke Chrome di BlueStacks via remote debugging
    connectOptions: {
      wsEndpoint: 'ws://localhost:9222/devtools/browser',
    },
    
    // Atau gunakan URL langsung
    baseURL: 'https://gccs-mobile.modena.com',
    
    // Mobile viewport
    viewport: { width: 412, height: 915 }, // Pixel 5 size
    
    // Geolocation
    geolocation: { longitude: 106.8456, latitude: -6.2088 },
    permissions: ['geolocation'],
    
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
});
```

#### Step 6: Jalankan Test

```powershell
# Pastikan BlueStacks running dan Chrome terbuka
npx playwright test mobile_gccs.spec.js --config=playwright.config.bluestacks.js
```

---

### Skenario 2: Aplikasi Native Android dengan WebView

Jika aplikasi adalah native Android app dengan WebView:

#### Step 1: Enable WebView Debugging

Di dalam aplikasi (jika Anda punya akses ke source code):

```java
// Enable WebView debugging
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```

#### Step 2: Find WebView Process

```powershell
.\adb shell
cat /proc/net/unix | grep webview
# Catat process ID
```

#### Step 3: Forward WebView Port

```powershell
.\adb forward tcp:9222 localabstract:webview_devtools_remote_[PROCESS_ID]
```

---

### Skenario 3: Test Langsung di Chrome Browser BlueStacks (RECOMMENDED)

Cara paling mudah untuk testing:

#### Step 1: Buka Chrome di BlueStacks

1. Launch BlueStacks
2. Buka **Chrome browser**
3. Navigate ke aplikasi GCCS Mobile

#### Step 2: Gunakan Playwright Normal

Tidak perlu remote debugging, gunakan config normal:

```javascript
// playwright.config.bluestacks-simple.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://gccs-mobile.modena.com', // URL aplikasi Anda
    ...devices['Pixel 5'], // Mobile emulation
    
    geolocation: { longitude: 106.8456, latitude: -6.2088 },
    permissions: ['geolocation'],
    locale: 'id-ID',
    
    headless: false, // Agar terlihat
  },
});
```

Playwright akan membuka browser sendiri, tidak perlu connect ke BlueStacks.

**Keuntungan:**
- ✅ Lebih mudah setup
- ✅ Tidak perlu ADB
- ✅ Lebih stabil
- ✅ Screenshots dan video otomatis

**Kerugian:**
- ❌ Tidak test aplikasi native yang sebenarnya
- ❌ Tidak test di environment BlueStacks yang exact

---

## Setup Script Otomatis

Buat file PowerShell untuk setup otomatis:

**File: `setup-bluestacks.ps1`**

```powershell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BlueStacks + Playwright Setup       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if BlueStacks is running
$bluestacks = Get-Process "BlueStacks*" -ErrorAction SilentlyContinue
if (-not $bluestacks) {
    Write-Host "ERROR: BlueStacks is not running!" -ForegroundColor Red
    Write-Host "Please start BlueStacks first." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ BlueStacks is running" -ForegroundColor Green

# Set ADB path
$adbPath = "C:\Program Files\BlueStacks_nxt\HD-Adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "C:\Program Files\BlueStacks\HD-Adb.exe"
}
if (-not (Test-Path $adbPath)) {
    Write-Host "ERROR: BlueStacks ADB not found!" -ForegroundColor Red
    Write-Host "Please check BlueStacks installation path." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ ADB found: $adbPath" -ForegroundColor Green

# Connect to BlueStacks
Write-Host "Connecting to BlueStacks..." -ForegroundColor Yellow
& $adbPath connect localhost:5555

Start-Sleep -Seconds 2

# Check devices
Write-Host "Checking connected devices..." -ForegroundColor Yellow
& $adbPath devices

# Forward port for Chrome DevTools
Write-Host "Forwarding Chrome DevTools port..." -ForegroundColor Yellow
& $adbPath forward tcp:9222 localabstract:chrome_devtools_remote

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Chrome in BlueStacks" -ForegroundColor White
Write-Host "2. Navigate to GCCS Mobile app" -ForegroundColor White
Write-Host "3. Run: npm test" -ForegroundColor White
Write-Host ""
Write-Host "To verify Chrome connection:" -ForegroundColor Yellow
Write-Host "Open in your PC browser: http://localhost:9222" -ForegroundColor Cyan
Write-Host ""
```

---

## Troubleshooting

### Issue: ADB tidak bisa connect

**Solution:**
```powershell
# Kill ADB server
.\adb kill-server

# Start ADB server
.\adb start-server

# Connect lagi
.\adb connect localhost:5555
```

### Issue: Port 9222 already in use

**Solution:**
```powershell
# Find process using port 9222
netstat -ano | findstr :9222

# Kill process (ganti [PID] dengan process ID)
taskkill /PID [PID] /F

# Forward port lagi
.\adb forward tcp:9222 localabstract:chrome_devtools_remote
```

### Issue: Tidak bisa detect Chrome di BlueStacks

**Solution:**
1. Pastikan Chrome di BlueStacks sudah terbuka
2. Enable "Remote debugging" di Chrome:
   - Buka Chrome di BlueStacks
   - Ketik di address bar: `chrome://inspect`
   - Enable "Discover USB devices"

### Issue: WebView tidak terdeteksi

**Solution:**
```powershell
# List semua WebView processes
.\adb shell cat /proc/net/unix | grep webview

# Forward port untuk process tertentu
.\adb forward tcp:9222 localabstract:webview_devtools_remote_[PROCESS_ID]
```

---

## Verifikasi Setup

### 1. Verify ADB Connection

```powershell
.\adb devices
# Expected output:
# List of devices attached
# localhost:5555  device
```

### 2. Verify Chrome DevTools

Buka browser di PC Anda dan akses:
```
http://localhost:9222
```

Anda harus melihat list of inspectable pages dari Chrome di BlueStacks.

### 3. Verify Port Forwarding

```powershell
.\adb forward --list
# Expected output:
# localhost:5555 tcp:9222 localabstract:chrome_devtools_remote
```

---

## Rekomendasi Berdasarkan Tipe Aplikasi

### Jika aplikasi adalah **Web App / PWA**:
✅ Gunakan **Skenario 3** (Playwright langsung tanpa BlueStacks)
- Paling mudah
- Paling stabil
- Coverage testing sama

### Jika aplikasi adalah **Hybrid App** (WebView):
✅ Gunakan **Skenario 2** (Connect via ADB + WebView debugging)
- Testing environment lebih real
- Perlu setup ADB

### Jika aplikasi adalah **Native Android App**:
❌ Playwright tidak support
✅ Gunakan **Appium** sebagai alternatif

---

## Alternate Approach: Appium untuk Native Apps

Jika aplikasi adalah native Android dan Playwright tidak bisa digunakan:

```javascript
// Gunakan Appium dengan WebDriverIO
const { remote } = require('webdriverio');

const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    'appium:deviceName': 'BlueStacks',
    'appium:app': 'com.modena.gccs.mobile', // Package name
    'appium:automationName': 'UiAutomator2',
  }
};

const client = await remote(opts);
```

---

## FAQ

**Q: Apakah Playwright bisa langsung test native Android app?**
A: Tidak. Playwright designed untuk web browsers. Untuk native Android, gunakan Appium.

**Q: Apakah saya harus menggunakan BlueStacks?**
A: Tidak. Jika aplikasi adalah web app, Playwright bisa test langsung tanpa emulator.

**Q: Apa bedanya test di Playwright vs di BlueStacks?**
A: Playwright test di browser real, BlueStacks test di emulator Android. Untuk web app, hasilnya sama.

**Q: Port berapa yang digunakan BlueStacks ADB?**
A: Default: 5555. Bisa dicek di BlueStacks Settings → Advanced.

---

**Pilihan Terbaik untuk Anda:**

Jika aplikasi GCCS Mobile adalah **web app** yang dibuka di browser:
👉 Gunakan test yang sudah saya buat dengan `npm test` langsung (tidak perlu BlueStacks)

Jika aplikasi adalah **native/hybrid Android app**:
👉 Gunakan setup ADB di atas, atau pertimbangkan menggunakan Appium

---

**Next: Silakan beritahu saya:**
1. Apakah aplikasi GCCS Mobile adalah web app atau native app?
2. Apakah aplikasi dibuka di Chrome browser atau app terpisah?

Saya akan sesuaikan konfigurasi berdasarkan jawaban Anda.
