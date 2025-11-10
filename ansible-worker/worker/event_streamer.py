import redis
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

redis_client = redis.Redis(
    host="redis",
    port=6379,
    db=2,
    decode_responses=True
)

class EventStreamer:
    """Stream Ansible events to Redis Pub/Sub for real-time WebSocket delivery."""
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.channel = f"job:{job_id}:events"

    def stream_event(self, event_data: dict):
        """
        Called by ansible-runner for each event.
        """
        try:
            enrich_event = {
                "job_id": self.job_id,
                "timestamp": datetime.now().isoformat(),
                "event": event_data.get("event"),
                "event_data": event_data.get("event_data", {}),
                "uuid": event_data.get("uuid"),
                "counter": event_data.get("counter"),
                "stdout": event_data.get("stdout", ""),
            }

            task_name = event_data.get("event_data", {}).get("task")
            if task_name:
                enrich_event["task_name"] = task_name
                # TODO: Map task_name to node_id from workflow metadata

            redis_client.publish(
                self.channel,
                json.dumps(enrich_event)
            )
            logger.debug(f"Published event {event_data.get('event')} to {self.channel}")
        except Exception as e:
            logger.error(f"Failed to stream event: {e}")

    def publish_error(self, error_message: str):
        error_event = {
            "job_id": self.job_id,
            "timestamp": datetime.now().isoformat(),
            "event": "job_error",
            "error": error_message
        }
        redis_client.publish(self.channel, json.dumps(error_event))

    def publish_complete(self, result: dict):
        complete_event = {
            "job_id": self.job_id,
            "timestamp": datetime.now().isoformat(),
            "event": "job_complete",
            "result": result
        }
        redis_client.publish(self.channel, json.dumps(complete_event))
