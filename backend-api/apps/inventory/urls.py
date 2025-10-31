from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inventory.views import InventoryViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'transactions', InventoryTransactionViewSet, basename='inventory-transaction')

urlpatterns = [
    path('', include(router.urls)),
]
