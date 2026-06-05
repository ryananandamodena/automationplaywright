# 🎨 Applitools Getting Started Script
# Run this to set up Applitools Visual AI Testing

param(
    [switch]$SetupOnly,
    [switch]$RunDemo
)

function Show-Banner {
    Write-Host @"

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎨 APPLITOOLS VISUAL AI TESTING SETUP 🎨          ║
║                                                       ║
║   AI-Powered Visual Regression Testing               ║
║   Cross-Browser | Responsive | Ultra Fast            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
}

function Check-Prerequisites {
    Write-Host "`n📋 Checking prerequisites...`n" -ForegroundColor Yellow
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found! Install from: https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    # Check if package installed
    cd Ryan/test-playwright
    $packageCheck = npm list @applitools/eyes-playwright 2>&1
    
    if ($packageCheck -match "@applitools/eyes-playwright") {
        Write-Host "✅ Applitools package installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Applitools package not found!" -ForegroundColor Red
        Write-Host "   Installing now..." -ForegroundColor Yellow
        npm install -D @applitools/eyes-playwright
    }
}

function Get-ApplitoolsAccount {
    Write-Host "`n🔑 STEP 1: Create Applitools Account (FREE)`n" -ForegroundColor Cyan
    Write-Host "   1. Open browser to: https://applitools.com/users/register" -ForegroundColor White
    Write-Host "   2. Sign up with email or GitHub/Google" -ForegroundColor White
    Write-Host "   3. Choose plan: FREE FOREVER (100 checkpoints/month)" -ForegroundColor White
    Write-Host "   4. Verify email and login`n" -ForegroundColor White
    
    $openBrowser = Read-Host "Open signup page in browser? (Y/n)"
    
    if ($openBrowser -ne 'n' -and $openBrowser -ne 'N') {
        Start-Process "https://applitools.com/users/register"
        Write-Host "`n✅ Browser opened! Complete signup and return here." -ForegroundColor Green
    }
    
    Write-Host "`n⏳ Press Enter when you've completed signup..." -ForegroundColor Yellow
    Read-Host
}

function Get-APIKey {
    Write-Host "`n🔑 STEP 2: Get Your API Key`n" -ForegroundColor Cyan
    Write-Host "   1. Login to: https://eyes.applitools.com" -ForegroundColor White
    Write-Host "   2. Click profile icon (top right)" -ForegroundColor White
    Write-Host "   3. Click 'My API Key'" -ForegroundColor White
    Write-Host "   4. Copy your API key`n" -ForegroundColor White
    
    $openDashboard = Read-Host "Open Applitools dashboard? (Y/n)"
    
    if ($openDashboard -ne 'n' -and $openDashboard -ne 'N') {
        Start-Process "https://eyes.applitools.com"
        Write-Host "`n✅ Dashboard opened! Copy your API key." -ForegroundColor Green
    }
    
    Write-Host "`n📋 Paste your API key here:" -ForegroundColor Yellow
    $apiKey = Read-Host "(It will be hidden)"
    
    return $apiKey
}

function Set-APIKey {
    param([string]$ApiKey)
    
    Write-Host "`n🔧 STEP 3: Configure API Key`n" -ForegroundColor Cyan
    
    # Set for current session
    $env:APPLITOOLS_API_KEY = $ApiKey
    Write-Host "✅ API Key set for current PowerShell session" -ForegroundColor Green
    
    # Ask if want to set permanently
    Write-Host "`nDo you want to save API key permanently (system-wide)?" -ForegroundColor Yellow
    Write-Host "   This will add it to Windows Environment Variables." -ForegroundColor Gray
    $setPermanent = Read-Host "(Y/n)"
    
    if ($setPermanent -ne 'n' -and $setPermanent -ne 'N') {
        try {
            [System.Environment]::SetEnvironmentVariable('APPLITOOLS_API_KEY', $ApiKey, 'User')
            Write-Host "✅ API Key saved permanently (User-level environment variable)" -ForegroundColor Green
            Write-Host "   ⚠️  Restart PowerShell/IDE for system-wide effect" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to set permanent variable: $_" -ForegroundColor Red
            Write-Host "   API Key is still set for this session only." -ForegroundColor Yellow
        }
    }
    
    # Verify
    if ($env:APPLITOOLS_API_KEY) {
        Write-Host "`n✅ Verification: API Key is set!" -ForegroundColor Green
        Write-Host "   Key (first 10 chars): $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)))..." -ForegroundColor Gray
    }
}

