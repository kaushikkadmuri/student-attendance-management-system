from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from attendance.models import Attendance
from batches.models import Batch
from centers.models import Center
from students.models import Student

from .models import AuditLog
from .serializers import AuditLogSerializer

CRUD_ACTIONS = ["CREATE", "UPDATE", "DELETE"]


def _recent_dashboard_activity_queryset():
    return AuditLog.objects.select_related("actor").filter(
        action__in=CRUD_ACTIONS
    ).exclude(entity_type__iexact="attendance")


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        user_role_counts = User.objects.values("role").annotate(total=Count("id"))
        role_map = {row["role"]: row["total"] for row in user_role_counts}

        data = {
            "counts": {
                "centers": Center.objects.count(),
                "analysts": role_map.get("ANALYST", 0),
                "counsellors": role_map.get("COUNSELLOR", 0),
                "students": Student.objects.count(),
            },
            "recent_actions": _recent_dashboard_activity_queryset().count(),
        }
        return Response(data)


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        try:
            limit = int(request.query_params.get("limit", 50))
        except Exception:
            limit = 50
        limit = max(1, min(limit, 200))

        queryset = _recent_dashboard_activity_queryset()[:limit]
        serializer = AuditLogSerializer(queryset, many=True)
        return Response(serializer.data)


class AuditLogDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, activity_id):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        deleted_count, _ = _recent_dashboard_activity_queryset().filter(
            id=activity_id
        ).delete()
        if deleted_count == 0:
            return Response({"error": "Audit activity not found"}, status=404)

        return Response(
            {
                "message": "Audit activity deleted successfully",
                "deleted_count": deleted_count,
            }
        )


class AuditLogClearAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        deleted_count, _ = AuditLog.objects.all().delete()
        return Response(
            {
                "message": "All audit logs cleared successfully",
                "deleted_count": deleted_count,
            }
        )


def _working_days_between(start_date, end_date):
    if not start_date or not end_date or end_date < start_date:
        return 0

    count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() != 6:  # Exclude Sundays
            count += 1
        current += timedelta(days=1)
    return count


class BatchAttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        batch_id = request.query_params.get("batch_id")
        if not batch_id:
            return Response({"error": "batch_id is required"}, status=400)

        try:
            batch = Batch.objects.get(id=batch_id)
        except Batch.DoesNotExist:
            return Response({"error": "Batch not found"}, status=404)

        range_start = batch.start_date
        today = timezone.now().date()
        completed_end = min(batch.end_date, today)
        completed_working_days = _working_days_between(range_start, completed_end)
        total_working_days = _working_days_between(range_start, batch.end_date)

        students = Student.objects.filter(batch=batch).select_related("user")
        student_rows = []
        for student in students:
            present_days = Attendance.objects.filter(
                student=student,
                is_present=True,
                date__gte=range_start,
                date__lte=completed_end,
            ).count()
            percentage = (
                round((present_days / completed_working_days) * 100, 2)
                if completed_working_days > 0
                else 0.0
            )
            student_rows.append(
                {
                    "student_id": student.id,
                    "name": student.user.first_name,
                    "email": student.user.email,
                    "present_days": present_days,
                    "attendance_percentage": percentage,
                }
            )

        return Response(
            {
                "batch": {
                    "id": batch.id,
                    "name": batch.name,
                    "start_date": batch.start_date,
                    "end_date": batch.end_date,
                },
                "report_upto_date": completed_end,
                "total_working_days": total_working_days,
                "completed_working_days": completed_working_days,
                "students": student_rows,
            }
        )
