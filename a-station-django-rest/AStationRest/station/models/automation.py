from django.db import models
from django.conf import settings
from core.models import TimestampedUUIDModel
from .workspace import Workspace

class Playbook(TimestampedUUIDModel):
    """
    An Ansible playbook stored as YAML content.
    """
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='playbooks'
    )
    name = models.CharField(max_length=255)
    yaml_content = models.TextField(help_text="Raw YAML content of the playbook")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class PlaybookRun(TimestampedUUIDModel):
    """
    Tracks an execution of a playbook.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    playbook = models.ForeignKey(
        Playbook,
        on_delete=models.CASCADE,
        related_name='runs'
    )

    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='playbook_runs'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    log_output = models.TextField(blank=True, help_text="Full output from ansible-playbook command")
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.playbook.name} - {self.status} - {self.created_at}"

    class Meta:
        ordering = ['-created_at']
