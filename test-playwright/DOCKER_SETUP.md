# 🐳 Docker Setup for Playwright Tests

## Overview

This Docker setup provides a **consistent, isolated test environment** for running Playwright tests across different machines and CI/CD platforms.

## Benefits

✅ **Consistent Environment** - Same dependencies, browsers, and OS everywhere  
✅ **No "Works on My Machine"** - Identical setup for dev, CI, and production  
✅ **Easy Onboarding** - New team members just run `docker-compose up`  
✅ **CI/CD Ready** - Optimized for GitHub Actions, GitLab CI, Jenkins, etc.  
✅ **Isolated Testing** - Tests don't interfere with host system  
✅ **Cached Layers** - Fast rebuilds with Docker layer caching  

---

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+

### Install Docker

**Windows/Mac:**
```powershell
# Download from: https://www.docker.com/products/docker-desktop
# Install and start Docker Desktop
```

**Linux:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## Quick Start

### 1️⃣ Build Docker Image

```powershell
# Build the image
docker-compose build

# Verify image created
docker images | grep playwright
```

### 2️⃣ Run All Tests

```powershell
# Run tests in container
docker-compose run --rm playwright-tests

# Run with specific command
docker-compose run --rm playwright-tests npx playwright test more1/so
```

### 3️⃣ Run Tests with Allure Report Server

```powershell
# Start tests + Allure server
docker-compose up

# Access Allure report at: http://localhost:5050
```

### 4️⃣ Clean Up

```powershell
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker rmi mhc-playwright-tests
```

---

## Docker Commands Reference

### Build

```powershell
# Build image
docker-compose build

# Build without cache (force fresh build)
docker-compose build --no-cache

# Build specific service
docker-compose build playwright-tests
```

### Run Tests

```powershell
# Run all tests
docker-compose run --rm playwright-tests

# Run specific test file
docker-compose run --rm playwright-tests npx playwright test contract-allure-demo.spec.js

# Run with headed mode (requires X11 on Linux)
docker-compose run --rm -e HEADED=true playwright-tests npx playwright test --headed

# Run specific project
docker-compose run --rm playwright-tests npx playwright test --project=chromium
```

### Interactive Shell

```powershell
# Open bash shell in container
docker-compose run --rm playwright-tests bash

# Inside container, you can:
npx playwright test
npx allure serve allure-results
ls -la test-results/
```

### View Results

```powershell
# Test results are mounted to host
ls test-results/
ls allure-results/

# Generate Allure report locally
docker-compose run --rm playwright-tests npx allure generate allure-results -o allure-report

# Or use Allure server
docker-compose up allure-server
# Access: http://localhost:5050
```

---

## Configuration

### Environment Variables

Set in `docker-compose.yml` or pass via command:

```powershell
# Override BASE_URL
docker-compose run --rm -e BASE_URL_MHC=https://mhc-staging.modena.com playwright-tests

# Set custom timeout
docker-compose run --rm -e DEFAULT_TIMEOUT=60000 playwright-tests
```

### Volume Mounts

Results are automatically synced to host:

```yaml
volumes:
  - ./test-results:/app/test-results
  - ./allure-results:/app/allure-results
  - ./screenshots:/app/screenshots
```

Access them on your host machine in the project folder.

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/playwright.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker-compose build
      
      - name: Run Playwright tests
        run: docker-compose run --rm playwright-tests
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker-compose build
    - docker-compose run --rm playwright-tests
  artifacts:
    paths:
      - test-results/
      - allure-results/
```

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```powershell
# Windows: Start Docker Desktop
# Linux: Start Docker service
sudo systemctl start docker
```

### Issue: "Permission denied"

**Solution:**
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Issue: "Port already in use"

**Solution:**
```powershell
# Change port in docker-compose.yml
ports:
  - "5051:5050"  # Use 5051 instead of 5050
```

### Issue: "Tests fail in Docker but pass locally"

**Solution:**
```powershell
# Check environment differences
docker-compose run --rm playwright-tests env

# Run interactively to debug
docker-compose run --rm playwright-tests bash
npx playwright test --debug
```

---

## Performance Tips

### 1️⃣ Use Build Cache

```powershell
# Docker caches layers - only changed layers rebuild
# To maximize cache hits:
# 1. Copy package.json first (changes rarely)
# 2. Run npm install (cached if package.json unchanged)
# 3. Copy source code (changes frequently)
```

### 2️⃣ Multi-Stage Builds (Advanced)

For smaller production images:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npx", "playwright", "test"]
```

### 3️⃣ Parallel Execution

```powershell
# Run tests in parallel (Docker handles resource limits)
docker-compose run --rm playwright-tests npx playwright test --workers=4
```

---

## Next Steps

✅ **Stage 3 Completion:** Docker containerization ✓  
⏭️ **Next Priority:** CI/CD integration with Allure publishing  
⏭️ **Then:** Kubernetes deployment (optional, for scale)  

**Testing Maturity Progress:**
- Stage 2 (Automation): 100% ✅
- Stage 3 (Advanced): 95% → 100% ✅ (with Docker)
- Stage 4 (AI Testing): Ready to start!

---

## Additional Resources

- [Playwright Docker Documentation](https://playwright.dev/docs/docker)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Allure Docker Service](https://github.com/fescobar/allure-docker-service)
