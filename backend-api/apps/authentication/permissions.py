from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'


class IsManager(BasePermission):
    """Allow access to managers and admins"""
    def has_permission(self, request, view):
        return request.user and request.user.role in ('manager', 'admin')


class IsCashier(BasePermission):
    """Allow access to cashiers"""
    def has_permission(self, request, view):
        return request.user and request.user.role == 'cashier'


class IsStockStaff(BasePermission):
    """Allow access to stock staff"""
    def has_permission(self, request, view):
        return request.user and request.user.role == 'stock_staff'


class IsStoreOwnerOrAdmin(BasePermission):
    """Allow access if user is manager/admin of their store"""
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.role in ('manager', 'admin')

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True

        # Check if user's store matches object's store
        if hasattr(obj, 'store_id'):
            return obj.store_id == request.user.store_id

        return False


class IsCurrentUserOrAdmin(BasePermission):
    """Allow access if user is accessing their own data or is admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True

        if hasattr(obj, 'id'):
            return obj.id == request.user.id

        return False
