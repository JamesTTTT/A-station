import ansible_runner
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

ARTIFACT_BASE_DIR = "/tmp/ansible-artifacts"


class AnsibleExecutor:

    def __init__(
        self,
        job_id: str,
        source_path: str,
        playbook_path: str,
        inventory_path: str,
        extra_vars: dict = None,
    ):
        self.job_id = job_id
        self.source_path = Path(source_path)
        self.playbook_path = playbook_path
        self.inventory_path = inventory_path
        self.extra_vars = extra_vars or {}
        self.artifact_dir = Path(ARTIFACT_BASE_DIR) / job_id
        self.artifact_dir.mkdir(parents=True, exist_ok=True)

    def run(self, event_callback=None):
        logger.info(f"Executing playbook {self.playbook_path} from {self.source_path}")

        inventory_abs = str(self.source_path / self.inventory_path)

        runner = ansible_runner.interface.run(
            private_data_dir=str(self.source_path),
            playbook=self.playbook_path,
            inventory=inventory_abs,
            extravars=self.extra_vars if self.extra_vars else None,
            artifact_dir=str(self.artifact_dir),
            quiet=False,
            json_mode=True,
            event_handler=event_callback,
            cancel_callback=self.check_cancelled,
            status_handler=self.status_handler,
        )

        logger.info(f"Playbook completed with status: {runner.status}, rc: {runner.rc}")
        return runner

    def check_cancelled(self):
        # TODO: Check Redis for cancellation flag
        return False

    def status_handler(self, status_data, runner_config):
        logger.debug(f"Runner status: {status_data}")

    def get_final_summary(self, runner):
        if runner.stats is None:
            return {
                "ok": 0,
                "changed": 0,
                "failures": 0,
                "skipped": 0,
                "rescued": 0,
                "ignored": 0,
            }
        return {
            "ok": runner.stats.get("ok", 0),
            "changed": runner.stats.get("changed", 0),
            "failures": runner.stats.get("failures", 0),
            "skipped": runner.stats.get("skipped", 0),
            "rescued": runner.stats.get("rescued", 0),
            "ignored": runner.stats.get("ignored", 0),
        }

    def cleanup(self):
        import shutil
        if self.artifact_dir.exists():
            shutil.rmtree(self.artifact_dir)
