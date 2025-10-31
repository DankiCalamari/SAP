from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.reporting.views import ReportingViewSet

router = DefaultRouter()
router.register(r'reports', ReportingViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
