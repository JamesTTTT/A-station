import os
from celery.schedules import crontab

class CeleryConfig:
    """Celery configuration settings for the FastAPI client."""

    # Redis URL
    broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")

    task_serializer = "json"
    result_serializer = "json"
    accept_content = ["json"]

    timezone = "UTC"
    enable_utc = True

    task_track_started = True

    task_routes = {
        "tasks.run_playbook": {"queue": "default"},
    }

    result_expires = 3600
    result_persistent = True

    task_acks_late = False
    task_reject_on_worker_lost = True

    worker_prefetch_multiplier = 1

    # Retry settings
    task_publish_retry = True
    task_publish_retry_policy = {
        "max_retries": 3,
        "interval_start": 0,
        "interval_step": 0.2,
        "interval_max": 0.2,
    }

    beat_schedule = {
        "cleanup-expired-tokens": {
            "task": "tasks.cleanup_expired_tokens",
            "schedule": crontab(hour=3, minute=0),
        },
    }


# Dictionary format for easy import and use
celery_config = {
    "broker_url": CeleryConfig.broker_url,
    "result_backend": CeleryConfig.result_backend,
    "task_serializer": CeleryConfig.task_serializer,
    "result_serializer": CeleryConfig.result_serializer,
    "accept_content": CeleryConfig.accept_content,
    "timezone": CeleryConfig.timezone,
    "enable_utc": CeleryConfig.enable_utc,
    "task_track_started": CeleryConfig.task_track_started,
    "task_routes": CeleryConfig.task_routes,
    "result_expires": CeleryConfig.result_expires,
    "result_persistent": CeleryConfig.result_persistent,
    "task_acks_late": CeleryConfig.task_acks_late,
    "task_reject_on_worker_lost": CeleryConfig.task_reject_on_worker_lost,
    "task_publish_retry": CeleryConfig.task_publish_retry,
    "task_publish_retry_policy": CeleryConfig.task_publish_retry_policy,
    "beat_schedule": CeleryConfig.beat_schedule,
}
