from django.urls import path
from .views import (
    CreateStudentView,
    ListStudentsView,
    UpdateStudentView,
    DeleteStudentView,
    # StudentProfileView
)

urlpatterns = [
    path("create/", CreateStudentView.as_view()),
    path("list/", ListStudentsView.as_view()),
    path("update/<int:pk>/", UpdateStudentView.as_view()),
    path("delete/<int:pk>/", DeleteStudentView.as_view()),
    # path("me/", StudentProfileView.as_view()),
]