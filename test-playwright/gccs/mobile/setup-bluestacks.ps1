Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BlueStacks + Playwright Setup       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if BlueStacks is running
Write-Host "Checking BlueStacks status..." -ForegroundColor Yellow
$bluestacks = Get-Process "BlueStacks*" -ErrorAction SilentlyContinue
if (-not $bluestacks) {
    Write-Host "⚠ BlueStacks is not running!" -ForegroundColor Yellow
    Write-Host ""
    $start = Read-Host "Do you want to start BlueStacks? (Y/N)"
    if ($start -eq "Y" -or $start -eq "y") {
        Write-Host "Please start BlueStacks manually and run this script again." -ForegroundColor Cyan
        exit 0
    } else {
        exit 1
    }
}
Write-Host "✓ BlueStacks is running" -ForegroundColor Green
Write-Host ""

# Find ADB path
Write-Host "Locating ADB..." -ForegroundColor Yellow
$adbPaths = @(
    "C:\Program Files\BlueStacks_nxt\HD-Adb.exe",
    "C:\Program Files\BlueStacks\HD-Adb.exe",
    "C:\Program Files (x86)\BlueStacks_nxt\HD-Adb.exe",
    "C:\Program Files (x86)\BlueStacks\HD-Adb.exe"
)

$adbPath = $null
foreach ($path in $adbPaths) {
    if (Test-Path $path) {
        $adbPath = $path
        break
    }
}

if (-not $adbPath) {
    Write-Host "⚠ BlueStacks ADB not found in standard locations" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Cyan
    Write-Host "1. BlueStacks is not installed" -ForegroundColor White
    Write-Host "2. BlueStacks is installed in custom location" -ForegroundColor White
    Write-Host ""
    Write-Host "Please verify BlueStacks installation or use Android SDK ADB" -ForegroundColor Yellow
    Write-Host ""
    
    # Ask if user wants to use Android SDK ADB
    $useSdk = Read-Host "Do you have Android SDK installed? (Y/N)"
    if ($useSdk -eq "Y" -or $useSdk -eq "y") {
        $sdkPath = Read-Host "Enter Android SDK platform-tools path (e.g., C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools)"
        if (Test-Path "$sdkPath\adb.exe") {
            $adbPath = "$sdkPath\adb.exe"
            Write-Host "✓ Using Android SDK ADB" -ForegroundColor Green
        } else {
            Write-Host "ERROR: adb.exe not found at specified path!" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
} else {
    Write-Host "✓ ADB found: $adbPath" -ForegroundColor Green
}
Write-Host ""

# Connect to BlueStacks
Write-Host "Connecting to BlueStacks via ADB..." -ForegroundColor Yellow
$output = & $adbPath connect localhost:5555 2>&1
Write-Host $output
Start-Sleep -Seconds 2

# Check devices
Write-Host ""
Write-Host "Checking connected devices..." -ForegroundColor Yellow
$devices = & $adbPath devices
Write-Host $devices
Write-Host ""

# Verify connection
if ($devices -match "localhost:5555.*device") {
    Write-Host "✓ Successfully connected to BlueStacks" -ForegroundColor Green
} else {
    Write-Host "⚠ Connection to BlueStacks may have failed" -ForegroundColor Yellow
    Write-Host "Please check BlueStacks settings and enable ADB" -ForegroundColor Cyan
    Write-Host ""
}

# Ask about Chrome DevTools forwarding
Write-Host ""
Write-Host "Do you want to setup Chrome DevTools remote debugging?" -ForegroundColor Cyan
Write-Host "(Required if testing web app in Chrome inside BlueStacks)" -ForegroundColor Gray
$setupChrome = Read-Host "(Y/N)"

if ($setupChrome -eq "Y" -or $setupChrome -eq "y") {
    Write-Host ""
    Write-Host "Setting up Chrome DevTools port forwarding..." -ForegroundColor Yellow
    
    # Kill existing port forwarding
    & $adbPath forward --remove tcp:9222 2>&1 | Out-Null
    
    # Forward port for Chrome DevTools
    $forwardOutput = & $adbPath forward tcp:9222 localabstract:chrome_devtools_remote 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Chrome DevTools port forwarding setup complete" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can verify by opening in your browser:" -ForegroundColor Cyan
        Write-Host "http://localhost:9222" -ForegroundColor White
    } else {
        Write-Host "⚠ Port forwarding setup may have issues" -ForegroundColor Yellow
        Write-Host $forwardOutput
    }
}

# List all port forwards
Write-Host ""
Write-Host "Current port forwards:" -ForegroundColor Yellow
& $adbPath forward --list

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display next steps
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Test Web App in BlueStacks Chrome" -ForegroundColor Yellow
Write-Host "  1. Open Chrome in BlueStacks" -ForegroundColor White
Write-Host "  2. Navigate to GCCS Mobile app URL" -ForegroundColor White
Write-Host "  3. Verify app is accessible" -ForegroundColor White
Write-Host "  4. Run: npm test" -ForegroundColor Green
Write-Host ""

Write-Host "Option 2: Test with Playwright (Recommended for Web Apps)" -ForegroundColor Yellow
Write-Host "  1. Just run: npm test" -ForegroundColor Green
Write-Host "  2. Playwright will open its own browser" -ForegroundColor White
Write-Host "  3. No BlueStacks connection needed" -ForegroundColor White
Write-Host ""

Write-Host "To verify ADB connection:" -ForegroundColor Cyan
Write-Host "  $adbPath devices" -ForegroundColor White
Write-Host ""

Write-Host "To verify Chrome DevTools (if setup):" -ForegroundColor Cyan
Write-Host "  Open: http://localhost:9222 in your browser" -ForegroundColor White
Write-Host ""

Write-Host "For troubleshooting, see: BLUESTACKS_SETUP.md" -ForegroundColor Gray
Write-Host ""
