from django.urls import path
from .views import CreateBatchView, ListBatchView, UpdateBatchView, DeleteBatchView

urlpatterns = [
    path("create/", CreateBatchView.as_view()),
    path("list/", ListBatchView.as_view()),
    path("update/<int:pk>/", UpdateBatchView.as_view()),
    path("delete/<int:pk>/", DeleteBatchView.as_view()),
]