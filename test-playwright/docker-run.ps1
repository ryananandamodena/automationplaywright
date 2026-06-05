# 🐳 Docker Test Runner for Windows
# Quick commands for running Playwright tests in Docker

param(
    [Parameter(Position=0)]
    [ValidateSet('build', 'test', 'allure', 'shell', 'clean', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position=1)]
    [string]$TestFile = '',
    
    [switch]$NoBuild,
    [switch]$NoCache
)

function Show-Help {
    Write-Host @"

🐳 DOCKER TEST RUNNER - COMMANDS
================================

BASIC COMMANDS:
  .\docker-run.ps1 build          Build Docker image
  .\docker-run.ps1 test           Run all tests in Docker
  .\docker-run.ps1 allure         Run tests + start Allure server
  .\docker-run.ps1 shell          Open interactive shell in container
  .\docker-run.ps1 clean          Clean up containers and volumes

SPECIFIC TESTS:
  .\docker-run.ps1 test contract-allure-demo.spec.js
  .\docker-run.ps1 test more1/so/create-so-pom.spec.js
  .\docker-run.ps1 test more1/po

OPTIONS:
  -NoBuild       Skip building image (use existing)
  -NoCache       Force rebuild without cache

EXAMPLES:
  # Build and run all tests
  .\docker-run.ps1 test

  # Run specific test without rebuilding
  .\docker-run.ps1 test contract-allure-demo.spec.js -NoBuild

  # Force clean build
  .\docker-run.ps1 build -NoCache

  # Run tests and view Allure report
  .\docker-run.ps1 allure

  # Debug in container
  .\docker-run.ps1 shell

"@
}

function Build-DockerImage {
    Write-Host "`n🔨 Building Docker image..." -ForegroundColor Cyan
    
    if ($NoCache) {
        Write-Host "   (Forcing clean build, no cache)" -ForegroundColor Yellow
        docker-compose build --no-cache
    } else {
        docker-compose build
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Docker image built successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Docker build failed!" -ForegroundColor Red
        exit 1
    }
}

function Run-Tests {
    if (-not $NoBuild) {
        Build-DockerImage
    }
    
    Write-Host "`n🧪 Running Playwright tests in Docker..." -ForegroundColor Cyan
    
    if ($TestFile) {
        Write-Host "   Test: $TestFile" -ForegroundColor Yellow
        docker-compose run --rm playwright-tests npx playwright test $TestFile
    } else {
        Write-Host "   Running all tests" -ForegroundColor Yellow
        docker-compose run --rm playwright-tests
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Tests completed with failures" -ForegroundColor Yellow
    }
    
    Write-Host "`n📊 Test results available in:" -ForegroundColor Cyan
    Write-Host "   - test-results/" -ForegroundColor White
    Write-Host "   - allure-results/" -ForegroundColor White
    Write-Host "`n💡 View Allure report: .\docker-run.ps1 allure" -ForegroundColor Cyan
}

function Start-AllureServer {
    if (-not $NoBuild) {
        Build-DockerImage
    }
    
    Write-Host "`n📊 Starting Allure report server..." -ForegroundColor Cyan
    Write-Host "`n   1. Running tests..." -ForegroundColor Yellow
    docker-compose run --rm playwright-tests
    
    Write-Host "`n   2. Starting Allure server..." -ForegroundColor Yellow
    Write-Host "`n🌐 Allure Report will be available at: http://localhost:5050" -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop the server`n" -ForegroundColor Yellow
    
    docker-compose up allure-server
}

function Open-Shell {
    if (-not $NoBuild) {
        Build-DockerImage
    }
    
    Write-Host "`n🐚 Opening interactive shell in container..." -ForegroundColor Cyan
    Write-Host "   Type 'exit' to leave the container`n" -ForegroundColor Yellow
    
    docker-compose run --rm playwright-tests bash
}

function Clean-Docker {
    Write-Host "`n🧹 Cleaning up Docker resources..." -ForegroundColor Cyan
    
    Write-Host "   Stopping containers..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host "   Removing volumes..." -ForegroundColor Yellow
    docker-compose down -v
    
    $removeImage = Read-Host "`nRemove Docker image? (y/N)"
    if ($removeImage -eq 'y' -or $removeImage -eq 'Y') {
        Write-Host "   Removing image..." -ForegroundColor Yellow
        docker-compose down --rmi local
    }
    
    Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
}

# Main execution
switch ($Command) {
    'build'  { Build-DockerImage }
    'test'   { Run-Tests }
    'allure' { Start-AllureServer }
    'shell'  { Open-Shell }
    'clean'  { Clean-Docker }
    'help'   { Show-Help }
    default  { Show-Help }
}
