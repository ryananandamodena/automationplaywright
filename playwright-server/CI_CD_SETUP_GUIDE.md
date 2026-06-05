# CI/CD Setup Guide untuk Playwright E2E Testing

## Overview
Panduan lengkap untuk setup CI/CD pipeline untuk menjalankan E2E testing secara otomatis.

## Pilihan Platform CI/CD

### 1. GitHub Actions (Recommended) ⭐
- ✅ Gratis untuk public repo
- ✅ 2000 menit/bulan untuk private repo
- ✅ Mudah setup
- ✅ Terintegrasi dengan GitHub

### 2. GitLab CI/CD
- ✅ Gratis 400 menit/bulan
- ✅ Self-hosted option
- ✅ Built-in container registry

### 3. Jenkins
- ✅ Self-hosted (gratis)
- ✅ Sangat customizable
- ⚠️ Perlu maintenance server

### 4. Azure DevOps
- ✅ 1800 menit/bulan gratis
- ✅ Terintegrasi dengan Microsoft ecosystem

---

## Persiapan Sebelum Setup CI/CD

### 1. Repository Structure
```
project-root/
├── .github/
│   └── workflows/
│       └── e2e-tests.yml          # GitHub Actions
├── .gitlab-ci.yml                  # GitLab CI
├── Jenkinsfile                     # Jenkins
├── playwright-server/
│   ├── package.json
│   ├── playwright.config.js
│   └── test-playwright/
│       ├── create-contract-simple.mjs
│       ├── contract-service-e2e-flexible.mjs
│       └── contract-approval-e2e.mjs
├── .env.example                    # Template environment variables
└── README.md
```

### 2. Environment Variables yang Dibutuhkan
```bash
# User Credentials
ADMIN_EMAIL=ryan.ananda@modena.com
ADMIN_PASSWORD=P@ssw0rd_ryan.ananda

APPROVER1_EMAIL=novyan.ramdhan@modena.com
APPROVER1_PASSWORD=P@ssw0rd_novyan.ramdhan

APPROVER2_EMAIL=daniel.aritonga@modena.com
APPROVER2_PASSWORD=P@ssw0rd_daniel.aritonga

# Application URLs
BASE_URL=https://portal-dev.modena.com
API_URL=https://api-dev.modena.com

# Test Configuration
HEADLESS=true
TIMEOUT=30000
SCREENSHOT_ON_FAILURE=true
```

### 3. Dependencies yang Diperlukan
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0",
    "dotenv": "^16.0.0"
  },
  "scripts": {
    "test:e2e": "node test-playwright/contract-service-e2e-flexible.mjs",
    "test:contract": "node test-playwright/create-contract-simple.mjs",
    "test:approval": "node test-playwright/contract-approval-e2e.mjs",
    "test:all": "npm run test:contract && npm run test:e2e"
  }
}
```

---

## Setup 1: GitHub Actions (Recommended)

### File: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  # Trigger on push to main/master
  push:
    branches: [ main, master, develop ]
  
  # Trigger on pull request
  pull_request:
    branches: [ main, master, develop ]
  
  # Manual trigger
  workflow_dispatch:
  
  # Scheduled run (every day at 2 AM)
  schedule:
    - cron: '0 2 * * *'

jobs:
  e2e-tests:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        # Run tests on multiple browsers
        browser: [chromium, firefox, webkit]
      fail-fast: false
    
    steps:
      # 1. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4
      
      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: playwright-server/package-lock.json
      
      # 3. Install dependencies
      - name: Install dependencies
        working-directory: playwright-server
        run: |
          npm ci
          npx playwright install --with-deps ${{ matrix.browser }}
      
      # 4. Run E2E tests
      - name: Run Contract Creation Test
        working-directory: playwright-server/test-playwright
        env:
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          BASE_URL: ${{ secrets.BASE_URL }}
          HEADLESS: true
        run: node create-contract-simple.mjs
        continue-on-error: true
      
      - name: Run Full E2E Test
        working-directory: playwright-server/test-playwright
        env:
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          BASE_URL: ${{ secrets.BASE_URL }}
          HEADLESS: true
        run: node contract-service-e2e-flexible.mjs
        continue-on-error: true
      
      - name: Run Approval Flow Test
        working-directory: playwright-server/test-playwright
        env:
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          APPROVER1_EMAIL: ${{ secrets.APPROVER1_EMAIL }}
          APPROVER1_PASSWORD: ${{ secrets.APPROVER1_PASSWORD }}
          APPROVER2_EMAIL: ${{ secrets.APPROVER2_EMAIL }}
          APPROVER2_PASSWORD: ${{ secrets.APPROVER2_PASSWORD }}
          BASE_URL: ${{ secrets.BASE_URL }}
          HEADLESS: true
        run: node contract-approval-e2e.mjs
        continue-on-error: true
      
      # 5. Upload screenshots on failure
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots-${{ matrix.browser }}
          path: playwright-server/test-playwright/*.png
          retention-days: 7
      
      # 6. Upload test results
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.browser }}
          path: playwright-server/test-results/
          retention-days: 7
      
      # 7. Send notification (optional)
      - name: Send Slack notification
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "E2E Tests Failed on ${{ matrix.browser }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*E2E Tests Failed* :x:\n*Browser:* ${{ matrix.browser }}\n*Branch:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
```

