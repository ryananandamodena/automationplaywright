# 🤖 Applitools Setup Helper Script
# Run this after getting your API key from Applitools dashboard

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     APPLITOOLS VISUAL AI TESTING - SETUP WIZARD           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if API key is already set
if ($env:APPLITOOLS_API_KEY) {
    Write-Host "✅ API Key already set: $($env:APPLITOOLS_API_KEY.Substring(0, 10))..." -ForegroundColor Green
    Write-Host ""
    $continue = Read-Host "Want to update it? (y/n)"
    if ($continue -ne 'y') {
        Write-Host ""
        Write-Host "Skipping API key setup..." -ForegroundColor Yellow
        $apiKey = $env:APPLITOOLS_API_KEY
    }
}

if (-not $apiKey) {
    Write-Host "📋 STEP 1: Get your API key" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Login to Applitools dashboard:" -ForegroundColor White
    Write-Host "      https://eyes.applitools.com/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   2. Click your profile icon (top right)" -ForegroundColor White
    Write-Host "   3. Select 'My API Key'" -ForegroundColor White
    Write-Host "   4. Copy the API key" -ForegroundColor White
    Write-Host ""
    
    $apiKey = Read-Host "Paste your API key here"
    
    if (-not $apiKey) {
        Write-Host ""
        Write-Host "❌ No API key provided. Exiting..." -ForegroundColor Red
        exit 1
    }
    
    # Set environment variable
    $env:APPLITOOLS_API_KEY = $apiKey
    Write-Host ""
    Write-Host "✅ API key set successfully!" -ForegroundColor Green
}

# Option to save to .env file
Write-Host ""
Write-Host "💾 Do you want to save API key to .env file? (Recommended)" -ForegroundColor Yellow
Write-Host "   This allows you to skip this step next time." -ForegroundColor Gray
$saveToEnv = Read-Host "Save to .env? (y/n)"

if ($saveToEnv -eq 'y') {
    $envContent = "APPLITOOLS_API_KEY=$apiKey"
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Saved to .env file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ℹ️  Add .env to .gitignore to keep API key secure!" -ForegroundColor Cyan
    
    # Check if .gitignore exists and add .env if not present
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -notmatch "\.env") {
            Add-Content -Path ".gitignore" -Value "`n.env"
            Write-Host "✅ Added .env to .gitignore" -ForegroundColor Green
        }
    } else {
        Set-Content -Path ".gitignore" -Value ".env"
        Write-Host "✅ Created .gitignore with .env" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     SETUP COMPLETE! READY TO RUN TESTS                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Choose a test to run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Homepage Hero Section (quickest)" -ForegroundColor White
Write-Host "   2. Product Pages" -ForegroundColor White
Write-Host "   3. Responsive Design (Desktop/Tablet/Mobile)" -ForegroundColor White
Write-Host "   4. OLD vs NEW Site Comparison" -ForegroundColor White
Write-Host "   5. Run ALL tests" -ForegroundColor White
Write-Host "   6. Exit (I'll run tests manually)" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "▶️  Running Homepage Hero Section test..." -ForegroundColor Cyan
        Write-Host ""
        npm run test:visual:hero
    }
    "2" {
        Write-Host ""
        Write-Host "▶️  Running Product Pages test..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright test prive/prive-visual-ai.spec.js -g "Product Pages" --headed
    }
    "3" {
        Write-Host ""
        Write-Host "▶️  Running Responsive Design test..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright test prive/prive-visual-ai.spec.js -g "Responsive" --headed
    }
    "4" {
        Write-Host ""
        Write-Host "▶️  Running OLD vs NEW comparison test..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright test prive/prive-visual-ai.spec.js -g "OLD vs NEW" --headed
    }
    "5" {
        Write-Host ""
        Write-Host "▶️  Running ALL visual tests..." -ForegroundColor Cyan
        Write-Host ""
        npm run test:visual:headed
    }
    "6" {
        Write-Host ""
        Write-Host "👍 Great! Run tests anytime with:" -ForegroundColor Green
        Write-Host ""
        Write-Host "   npm run test:visual:headed" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Or see all options in package.json scripts section." -ForegroundColor Gray
        Write-Host ""
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Run script again to try." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     VIEW RESULTS IN APPLITOOLS DASHBOARD                   ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "🌐 Dashboard: https://eyes.applitools.com/app/batches/" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 First run creates BASELINE images" -ForegroundColor Yellow
Write-Host "   You need to ACCEPT them in the dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 Second run COMPARES vs baseline" -ForegroundColor Yellow
Write-Host "   AI will highlight any visual differences" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Done! Happy Visual Testing! 🎉" -ForegroundColor Green
Write-Host ""
