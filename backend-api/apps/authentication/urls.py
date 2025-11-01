from django.urls import path
from apps.authentication.views import (
    LoginView, LogoutView, RefreshTokenView, RegisterView
)

urlpatterns = [
    path('login', LoginView.as_view(), name='login'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('refresh-token', RefreshTokenView.as_view(), name='refresh_token'),
    path('register', RegisterView.as_view(), name='register'),
]
