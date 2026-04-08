from app.celery_app.client import celery_app
from app.db.base import SessionLocal
from app.core.security import cleanup_expired_tokens


@celery_app.task(name="tasks.cleanup_expired_tokens")
def cleanup_expired_tokens_task():
    db = SessionLocal()
    try:
        deleted = cleanup_expired_tokens(db)
        return {"deleted": deleted}
    finally:
        db.close()
