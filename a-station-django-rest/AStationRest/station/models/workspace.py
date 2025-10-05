from django.db import models
from django.conf import settings
from core.models import TimestampedUUIDModel

class Workspace(TimestampedUUIDModel):
    """
    A workspace for organizing hosts, playbooks, and runs.
    Multiple users can be members of a workspace.
    """
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_workspaces'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='workspaces',
        blank=True
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']