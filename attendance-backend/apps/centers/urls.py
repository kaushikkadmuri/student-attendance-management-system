from django.urls import path
from .views import CenterCreateView, CenterListView, CenterUpdateView, CenterDeleteView

urlpatterns = [
    path("", CenterListView.as_view()),      # GET → list centers
    path("create/", CenterCreateView.as_view()),  # POST → create center
    path("update/<int:id>/", CenterUpdateView.as_view(), name="update-center"),
    path("delete/<int:id>/", CenterDeleteView.as_view(), name="delete-center"),
]
