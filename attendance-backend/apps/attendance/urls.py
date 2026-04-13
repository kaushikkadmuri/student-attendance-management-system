from django.urls import path
from .views import (
    MyAttendanceView,
    CheckInView,
    CheckOutView,
    ResetTodayAttendanceView,
)

urlpatterns = [
    path("check-in/", CheckInView.as_view(), name="check-in"),
    path("check-out/", CheckOutView.as_view(), name="check-out"),
    path("reset-today/", ResetTodayAttendanceView.as_view(), name="reset-today"),
    path("my/", MyAttendanceView.as_view(), name="my-attendance"),
]
