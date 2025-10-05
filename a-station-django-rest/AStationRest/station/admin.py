from django.contrib import admin
from station.models.workspace import Workspace
from station.models.inventory import Host, InventoryGroup, Variable, SSHKey
from station.models.automation import Playbook, PlaybookRun

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at', 'member_count']
    list_filter = ['created_at']
    search_fields = ['name', 'owner__username', 'owner__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['members']

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(Host)
class HostAdmin(admin.ModelAdmin):
    list_display = ['alias', 'hostname', 'port', 'workspace', 'username', 'connection_status', 'is_active', 'last_seen']
    list_filter = ['workspace', 'connection_status', 'is_active', 'created_at']
    search_fields = ['alias', 'hostname', 'username', 'workspace__name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_seen']
    filter_horizontal = ['reusable_variables']

    fieldsets = (
        ('Basic Information', {
            'fields': ('workspace', 'alias', 'hostname', 'port')
        }),
        ('Authentication', {
            'fields': ('username', 'ssh_key')
        }),
        ('Variables', {
            'fields': ('variables', 'reusable_variables'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'connection_status', 'last_seen')
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(InventoryGroup)
class InventoryGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'host_count', 'total_host_count', 'created_at']
    list_filter = ['workspace', 'created_at']
    search_fields = ['name', 'description', 'workspace__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['hosts', 'reusable_variables', 'parent_groups']

    fieldsets = (
        ('Basic Information', {
            'fields': ('workspace', 'name', 'description')
        }),
        ('Hosts', {
            'fields': ('hosts',)
        }),
        ('Variables', {
            'fields': ('variables', 'reusable_variables'),
            'classes': ('collapse',)
        }),
        ('Group Hierarchy', {
            'fields': ('parent_groups',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(Variable)
class VariableAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'value_preview', 'is_sensitive', 'created_at']
    list_filter = ['workspace', 'is_sensitive', 'created_at']
    search_fields = ['name', 'description', 'workspace__name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('workspace', 'name', 'value', 'is_sensitive')
        }),
        ('Documentation', {
            'fields': ('description',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def value_preview(self, obj):
        if obj.is_sensitive:
            return '********'
        return obj.value[:50] + '...' if len(obj.value) > 50 else obj.value
    value_preview.short_description = 'Value'


@admin.register(SSHKey)
class SSHKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'passphrase_encrypted', 'group_count', 'created_at']
    list_filter = ['workspace', 'passphrase_encrypted', 'created_at']
    search_fields = ['name', 'description', 'workspace__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['groups']

    fieldsets = (
        ('Basic Information', {
            'fields': ('workspace', 'name', 'description')
        }),
        ('Key Data', {
            'fields': ('private_key', 'public_key', 'passphrase_encrypted'),
            'classes': ('collapse',)
        }),
        ('Groups', {
            'fields': ('groups',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def group_count(self, obj):
        return obj.groups.count()
    group_count.short_description = 'Groups'


@admin.register(Playbook)
class PlaybookAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'created_at', 'run_count']
    list_filter = ['workspace', 'created_at']
    search_fields = ['name', 'workspace__name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('workspace', 'name')
        }),
        ('Playbook Content', {
            'fields': ('yaml_content',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def run_count(self, obj):
        return obj.runs.count()
    run_count.short_description = 'Runs'


@admin.register(PlaybookRun)
class PlaybookRunAdmin(admin.ModelAdmin):
    list_display = ['playbook', 'status', 'triggered_by', 'created_at', 'finished_at', 'duration']
    list_filter = ['status', 'created_at', 'finished_at']
    search_fields = ['playbook__name', 'triggered_by__username', 'triggered_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'finished_at', 'duration']

    fieldsets = (
        ('Run Information', {
            'fields': ('playbook', 'triggered_by', 'status')
        }),
        ('Timing', {
            'fields': ('created_at', 'finished_at', 'duration')
        }),
        ('Output', {
            'fields': ('log_output',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def duration(self, obj):
        if obj.finished_at and obj.created_at:
            delta = obj.finished_at - obj.created_at
            return str(delta)
        return 'N/A'
    duration.short_description = 'Duration'
