"""
Celery Worker - AI Autonomous QA Testing Platform

Handles background tasks for:
- Running web explorations with Playwright
- AI-powered test case generation
- Page crawling and DOM snapshot capture
"""
import logging
from celery import Celery
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.exploration"],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Make celery_app importable as 'app.worker'
app = celery_app

if __name__ == "__main__":
    celery_app.start()
