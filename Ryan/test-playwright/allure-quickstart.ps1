# 🎨 Allure Reporting Quick Start

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ALLURE REPORTING - QUICK START WIZARD             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Allure Framework Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. 🎯 Run Demo Test & View Allure Report (RECOMMENDED)" -ForegroundColor Green
Write-Host "   2. 📝 Run All Tests & Generate Report" -ForegroundColor White
Write-Host "   3. 🔍 Generate Report from Last Run" -ForegroundColor White  
Write-Host "   4. 📖 View Allure Documentation" -ForegroundColor Cyan
Write-Host "   5. 🧹 Clean Old Reports" -ForegroundColor Yellow
Write-Host "   6. Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
        Write-Host "║              RUNNING ALLURE DEMO TEST                      ║" -ForegroundColor Magenta
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "▶️  Running contract-allure-demo.spec.js..." -ForegroundColor Cyan
        Write-Host "   This test demonstrates all Allure features:" -ForegroundColor Gray
        Write-Host "   - Epic/Feature/Story organization" -ForegroundColor Gray
        Write-Host "   - Nested test steps" -ForegroundColor Gray
        Write-Host "   - Screenshots & attachments" -ForegroundColor Gray
        Write-Host "   - Test parameters" -ForegroundColor Gray
        Write-Host ""
        
        npx playwright test contract-allure-demo.spec.js
        
        if ($LASTEXITCODE -eq 0 -or (Test-Path "allure-results")) {
            Write-Host ""
            Write-Host "✅ Tests completed!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Generating & opening Allure report..." -ForegroundColor Cyan
            Write-Host ""
            
            npm run allure:serve
        } else {
            Write-Host ""
            Write-Host "⚠️  No test results found. Tests may have failed to run." -ForegroundColor Yellow
            Write-Host "   Check error messages above." -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host ""
        Write-Host "▶️  Running ALL tests with Allure reporting..." -ForegroundColor Cyan
        Write-Host "   This may take a few minutes..." -ForegroundColor Gray
        Write-Host ""
        
        npm run test:allure:report
    }
    "3" {
        Write-Host ""
        if (Test-Path "allure-results") {
            Write-Host "📊 Generating report from existing results..." -ForegroundColor Cyan
            Write-Host ""
            
            npm run allure:generate
            npm run allure:open
        } else {
            Write-Host "❌ No test results found!" -ForegroundColor Red
            Write-Host "   Please run tests first (Option 1 or 2)" -ForegroundColor Yellow
        }
    }
    "4" {
        Write-Host ""
        Write-Host "📖 Opening Allure documentation..." -ForegroundColor Cyan
        Write-Host ""
        
        if (Test-Path "ALLURE_REPORTING_GUIDE.md") {
            notepad "ALLURE_REPORTING_GUIDE.md"
        } else {
            Write-Host "📚 Documentation files:" -ForegroundColor Yellow
            Write-Host "   - ALLURE_REPORTING_GUIDE.md (Complete guide)" -ForegroundColor White
            Write-Host "   - contract-allure-demo.spec.js (Example test)" -ForegroundColor White
            Write-Host ""
            Write-Host "   Online docs: https://docs.qameta.io/allure/" -ForegroundColor Cyan
        }
    }
    "5" {
        Write-Host ""
        Write-Host "🧹 Cleaning old reports..." -ForegroundColor Yellow
        Write-Host ""
        
        if (Test-Path "allure-results") {
            Remove-Item -Recurse -Force "allure-results"
            Write-Host "✅ Removed allure-results/" -ForegroundColor Green
        }
        
        if (Test-Path "allure-report") {
            Remove-Item -Recurse -Force "allure-report"
            Write-Host "✅ Removed allure-report/" -ForegroundColor Green
        }
        
        if (Test-Path "test-results") {
            Remove-Item -Recurse -Force "test-results"
            Write-Host "✅ Removed test-results/" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "✨ Cleanup complete! Run tests to generate fresh reports." -ForegroundColor Green
    }
    "6" {
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
Write-Host "║                 ALLURE REPORTING TIPS                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "💡 In the Allure report you'll see:" -ForegroundColor Yellow
Write-Host "   - 📊 Overview dashboard with success rate & trends" -ForegroundColor White
Write-Host "   - 🏷️  Tests organized by Epic → Feature → Story" -ForegroundColor White
Write-Host "   - 📝 Step-by-step execution details" -ForegroundColor White
Write-Host "   - 📸 Screenshots embedded in test steps" -ForegroundColor White
Write-Host "   - 📈 Historical trends & flaky test detection" -ForegroundColor White
Write-Host ""
Write-Host "📚 Quick Commands:" -ForegroundColor Yellow
Write-Host "   npm run test:allure           - Run tests" -ForegroundColor Cyan
Write-Host "   npm run allure:serve          - View report" -ForegroundColor Cyan
Write-Host "   npm run test:allure:report    - Run + View (all-in-one)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Read the guide: ALLURE_REPORTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