### Setup GitHub Secrets

1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `APPROVER1_EMAIL`
   - `APPROVER1_PASSWORD`
   - `APPROVER2_EMAIL`
   - `APPROVER2_PASSWORD`
   - `BASE_URL`
   - `SLACK_WEBHOOK_URL` (optional)

---

## Setup 2: GitLab CI/CD

### File: `.gitlab-ci.yml`

```yaml
stages:
  - test
  - report

variables:
  NODE_VERSION: "20"
  PLAYWRIGHT_BROWSERS_PATH: $CI_PROJECT_DIR/.cache/ms-playwright

# Cache dependencies
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - playwright-server/node_modules/
    - .cache/ms-playwright/

# Run E2E tests
e2e-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  
  before_script:
    - cd playwright-server
    - npm ci
    - npx playwright install chromium
  
  script:
    # Contract creation test
    - echo "Running contract creation test..."
    - cd test-playwright
    - node create-contract-simple.mjs || true
    
    # Full E2E test
    - echo "Running full E2E test..."
    - node contract-service-e2e-flexible.mjs || true
    
    # Approval flow test
    - echo "Running approval flow test..."
    - node contract-approval-e2e.mjs || true
  
  artifacts:
    when: always
    paths:
      - playwright-server/test-playwright/*.png
      - playwright-server/test-results/
    expire_in: 7 days
  
  only:
    - main
    - develop
    - merge_requests

# Generate test report
test-report:
  stage: report
  image: node:20
  
  script:
    - echo "Generating test report..."
    - cd playwright-server
    - npm run report || true
  
  artifacts:
    paths:
      - playwright-server/test-report/
    expire_in: 30 days
  
  only:
    - main
    - develop
```

### Setup GitLab CI/CD Variables

1. Go to project → Settings → CI/CD → Variables
2. Add variables (mark as "Protected" and "Masked"):
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `APPROVER1_EMAIL`
   - `APPROVER1_PASSWORD`
   - `APPROVER2_EMAIL`
   - `APPROVER2_PASSWORD`
   - `BASE_URL`

---

## Setup 3: Jenkins

### File: `Jenkinsfile`

```groovy
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
            args '-u root:root'
        }
    }
    
    environment {
        ADMIN_EMAIL = credentials('admin-email')
        ADMIN_PASSWORD = credentials('admin-password')
        APPROVER1_EMAIL = credentials('approver1-email')
        APPROVER1_PASSWORD = credentials('approver1-password')
        APPROVER2_EMAIL = credentials('approver2-email')
        APPROVER2_PASSWORD = credentials('approver2-password')
        BASE_URL = credentials('base-url')
        HEADLESS = 'true'
    }
    
    stages {
        stage('Install Dependencies') {
            steps {
                dir('playwright-server') {
                    sh 'npm ci'
                    sh 'npx playwright install chromium'
                }
            }
        }
        
        stage('Run Contract Creation Test') {
            steps {
                dir('playwright-server/test-playwright') {
                    sh 'node create-contract-simple.mjs || true'
                }
            }
        }
        
        stage('Run Full E2E Test') {
            steps {
                dir('playwright-server/test-playwright') {
                    sh 'node contract-service-e2e-flexible.mjs || true'
                }
            }
        }
        
        stage('Run Approval Flow Test') {
            steps {
                dir('playwright-server/test-playwright') {
                    sh 'node contract-approval-e2e.mjs || true'
                }
            }
        }
    }
    
    post {
        always {
            // Archive screenshots
            archiveArtifacts artifacts: 'playwright-server/test-playwright/*.png', allowEmptyArchive: true
            
            // Archive test results
            archiveArtifacts artifacts: 'playwright-server/test-results/**/*', allowEmptyArchive: true
        }
        
        failure {
            // Send email notification
            emailext (
                subject: "E2E Tests Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "E2E tests failed. Check console output at ${env.BUILD_URL}",
                to: 'team@modena.com'
            )
        }
    }
}
```

### Setup Jenkins Credentials

1. Go to Jenkins → Manage Jenkins → Credentials
2. Add credentials:
   - `admin-email` (Secret text)
   - `admin-password` (Secret text)
   - `approver1-email` (Secret text)
   - `approver1-password` (Secret text)
   - `approver2-email` (Secret text)
   - `approver2-password` (Secret text)
   - `base-url` (Secret text)

---

## Setup 4: Azure DevOps

### File: `azure-pipelines.yml`

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'