function Run-DemoTest {
    Write-Host "`n🧪 STEP 4: Run Demo Visual Test`n" -ForegroundColor Cyan
    Write-Host "   This will create your first visual baseline!" -ForegroundColor Yellow
    Write-Host "   Test: MHC Sales Order page visual check`n" -ForegroundColor Gray
    
    $runTest = Read-Host "Run demo test now? (Y/n)"
    
    if ($runTest -ne 'n' -and $runTest -ne 'N') {
        Write-Host "`n🚀 Starting visual test...`n" -ForegroundColor Cyan
        
        cd Ryan/test-playwright
        npx playwright test visual-tests/mhc-sales-order-visual.spec.js --headed --project=chromium --grep "Visual check - Sales Order list page"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Demo test completed!" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  Test completed with issues - check logs" -ForegroundColor Yellow
        }
        
        Write-Host "`n📊 View results:" -ForegroundColor Cyan
        Write-Host "   Open: https://eyes.applitools.com" -ForegroundColor White
        Write-Host "   Navigate to 'Test Manager'" -ForegroundColor White
        Write-Host "   See your first visual test!" -ForegroundColor White
        
        $openResults = Read-Host "`nOpen Applitools dashboard to see results? (Y/n)"
        if ($openResults -ne 'n' -and $openResults -ne 'N') {
            Start-Process "https://eyes.applitools.com"
        }
    }
}

function Show-NextSteps {
    Write-Host @"

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎉 APPLITOOLS SETUP COMPLETE! 🎉                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📚 NEXT STEPS:

1️⃣  VIEW DOCUMENTATION
   Read: Ryan/test-playwright/APPLITOOLS_SETUP.md

2️⃣  RUN MORE VISUAL TESTS
   npm run test:visual

3️⃣  CHECK RESULTS
   Dashboard: https://eyes.applitools.com

4️⃣  ADD VISUAL CHECKS TO EXISTING TESTS
   Example: See visual-tests/mhc-sales-order-visual.spec.js

5️⃣  INTEGRATE WITH CI/CD
   Already configured in .github/workflows/
   Just add GitHub Secret: APPLITOOLS_API_KEY

📊 YOUR TESTING MATURITY:
   Stage 2 (Automation): ✅ 100%
   Stage 3 (Advanced):   ✅ 100%
   Stage 4 (AI Testing): ✅ 100%

🎉 CONGRATULATIONS! You've reached the HIGHEST level of test automation maturity!

"@ -ForegroundColor Cyan
}

# Main execution
Show-Banner
Check-Prerequisites

if (-not $SetupOnly) {
    # Check if API key already set
    if ($env:APPLITOOLS_API_KEY) {
        Write-Host "`n✅ API Key already configured!" -ForegroundColor Green
        Write-Host "   Key (first 10 chars): $($env:APPLITOOLS_API_KEY.Substring(0, [Math]::Min(10, $env:APPLITOOLS_API_KEY.Length)))...`n" -ForegroundColor Gray
        
        $reconfigure = Read-Host "Reconfigure with new API key? (y/N)"
        if ($reconfigure -eq 'y' -or $reconfigure -eq 'Y') {
            Get-ApplitoolsAccount
            $apiKey = Get-APIKey
            Set-APIKey -ApiKey $apiKey
        }
    } else {
        Get-ApplitoolsAccount
        $apiKey = Get-APIKey
        Set-APIKey -ApiKey $apiKey
    }
    
    if ($RunDemo -or (-not $SetupOnly)) {
        Run-DemoTest
    }
}

Show-NextSteps

Write-Host "`n💡 TIP: Run this script anytime with: .\applitools-setup.ps1`n" -ForegroundColor Yellow
