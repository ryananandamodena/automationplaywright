# Use official Playwright image with all browsers
FROM mcr.microsoft.com/playwright:v1.58.2-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files
COPY . .

# Install Playwright browsers (already included in base image, but ensure dependencies)
RUN npx playwright install-deps

# Create results directories
RUN mkdir -p test-results allure-results allure-report screenshots

# Set environment variables
ENV CI=true
ENV NODE_ENV=test
ENV PWDEBUG=0

# Expose port for Allure report server (optional)
EXPOSE 4000

# Default command: run all tests
CMD ["npx", "playwright", "test"]
