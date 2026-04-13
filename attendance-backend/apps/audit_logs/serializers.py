from rest_framework import serializers
from datetime import timedelta

from accounts.models import User
from batches.models import Batch
from centers.models import Center
from students.models import Student

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_email = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()
    target_email = serializers.SerializerMethodField()
    target_role = serializers.SerializerMethodField()
    target_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "action",
            "status",
            "message",
            "actor_name",
            "actor_email",
            "actor_role",
            "target_name",
            "target_email",
            "target_role",
            "target_display",
            "ip_address",
            "metadata",
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return None
        return obj.actor.first_name or obj.actor.email

    def get_actor_email(self, obj):
        if not obj.actor:
            return None
        return obj.actor.email

    def get_actor_role(self, obj):
        if not obj.actor:
            return None
        return obj.actor.role

    def _resolve_target(self, obj):
        cached = getattr(obj, "_resolved_target", None)
        if cached is not None:
            return cached

        metadata = obj.metadata or {}
        target_name = metadata.get("target_name") or ""
        target_email = metadata.get("target_email") or ""
        target_role = metadata.get("target_role") or ""

        entity_type = (obj.entity_type or "").lower()
        entity_id = (obj.entity_id or "").strip()
        path = (obj.message or "").lower()

        if entity_type == "students" and entity_id:
            student = Student.objects.select_related("user").filter(id=entity_id).first()
            if student:
                target_name = target_name or (student.user.first_name or student.user.email)
                target_email = target_email or student.user.email
                target_role = target_role or "STUDENT"
            elif not target_name:
                target_name = f"Student #{entity_id}"
                target_role = target_role or "STUDENT"

        elif entity_type == "centers" and entity_id:
            center = Center.objects.filter(id=entity_id).first()
            if center:
                target_name = target_name or center.name
                target_role = target_role or "CENTER"
            elif not target_name:
                target_name = f"Center #{entity_id}"
                target_role = target_role or "CENTER"

        elif entity_type == "batches" and entity_id:
            batch = Batch.objects.filter(id=entity_id).first()
            if batch:
                target_name = target_name or batch.name
                target_role = target_role or "BATCH"
            elif not target_name:
                target_name = f"Batch #{entity_id}"
                target_role = target_role or "BATCH"

        elif entity_type in ["accounts", "auth"]:
            inferred_role = ""
            if "analyst" in path:
                inferred_role = "ANALYST"
            elif "counsellor" in path:
                inferred_role = "COUNSELLOR"
            elif "student" in path:
                inferred_role = "STUDENT"
            target_role = target_role or inferred_role

            if entity_id:
                user_qs = User.objects.filter(id=entity_id)
                if target_role:
                    user_qs = user_qs.filter(role=target_role)
                user = user_qs.first()
                if user:
                    target_name = target_name or (user.first_name or user.email)
                    target_email = target_email or user.email
                    target_role = target_role or user.role
            elif obj.action == "CREATE" and obj.status == "SUCCESS" and not target_email:
                # Legacy create rows may not have target metadata/id.
                # Use nearest created user around audit timestamp as best-effort fallback.
                role_to_match = target_role or inferred_role
                user_qs = User.objects.all()
                if role_to_match:
                    user_qs = user_qs.filter(role=role_to_match)
                window_start = obj.created_at - timedelta(minutes=5)
                candidate = (
                    user_qs.filter(date_joined__gte=window_start, date_joined__lte=obj.created_at)
                    .order_by("-date_joined")
                    .first()
                )
                if candidate:
                    target_name = target_name or (candidate.first_name or candidate.email)
                    target_email = target_email or candidate.email
                    target_role = target_role or candidate.role

        if not target_name and entity_type:
            label = entity_type.rstrip("s").replace("-", " ").title()
            target_name = f"{label} #{entity_id}" if entity_id else label

        if target_name and target_email and target_name != target_email:
            identity = f"{target_name} ({target_email})"
        else:
            identity = target_name or target_email or "-"

        display = f"{target_role.title()}: {identity}" if target_role else identity

        resolved = {
            "target_name": target_name or None,
            "target_email": target_email or None,
            "target_role": target_role or None,
            "target_display": display,
        }
        setattr(obj, "_resolved_target", resolved)
        return resolved

    def get_target_name(self, obj):
        return self._resolve_target(obj).get("target_name")

    def get_target_email(self, obj):
        return self._resolve_target(obj).get("target_email")

    def get_target_role(self, obj):
        return self._resolve_target(obj).get("target_role")

    def get_target_display(self, obj):
        return self._resolve_target(obj).get("target_display")
