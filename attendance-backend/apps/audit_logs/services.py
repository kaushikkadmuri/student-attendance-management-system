from accounts.models import User

from .models import AuditLog

AUDITABLE_ROLES = {"ADMIN", "ANALYST", "COUNSELLOR"}
CRUD_ACTIONS = {"CREATE", "UPDATE", "DELETE"}
EXCLUDED_ENTITY_TYPES = {"attendance"}


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _infer_action(request):
    path = request.path.lower()
    method = request.method.upper()

    if "check-in" in path:
        return "CHECK_IN"
    if "check-out" in path:
        return "CHECK_OUT"
    if "logout" in path:
        return "LOGOUT"
    if "login" in path:
        return "LOGIN"

    if method == "POST":
        return "CREATE"
    if method in ["PUT", "PATCH"]:
        return "UPDATE"
    if method == "DELETE":
        return "DELETE"
    return None


def log_request_action(request, response):
    # Log only mutating API calls to keep noise low.
    if request.method.upper() not in ["POST", "PUT", "PATCH", "DELETE"]:
        return
    if not request.path.startswith("/api/"):
        return
    if request.path.startswith("/api/audit-logs/"):
        return

    actor = getattr(request, "user", None)
    if not actor or not getattr(actor, "is_authenticated", False):
        return
    if getattr(actor, "role", None) not in AUDITABLE_ROLES:
        return

    action = _infer_action(request)
    if action not in CRUD_ACTIONS:
        return

    status = "SUCCESS" if response.status_code < 400 else "FAILED"
    entity_type = ""
    entity_id = ""
    path_parts = [part for part in request.path.split("/") if part]
    if len(path_parts) >= 2 and path_parts[0] == "api":
        entity_type = path_parts[1]
    if entity_type.lower() in EXCLUDED_ENTITY_TYPES:
        return

    if getattr(request, "resolver_match", None):
        kwargs = request.resolver_match.kwargs or {}
        entity_id = str(kwargs.get("id") or kwargs.get("pk") or "")

    response_data = getattr(response, "data", None)
    if not entity_id and isinstance(response_data, dict):
        # Capture common identifier keys for create endpoints.
        entity_id = str(
            response_data.get("id")
            or response_data.get("pk")
            or response_data.get("student_id")
            or response_data.get("batch_id")
            or ""
        )

    target_name = ""
    target_email = ""
    target_role = ""
    request_data = getattr(request, "data", None)
    if hasattr(request_data, "get"):
        target_name = request_data.get("name") or request_data.get("first_name") or ""
        target_email = request_data.get("email") or ""

    if "analyst" in request.path:
        target_role = "ANALYST"
    elif "counsellor" in request.path:
        target_role = "COUNSELLOR"
    elif "/students/" in request.path:
        target_role = "STUDENT"

    if (
        not entity_id
        and status == "SUCCESS"
        and entity_type in ["auth", "accounts"]
        and target_email
    ):
        user_qs = User.objects.filter(email=target_email)
        if target_role:
            user_qs = user_qs.filter(role=target_role)
        target_user = user_qs.order_by("-id").first()
        if target_user:
            entity_id = str(target_user.id)

    AuditLog.objects.create(
        actor=actor,
        action=action,
        status=status,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=_get_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:500],
        message=f"{request.method} {request.path}",
        metadata={
            "status_code": response.status_code,
            "target_name": target_name,
            "target_email": target_email,
            "target_role": target_role,
        },
    )
