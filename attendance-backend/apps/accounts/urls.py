from django.urls import path
from .views import CustomTokenObtainPairView, RefreshView, LogoutView, MeView, CreateAnalystView, DeleteAnalystView, ListAnalystView, UpdateAnalystView, CreateCounsellorView, ListCounsellorView, UpdateCounsellorView, DeleteCounsellorView
from .views import ForgotPasswordView, ResetPasswordView, VerifyOTPView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("create-analyst/", CreateAnalystView.as_view(), name="create-analyst"),
    path("create-counsellor/", CreateCounsellorView.as_view(), name="create-counsellor"),
    path("delete-analyst/<int:id>/", DeleteAnalystView.as_view(), name="delete-analyst"),
    path("analysts/", ListAnalystView.as_view(), name="list-analysts"),
    path("counsellors/", ListCounsellorView.as_view(), name="list-counsellors"),
    path("update-analyst/<int:id>/", UpdateAnalystView.as_view(), name="update-analyst"),
    path("update-counsellor/<int:id>/", UpdateCounsellorView.as_view(), name="update-counsellor"),
    path("delete-counsellor/<int:id>/", DeleteCounsellorView.as_view(), name="delete-counsellor"),
]
