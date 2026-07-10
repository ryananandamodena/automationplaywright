# GCCS Mobile Test Execution Script
# Run this script to execute GCCS Mobile tests

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GCCS Mobile E2E Testing Suite       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if Playwright is installed
Write-Host "Checking Playwright installation..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@playwright")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    npx playwright install chromium
    npx playwright install-deps
}
Write-Host "✓ Playwright is ready" -ForegroundColor Green
Write-Host ""

# Create directories if they don't exist
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "bug-reports" | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green
Write-Host ""

# Display menu
Write-Host "Select test execution mode:" -ForegroundColor Cyan
Write-Host "1. Run all tests" -ForegroundColor White
Write-Host "2. Run login tests only" -ForegroundColor White
Write-Host "3. Run dashboard tests only" -ForegroundColor White
Write-Host "4. Run confirmation tests only" -ForegroundColor White
Write-Host "5. Run start visit tests only" -ForegroundColor White
Write-Host "6. Run negative tests only" -ForegroundColor White
Write-Host "7. Run with UI mode (interactive)" -ForegroundColor White
Write-Host "8. Run with debug mode" -ForegroundColor White
Write-Host "9. View last test report" -ForegroundColor White
Write-Host "0. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (0-9)"

switch ($choice) {
    "1" {
        Write-Host "Running all tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js
    }
    "2" {
        Write-Host "Running login tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js -g "Login"
    }
    "3" {
        Write-Host "Running dashboard tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js -g "Dashboard"
    }
    "4" {
        Write-Host "Running confirmation tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js -g "Confirmation"
    }
    "5" {
        Write-Host "Running start visit tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js -g "Visit"
    }
    "6" {
        Write-Host "Running negative tests..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js -g "NEG"
    }
    "7" {
        Write-Host "Launching UI mode..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js --ui
    }
    "8" {
        Write-Host "Launching debug mode..." -ForegroundColor Green
        npx playwright test mobile_gccs.spec.js --config=playwright.config.mobile.js --debug
    }
    "9" {
        Write-Host "Opening test report..." -ForegroundColor Green
        npx playwright show-report mobile-test-report
    }
    "0" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View report: npx playwright show-report mobile-test-report" -ForegroundColor Yellow
Write-Host "Screenshots: ./screenshots/" -ForegroundColor Yellow
Write-Host "Videos: ./test-results/" -ForegroundColor Yellow
Write-Host ""
