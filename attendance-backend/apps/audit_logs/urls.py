from django.urls import path

from .views import (
    AdminDashboardSummaryView,
    AuditLogClearAllView,
    AuditLogDeleteView,
    AuditLogListView,
    BatchAttendanceReportView,
)


urlpatterns = [
    path("summary/", AdminDashboardSummaryView.as_view(), name="admin-dashboard-summary"),
    path("activities/", AuditLogListView.as_view(), name="audit-log-activities"),
    path("activities/<int:activity_id>/", AuditLogDeleteView.as_view(), name="audit-log-delete"),
    path("activities/clear-all/", AuditLogClearAllView.as_view(), name="audit-log-clear-all"),
    path("batch-attendance/", BatchAttendanceReportView.as_view(), name="batch-attendance-report"),
]
