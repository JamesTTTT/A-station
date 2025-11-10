from celery import Task
from worker.celery_app import celery_app
from worker.ansible_executor import AnsibleExecutor
from worker.event_streamer import EventStreamer
import logging

logger = logging.getLogger(__name__)

class CallbackTask(Task):
    """Base task with callbacks for state changes."""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        EventStreamer.publish_error(task_id, str(exc))

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {task_id} succeeded")
        EventStreamer.publish_complete(task_id, retval)

@celery_app.task(base=CallbackTask, bind=True, name="tasks.run_playbook")
def run_playbook(
    self,
    job_id: str,
    playbook_yaml: str,
    inventory: str,
    extra_vars: dict = None
):
    """
    Execute an Ansible playbook using ansible-runner.
    """

    logger.info(f"Starting playbook execution for job {job_id}")

    self.update_state(state="STARTED", meta={"job_id": job_id})

    executor = AnsibleExecutor(
        job_id=job_id,
        playbook_yaml=playbook_yaml,
        inventory=inventory,
        extra_vars=extra_vars or {}
    )

    # Stream events to Redis as they happen
    streamer = EventStreamer(job_id)

    try:
        result = executor.run(event_callback=streamer.stream_event)

        return {
            "status": result.status,
            "rc": result.rc,
            "stats": result.stats,
            "events_count": len(result.events),
            "final_summary": executor.get_final_summary(result)
        }

    except Exception as e:
        logger.exception(f"Playbook execution failed for job {job_id}")
        streamer.publish_error(str(e))
        raise