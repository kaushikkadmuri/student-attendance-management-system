from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "created_at",
        "actor",
        "action",
        "status",
        "entity_type",
        "entity_id",
    )
    list_filter = ("action", "status", "created_at")
    search_fields = ("actor__email", "actor__name", "entity_type", "entity_id", "message")
    readonly_fields = (
        "actor",
        "action",
        "status",
        "entity_type",
        "entity_id",
        "ip_address",
        "user_agent",
        "message",
        "metadata",
        "created_at",
    )