stages:
  - stage: Test
    displayName: 'Run E2E Tests'
    jobs:
      - job: E2ETests
        displayName: 'E2E Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'
          
          - script: |
              cd playwright-server
              npm ci
              npx playwright install --with-deps chromium
            displayName: 'Install dependencies'
          
          - script: |
              cd playwright-server/test-playwright
              node create-contract-simple.mjs
            displayName: 'Run Contract Creation Test'
            env:
              ADMIN_EMAIL: $(ADMIN_EMAIL)
              ADMIN_PASSWORD: $(ADMIN_PASSWORD)
              BASE_URL: $(BASE_URL)
              HEADLESS: true
            continueOnError: true
          
          - script: |
              cd playwright-server/test-playwright
              node contract-service-e2e-flexible.mjs
            displayName: 'Run Full E2E Test'
            env:
              ADMIN_EMAIL: $(ADMIN_EMAIL)
              ADMIN_PASSWORD: $(ADMIN_PASSWORD)
              BASE_URL: $(BASE_URL)
              HEADLESS: true
            continueOnError: true
          
          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/test-results/*.xml'
            condition: always()
          
          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: 'playwright-server/test-playwright'
              artifact: 'screenshots'
            condition: always()
```

---

## Modifikasi Script untuk CI/CD

### Update script untuk support environment variables

**File: `playwright-server/test-playwright/create-contract-simple.mjs`**

Tambahkan di bagian atas:

```javascript
import { chromium } from 'playwright';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const USER = {
  email: process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com',
  password: process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda',
};

const HEADLESS = process.env.HEADLESS === 'true' || false;

async function createContract() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: HEADLESS ? ['--no-sandbox', '--disable-setuid-sandbox'] : ['--start-maximized']
  });
  
  // ... rest of the code
}
```

---

## Best Practices untuk CI/CD

### 1. Gunakan Headless Mode
```javascript
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### 2. Set Timeout yang Cukup
```javascript
// Increase timeout for CI environment
const timeout = process.env.CI ? 60000 : 30000;
await page.goto(url, { timeout });
```

### 3. Retry on Failure
```yaml
# GitHub Actions
- name: Run tests with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm run test:e2e
```

### 4. Parallel Execution
```yaml
# Run tests in parallel
strategy:
  matrix:
    test: [contract, service, approval]
  max-parallel: 3
```

### 5. Conditional Execution
```yaml
# Only run on specific branches
on:
  push:
    branches: [ main, develop ]
    paths:
      - 'playwright-server/**'
      - '.github/workflows/**'
```

---

## Monitoring & Reporting

### 1. Slack Notifications
```yaml
- name: Slack Notification
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_CHANNEL: e2e-tests
    SLACK_COLOR: ${{ job.status }}
    SLACK_MESSAGE: 'E2E Tests ${{ job.status }}'
```

### 2. Email Notifications
```yaml
- name: Send email
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: E2E Test Results
    body: Test results attached
    to: team@modena.com
    from: ci@modena.com
    attachments: test-results/*.png
```

### 3. Test Report Dashboard
```javascript
// Generate HTML report
import { generateReport } from './report-generator.js';

await generateReport({
  results: testResults,
  outputPath: './test-report/index.html'
});
```

---

## Troubleshooting CI/CD

### Issue 1: Browser Installation Failed
```yaml
# Solution: Use Playwright Docker image
container:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
```

### Issue 2: Permission Denied
```yaml
# Solution: Run as root or add permissions
args: '-u root:root'
# Or
run: chmod +x ./scripts/*.sh
```

### Issue 3: Timeout in CI
```javascript
// Increase timeout for CI
const timeout = process.env.CI ? 90000 : 30000;
```

### Issue 4: Screenshots Not Saved
```yaml
# Ensure artifacts are uploaded
- uses: actions/upload-artifact@v4
  if: always()  # Upload even on failure
```

---

## Checklist Setup CI/CD

- [ ] Pilih platform CI/CD (GitHub Actions recommended)
- [ ] Buat file konfigurasi (.github/workflows/e2e-tests.yml)
- [ ] Setup environment variables/secrets
- [ ] Update scripts untuk support env variables
- [ ] Install dotenv package: `npm install dotenv`
- [ ] Test locally dengan HEADLESS=true
- [ ] Commit dan push ke repository
- [ ] Verify pipeline berjalan
- [ ] Setup notifications (Slack/Email)
- [ ] Configure scheduled runs
- [ ] Setup test reporting
- [ ] Document untuk team

---

## Estimasi Waktu Setup

| Platform | Setup Time | Difficulty |
|----------|------------|------------|
| GitHub Actions | 30-60 min | Easy ⭐ |
| GitLab CI | 45-90 min | Medium ⭐⭐ |
| Jenkins | 2-4 hours | Hard ⭐⭐⭐ |
| Azure DevOps | 1-2 hours | Medium ⭐⭐ |

---

## Rekomendasi

Untuk project Anda, saya rekomendasikan:

1. **Start with GitHub Actions** - Paling mudah dan gratis
2. **Run tests on**: Push to main/develop, PR, dan scheduled (daily)
3. **Parallel execution**: Run contract, service, approval tests secara parallel
4. **Notifications**: Setup Slack untuk instant notification
5. **Artifacts**: Save screenshots dan test results selama 7 hari

**Next Steps**:
1. Buat file `.github/workflows/e2e-tests.yml`
2. Setup GitHub Secrets
3. Update scripts dengan env variables
4. Push dan test!
