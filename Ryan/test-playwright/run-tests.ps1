# 🧪 Quick Test Commands

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          PLAYWRIGHT TEST RUNNER - QUICK MENU               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 What do you want to test?" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. 🆕 Contract Creation (NEW POM version) - RECOMMENDED" -ForegroundColor Green
Write-Host "   2. 📝 Contract Creation (OLD version - fixed)" -ForegroundColor White
Write-Host "   3. 🛒 Purchase Order Creation (fixed)" -ForegroundColor White
Write-Host "   4. 📦 Sales Order Creation" -ForegroundColor White
Write-Host "   5. ⚡ ALL tests (parallel execution demo)" -ForegroundColor White
Write-Host "   6. 📊 View HTML Report" -ForegroundColor Cyan
Write-Host "   7. 🔍 Debug Mode (step-through)" -ForegroundColor Magenta
Write-Host "   8. Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-8)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "▶️  Running Contract Creation (POM version)..." -ForegroundColor Green
        Write-Host "   This shows the new Page Object Model pattern!" -ForegroundColor Gray
        Write-Host ""
        npx playwright test create-contract-pom.spec.js --headed
    }
    "2" {
        Write-Host ""
        Write-Host "▶️  Running Contract Creation (OLD version - fixed selectors)..." -ForegroundColor Cyan
        Write-Host ""
        node create-contract-simple.mjs
    }
    "3" {
        Write-Host ""
        Write-Host "▶️  Running Purchase Order Creation (fixed)..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright test more1/po/create-po-simple.spec.js --headed
    }
    "4" {
        Write-Host ""
        Write-Host "▶️  Running Sales Order Creation..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright test more1/so/create-so-simple.spec.js --headed
    }
    "5" {
        Write-Host ""
        Write-Host "▶️  Running ALL tests with parallel execution..." -ForegroundColor Green
        Write-Host "   Watch: 2 browser windows will open simultaneously!" -ForegroundColor Gray
        Write-Host ""
        npx playwright test --headed
    }
    "6" {
        Write-Host ""
        Write-Host "📊 Opening HTML Report..." -ForegroundColor Cyan
        Write-Host ""
        npx playwright show-report
    }
    "7" {
        Write-Host ""
        Write-Host "🔍 Starting Debug Mode..." -ForegroundColor Magenta
        Write-Host "   You can step through test execution line by line" -ForegroundColor Gray
        Write-Host ""
        npx playwright test create-contract-pom.spec.js --debug
    }
    "8" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Green
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
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    TEST COMPLETED                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Want to learn more?" -ForegroundColor Yellow
Write-Host "   - Read: pages/README.md (Page Object Model guide)" -ForegroundColor White
Write-Host "   - Read: PRIORITY_1_IMPROVEMENTS.md (What was fixed)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   - Refactor more tests to use Page Object Model" -ForegroundColor White
Write-Host "   - Setup Allure reporting for better test reports" -ForegroundColor White
Write-Host ""
