import ansible_runner
import tempfile
import os
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)

class AnsibleExecutor:

    def __init__(self,
                 job_id: str,
                 playbook_yaml: str,
                 inventory: str,
                 extra_vars: dict = None
                 ):
        self.job_id = job_id
        self.playbook_yaml = playbook_yaml
        self.inventory = inventory
        self.extra_vars = extra_vars or {}

        self.work_dir = Path(tempfile.mkdtemp(prefix=f"job_{job_id}_"))
        self.setup_work_directory()

    def setup_work_directory(self):
        """
        Create ansible-runner directory structure
        """
        (self.work_dir / "inventory").mkdir()
        (self.work_dir / "project").mkdir()
        (self.work_dir / "env").mkdir()

        playbook_path = self.work_dir / "project" /"playbook.yml"
        playbook_path.write_text(self.playbook_yaml)

        inventory_path = self.work_dir / "inventory" / "hosts"
        inventory_path.write_text(self.inventory)


        if self.extra_vars:
            extravars_path = self.work_dir / "env" / "extravars"
            extravars_path.write_text(yaml.dump(self.extra_vars))

    def run(self, event_callback=None):
        """
        Execute the playbook using ansible-runner
        """
        logger.info(f"Executing playbook in {self.work_dir}")

        runner = ansible_runner.interface.run(
            private_data_dir=str(self.work_dir),
            playbook=str(self.work_dir / "project" / "playbook.yml"),
            inventory=str(self.work_dir / "inventory" / "hosts"),
            extravars=self.extra_vars,
            quiet=False,
            json_mode=True,
            event_handler=event_callback,
            cancel_callback=self.check_cancelled,
            status_handler=self.status_handler
        )

        logger.info(f"Playbook completed with status: {runner.status}, rc: {runner.rc}")

        return runner


    def check_cancelled(self):
        #TODO: Check Redis for cancellation flag
        return False

    def status_handler(self, status_data, runner_config):
        logger.debug(f"Runner status: {status_data}")

    def get_final_summary(self, runner):
        """
        Extract final execution summary
        """
        if runner.stats is None:
            return {
                "ok": 0,
                "changed": 0,
                "failures": 0,
                "skipped": 0,
                "rescued": 0,
                "ignored": 0
            }
        return {
            "ok": runner.stats.get("ok", 0),
            "changed": runner.stats.get("changed", 0),
            "failures": runner.stats.get("failures", 0),
            "skipped": runner.stats.get("skipped", 0),
            "rescued": runner.stats.get("rescued", 0),
            "ignored": runner.stats.get("ignored", 0)
        }

    def cleanup(self):
        import shutil
        if self.work_dir.exists():
            shutil.rmtree(self.work_dir)