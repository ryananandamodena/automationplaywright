"""
Exploration Tasks - Background job untuk menjalankan web crawling
"""
import logging
import uuid
from datetime import datetime
from celery import shared_task
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)


def get_db_session():
    """Create a DB session for use inside Celery tasks."""
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


@shared_task(bind=True, name="app.tasks.exploration.run_exploration")
def run_exploration(self, exploration_id: str):
    """
    Background task untuk menjalankan eksplorasi web.
    
    Alur:
    1. Update status ke RUNNING
    2. Crawl halaman dengan Playwright
    3. Simpan DOM snapshot untuk setiap halaman
    4. Update status ke COMPLETED
    
    Args:
        exploration_id: UUID dari exploration yang akan dijalankan
    """
    from app.worker import celery_app

    db = get_db_session()
    try:
        # Import models inside task to avoid circular imports
        # Note: models are shared from backend. In production, 
        # ideally models would be in a shared package.
        # For now we directly use raw SQL via SQLAlchemy core.
        from sqlalchemy import text

        logger.info(f"Starting exploration: {exploration_id}")

        # Update status to RUNNING
        db.execute(
            text("""
                UPDATE explorations 
                SET status = 'RUNNING', started_at = :now, progress = 0
                WHERE id = :id
            """),
            {"now": datetime.utcnow(), "id": exploration_id}
        )
        db.commit()

        # Update progress - task telah dimulai
        self.update_state(state="PROGRESS", meta={"progress": 10, "current_page": None})

        # Get exploration details
        result = db.execute(
            text("SELECT project_id, environment_id FROM explorations WHERE id = :id"),
            {"id": exploration_id}
        ).fetchone()

        if not result:
            logger.error(f"Exploration {exploration_id} not found in DB")
            return {"status": "FAILED", "error": "Exploration not found"}

        # Get environment base_url
        env_result = db.execute(
            text("SELECT base_url FROM environments WHERE id = :id"),
            {"id": result.environment_id}
        ).fetchone()

        if not env_result:
            raise ValueError(f"Environment not found for exploration {exploration_id}")

        base_url = env_result.base_url
        logger.info(f"Crawling URL: {base_url}")

        # Update progress - starting crawl
        db.execute(
            text("UPDATE explorations SET progress = 20 WHERE id = :id"),
            {"id": exploration_id}
        )
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 20, "current_page": base_url})

        # ===== Playwright Crawling =====
        discovered_pages = []
        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context_browser = browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    ignore_https_errors=True,
                )
                page = context_browser.new_page()

                # Navigate to base URL
                try:
                    page.goto(base_url, wait_until="networkidle", timeout=30000)
                    
                    title = page.title()
                    url = page.url

                    # Capture basic DOM info
                    links = page.evaluate("""() => {
                        const anchors = Array.from(document.querySelectorAll('a[href]'));
                        return anchors
                            .map(a => a.href)
                            .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('mailto:'))
                            .slice(0, 20);
                    }""")

                    dom_snapshot = {
                        "url": url,
                        "title": title,
                        "links": links,
                        "screenshot": None,  # Skip screenshot to reduce size
                    }

                    discovered_pages.append({
                        "url": url,
                        "title": title,
                        "page_name": title or url,
                        "dom_snapshot": dom_snapshot,
                    })

                    logger.info(f"Discovered page: {url} - {title}")

                except Exception as e:
                    logger.warning(f"Failed to crawl {base_url}: {e}")

                browser.close()

        except ImportError:
            logger.warning("Playwright not available, using stub mode")
            # Stub mode - simulasi penemuan halaman
            discovered_pages = [
                {
                    "url": base_url,
                    "title": "Home",
                    "page_name": "Home",
                    "dom_snapshot": {"url": base_url, "title": "Home", "links": []},
                }
            ]

        # Update progress - saving results
        db.execute(
            text("UPDATE explorations SET progress = 80 WHERE id = :id"),
            {"id": exploration_id}
        )
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 80, "current_page": None})

        # Save discovered pages to DB
        for p_data in discovered_pages:
            page_id = str(uuid.uuid4())
            db.execute(
                text("""
                    INSERT INTO pages (id, exploration_id, url, title, page_name, dom_snapshot)
                    VALUES (:id, :exploration_id, :url, :title, :page_name, :dom_snapshot::jsonb)
                """),
                {
                    "id": page_id,
                    "exploration_id": exploration_id,
                    "url": p_data["url"],
                    "title": p_data.get("title"),
                    "page_name": p_data.get("page_name"),
                    "dom_snapshot": str(p_data.get("dom_snapshot", {})).replace("'", '"'),
                }
            )
        db.commit()

        # Mark as COMPLETED
        discovered_modules = [
            {"name": p["page_name"], "url": p["url"]} for p in discovered_pages
        ]
        db.execute(
            text("""
                UPDATE explorations
                SET status = 'COMPLETED', completed_at = :now, progress = 100,
                    discovered_modules = :modules::jsonb
                WHERE id = :id
            """),
            {
                "now": datetime.utcnow(),
                "modules": str(discovered_modules).replace("'", '"'),
                "id": exploration_id,
            }
        )
        db.commit()

        logger.info(f"Exploration {exploration_id} completed. Pages found: {len(discovered_pages)}")
        return {
            "status": "COMPLETED",
            "exploration_id": exploration_id,
            "pages_found": len(discovered_pages),
        }

    except Exception as exc:
        logger.exception(f"Exploration {exploration_id} failed: {exc}")
        try:
            db.execute(
                text("""
                    UPDATE explorations
                    SET status = 'FAILED', completed_at = :now
                    WHERE id = :id
                """),
                {"now": datetime.utcnow(), "id": exploration_id}
            )
            db.commit()
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60, max_retries=2)

    finally:
        db.close()
