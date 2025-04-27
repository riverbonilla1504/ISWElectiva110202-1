from django.urls import path

from core.views import RegisterView, LoginView, EditUserView, getUserView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('edit/<int:id_user>/', EditUserView.as_view(), name='edit_user'),
    path('get/<int:id_user>/', getUserView.as_view(), name='get_user'),
]