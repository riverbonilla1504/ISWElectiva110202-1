from django.urls import path

from core.views import RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
]