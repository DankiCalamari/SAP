from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.loyalty.views import CustomerViewSet, DiscountViewSet, LayawayViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'discounts', DiscountViewSet, basename='discount')
router.register(r'layaways', LayawayViewSet, basename='layaway')

urlpatterns = [
    path('', include(router.urls)),
]
