FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium --with-deps

# Copy application code
COPY . .

# Run Celery worker
CMD ["celery", "-A", "app.worker", "worker", "--loglevel=info", "--concurrency=2"]
