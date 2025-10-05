from django.db import models
from django.conf import settings
from core.models import TimestampedUUIDModel
from .workspace import Workspace

class Host(TimestampedUUIDModel):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='hosts'
    )
    alias = models.CharField(max_length=100, help_text="Display name for the host")
    hostname = models.CharField(max_length=200, help_text="Hostname or IP address (used as ansible_host if different from alias)")
    port = models.PositiveIntegerField(default=22, help_text="SSH port")
    username = models.CharField(max_length=100, help_text="SSH username")
    ssh_key = models.ForeignKey(
        'SSHKey',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hosts',
        help_text="Primary SSH key for authentication. If null, password-based or other authentication is assumed."
    )

    variables = models.JSONField(default=dict, blank=True, help_text="Host-specific Ansible variables")
    reusable_variables = models.ManyToManyField('Variable', blank=True, related_name='hosts', help_text="Reusable variables assigned to this host")

    is_active = models.BooleanField(default=True, help_text="Whether this host is active and available")
    last_seen = models.DateTimeField(null=True, blank=True, help_text="Last successful connection")
    connection_status = models.CharField(max_length=20, choices=[
        ('unknown', 'Unknown'),
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('unreachable', 'Unreachable'),
    ], default="unknown")

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_hosts')

    class Meta:
        unique_together = [['workspace', 'hostname', 'port']]
        ordering = ['alias']

    def __str__(self):
        return f"{self.alias} ({self.hostname})"

    def connection_display(self):
        return self.get_connection_status_display()

    def ansible_host_string(self):
        """Generate Ansible inventory host string"""
        return f"{self.hostname}:{self.port}"

    def to_ansible_format(self):
        """
        Convert to Ansible inventory format.
        """
        ansible_vars = {
            'ansible_host': self.hostname,
            'ansible_port': self.port,
            'ansible_user': self.username,
        }
        # Add reusable variables
        for var in self.reusable_variables.all():
            ansible_vars[var.name] = var.value
        # Add host-specific variables
        ansible_vars.update(self.variables)
        return ansible_vars

class InventoryGroup(TimestampedUUIDModel):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='inventory_groups'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    variables = models.JSONField(default=dict, blank=True, help_text="Ansible group variables in JSON format")
    reusable_variables = models.ManyToManyField('Variable', blank=True, related_name='groups', help_text="Reusable variables assigned to this group")
    parent_groups = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='child_groups')
    hosts = models.ManyToManyField(Host, blank=True, help_text="Hosts in this group")

    class Meta:
        ordering = ['name']
        unique_together = [['workspace', 'name']]

    def __str__(self):
        return self.name

    def host_count(self):
        return self.hosts.filter(is_active=True).count()

    def total_host_count(self):
        direct_hosts = self.hosts.filter(is_active=True).count()
        child_hosts = sum(child.total_host_count for child in self.child_groups.all())
        return direct_hosts + child_hosts

    def get_all_variables(self):
        """
        Get all variables including reusable ones.
        """
        all_vars = {}
        # Add reusable variables first
        for var in self.reusable_variables.all():
            all_vars[var.name] = var.value
        # Add group-specific variables last
        all_vars.update(self.variables)
        return all_vars

class Variable(TimestampedUUIDModel):
    """
    Reusable Ansible variables that can be assigned to hosts and groups.
    """
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='variables'
    )
    name = models.CharField(max_length=100, help_text="Variable name (e.g., 'ansible_python_interpreter')")
    value = models.TextField(help_text="Variable value")
    description = models.TextField(blank=True, help_text="Description of what this variable does")
    is_sensitive = models.BooleanField(default=False, help_text="Mark as sensitive to hide value in UI")

    class Meta:
        ordering = ['name']
        unique_together = [['workspace', 'name']]

    def __str__(self):
        return self.name


class SSHKey(TimestampedUUIDModel):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='ssh_keys'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    private_key = models.TextField(help_text="SSH private key content")
    public_key = models.TextField(blank=True, help_text="SSH public key content")
    passphrase_encrypted = models.BooleanField(default=False)

    groups = models.ManyToManyField(InventoryGroup, blank=True, related_name='ssh_keys')

    class Meta:
        unique_together = [['workspace', 'name']]

    def __str__(self):
        return self.name