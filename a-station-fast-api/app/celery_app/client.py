from celery import Celery
from app.celery_app.config import CeleryConfig

celery_app = Celery("a_station_worker")
celery_app.config_from_object(CeleryConfig)